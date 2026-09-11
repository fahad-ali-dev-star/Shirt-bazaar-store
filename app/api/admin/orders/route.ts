import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { isUuid, parseJsonObject } from "@/lib/validation";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "fulfilled",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export async function GET() {
  const { authorized } = await requireAdmin();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, status, total, payment_status, payment_method, payment_reference, shipping_address, created_at, courier, tracking_number, shipped_at, order_items(qty, price_at_purchase, product_variants(size, color, products(name)))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  return NextResponse.json({ orders });
}

export async function PATCH(req: NextRequest) {
  const { authorized } = await requireAdmin();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseJsonObject(body);
  if (!payload) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const orderId = typeof payload.orderId === "string" ? payload.orderId.trim() : "";
  const status = payload.status;
  const paymentStatus = payload.payment_status;
  const courier = typeof payload.courier === "string" ? payload.courier.trim() : null;
  const trackingNumber =
    typeof payload.tracking_number === "string" ? payload.tracking_number.trim() : null;

  if (!isUuid(orderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // If only payment_status is being updated (e.g. verifying manual JazzCash/Easypaisa payment)
  if (paymentStatus !== undefined) {
    if (paymentStatus !== "paid" && paymentStatus !== "unpaid" && paymentStatus !== "failed") {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 });
    }

    const { data: currentOrder } = await supabase
      .from("orders")
      .select("id, status, payment_status, payment_method")
      .eq("id", orderId)
      .single();

    const { error: payErr } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        ...(paymentStatus === "failed" ? { status: "cancelled" } : {}),
      })
      .eq("id", orderId);

    if (payErr) {
      logServerError("Failed to update payment status", payErr, { orderId });
      return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
    }

    // If payment failed/rejected, restore inventory for this order's items
    if (paymentStatus === "failed" && currentOrder?.status !== "cancelled") {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("variant_id, qty")
        .eq("order_id", orderId);

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { data: currentVar } = await supabase
            .from("product_variants")
            .select("stock_qty")
            .eq("id", item.variant_id)
            .single();

          if (currentVar) {
            await supabase
              .from("product_variants")
              .update({ stock_qty: currentVar.stock_qty + item.qty })
              .eq("id", item.variant_id);
          }
        }
      }
    }

    if (!status) {
      return NextResponse.json({ success: true, payment_status: paymentStatus });
    }
  }

  if (status && !isOrderStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status) {
    if (status === "paid" || status === "refunded") {
      return NextResponse.json(
        { error: "Payment statuses are controlled by the payment system or payment status toggle" },
        { status: 400 }
      );
    }

    if (courier !== null && courier !== "" && !/^[\p{L}0-9 .,&'’()_-]{1,120}$/u.test(courier)) {
      return NextResponse.json({ error: "Courier name is too long" }, { status: 400 });
    }

    if (trackingNumber !== null && trackingNumber !== "" && !/^[A-Za-z0-9._\-\s/]{1,160}$/.test(trackingNumber)) {
      return NextResponse.json({ error: "Tracking number is too long" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("transition_order_status", {
      p_order_id: orderId,
      p_status: status as OrderStatus,
      p_courier: status === "shipped" ? courier : null,
      p_tracking_number: status === "shipped" ? trackingNumber : null,
    });

    if (error) {
      logServerError("Failed to transition order status", error, { orderId });
      const message = error.message || "Failed to update order";
      const clientMessage =
        message.includes("Order not found") ||
        message.includes("must move") ||
        message.includes("terminal state") ||
        message.includes("required when shipping") ||
        message.includes("too long")
          ? message
          : "Failed to update order";
      return NextResponse.json({ error: clientMessage }, { status: 400 });
    }

    // If a Cash on Delivery order was fulfilled, cash has been collected upon delivery
    if (status === "fulfilled") {
      await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId)
        .eq("payment_method", "cod");
    }

    const result = data as {
      changed: boolean;
      old_status: OrderStatus;
      status: OrderStatus;
      shipping_address?: Record<string, unknown>;
      courier?: string | null;
      tracking_number?: string | null;
    };

    // Only send a shipped notification when the transition actually changed the state.
    if (result.changed && result.status === "shipped" && result.tracking_number) {
      try {
        const address = result.shipping_address ?? {};
        const toEmail = typeof address.email === "string" ? address.email : null;
        const customerName =
          typeof address.fullName === "string"
            ? address.fullName
            : typeof address.name === "string"
              ? address.name
              : "Customer";

        if (toEmail) {
          const { sendOrderShippedEmail } = await import("@/lib/email/resend");
          await sendOrderShippedEmail(
            toEmail,
            customerName,
            orderId,
            result.courier || "Our Delivery Partner",
            result.tracking_number
          );
        }
      } catch (error) {
        // The order transition has already committed. Email failure must not roll it back.
        logServerError("Error sending shipped email", error, { orderId });
      }
    }

    return NextResponse.json({ success: true, result });
  }

  // No status or payment_status provided
  return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
}
