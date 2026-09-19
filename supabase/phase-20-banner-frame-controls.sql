-- ============================================================
-- Phase 20: Banner Frame / Height Controls
-- ============================================================
-- Adds banner_height and image_fit columns to store_banners

alter table public.store_banners
  add column if not exists banner_height text not null default 'tall'
    check (banner_height in ('screen', 'tall', 'standard')),
  add column if not exists image_fit text not null default 'cover'
    check (image_fit in ('cover', 'contain'));
