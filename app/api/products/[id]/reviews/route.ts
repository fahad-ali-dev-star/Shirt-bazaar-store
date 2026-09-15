import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isUuid, parseJsonObject, validateReviewInput } from "@/lib/validation";
import { logServerError } from "@/lib/api/errors";
import { revalidatePath } from "next/cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("id, author_name, rating, title, comment, is_verified_buyer, helpful_count, created_at")
      .eq("product_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logServerError("Failed to fetch product reviews", error, { productId: id });
      return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
    }

    const reviewList = reviews || [];
    const totalReviews = reviewList.length;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    for (const r of reviewList) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[star] = (distribution[star] || 0) + 1;
      ratingSum += r.rating;
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5.0;

    return NextResponse.json({
      reviews: reviewList,
      stats: {
        totalReviews,
        averageRating,
        distribution,
      },
    });
  } catch (err) {
    logServerError("Exception in GET product reviews", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const payload = parseJsonObject(body);
    const validation = validateReviewInput(payload);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { author_name, author_email, rating, title, comment } = validation.value;

    // Check if user is logged in
    let userId: string | null = null;
    let isVerifiedBuyer = false;

    try {
      const authClient = await createClient();
      const { data: authData } = await authClient.auth.getUser();
      if (authData?.user) {
        userId = authData.user.id;

        // Check if user has purchased this product
        const adminClient = createAdminClient();
        const { data: orderItemMatch } = await adminClient
          .from("order_items")
          .select("id, orders!inner(user_id, status), product_variants!inner(product_id)")
          .eq("orders.user_id", userId)
          .eq("product_variants.product_id", id)
          .in("orders.status", ["paid", "processing", "shipped", "fulfilled"])
          .limit(1);

        if (orderItemMatch && orderItemMatch.length > 0) {
          isVerifiedBuyer = true;
        }
      }
    } catch {
      // Non-blocking if auth lookup fails
    }

    const supabase = createAdminClient();

    // Verify product exists and fetch slug for cache busting
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: newReview, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: id,
        user_id: userId,
        author_name,
        author_email,
        rating,
        title,
        comment,
        is_verified_buyer: isVerifiedBuyer,
        status: "approved",
      })
      .select("id, author_name, rating, title, comment, is_verified_buyer, helpful_count, created_at")
      .single();

    if (insertError) {
      logServerError("Failed to create product review", insertError, { productId: id });
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    // Revalidate storefront product path
    try {
      if (product.slug) {
        revalidatePath(`/products/${product.slug}`);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      review: newReview,
    });
  } catch (err) {
    logServerError("Exception in POST product review", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
