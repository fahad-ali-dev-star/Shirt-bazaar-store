import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { authorized, user } = await requireUser();
  if (!authorized || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const orderId = body?.orderId;

    if (!isUuid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch order to check ownership and status
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, user_id, status, payment_status, payment_method, created_at")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow cancelling if order is in pending or processing state
    if (order.status !== "pending" && order.status !== "processing") {
      return NextResponse.json(
        { error: `Cannot cancel order in "${order.status}" status. Please contact customer support.` },
        { status: 400 }
      );
    }

    // Update order status to cancelled
    const { error: cancelErr } = await supabase
      .from("orders")
      .update({ status: "cancelled", payment_status: order.payment_status === "paid" ? "failed" : order.payment_status })
      .eq("id", orderId);

    if (cancelErr) {
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }

    // Restore variant stock
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

    return NextResponse.json({ success: true, message: "Order cancelled successfully." });
  } catch (err) {
    return NextResponse.json({ error: "Unable to process order cancellation" }, { status: 500 });
  }
}
