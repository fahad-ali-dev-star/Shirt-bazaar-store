-- Phase 6: complete Supabase RLS and privilege hardening.
-- Run after the Phase 1–5 migrations.
--
-- Database authorization model:
--   * anon/authenticated: storefront reads only; authenticated users can read
--     their own orders and manage only their own legacy carts.
--   * anon/authenticated: no direct writes to products, variants, images,
--     orders, or order_items.
--   * service_role: trusted server-side mutations only.
--
-- IMPORTANT: Run this in Supabase SQL Editor using a role allowed to alter
-- tables/policies. Test against a staging database before production.

-- ------------------------------------------------------------
-- 1. Enable and FORCE RLS on every application table
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2. Remove old/broad policies
-- ------------------------------------------------------------
drop policy if exists "Public read active products" on products;
drop policy if exists "Public read variants of active products" on product_variants;
drop policy if exists "Public read product images" on product_images;
drop policy if exists "Users manage own cart" on carts;
drop policy if exists "Users manage own cart items" on cart_items;
drop policy if exists "Users read own orders" on orders;
drop policy if exists "Users read own order items" on order_items;

drop policy if exists "products_public_read_active" on products;
drop policy if exists "product_variants_public_read_active_product" on product_variants;
drop policy if exists "product_images_public_read_active_product" on product_images;
drop policy if exists "carts_select_own" on carts;
drop policy if exists "carts_insert_own" on carts;
drop policy if exists "carts_update_own" on carts;
drop policy if exists "carts_delete_own" on carts;
drop policy if exists "cart_items_select_own" on cart_items;
drop policy if exists "cart_items_insert_own" on cart_items;
drop policy if exists "cart_items_update_own" on cart_items;
drop policy if exists "cart_items_delete_own" on cart_items;
drop policy if exists "orders_select_own" on orders;
drop policy if exists "order_items_select_own" on order_items;

-- ------------------------------------------------------------
-- 3. Public storefront reads
-- ------------------------------------------------------------
create policy "products_public_read_active"
on products
for select
to anon, authenticated
using (is_active = true);

create policy "product_variants_public_read_active_product"
on product_variants
for select
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
on product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

-- ------------------------------------------------------------
-- 4. Legacy cart tables: authenticated owner only
-- ------------------------------------------------------------
-- Checkout no longer supports guests. Existing legacy guest carts remain in
-- the database but are not accessible through the API because these policies
-- apply only to authenticated users and require user_id = auth.uid().
create policy "carts_select_own"
on carts
for select
to authenticated
using (user_id = auth.uid());

create policy "carts_insert_own"
on carts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "carts_update_own"
on carts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "carts_delete_own"
on carts
for delete
to authenticated
using (user_id = auth.uid());

create policy "cart_items_select_own"
on cart_items
for select
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
on cart_items
for insert
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
on cart_items
for update
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
on cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from carts c
    where c.id = cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

-- ------------------------------------------------------------
-- 5. Customer order access: read-only ownership policy
-- ------------------------------------------------------------
create policy "orders_select_own"
on orders
for select
to authenticated
using (user_id = auth.uid());

create policy "order_items_select_own"
on order_items
for select
to authenticated
using (
  exists (
    select 1
    from orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- There are intentionally NO client policies for INSERT/UPDATE/DELETE on:
--   products, product_variants, product_images, orders, order_items.
-- Those operations are performed by trusted server routes/functions.

-- ------------------------------------------------------------
-- 6. Direct table privilege hardening
-- ------------------------------------------------------------
-- RLS is the primary database authorization boundary. These REVOKEs add a
-- second boundary so a future policy mistake cannot accidentally expose a
-- write operation to the public API roles.
revoke insert, update, delete
on products, product_variants, product_images, orders, order_items
from anon, authenticated;

-- Anonymous users need storefront SELECT only.
revoke all
on products, product_variants, product_images, orders, order_items
from anon;

grant select
on products, product_variants, product_images
to anon;

-- Authenticated users need storefront SELECT plus their own order/cart reads
-- and legacy cart mutations, all still constrained by RLS.
grant select
on products, product_variants, product_images, carts, cart_items, orders, order_items
 to authenticated;

grant insert, update, delete
on carts, cart_items
 to authenticated;

-- No public access to legacy carts.
revoke all on carts, cart_items from anon;

-- ------------------------------------------------------------
-- 7. SECURITY DEFINER function execution hardening
-- ------------------------------------------------------------
-- These functions bypass normal table RLS by design and therefore must only
-- be executable by the trusted server role.
revoke all on function create_pending_order(uuid, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function create_pending_order(uuid, jsonb, jsonb)
to service_role;

revoke all on function finalize_stripe_order(uuid, text, bigint, text)
from public, anon, authenticated;
grant execute on function finalize_stripe_order(uuid, text, bigint, text)
to service_role;

revoke all on function transition_order_status(uuid, order_status, text, text)
from public, anon, authenticated;
grant execute on function transition_order_status(uuid, order_status, text, text)
to service_role;

-- Keep helper trigger function unavailable to public API roles as well.
revoke all on function set_updated_at()
from public, anon, authenticated;

-- ------------------------------------------------------------
-- 8. Verification queries (run separately when auditing)
-- ------------------------------------------------------------
-- SELECT schemaname, tablename, rowsecurity, forcerowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'products','product_variants','product_images','carts',
--     'cart_items','orders','order_items'
--   )
-- ORDER BY tablename;
--
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
