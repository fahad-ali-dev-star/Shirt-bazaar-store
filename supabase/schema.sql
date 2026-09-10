-- ============================================================
-- Shirt Store — Supabase / Postgres Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_slug on products(slug);
create index idx_products_category on products(category) where is_active;

-- ------------------------------------------------------------
-- PRODUCT VARIANTS (size / color / stock)
-- ------------------------------------------------------------
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,               -- e.g. 'S','M','L','XL'
  color text not null,              -- e.g. 'Black','White'
  sku text not null unique,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  price_override numeric(10,2),     -- null = use products.base_price
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create index idx_variants_product on product_variants(product_id);

-- ------------------------------------------------------------
-- PRODUCT IMAGES
-- ------------------------------------------------------------
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position integer not null default 0
);

create index idx_images_product on product_images(product_id, position);

-- ------------------------------------------------------------
-- CARTS (session_id retained for legacy/local cart support; checkout requires authentication)
-- ------------------------------------------------------------
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,                  -- for guests, stored in a cookie
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or session_id is not null)
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create type order_status as enum ('pending','paid','processing','shipped','fulfilled','cancelled','refunded');

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status order_status not null default 'pending',
  total numeric(10,2) not null default 0,
  shipping_address jsonb not null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed')),
  payment_reference text,           -- Stripe Checkout Session ID / payment reference
  courier text,
  tracking_number text,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  qty integer not null check (qty > 0),
  price_at_purchase numeric(10,2) not null
);

create index idx_orders_user on orders(user_id);
create index idx_order_items_order on order_items(order_id);
create index idx_orders_status_created_at on orders(status, created_at desc);
create index idx_orders_tracking_number on orders(tracking_number) where tracking_number is not null;

alter table orders add constraint orders_courier_length_check check (courier is null or char_length(btrim(courier)) between 1 and 120);
alter table orders add constraint orders_tracking_number_length_check check (tracking_number is null or char_length(btrim(tracking_number)) between 1 and 160);
alter table orders add constraint orders_shipping_metadata_check check ((status <> 'shipped' and status <> 'fulfilled') or (courier is not null and tracking_number is not null and shipped_at is not null));

-- ------------------------------------------------------------
-- Performance indexes
-- ------------------------------------------------------------
create extension if not exists pg_trgm;
create index idx_products_active_created_at on products (created_at desc) where is_active = true;
create index idx_products_active_category_created_at on products (category, created_at desc) where is_active = true;
create index idx_products_active_name on products (name) where is_active = true;
create index idx_products_active_name_trgm on products using gin (name gin_trgm_ops) where is_active = true;
create index idx_variants_product_stock on product_variants (product_id, stock_qty);
create index idx_orders_user_created_at on orders (user_id, created_at desc);
create index idx_order_items_variant on order_items (variant_id);

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();
create trigger trg_carts_updated before update on carts
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
-- RLS is enabled and forced on every application table. The service_role
-- client used by trusted server routes bypasses RLS by design; all other
-- access is constrained below.
alter table products enable row level security;
alter table products force row level security;
alter table product_variants enable row level security;
alter table product_variants force row level security;
alter table product_images enable row level security;
alter table product_images force row level security;
alter table carts enable row level security;
alter table carts force row level security;
alter table cart_items enable row level security;
alter table cart_items force row level security;
alter table orders enable row level security;
alter table orders force row level security;
alter table order_items enable row level security;
alter table order_items force row level security;

-- Products / variants / images are storefront-readable only when the parent
-- product is active. There are intentionally no client write policies.
create policy "products_public_read_active"
on products for select
to anon, authenticated
using (is_active = true);

create policy "product_variants_public_read_active_product"
on product_variants for select
to anon, authenticated
using (
  exists (
    select 1
    from products p
    where p.id = product_variants.product_id
      and p.is_active = true
  )
);

create policy "product_images_public_read_active_product"
on product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

-- Carts are legacy tables and checkout no longer accepts guest orders. Keep
-- them usable only by authenticated users for their own cart. The client can
-- never insert/update a cart for another user because WITH CHECK is explicit.
create policy "carts_select_own"
on carts for select
to authenticated
using (user_id = auth.uid());

create policy "carts_insert_own"
on carts for insert
to authenticated
with check (user_id = auth.uid());

create policy "carts_update_own"
on carts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "carts_delete_own"
on carts for delete
to authenticated
using (user_id = auth.uid());

create policy "cart_items_select_own"
on cart_items for select
to authenticated
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

create policy "cart_items_insert_own"
on cart_items for insert
to authenticated
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

