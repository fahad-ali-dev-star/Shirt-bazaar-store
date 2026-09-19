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

import { calculateShipping } from "@/lib/payments/shipping";
import { hasUserClaimedOffer } from "@/lib/payments/offers";

// Standard preset discount mappings
const STANDARD_CODES: Record<string, number> = {
  SAVE20: 20,
  SAVE15: 15,
  SAVE10: 10,
  WELCOME15: 15,
  WELCOME10: 10,
  SUMMERDROP: 25,
  VIP20: 20,
  FREESHIP: 10,
};

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
      if (typeof promo.discount_percent === "number" && promo.discount_percent > 0) {
        return Math.min(Math.max(promo.discount_percent, 1), 80);
      }
      if (STANDARD_CODES[code]) {
        return STANDARD_CODES[code];
      }
      const numberMatch = code.match(/\d+/);
      if (numberMatch) {
        return Math.min(Math.max(parseInt(numberMatch[0], 10), 5), 80);
      }
      const msgMatch = (promo.message || "").match(/(\d+)\s*%/);
      if (msgMatch) {
        return Math.min(Math.max(parseInt(msgMatch[1], 10), 5), 80);
      }
      return 20;
    }
  } catch (err) {
    console.warn("Could not check active promo for checkout discount:", err);
  }

  if (STANDARD_CODES[code]) {
    return STANDARD_CODES[code];
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

  // ── One-Time Offer Redemption Enforcement ──
  if (couponCode) {
    const claimCheck = await hasUserClaimedOffer({
      userId: user.id,
      email: shippingAddress.email || user.email,
      phone: shippingAddress.phone,
    });

    if (claimCheck.hasClaimed) {
      return NextResponse.json(
        {
          error: "You have already redeemed a promotional offer on a previous order. Promotional offers are strictly one-time per customer.",
        },
        { status: 400 }
      );
    }
  }

  const discountPercent = await resolveCouponDiscount(couponCode);

  // Calculate actual subtotal from database variant prices for shipping calculation
  const variantIds = normalizedItems.map((i) => i.variantId);
  const supabase = createAdminClient();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, price_override, products(base_price, is_active)")
    .in("id", variantIds);

  let actualSubtotal = 0;
  if (variants && variants.length > 0) {
    for (const item of normalizedItems) {
      const v = variants.find((variant) => variant.id === item.variantId);
      const product = Array.isArray(v?.products) ? v?.products[0] : v?.products;
      const price = v?.price_override ?? product?.base_price ?? 2000;
      actualSubtotal += price * item.qty;
    }
  } else {
    actualSubtotal = normalizedItems.reduce((sum, item) => sum + item.qty * 2000, 0);
  }

  // Calculate discounted subtotal (matches frontend calculateShipping logic)
  const discountedSubtotal = discountPercent > 0
    ? Math.max(0, actualSubtotal * (1 - discountPercent / 100))
    : actualSubtotal;

  const calculatedShippingFee = calculateShipping(discountedSubtotal, shippingAddress.city);

  // Handle Cash on Delivery (COD)
  if (paymentMethod === "cod") {
    try {
      const created = await createCodOrder({
        items: normalizedItems,
        shippingAddress,
        userId: user.id,
        discountPercent,
        couponCode,
        shippingCost: calculatedShippingFee,
      });

      const redirectUrl = `/checkout/success?order=${created.order.id}&method=cod`;

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
        shippingCost: calculatedShippingFee,
      });

      const redirectUrl = `/checkout/success?order=${created.order.id}&method=${paymentMethod}&tid=${encodeURIComponent(
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
        (error.message.includes("out of stock") ||
          error.message.includes("unavailable") ||
          error.message.includes("Transaction ID"))
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

    // Update order total with discount and shipping in database
    let orderFinalTotal = created.order.total;
    if (discountPercent > 0) {
      orderFinalTotal = Math.max(
        0,
        Math.round(created.order.total * (1 - discountPercent / 100) * 100) / 100
      );
    }
    orderFinalTotal += calculatedShippingFee;

    let stripePaymentRef = `Stripe-${Date.now()}-${user.id.slice(0, 8)}`;
    if (couponCode) {
      stripePaymentRef += ` [${couponCode}]`;
    }
    if (calculatedShippingFee > 0) {
      stripePaymentRef += ` | Ship: Rs ${calculatedShippingFee}`;
    }

    const supabase = createAdminClient();
    await supabase
      .from("orders")
      .update({
        total: orderFinalTotal,
        payment_reference: stripePaymentRef,
      })
      .eq("id", orderId);

    try {
      // Note: Stripe does not support PKR currency. We convert PKR to USD at approx 1 USD = 278 PKR
      const PKR_TO_USD_RATE = 278;

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = created.variants.map((variant) => {
        const pkrUnitPrice = discountPercent > 0
          ? Math.round(variant.price * (1 - discountPercent / 100))
          : Math.round(variant.price);

        // Convert to USD cents (1 USD = 100 cents)
        const usdCents = Math.max(50, Math.round((pkrUnitPrice / PKR_TO_USD_RATE) * 100));

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${variant.name} (Rs ${pkrUnitPrice.toLocaleString()} PKR)${
                discountPercent > 0 ? ` [${discountPercent}% Off with ${couponCode}]` : ""
              }`,
            },
            unit_amount: usdCents,
          },
          quantity: variant.qty,
        };
      });

      if (calculatedShippingFee > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Standard Delivery (Rs ${calculatedShippingFee} PKR)`,
            },
            unit_amount: Math.max(50, Math.round((calculatedShippingFee / PKR_TO_USD_RATE) * 100)),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: lineItems,
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
