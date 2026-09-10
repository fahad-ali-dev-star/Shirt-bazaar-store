import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  cancelPendingStripeOrder,
  createCodOrder,
  createManualWalletOrder,
  createPendingStripeOrder,
} from "@/lib/payments/checkout-helpers";
import { requireUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import {
  parseJsonObject,
  validateCheckoutItems,
  validateCouponCode,
  validatePaymentMethod,
  validateShippingAddress,
  validateWalletDetails,
} from "@/lib/validation";
import { logServerError } from "@/lib/api/errors";

async function resolveCouponDiscount(couponCode: string | null): Promise<number> {
  if (!couponCode) return 0;
  const code = couponCode.trim().toUpperCase();

  try {
    const supabase = createAdminClient();
    const { data: promo } = await (supabase as any)
      .from("store_promos")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promo && promo.coupon_code && promo.coupon_code.toUpperCase() === code) {
      const numberMatch = code.match(/\d+/);
      const percent = numberMatch ? parseInt(numberMatch[0], 10) : 20;
      return Math.min(Math.max(percent, 5), 80);
    }
  } catch (err) {
    console.warn("Could not check active promo for checkout discount:", err);
  }

  const STANDARD_CODES: Record<string, number> = {
    SAVE20: 20,
    SAVE15: 15,
    SAVE10: 10,
    WELCOME15: 15,
    WELCOME10: 10,
    FREESHIP: 10,
    SUMMERDROP: 25,
    VIP20: 20,
  };

  if (STANDARD_CODES[code]) {
    return STANDARD_CODES[code];
  }

  if (code.startsWith("SAVE") || code.startsWith("SALE") || code.startsWith("OFF")) {
    const numMatch = code.match(/\d+/);
    if (numMatch) {
      const percent = parseInt(numMatch[0], 10);
      if (percent > 0 && percent <= 50) return percent;
    }
  }

  return 0;
}

export async function POST(req: NextRequest) {
  const { authorized, user } = await requireUser();
  if (!authorized || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (process.env.UPSTASH_REDIS_REST_URL) {
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
    });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await ratelimit.limit(`checkout:${user.id}:${ip}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 100_000) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseJsonObject(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });
  }

  const itemResult = validateCheckoutItems(payload.items);
  if (!itemResult.ok) {
    return NextResponse.json({ error: itemResult.error }, { status: 400 });
  }

  const shippingResult = validateShippingAddress(payload.shippingAddress);
  if (!shippingResult.ok) {
    return NextResponse.json({ error: shippingResult.error }, { status: 400 });
  }

  const methodResult = validatePaymentMethod(payload.paymentMethod);
  if (!methodResult.ok) {
    return NextResponse.json({ error: methodResult.error }, { status: 400 });
  }

  const couponResult = validateCouponCode(payload.couponCode);
  if (!couponResult.ok) {
    return NextResponse.json({ error: couponResult.error }, { status: 400 });
  }

  const normalizedItems = itemResult.value;
  const shippingAddress = shippingResult.value;
  const paymentMethod = methodResult.value;
  const couponCode = couponResult.value;

  const discountPercent = await resolveCouponDiscount(couponCode);

  // Handle Cash on Delivery (COD)
  if (paymentMethod === "cod") {
    try {
      const created = await createCodOrder({
        items: normalizedItems,
        shippingAddress,
        userId: user.id,
      });

      // Apply server-side discount to order total if coupon is active
      if (discountPercent > 0) {
        const discountedTotal = Math.max(
          0,
          Math.round(created.order.total * (1 - discountPercent / 100) * 100) / 100
        );
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            total: discountedTotal,
            payment_reference: `COD-${created.order.id} [${couponCode}]`,
          })
          .eq("id", created.order.id);
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectUrl = `${siteUrl}/checkout/success?order=${created.order.id}&method=cod`;

      return NextResponse.json({
        success: true,
        orderId: created.order.id,
        url: redirectUrl,
      });
    } catch (error) {
      logServerError("COD Checkout failed", error, { userId: user.id });
      const msg =
        error instanceof Error &&
        (error.message.includes("out of stock") || error.message.includes("unavailable"))
          ? error.message
          : "Failed to place Cash on Delivery order. Please try again.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Handle JazzCash & Easypaisa Manual Payments
  if (paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
    const walletCheck = validateWalletDetails(
      paymentMethod,
      payload.transactionId,
      payload.senderPhone
    );
    if (!walletCheck.ok) {
      return NextResponse.json({ error: walletCheck.error }, { status: 400 });
    }

    try {
      const created = await createManualWalletOrder({
        items: normalizedItems,
        shippingAddress,
        userId: user.id,
        paymentMethod,
        transactionId: walletCheck.transactionId,
        senderPhone: walletCheck.senderPhone,
        discountPercent,
        couponCode,
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      const redirectUrl = `${siteUrl}/checkout/success?order=${created.order.id}&method=${paymentMethod}&tid=${encodeURIComponent(
        walletCheck.transactionId
      )}`;

      return NextResponse.json({
        success: true,
        orderId: created.order.id,
        url: redirectUrl,
      });
    } catch (error) {
      const walletName = paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa";
      logServerError(`${walletName} Checkout failed`, error, { userId: user.id });
      const msg =
        error instanceof Error &&
        (error.message.includes("out of stock") || error.message.includes("unavailable"))
          ? error.message
          : `Failed to place ${walletName} order. Please try again.`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Handle Stripe card payment
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_SITE_URL) {
    logServerError("Stripe checkout is not configured", new Error("missing Stripe configuration"));
    return NextResponse.json({ error: "Card checkout is temporarily unavailable" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let orderId: string | null = null;

  try {
    const created = await createPendingStripeOrder({
      items: normalizedItems,
      shippingAddress,
      userId: user.id,
    });
    orderId = created.order.id;

    // Update order total with discount in database
    if (discountPercent > 0) {
      const discountedTotal = Math.max(
        0,
        Math.round(created.order.total * (1 - discountPercent / 100) * 100) / 100
      );
      const supabase = createAdminClient();
      await supabase
        .from("orders")
        .update({
          total: discountedTotal,
        })
        .eq("id", orderId);
    }

    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: created.variants.map((variant) => {
            const unitPrice = discountPercent > 0
              ? Math.round(variant.price * (1 - discountPercent / 100) * 100)
              : Math.round(variant.price * 100);

            return {
              price_data: {
                currency: "pkr",
                product_data: {
                  name:
                    variant.name +
                    (discountPercent > 0 ? ` (${discountPercent}% Off with ${couponCode})` : ""),
                },
                unit_amount: Math.max(100, unitPrice),
              },
              quantity: variant.qty,
            };
          }),
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order=${orderId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
          metadata: { order_id: orderId, coupon_code: couponCode || "" },
        },
        { idempotencyKey: `checkout:${orderId}` }
      );

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }

      return NextResponse.json({ url: session.url });
    } catch (stripeError) {
      await cancelPendingStripeOrder(orderId);
      throw stripeError;
    }
  } catch (error) {
    logServerError("Checkout failed", error, { userId: user.id, orderId });
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}
