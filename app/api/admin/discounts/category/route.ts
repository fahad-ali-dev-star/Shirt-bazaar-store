import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { parseJsonObject, validateCategoryDiscountInput } from "@/lib/validation";
import { invalidateCache } from "@/lib/redis";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const payload = parseJsonObject(body);
    const result = validateCategoryDiscountInput(payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { category, discount_percent } = result.value;
    const supabase = createAdminClient();

    let query = supabase
      .from("products")
      .update({ discount_percent })
      .eq("is_active", true);

    if (category.toLowerCase() !== "all") {
      // Apply to specific category (case-insensitive)
      query = query.ilike("category", category);
    }

    const { data, error } = await query.select("id, name, slug, category, discount_percent");

    if (error) {
      logServerError("Category discount update failed", error, { category, discount_percent });
      return NextResponse.json({ error: "Failed to update category discount" }, { status: 500 });
    }

    // Invalidate Redis cache and Next.js tags
    try {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
      await invalidateCache(
        "cache:store:home-products",
        `cache:store:category:${categorySlug}`,
        `cache:store:category:${category}`
      );
      revalidatePath("/");
      revalidatePath("/admin/products");
      revalidatePath(`/category/${categorySlug}`);
      revalidateTag("products");
      revalidateTag("home-products");
    } catch (cacheErr) {
      console.warn("Cache invalidation warning:", cacheErr);
    }

    return NextResponse.json({
      success: true,
      category,
      discount_percent,
      affectedCount: data?.length ?? 0,
      products: data ?? [],
    });
  } catch (err) {
    logServerError("Category discount request failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
