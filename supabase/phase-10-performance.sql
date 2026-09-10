-- Phase 10: performance indexes and query-shape support.
-- Safe to run after phases 1-9.

create index if not exists idx_products_active_created_at
  on products (created_at desc)
  where is_active = true;

create index if not exists idx_products_active_category_created_at
  on products (category, created_at desc)
  where is_active = true;

create index if not exists idx_products_active_name
  on products (name)
  where is_active = true;

create index if not exists idx_variants_product_stock
  on product_variants (product_id, stock_qty);

create index if not exists idx_orders_user_created_at
  on orders (user_id, created_at desc);

create index if not exists idx_order_items_variant
  on order_items (variant_id);

-- pg_trgm makes the storefront name search substantially cheaper than a
-- sequential scan as the catalog grows.
create extension if not exists pg_trgm;
create index if not exists idx_products_active_name_trgm
  on products using gin (name gin_trgm_ops)
  where is_active = true;
