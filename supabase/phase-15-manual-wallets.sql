-- Phase 15: Manual Wallet Payments - JazzCash & Easypaisa
-- Run this migration in Supabase SQL editor or CLI.
-- This expands the payment_method constraint to accept 'jazzcash' and 'easypaisa'.

-- 1. Drop the existing constraint
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- 2. Add the updated constraint to include jazzcash and easypaisa
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('stripe', 'cod', 'jazzcash', 'easypaisa'));

-- 3. Add an index on payment_method if not already present
CREATE INDEX IF NOT EXISTS idx_orders_payment_method
  ON orders(payment_method);

-- 4. (Optional) Backfill any existing rows with NULL payment_method to 'cod'
UPDATE orders
  SET payment_method = 'cod'
  WHERE payment_method IS NULL;

-- Done. Your store now accepts jazzcash and easypaisa as payment methods.
