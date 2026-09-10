-- Shirt Store — Phase 1 migration: Stripe only
-- Run this against an existing Supabase project before deploying the Phase 1 code.

-- Remove manual payment claims and their RLS policies.
drop table if exists payment_claims cascade;

-- Remove the obsolete payment-method discriminator. Stripe is now the only provider.
alter table orders drop column if exists payment_method;

-- Keep payment_reference for the Stripe Checkout Session/payment reference.
-- Restrict payment_status to the states used by Stripe checkout.
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'failed'));

-- Manual payment proof endpoints/routes are removed from the application in Phase 1.
