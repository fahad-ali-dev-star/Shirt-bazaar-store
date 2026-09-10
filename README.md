# Shirt Store

Stack: **Next.js (App Router) + Supabase (Postgres) + Tailwind + Stripe + Vercel**

This is now a fully wired, buildable project — not just a scaffold. `npm run
build` passes cleanly with no type errors. Cart, checkout, and admin panel
are all implemented and connected to a real, live Supabase project.

## What's in here

```
supabase/schema.sql              → full DB schema, RLS policies, stock trigger (already applied live)
lib/supabase/client.ts           → browser Supabase client
lib/supabase/server.ts           → server + admin (service role) Supabase clients
lib/store/cart.ts                → Zustand cart store, persisted to localStorage
lib/admin.ts                     → admin allow-list auth check (ADMIN_EMAILS)

app/layout.tsx, nav-bar.tsx       → root layout + nav with live cart count
app/(shop)/page.tsx               → homepage, all active products (ISR, 1hr)
app/(shop)/category/[slug]        → category listing page (ISR, 1hr)
app/(shop)/products/[slug]        → product detail + variant picker + add-to-cart (ISR, 1hr)
app/(shop)/cart                   → cart page (qty edit, remove, totals)
app/(shop)/checkout               → shipping form → Stripe Checkout session
app/(shop)/checkout/success       → post-payment confirmation, clears cart

app/(admin)/admin/login           → magic-link sign-in (Supabase Auth)
app/(admin)/admin/products        → product list, deactivate
app/(admin)/admin/products/new    → create product + variants
app/(admin)/admin/products/[id]   → edit product, toggle active
app/(admin)/admin/orders          → order list, update status per order

app/api/checkout                  → re-validates price/stock, rate-limited, creates Stripe session
app/api/webhook                   → confirms payment, decrements stock (never at add-to-cart)
app/api/orders                    → logged-in customer's own orders (RLS-scoped)
app/api/admin/products (+ [id])   → admin CRUD, protected by requireAdmin()
app/api/admin/orders              → admin order list + status updates
```

Left as intentional next steps: uploading product images (wire up Supabase
Storage or Cloudinary — for now, insert `product_images` rows manually or add
an upload form), and a richer variant editor on the edit-product page (add/
remove variants after creation — fastest done directly in Supabase's table
editor for now).

## Live Supabase project

A real Supabase project has already been created and the schema applied:

- **Project:** `shirt-store` (region `ap-south-1`)
- **URL:** `https://oserungxdraxbrfgvttd.supabase.co`
- **Ref:** `oserungxdraxbrfgvttd`
- Schema is live: `products`, `product_variants`, `product_images`, `carts`,
  `cart_items`, `orders`, `order_items` — all with RLS enabled, zero security
  advisor warnings.
- One test product ("Classic Cotton Tee") with 4 variants is seeded.

`.env.local` is **already filled in** with the project URL and anon key. You
still need to add:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API →
  service_role. Required for admin routes and the checkout/webhook routes.
- `ADMIN_EMAILS` — your email, comma-separated if more than one. This gates
  access to `/admin/*`. Sign in at `/admin/login` with that email (magic
  link) before visiting `/admin/products` or `/admin/orders`.
- Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- Upstash Redis keys — optional; checkout rate-limiting is skipped
  gracefully if these aren't set, so you can leave them blank while testing.

⚠️ This Supabase project was created via a connector under your account — I
don't have your Supabase login, so go verify it in your dashboard
(supabase.com/dashboard) and treat the service role key as a secret only you
fetch, never commit it.

## Setup

1. Confirm the project above shows up in your Supabase dashboard.
2. Fill in the remaining values in `.env.local` (service role key, admin
   email, Stripe, Upstash).
3. Install deps and run:
   ```bash
   npm install
   npm run dev
   ```
4. Visit `/admin/login`, sign in with your `ADMIN_EMAILS` address, then
   `/admin/products/new` to add real products.
