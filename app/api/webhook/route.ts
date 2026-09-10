import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markStripeOrderPaid } from "@/lib/payments/checkout-helpers";
import { isUuid } from "@/lib/validation";
import { logServerError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    logServerError("Stripe webhook is not configured", new Error("missing Stripe configuration"));
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId || !isUuid(orderId)) {
        logServerError("Stripe checkout session missing order_id", new Error("invalid Stripe metadata"), { eventId: event.id });
        return NextResponse.json({ error: "Missing order metadata" }, { status: 400 });
      }

      if (session.mode !== "payment") {
        logServerError("Unexpected Stripe Checkout mode", new Error("unexpected Stripe mode"), { eventId: event.id });
        return NextResponse.json({ error: "Invalid payment mode" }, { status: 400 });
      }

      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      if (session.currency !== "pkr" || session.amount_total == null) {
        logServerError("Invalid Stripe payment amount/currency", new Error("invalid Stripe payment"), { eventId: event.id });
        return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
      }

      await markStripeOrderPaid(
        orderId,
        session.id,
        session.amount_total,
        session.currency
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logServerError("Stripe webhook processing failed", error, { eventId: event.id, eventType: event.type });
    // A 5xx tells Stripe to retry the event. The database finalization is
    // transactional and idempotent, so retries are safe.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