create policy "cart_items_update_own"
on cart_items for update
to authenticated
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

create policy "cart_items_delete_own"
on cart_items for delete
to authenticated
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

-- Orders are immutable from the customer-facing API. Customers may only
-- read their own orders. Creation/payment/status changes happen through
-- trusted server-side functions using service_role.
create policy "orders_select_own"
on orders for select
to authenticated
using (user_id = auth.uid());

create policy "order_items_select_own"
on order_items for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- No INSERT/UPDATE/DELETE policies are intentionally defined for products,
-- variants, images, orders, or order_items. Those mutations must go through
-- protected server-side routes/functions. RLS therefore remains a second
-- authorization boundary even if an API route is accidentally exposed.

-- ------------------------------------------------------------
-- Privilege hardening
-- ------------------------------------------------------------
-- Explicitly remove direct table access from the public API roles. RLS is
-- still required, but revoking writes prevents accidental exposure through
-- future policy mistakes. Supabase's service_role retains its elevated access.
revoke insert, update, delete on products, product_variants, product_images from anon, authenticated;
revoke insert, update, delete on orders, order_items from anon, authenticated;
revoke all on products, product_variants, product_images, orders, order_items from anon;
revoke all on carts, cart_items from anon;

-- Keep read access for storefront/customer queries via the policies above.
grant select on products, product_variants, product_images to anon, authenticated;
grant select on carts, cart_items, orders, order_items to authenticated;

-- Security-definer functions are callable only by trusted server code.
revoke all on function create_pending_order(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function create_pending_order(uuid, jsonb, jsonb) to service_role;

revoke all on function finalize_stripe_order(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function finalize_stripe_order(uuid, text, bigint, text) to service_role;

revoke all on function transition_order_status(uuid, order_status, text, text) from public, anon, authenticated;
grant execute on function transition_order_status(uuid, order_status, text, text) to service_role;

-- ------------------------------------------------------------
-- Phase 3: atomic Stripe checkout and payment finalization
-- ------------------------------------------------------------
-- Phase 3: Stripe/order/inventory atomicity and idempotency.
-- Run after the Phase 1 migration.

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



-- Canonical admin order lifecycle transition function.
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
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_old_status := v_order.status;

  if v_old_status = p_status then
    return jsonb_build_object('changed', false, 'old_status', v_old_status, 'status', v_order.status, 'shipping_address', v_order.shipping_address);
  end if;

  if v_old_status = 'pending' and p_status not in ('cancelled') then raise exception 'Pending orders can only be cancelled before payment'; end if;
  if v_old_status = 'paid' and p_status <> 'processing' then raise exception 'Paid orders must move to processing'; end if;
  if v_old_status = 'processing' and p_status <> 'shipped' then raise exception 'Processing orders must move to shipped'; end if;
  if v_old_status = 'shipped' and p_status <> 'fulfilled' then raise exception 'Shipped orders must move to fulfilled'; end if;
  if v_old_status in ('fulfilled', 'cancelled', 'refunded') then raise exception 'This order is in a terminal state'; end if;

  if p_status = 'shipped' then
    v_courier := nullif(btrim(coalesce(p_courier, '')), '');
    v_tracking := nullif(btrim(coalesce(p_tracking_number, '')), '');
    if v_courier is null or v_tracking is null then raise exception 'Courier and tracking number are required when shipping an order'; end if;
    if char_length(v_courier) > 120 or char_length(v_tracking) > 160 then raise exception 'Shipping information is too long'; end if;
    v_shipped_at := coalesce(v_order.shipped_at, now());
  else
    v_courier := v_order.courier;
    v_tracking := v_order.tracking_number;
    v_shipped_at := v_order.shipped_at;
  end if;

  update orders set status=p_status, courier=v_courier, tracking_number=v_tracking, shipped_at=v_shipped_at where id=p_order_id;
  return jsonb_build_object('changed', true, 'old_status', v_old_status, 'status', p_status, 'shipping_address', v_order.shipping_address, 'courier', v_courier, 'tracking_number', v_tracking, 'shipped_at', v_shipped_at);
end;
$$;

revoke all on function transition_order_status(uuid, order_status, text, text) from public, anon, authenticated;
grant execute on function transition_order_status(uuid, order_status, text, text) to service_role;

-- ------------------------------------------------------------
-- Supabase Storage: product images
-- ------------------------------------------------------------
-- Product images are public-read storefront assets. Writes are performed only
-- by the protected server-side admin upload route using service_role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

-- No client INSERT/UPDATE/DELETE policies are defined for product-images.