5. **Stripe webhook (local dev):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
6. Deploy to **Vercel**, add the same env vars there, and point your Stripe
   webhook at `https://yourdomain.com/api/webhook`.

## Design decisions worth knowing

- **Products vs. variants are separate tables.** A shirt has size/color combos,
  each with its own stock count — don't collapse this into one row.
- **Cart lives entirely in client state** (Zustand + localStorage), never
  hitting Supabase on add/remove/qty-change. It only touches the server once,
  at checkout — this is the main thing that keeps a store from buckling
  under traffic.
- **Stock is decremented at payment confirmation** (in the webhook), not at
  "add to cart," so abandoned carts don't lock up inventory.
- **Product/category pages use ISR** (`revalidate = 3600`), so a traffic spike
  hits cached HTML rather than your database. The admin product-edit route
  calls `revalidatePath` so edits show up immediately instead of waiting an hour.
- **RLS is on for every table.** Public reads for active products only;
  writes (admin actions) go through server routes using the service role key,
  which is never exposed to the browser. Admin routes are further gated by
  an `ADMIN_EMAILS` allow-list.
- **Never trust client-sent prices.** `api/checkout` re-fetches prices and
  stock from the DB before creating the Stripe session.

## Next steps (suggested order)

1. Add real product photos — wire up Supabase Storage (or Cloudinary) and an
   upload field in the admin product form.
2. Customer accounts — the schema and RLS already support per-user orders;
   add a customer-facing sign-in page (same pattern as `/admin/login`).
3. Order confirmation emails (Resend is a good fit here).
4. Stripe is the only payment provider configured for this store.


## Phase 1 — Stripe only

The store now uses Stripe as its only payment provider. JazzCash, Easypaisa, manual payment claims, payment-proof submission, and manual payment approval have been removed from the application.

For an existing Supabase database, run `supabase/phase-1-remove-manual-payments.sql` before deploying this version.

## Phase 4 — Canonical order lifecycle

Orders now use one lifecycle:

`pending -> paid -> processing -> shipped -> fulfilled`

`pending -> cancelled` is allowed before payment. `refunded` remains reserved for a future Stripe refund flow.

Shipping orders require `courier`, `tracking_number`, and `shipped_at`. Admin status changes go through the privileged `transition_order_status()` database function so invalid status jumps are rejected consistently.

For an existing Supabase project, run `supabase/phase-4-order-lifecycle.sql` after the Phase 3 migration.


## Phase 6 — Supabase RLS hardening

Run `supabase/phase-6-rls-hardening.sql` after the earlier Phase 1–5 migrations.

RLS is enabled and forced on every application table. Public storefront reads are limited to active products and their variants/images. Authenticated users can read only their own orders and manage only their own legacy carts. Customer-facing roles have no direct write access to products, orders, order items, variants, or images. Trusted server-side functions/routes use the service role for privileged mutations.

### Product image storage security

Product images are stored in the `product-images` Supabase Storage bucket. The bucket is public-read for storefront delivery, limited to JPEG/PNG/WebP and 5 MiB per object. The application never trusts the original filename; the admin upload API generates UUID-only object paths under `uploads/`. Client roles have no storage write policies; uploads go through the authenticated admin API using the server-only service role.

For an existing Supabase project, run `supabase/phase-7-storage-hardening.sql` after the previous migrations.


## Phase 10 performance

- Added catalog/order query limits to prevent unbounded result sets.
- Added partial indexes for active catalog ordering/category queries.
- Added trigram search support for product-name search.
- Added order/user and variant lookup indexes.
- Added a cookie-free, read-only public Supabase client so storefront pages can remain ISR-friendly.
- Added responsive `next/image` sizes and lazy loading for gallery thumbnails.
- Removed unused Cloudinary/Unsplash image host configuration.
- See `supabase/phase-10-performance.sql` for the existing-database migration.
