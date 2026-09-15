import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/errors";

export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, user_id, author_name, author_email, rating, title, comment, is_verified_buyer, status, helpful_count, created_at, products(id, name, slug)")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      logServerError("Admin reviews fetch failed", error);
      return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err) {
    logServerError("Admin reviews request failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
