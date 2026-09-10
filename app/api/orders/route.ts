import { NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/errors";

// Returns only the authenticated user's own orders. Supabase RLS is the
// database-level backstop, but authentication is checked explicitly here.
export async function GET() {
  const { authorized } = await requireUser();
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at, order_items(qty, price_at_purchase)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logServerError("Failed to load customer orders", error);
    return NextResponse.json({ error: "Failed to load orders", code: "INTERNAL_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
