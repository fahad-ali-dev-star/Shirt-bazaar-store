-- ============================================================
-- Phase 18: Multi Hero Banner Slider Support
-- ============================================================

-- Ensure store_banners table exists and has proper columns
create table if not exists public.store_banners (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  media_type text not null default 'image' check (media_type in ('video', 'image')),
  video_url text,
  image_url text,
  poster_url text,
  badge_text text default 'SPRING / SUMMER 2026 DROP',
  title text not null default 'Essentials, Elevated.',
  subtitle text not null default 'Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.',
  cta_text text not null default 'Shop Collection',
  cta_link text not null default '#products',
  secondary_cta_text text default 'Explore Oversized',
  secondary_cta_link text default '/category/oversized',
  overlay_opacity integer not null default 50 check (overlay_opacity >= 0 and overlay_opacity <= 100),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.store_banners enable row level security;

-- Policy: Everyone can read active banners
drop policy if exists "Public store banners read" on public.store_banners;
create policy "Public store banners read"
  on public.store_banners
  for select
  using (true);

-- Policy: Authenticated users can insert/update/delete
drop policy if exists "Admin store banners write" on public.store_banners;
create policy "Admin store banners write"
  on public.store_banners
  for all
  to authenticated
  using (true)
  with check (true);
