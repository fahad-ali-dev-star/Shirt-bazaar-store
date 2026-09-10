-- Phase 3: Stripe/order/inventory atomicity and idempotency.
-- Run after the Phase 1 migration.

-- Remove the legacy non-atomic helper from the earlier schema.
drop function if exists decrement_stock(uuid, integer);

-- A Stripe payment reference must never finalize two different orders.
alter table orders
  drop constraint if exists orders_payment_reference_key;
alter table orders
  add constraint orders_payment_reference_key unique (payment_reference);

-- Atomic checkout creation. Prices and product state are resolved inside
-- PostgreSQL, then the order + all order_items are inserted in one transaction.
create or replace function create_pending_order(
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

  -- Reject duplicate variants and malformed quantities before creating anything.
  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where not (item ? 'variantId')
       or not (item ? 'qty')
       or (item->>'qty') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'Invalid cart item';
  end if;

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

  -- Materialize and validate the cart against active products and current prices.
  create temporary table if not exists checkout_items (
    variant_id uuid primary key,
    qty integer not null,
    price numeric(10,2) not null,
    product_name text not null
  ) on commit drop;
  truncate checkout_items;

  insert into checkout_items (variant_id, qty, price, product_name)
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

  if exists (
    select 1
    from checkout_items c
    join product_variants v on v.id = c.variant_id
    where v.stock_qty < c.qty
  ) then
    raise exception 'One or more items are out of stock';
  end if;

  select coalesce(sum(price * qty), 0)::numeric(10,2)
    into v_total
  from checkout_items;

  insert into orders (user_id, status, total, shipping_address, payment_status)
  values (p_user_id, 'pending', v_total, p_shipping_address, 'unpaid')
  returning id into v_order_id;

  insert into order_items (order_id, variant_id, qty, price_at_purchase)
  select v_order_id, variant_id, qty, price
  from checkout_items;

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
  from checkout_items;

  return v_result;
exception
  when invalid_text_representation then
    raise exception 'Invalid cart item';
end;
$$;

-- Only the server-side service role should execute these security-definer
-- functions. They are not exposed to anon/authenticated API roles.
revoke all on function create_pending_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function create_pending_order(uuid, jsonb, jsonb) to service_role;

-- Atomic payment finalization. The order row is locked for the duration of the
-- transaction. Every stock update must have enough inventory; otherwise the
-- whole transaction rolls back and Stripe can safely retry the webhook.
create or replace function finalize_stripe_order(
  p_order_id uuid,
  p_payment_reference text,
  p_amount_minor bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item record;
  v_already_processed boolean := false;
  v_address jsonb;
begin
  if p_payment_reference is null or length(trim(p_payment_reference)) = 0 then
    raise exception 'Missing payment reference';
  end if;

  select * into v_order
  from orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  -- Idempotency: a duplicate Stripe webhook is a harmless no-op.
  if v_order.status = 'paid' and v_order.payment_status = 'paid' then
    return jsonb_build_object(
      'finalized', false,
      'already_processed', true,
      'total', v_order.total,
      'shipping_address', v_order.shipping_address
    );
  end if;

  if v_order.status <> 'pending' or v_order.payment_status <> 'unpaid' then
    raise exception 'Order is not payable';
  end if;

  if lower(coalesce(p_currency, '')) <> 'pkr' then
    raise exception 'Unexpected payment currency';
  end if;

  if p_amount_minor is null or p_amount_minor <> round(v_order.total * 100)::bigint then
    raise exception 'Payment amount does not match order total';
  end if;

  -- If this reference was already attached to another order, the unique
  -- constraint also protects against replaying a payment onto a second order.
  if exists (
    select 1 from orders
    where payment_reference = p_payment_reference
      and id <> p_order_id
  ) then
    raise exception 'Payment reference already used';
  end if;

  for v_item in
    select oi.variant_id, oi.qty
    from order_items oi
    where oi.order_id = p_order_id
    order by oi.variant_id
  loop
    update product_variants
      set stock_qty = stock_qty - v_item.qty
      where id = v_item.variant_id
        and stock_qty >= v_item.qty;

    if not found then
      raise exception 'Insufficient stock for order';
    end if;
  end loop;

  update orders
  set status = 'paid',
      payment_status = 'paid',
      payment_reference = p_payment_reference
  where id = p_order_id;

  return jsonb_build_object(
    'finalized', true,
    'already_processed', v_already_processed,
    'total', v_order.total,
    'shipping_address', v_order.shipping_address
  );
end;
$$;

revoke all on function finalize_stripe_order(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function finalize_stripe_order(uuid, text, bigint, text) to service_role;
