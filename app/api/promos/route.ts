import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/admin";
import { hasUserClaimedOffer } from "@/lib/payments/offers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if the current user has already redeemed an offer previously
    try {
      const { user } = await requireUser();
      if (user) {
        const claimCheck = await hasUserClaimedOffer({ userId: user.id, email: user.email });
        if (claimCheck.hasClaimed) {
          return NextResponse.json({ promo: null, alreadyClaimed: true });
        }
      }
    } catch {
      // Continue if auth check is not available
    }

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("store_promos")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Could not query store_promos:", error.message);
      return NextResponse.json({ promo: null });
    }

    // If no row exists or if admin explicitly marked promo as inactive, return null
    if (!data || data.is_active === false) {
      return NextResponse.json({ promo: null });
    }

    return NextResponse.json({ promo: data, alreadyClaimed: false });
  } catch (err) {
    console.warn("Exception in public promos endpoint:", err);
    return NextResponse.json({ promo: null });
  }
}

