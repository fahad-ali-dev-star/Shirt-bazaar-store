import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_PROMO = {
  is_active: true,
  badge_text: "SUMMER DROP",
  message: "Use code SAVE20 for 20% OFF your entire order!",
  coupon_code: "SAVE20",
  cta_text: "Shop Now",
  cta_link: "/#products",
  theme: "brand",
  can_dismiss: true,
};

export async function GET() {
  try {
    const supabase = createAdminClient();
    const fetchPromise = (supabase as any)
      .from("store_promos")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error || !data) return DEFAULT_PROMO;
        return data;
      });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(DEFAULT_PROMO), 1500)
    );

    const promo = await Promise.race([fetchPromise, timeoutPromise]);
    return NextResponse.json({ promo });
  } catch {
    return NextResponse.json({ promo: DEFAULT_PROMO });
  }
}
