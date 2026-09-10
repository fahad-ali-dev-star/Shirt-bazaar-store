-- Phase 12: Cash on Delivery (COD) payment method and order flow.
-- Run this migration in Supabase SQL editor or CLI.

-- 1. Add payment_method column to orders table if it doesn't already exist.
alter table orders
  add column if not exists payment_method text not null default 'stripe';

-- Ensure payment_method is either 'stripe' or 'cod'
alter table orders
  drop constraint if exists orders_payment_method_check;

alter table orders
  add constraint orders_payment_method_check
  check (payment_method in ('stripe', 'cod'));

create index if not exists idx_orders_payment_method
  on orders(payment_method);

-- 2. Atomic Cash on Delivery order creation.
create or replace function create_cod_order(
  p_user_id uuid,
  p_shipping_address jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total numeric(10,2);
  v_count integer;
  v_result jsonb;
  v_item record;
begin
  if p_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object' then
    raise exception 'Invalid shipping address';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Validate item structure
  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where not (item ? 'variantId')
       or not (item ? 'qty')
       or (item->>'qty') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'Invalid cart item';
  end if;

  -- Check for duplicates
  if exists (
    select 1
    from (
      select item->>'variantId' as variant_id, count(*) as item_count
      from jsonb_array_elements(p_items) item
      group by item->>'variantId'
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Duplicate cart item';
  end if;

  -- Create temporary table to resolve server-side prices and lock stock
  create temporary table if not exists cod_checkout_items (
    variant_id uuid primary key,
    qty integer not null,
    price numeric(10,2) not null,
    product_name text not null
  ) on commit drop;
  truncate cod_checkout_items;

  insert into cod_checkout_items (variant_id, qty, price, product_name)
  select
    (item->>'variantId')::uuid,
    (item->>'qty')::integer,
    coalesce(v.price_override, p.base_price),
    p.name
  from jsonb_array_elements(p_items) item
  join product_variants v on v.id = (item->>'variantId')::uuid
  join products p on p.id = v.product_id and p.is_active = true;

  get diagnostics v_count = row_count;
  if v_count <> jsonb_array_length(p_items) then
    raise exception 'One or more products are unavailable';
  end if;

  -- Check stock availability
  if exists (
    select 1
    from cod_checkout_items c
    join product_variants v on v.id = c.variant_id
    where v.stock_qty < c.qty
  ) then
    raise exception 'One or more items are out of stock';
  end if;

  select coalesce(sum(price * qty), 0)::numeric(10,2)
    into v_total
  from cod_checkout_items;

  -- Generate order ID
  v_order_id := gen_random_uuid();

  -- Insert the order as 'processing', 'unpaid', payment_method = 'cod'
  insert into orders (
    id,
    user_id,
    status,
    total,
    shipping_address,
    payment_status,
    payment_method,
    payment_reference
  )
  values (
    v_order_id,
    p_user_id,
    'processing',
    v_total,
    p_shipping_address,
    'unpaid',
    'cod',
    'COD-' || v_order_id
  );

  -- Insert order items
  insert into order_items (order_id, variant_id, qty, price_at_purchase)
  select v_order_id, variant_id, qty, price
  from cod_checkout_items;

  -- Atomically decrement stock
  for v_item in
    select variant_id, qty
    from cod_checkout_items
    order by variant_id
  loop
    update product_variants
    set stock_qty = stock_qty - v_item.qty
    where id = v_item.variant_id
      and stock_qty >= v_item.qty;

    if not found then
      raise exception 'Insufficient stock for order';
    end if;
  end loop;

  -- Clean up active cart for user
  delete from cart_items
  where cart_id in (select id from carts where user_id = p_user_id);

  -- Build response
  select jsonb_build_object(
    'order_id', v_order_id,
    'total', v_total,
    'variants', coalesce(jsonb_agg(jsonb_build_object(
      'id', variant_id,
      'name', product_name,
      'price', price,
      'qty', qty
    ) order by product_name), '[]'::jsonb)
  ) into v_result
  from cod_checkout_items;

  return v_result;
exception
  when invalid_text_representation then
    raise exception 'Invalid cart item';
end;
$$;

revoke all on function create_cod_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function create_cod_order(uuid, jsonb, jsonb) to service_role;

-- 3. Enhance transition_order_status to auto-mark COD orders as paid when fulfilled.
create or replace function transition_order_status(
  p_order_id uuid,
  p_status order_status,
  p_courier text default null,
  p_tracking_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_old_status order_status;
  v_courier text;
  v_tracking text;
  v_shipped_at timestamptz;
  v_new_payment_status text;
  v_item record;
begin
  if p_order_id is null then
    raise exception 'Missing order id';
  end if;

  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  v_old_status := v_order.status;
  v_new_payment_status := v_order.payment_status;

  if v_old_status = p_status then
    return jsonb_build_object(
      'changed', false,
      'old_status', v_old_status,
      'status', v_order.status,
      'payment_status', v_order.payment_status,
      'shipping_address', v_order.shipping_address
    );
  end if;

  if v_old_status = 'pending' and p_status not in ('cancelled') then
    raise exception 'Pending orders can only be cancelled before payment';
  end if;

  if v_old_status = 'paid' and p_status not in ('processing', 'cancelled') then
    raise exception 'Paid orders must move to processing or cancelled';
  end if;

  if v_old_status = 'processing' and p_status not in ('shipped', 'cancelled') then
    raise exception 'Processing orders must move to shipped or cancelled';
  end if;

  if v_old_status = 'shipped' and p_status not in ('fulfilled', 'cancelled') then
    raise exception 'Shipped orders must move to fulfilled or cancelled';
  end if;

  if v_old_status in ('fulfilled', 'cancelled', 'refunded') then
    raise exception 'This order is in a terminal state';
  end if;

  -- Handle restocking if order is cancelled from processing or shipped
  if p_status = 'cancelled' and v_old_status in ('processing', 'shipped') then
    for v_item in
      select variant_id, qty
      from order_items
      where order_id = p_order_id
    loop
      update product_variants
      set stock_qty = stock_qty + v_item.qty
      where id = v_item.variant_id;
    end loop;
  end if;

  -- If a COD order reaches fulfilled, cash was collected upon delivery
  if p_status = 'fulfilled' and coalesce(v_order.payment_method, 'stripe') = 'cod' then
    v_new_payment_status := 'paid';
  end if;

  if p_status = 'shipped' then
    v_courier := nullif(btrim(coalesce(p_courier, '')), '');
    v_tracking := nullif(btrim(coalesce(p_tracking_number, '')), '');

    if v_courier is null or v_tracking is null then
      raise exception 'Courier and tracking number are required when shipping an order';
    end if;

    if char_length(v_courier) > 120 or char_length(v_tracking) > 160 then
      raise exception 'Shipping information is too long';
    end if;

    v_shipped_at := coalesce(v_order.shipped_at, now());
  else
    v_courier := v_order.courier;
    v_tracking := v_order.tracking_number;
    v_shipped_at := v_order.shipped_at;
  end if;

  update orders
  set status = p_status,
      payment_status = v_new_payment_status,
      courier = v_courier,
      tracking_number = v_tracking,
      shipped_at = v_shipped_at,
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'changed', true,
    'old_status', v_old_status,
    'status', p_status,
    'payment_status', v_new_payment_status,
    'shipping_address', v_order.shipping_address,
    'courier', v_courier,
    'tracking_number', v_tracking,
    'shipped_at', v_shipped_at
  );
end;
$$;

revoke all on function transition_order_status(uuid, order_status, text, text) from public, anon, authenticated;
grant execute on function transition_order_status(uuid, order_status, text, text) to service_role;
