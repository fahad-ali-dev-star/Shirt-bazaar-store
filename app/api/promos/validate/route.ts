import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Standard preset discount mappings
const STANDARD_CODES: Record<string, { percent: number; desc: string }> = {
  SAVE20: { percent: 20, desc: "20% Flash Sale Discount" },
  SAVE15: { percent: 15, desc: "15% Special Discount" },
  SAVE10: { percent: 10, desc: "10% Order Discount" },
  WELCOME15: { percent: 15, desc: "15% New Customer Welcome" },
  WELCOME10: { percent: 10, desc: "10% New Customer Welcome" },
  FREESHIP: { percent: 10, desc: "Free Express Shipping Discount" },
  SUMMERDROP: { percent: 25, desc: "25% Summer Drop Exclusive" },
  VIP20: { percent: 20, desc: "20% VIP Member Discount" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawCode = body?.code || body?.couponCode;

    if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
      return NextResponse.json({ valid: false, error: "Please enter a coupon code" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Check live active promo from database
    try {
      const supabase = createAdminClient();
      const { data: promo } = await (supabase as any)
        .from("store_promos")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (promo && promo.coupon_code && promo.coupon_code.toUpperCase() === code) {
        // Extract percentage from code if contains number (e.g., SAVE25 -> 25) or default to 20
        const numberMatch = code.match(/\d+/);
        const percent = numberMatch ? parseInt(numberMatch[0], 10) : 20;

        return NextResponse.json({
          valid: true,
          code: promo.coupon_code.toUpperCase(),
          discountPercent: Math.min(Math.max(percent, 5), 80),
          description: promo.badge_text || `${percent}% Off Storewide Promo`,
        });
      }
    } catch (err) {
      console.warn("Error querying database for coupon code:", err);
    }

    // 2. Check standard preset codes
    if (STANDARD_CODES[code]) {
      const { percent, desc } = STANDARD_CODES[code];
      return NextResponse.json({
        valid: true,
        code,
        discountPercent: percent,
        description: desc,
      });
    }

    // 3. Dynamic parse for generic SAVE codes (e.g., SAVE30, SALE15)
    if (code.startsWith("SAVE") || code.startsWith("SALE") || code.startsWith("OFF")) {
      const numMatch = code.match(/\d+/);
      if (numMatch) {
        const percent = parseInt(numMatch[0], 10);
        if (percent > 0 && percent <= 50) {
          return NextResponse.json({
            valid: true,
            code,
            discountPercent: percent,
            description: `${percent}% Special Offer Discount`,
          });
        }
      }
    }

    return NextResponse.json(
      {
        valid: false,
        error: `Coupon "${code}" is invalid or has expired.`,
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: "Unable to validate coupon code at this time" },
      { status: 500 }
    );
  }
}
