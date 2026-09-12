import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Fetch current promo banner config
    const { data: promoData, error: promoError } = await (supabase as any)
      .from("store_promos")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promoError && promoError.code !== "PGRST116") {
      return NextResponse.json({ error: promoError.message }, { status: 500 });
    }

    // 2. Fetch all orders to compute Offers & Promos Analytics
    const { data: rawOrders } = await supabase
      .from("orders")
      .select(
        "id, total, status, payment_status, payment_method, payment_reference, created_at, shipping_address, order_items(qty, price_at_purchase)"
      )
      .order("created_at", { ascending: false });

    const orders = (rawOrders as any[]) || [];
    const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");

    // Standard discount rate mapping helper
    const getDiscountPercent = (code: string): number => {
      const match = code.match(/\d+/);
      if (match) return Math.min(Math.max(parseInt(match[0], 10), 5), 80);
      if (code === "FREESHIP") return 10;
      if (code === "SUMMERDROP") return 25;
      return 15;
    };

    let totalPromoOrders = 0;
    let totalPromoRevenue = 0;
    let totalDiscountGiven = 0;
    const promoCodeMap = new Map<
      string,
      { code: string; count: number; revenue: number; discount: number }
    >();
    const recentPromoOrders: Array<{
      id: string;
      code: string;
      customerName: string;
      city: string;
      total: number;
      estimatedSavings: number;
      status: string;
      createdAt: string;
      paymentMethod: string;
    }> = [];

    nonCancelledOrders.forEach((o) => {
      const paymentRef = o.payment_reference || "";
      const couponMatch = paymentRef.match(/\[([A-Za-z0-9_-]+)\]/);

      if (couponMatch) {
        const code = couponMatch[1].toUpperCase();
        const orderTotal = Number(o.total || 0);
        const percent = getDiscountPercent(code);

        // Estimate original subtotal before discount: final = subtotal * (1 - percent/100) + shipping
        // Estimated savings = orderTotal / (1 - percent/100) * (percent/100)
        const estimatedSavings = Math.round((orderTotal / (1 - percent / 100)) * (percent / 100));

        totalPromoOrders += 1;
        totalPromoRevenue += orderTotal;
        totalDiscountGiven += estimatedSavings;

        const currentStat = promoCodeMap.get(code) || {
          code,
          count: 0,
          revenue: 0,
          discount: 0,
        };
        currentStat.count += 1;
        currentStat.revenue += orderTotal;
        currentStat.discount += estimatedSavings;
        promoCodeMap.set(code, currentStat);

        if (recentPromoOrders.length < 10) {
          recentPromoOrders.push({
            id: o.id,
            code,
            customerName:
              (o.shipping_address as any)?.fullName ||
              (o.shipping_address as any)?.name ||
              "Customer",
            city: (o.shipping_address as any)?.city || "",
            total: orderTotal,
            estimatedSavings,
            status: o.status,
            createdAt: o.created_at,
            paymentMethod: o.payment_method,
          });
        }
      }
    });

    const totalOrdersCount = nonCancelledOrders.length;
    const promoUsageRate =
      totalOrdersCount > 0
        ? Math.round((totalPromoOrders / totalOrdersCount) * 100)
        : 0;

    const codeBreakdown = Array.from(promoCodeMap.values()).sort(
      (a, b) => b.count - a.count || b.revenue - a.revenue
    );

    const analytics = {
      totalStoreOrders: totalOrdersCount,
      totalPromoOrders,
      totalPromoRevenue,
      totalDiscountGiven,
      promoUsageRate,
      codeBreakdown,
      recentPromoOrders,
    };

    return NextResponse.json({
      promo: promoData || null,
      analytics,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      is_active,
      badge_text,
      message,
      coupon_code,
      cta_text,
      cta_link,
      theme,
      can_dismiss,
    } = body;

    const supabase = createAdminClient();

    // If only is_active toggle is being changed and id is supplied
    if (typeof is_active === "boolean" && id && !message) {
      const { data, error } = await (supabase as any)
        .from("store_promos")
        .update({
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ promo: data });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Promo message is required" }, { status: 400 });
    }

    const payload = {
      is_active: typeof is_active === "boolean" ? is_active : true,
      badge_text: badge_text?.trim() || null,
      message: message.trim(),
      coupon_code: coupon_code?.trim() ? coupon_code.trim().toUpperCase() : null,
      cta_text: cta_text?.trim() || null,
      cta_link: cta_link?.trim() || "/#products",
      theme: ["dark", "brand", "emerald", "amber", "purple", "crimson"].includes(theme)
        ? theme
        : "dark",
      can_dismiss: can_dismiss ?? true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      result = await (supabase as any)
        .from("store_promos")
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!result.error && !result.data) {
        result = await (supabase as any)
          .from("store_promos")
          .insert(payload)
          .select()
          .single();
      }
    } else {
      result = await (supabase as any)
        .from("store_promos")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Admin promo save error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ promo: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    console.error("Admin promo PUT exception:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

