import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("store_promos")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch store promo banner:", error.message);
      return NextResponse.json({ promo: null });
    }

    return NextResponse.json({ promo: data || null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching promo";
    console.warn("Promo fetch exception:", msg);
    return NextResponse.json({ promo: null });
  }
}
