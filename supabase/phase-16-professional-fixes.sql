-- ============================================================
-- Phase 16: Professional Store Hardening & Feature Extensions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add shipping_cost column to orders if not already present
alter table orders add column if not exists shipping_cost numeric(10,2) not null default 0;

-- 2. Add performance index on payment_reference for fast TID lookups
create index if not exists idx_orders_payment_reference on orders (payment_reference);

-- 3. Product Reviews Table
create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  is_verified_purchase boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_reviews_product on product_reviews(product_id) where is_approved = true;

-- 4. Enable RLS on product_reviews
alter table product_reviews enable row level security;
alter table product_reviews force row level security;

create policy if not exists "product_reviews_public_read"
on product_reviews for select
to anon, authenticated
using (is_approved = true);

create policy if not exists "product_reviews_authenticated_insert"
on product_reviews for insert
to authenticated
with check (user_id = auth.uid());

-- 5. Customer Wishlists Table (Server-side sync optional fallback)
create table if not exists customer_wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists idx_customer_wishlists_user on customer_wishlists(user_id);

alter table customer_wishlists enable row level security;
alter table customer_wishlists force row level security;

create policy if not exists "customer_wishlists_manage_own"
on customer_wishlists for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
