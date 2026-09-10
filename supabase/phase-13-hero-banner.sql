-- Phase 13: Hero Video & Banner Management Suite
create table if not exists public.store_banners (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  media_type text not null default 'video' check (media_type in ('video', 'image')),
  video_url text,
  image_url text,
  poster_url text,
  badge_text text default 'SPRING / SUMMER 2026 DROP',
  title text not null default 'Essentials, Elevated.',
  subtitle text not null default 'Discover our new collection of heavy-cotton and oversized shirts. Crafted for everyday comfort, tailored to last a lifetime.',
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

-- Policy: Authenticated admin users can update
drop policy if exists "Admin store banners write" on public.store_banners;
create policy "Admin store banners write"
  on public.store_banners
  for all
  to authenticated
  using (true)
  with check (true);

-- Seed default high-grade cinematic apparel loop video if table is empty
insert into public.store_banners (
  media_type,
  video_url,
  image_url,
  poster_url,
  badge_text,
  title,
  subtitle,
  cta_text,
  cta_link,
  secondary_cta_text,
  secondary_cta_link,
  overlay_opacity
)
select
  'video',
  'https://assets.mixkit.co/videos/preview/mixkit-young-man-in-a-white-t-shirt-looking-at-the-camera-42861-large.mp4',
  '/hero_banner.png',
  '/hero_banner.png',
  'SPRING / SUMMER 2026 DROP',
  'Essentials, Elevated.',
  'Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.',
  'Shop Collection',
  '#products',
  'Explore Oversized',
  '/category/oversized',
  55
where not exists (select 1 from public.store_banners);
