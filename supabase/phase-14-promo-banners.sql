-- Phase 14: Promotional & Offer Announcement Banner System
create table if not exists public.store_promos (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default true,
  badge_text text default 'LIMITED TIME OFFER',
  message text not null default 'Get 20% off all heavyweight cotton essentials!',
  coupon_code text default 'SALE20',
  cta_text text default 'Shop Sale',
  cta_link text default '/#products',
  theme text not null default 'dark' check (theme in ('dark', 'brand', 'emerald', 'amber', 'purple', 'crimson')),
  can_dismiss boolean not null default true,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.store_promos enable row level security;

-- Policy: Everyone can read active promos
drop policy if exists "Public store promos read" on public.store_promos;
create policy "Public store promos read"
  on public.store_promos
  for select
  using (true);

-- Policy: Authenticated admin users can manage
drop policy if exists "Admin store promos write" on public.store_promos;
create policy "Admin store promos write"
  on public.store_promos
  for all
  to authenticated
  using (true)
  with check (true);

-- Seed initial promotional announcement if empty
insert into public.store_promos (
  is_active,
  badge_text,
  message,
  coupon_code,
  cta_text,
  cta_link,
  theme,
  can_dismiss
)
select
  true,
  'FLASH SALE ⚡',
  'Enjoy 20% OFF all premium shirts this week only!',
  'SAVE20',
  'Claim Discount',
  '/#products',
  'dark',
  true
where not exists (select 1 from public.store_promos);
