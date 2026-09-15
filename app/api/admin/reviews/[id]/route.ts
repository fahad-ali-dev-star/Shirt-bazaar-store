import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { isUuid, parseJsonObject } from "@/lib/validation";
import { logServerError } from "@/lib/api/errors";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const payload = parseJsonObject(body);
    if (!payload) return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });

    const allowedStatuses = ["approved", "pending", "rejected"] as const;
    if (payload.status !== undefined && !allowedStatuses.includes(payload.status as any)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updateData: { status?: "approved" | "pending" | "rejected"; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (payload.status !== undefined) {
      updateData.status = payload.status as "approved" | "pending" | "rejected";
    }

    const supabase = createAdminClient();
    const { data: updatedReview, error } = await supabase
      .from("product_reviews")
      .update(updateData)
      .eq("id", id)
      .select("*, products(slug)")
      .single();

    if (error) {
      logServerError("Failed to update review", error, { reviewId: id });
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    // Bust storefront cache if product slug exists
    try {
      const productSlug = (updatedReview as any)?.products?.slug;
      if (productSlug) {
        revalidatePath(`/products/${productSlug}`);
      }
    } catch {}

    return NextResponse.json({ review: updatedReview });
  } catch (err) {
    logServerError("Admin review update failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });

    const supabase = createAdminClient();

    // Fetch product slug before deleting for cache busting
    const { data: review } = await supabase
      .from("product_reviews")
      .select("product_id, products(slug)")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", id);

    if (error) {
      logServerError("Failed to delete review", error, { reviewId: id });
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }

    try {
      const productSlug = (review as any)?.products?.slug;
      if (productSlug) {
        revalidatePath(`/products/${productSlug}`);
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError("Admin review delete failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
