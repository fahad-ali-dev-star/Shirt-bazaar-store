# Feature Guide: Customer Accounts + Order History

This document fully specifies the "customer accounts + order history" feature
already implemented in this project. Hand this file to any AI agent or
developer working on this codebase — it explains what was built, why, the
exact files touched, and how to verify it.

---

## 1. What this feature does

Before this feature: a customer could buy a shirt but had no way to sign in
or see past orders. Every checkout was effectively a "guest" checkout.

After this feature:
- A customer can sign in with just their email (passwordless "magic link").
- Once signed in, every order they place is linked to their account.
- They can visit `/account` to see every past order, its status, items, and
  totals.
- Guest checkout still works — signing in is optional, not required to buy.

---

## 2. Why this design (architecture decisions)

| Decision | Reasoning |
|---|---|
| **Passwordless (magic link) auth**, not email+password | Fewer support tickets ("forgot password"), fewer signup drop-offs, no password hashes to secure. Uses Supabase Auth's built-in `signInWithOtp`. |
| **Guest checkout stays supported** | Forcing account creation before purchase is a proven conversion killer for e-commerce. `user_id` on `orders` is nullable — checkout works identically whether or not someone's signed in. |
| **Order history reads go through the regular (RLS) Supabase client, not the admin/service-role client** | Row Level Security already restricts `orders` to `auth.uid() = user_id`. Using the normal client means the database itself enforces "you can only see your own orders" — there's no way to write a bug that leaks another customer's orders, because the query would just return nothing. |
| **Account page is a Server Component**, not client-fetched | Order history is not interactive/real-time — a server-rendered page is simpler, avoids a loading spinner, and doesn't expose an extra API endpoint. |
| **Separate login pages for customers (`/login`) vs admins (`/admin/login`)** | Both use Supabase Auth (same user table), but redirect to different places after login and serve different audiences. An admin email could also shop as a normal customer with the same account. |

---

## 3. Database changes

**None required beyond the original schema.** The `orders` table already had:

```sql
orders (
  ...
  user_id uuid references auth.users(id),
  ...
)
```

and this RLS policy already existed:

```sql
create policy "Users read own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Users read own order items" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
```

The only gap was that **nothing was ever writing `user_id`** on order
creation, and there was no UI for a customer to sign in or view orders.

---

## 4. Files added

### `app/(shop)/login/page.tsx`
Customer-facing sign-in page. Renders an email input, calls
`supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: ".../account" } })`.
On success shows "check your email" — no password field exists anywhere.

### `app/(shop)/account/page.tsx`
Server Component. Flow:
1. Creates a server-side Supabase client (`lib/supabase/server.ts`'s
   `createClient()` — the regular one, **not** `createAdminClient()`).
2. Calls `supabase.auth.getUser()`. If no user, `redirect("/login")`.
3. Queries `orders` joined with `order_items` → `product_variants` →
   `products`, ordered newest first. No manual `.eq("user_id", ...)` filter
   is needed — RLS does this automatically based on the authenticated
   session's cookies.
4. Renders each order: id (shortened), date, status badge (color-coded:
   yellow=pending-ish, green=fulfilled, red=cancelled/refunded), line items,
   payment status, total.
5. Empty state ("no orders yet") links back to the homepage.

### `app/(shop)/account/sign-out-button.tsx`
Small client component: calls `supabase.auth.signOut()`, redirects to `/`,
calls `router.refresh()` so the nav bar re-renders in its signed-out state.

---

## 5. Files modified

### `app/api/checkout/route.ts`
Added, near the top of the `POST` handler:

```ts
const authClient = await createClient();
const {
  data: { user },
} = await authClient.auth.getUser();
```

And when inserting the order:

```ts
const { data: order } = await supabase
  .from("orders")
  .insert({
    user_id: user?.id ?? null,   // <-- added
    status: "pending",
    total,
    shipping_address: shippingAddress,
    payment_status: "unpaid",
  })
```

This is the one line that actually links an order to a customer. Everything
else in checkout (price re-validation, stock check, Stripe session creation)
is unchanged. Note this still uses `createAdminClient()` (service role) to
write the order — the *read* of who's logged in uses the regular client,
but the *write* of the order itself still goes through the privileged path,
since guests (no session) must also be able to create orders.

### `app/nav-bar.tsx`
Added an auth-aware link:

```tsx
const [signedIn, setSignedIn] = useState(false);

useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
}, []);

// in JSX:
<Link href={signedIn ? "/account" : "/login"}>
  {signedIn ? "My orders" : "Sign in"}
</Link>
```

Note: this check is client-side and shared with the existing "Admin" link
logic added earlier — a signed-in admin will also see "My orders" (they're
the same underlying Supabase Auth user type). This is intentional for
simplicity; splitting "customer" vs "admin" into different concepts would
require a `role` column, which isn't necessary yet.

---

## 6. Environment variables

**No new environment variables were required.** This feature reuses:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase Auth's email/magic-link sending uses Supabase's built-in email
service by default (rate-limited, fine for testing). For production volume,
configure a custom SMTP provider in the Supabase dashboard under
**Authentication → Settings → SMTP Settings** — otherwise magic links can be
rate-limited or land in spam at scale.

---

## 7. How to verify this feature works

1. `npm run dev`
2. Go to `/login`, enter your email, submit.
3. Check your inbox for the Supabase magic link email, click it.
4. You should land on `/account` — since you have no orders yet, you'll see
   the "no orders yet" empty state.
5. Add a product to cart, go through `/checkout` and complete a **test mode**
   Stripe payment.
6. Once the webhook fires (payment confirmed), return to `/account` — the
   order should now appear with status `paid`.
7. Confirm the nav bar shows "My orders" instead of "Sign in" while
   logged in, and flips back after clicking **Sign out**.
8. To confirm RLS is actually protecting this (not just the UI hiding
   things): sign in as a *different* email and confirm you see zero orders
   from the first account — even though both rows exist in the same table.

---

## 8. Known limitations / good next steps

- **No profile page** — customers can't update their name, saved address, or
  phone number. Currently that info is only captured per-order in
  `shipping_address` (a JSON blob), not tied to a reusable profile.
- **No "resend magic link" cooldown UI** — Supabase enforces its own rate
  limit server-side, but the UI doesn't show a friendly countdown if someone
  clicks "send" repeatedly.
- **Order status colors are a simple heuristic** (anything not
  fulfilled/cancelled/refunded shows as the "pending" yellow style) — fine for
  5 statuses, would need revisiting if more granular statuses are added.
- **No email notification on order status change** — a customer won't be
  proactively told their order shipped; they'd have to check `/account`
  manually. Pairs well with the "order confirmation emails" feature if you
  build that next.
