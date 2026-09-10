import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authorized, user } = await requireAdmin();
  if (!authorized && !(process.env.NODE_ENV === "development" && user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch all orders with items and variant/product details
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id, total, status, payment_status, payment_method, created_at, shipping_address, order_items(qty, price_at_purchase, variant_id, product_variants(size, color, stock_qty, products(id, name, slug, category, base_price)))"
      )
      .order("created_at", { ascending: false });

    if (ordersError) {
      logServerError("Failed to fetch analytics orders", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders data" }, { status: 500 });
    }

    // 2. Fetch inventory for low-stock monitoring
    const { data: variants, error: varError } = await supabase
      .from("product_variants")
      .select("id, size, color, sku, stock_qty, price_override, products(id, name, slug, is_active, base_price)")
      .order("stock_qty", { ascending: true });

    if (varError) {
      logServerError("Failed to fetch analytics variants", varError);
    }

    const orderList = (orders as unknown as any[]) || [];
    const nonCancelledOrders = orderList.filter((o) => o.status !== "cancelled");

    // KPI Calculations
    const totalGrossRevenue = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const paidRevenue = nonCancelledOrders
      .filter((o) => o.payment_status === "paid" || o.status === "fulfilled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrdersCount = nonCancelledOrders.length;
    const pendingActionCount = orderList.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalGrossRevenue / totalOrdersCount) : 0;

    // Status breakdown
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      fulfilled: 0,
      cancelled: 0,
    };
    orderList.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status] += 1;
      }
    });

    // Payment methods
    const paymentBreakdown = {
      cod: { count: 0, revenue: 0 },
      stripe: { count: 0, revenue: 0 },
    };
    nonCancelledOrders.forEach((o) => {
      const method = o.payment_method === "cod" ? "cod" : "stripe";
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].revenue += Number(o.total || 0);
    });

    // Daily Sales (Last 14 days time-series)
    const now = new Date();
    const dailyMap = new Map<string, { date: string; label: string; revenue: number; orders: number }>();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap.set(key, { date: key, label, revenue: 0, orders: 0 });
    }

    nonCancelledOrders.forEach((o) => {
      const orderDate = new Date(o.created_at).toISOString().split("T")[0];
      if (dailyMap.has(orderDate)) {
        const item = dailyMap.get(orderDate)!;
        item.revenue += Number(o.total || 0);
        item.orders += 1;
      }
    });

    const dailySales = Array.from(dailyMap.values());

    // Top Selling Products
    const productStats = new Map<
      string,
      { id: string; name: string; slug: string; unitsSold: number; totalRevenue: number }
    >();

    nonCancelledOrders.forEach((o) => {
      const items = (Array.isArray(o.order_items) ? o.order_items : []) as any[];
      items.forEach((item) => {
        const variant = item.product_variants;
        const product = variant?.products;
        if (product && product.name) {
          const pid = product.id || product.name;
          const current = productStats.get(pid) || {
            id: pid,
            name: product.name,
            slug: product.slug || "",
            unitsSold: 0,
            totalRevenue: 0,
          };
          current.unitsSold += Number(item.qty || 1);
          current.totalRevenue += Number(item.price_at_purchase || 0) * Number(item.qty || 1);
          productStats.set(pid, current);
        }
      });
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Low stock alerts (variants with stock_qty <= 5)
    const lowStockVariants = ((variants as unknown as any[]) || [])
      .filter((v) => (v.products as any)?.is_active && v.stock_qty <= 5)
      .map((v) => ({
        id: v.id,
        productName: (v.products as any)?.name || "Unknown Product",
        slug: (v.products as any)?.slug || "",
        size: v.size,
        color: v.color,
        sku: v.sku,
        stockQty: v.stock_qty,
      }))
      .slice(0, 10);

    // Recent 5 orders for feed
    const recentOrders = orderList.slice(0, 6).map((o) => ({
      id: o.id,
      total: Number(o.total || 0),
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      createdAt: o.created_at,
      customerName:
        (o.shipping_address as any)?.fullName ||
        (o.shipping_address as any)?.name ||
        "Customer",
      city: (o.shipping_address as any)?.city || "",
    }));

    return NextResponse.json({
      success: true,
      kpis: {
        totalGrossRevenue,
        paidRevenue,
        totalOrdersCount,
        pendingActionCount,
        avgOrderValue,
      },
      statusCounts,
      paymentBreakdown,
      dailySales,
      topProducts,
      lowStockVariants,
      recentOrders,
    });
  } catch (error) {
    logServerError("Admin analytics API failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
