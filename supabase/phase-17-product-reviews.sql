-- ============================================================
-- Phase 17: Product Reviews System
-- ============================================================

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_email text,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text not null,
  is_verified_buyer boolean not null default false,
  status text not null default 'approved' check (status in ('approved', 'pending', 'rejected')),
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast queries & filtering
create index if not exists idx_reviews_product_id on product_reviews(product_id);
create index if not exists idx_reviews_rating on product_reviews(rating);
create index if not exists idx_reviews_created_at on product_reviews(created_at desc);
create index if not exists idx_reviews_status on product_reviews(status);
create index if not exists idx_reviews_product_status on product_reviews(product_id, status);

-- Enable Row Level Security
alter table product_reviews enable row level security;

-- Policy: Everyone (anon & authenticated) can view approved reviews
create policy "product_reviews_public_read_approved"
on product_reviews for select
to anon, authenticated
using (status = 'approved');

-- Policy: Anyone can insert reviews
create policy "product_reviews_insert"
on product_reviews for insert
to anon, authenticated
with check (true);
