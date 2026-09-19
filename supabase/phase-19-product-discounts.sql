-- ============================================================
-- Phase 19: Product & Category Discounts
-- Adds discount_percent column to products table
-- ============================================================

alter table products 
  add column if not exists discount_percent integer not null default 0 
  check (discount_percent >= 0 and discount_percent <= 100);

-- Index for quickly filtering and querying discounted products
create index if not exists idx_products_discount 
  on products (discount_percent) 
  where is_active = true and discount_percent > 0;

-- Composite index for category discount queries
create index if not exists idx_products_category_discount 
  on products (category, discount_percent) 
  where is_active = true;
