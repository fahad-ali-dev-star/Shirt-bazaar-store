import { createAdminClient } from "@/lib/supabase/server";

export interface OfferClaimCheckResult {
  hasClaimed: boolean;
  previousOrderCode?: string | null;
  previousOrderId?: string | null;
}

/**
 * Checks if a customer has already claimed/redeemed any promotional offer
 * on a previous non-cancelled order.
 *
 * Rules:
 * - One-time claim per customer across all promotions/offers.
 * - Checked by Supabase user_id, recipient email, or recipient phone.
 */
export async function hasUserClaimedOffer({
  userId,
  email,
  phone,
}: {
  userId?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<OfferClaimCheckResult> {
  try {
    const supabase = createAdminClient();

    // 1. Check orders by user_id
    if (userId) {
      const { data: userOrders, error: userOrdersError } = await (supabase as any)
        .from("orders")
        .select("id, status, payment_reference")
        .eq("user_id", userId)
        .neq("status", "cancelled");

      if (!userOrdersError && userOrders && userOrders.length > 0) {
        for (const order of userOrders) {
          const match = (order.payment_reference || "").match(/\[([A-Za-z0-9_\-\s%]+)\]/);
          if (match) {
            return {
              hasClaimed: true,
              previousOrderCode: match[1],
              previousOrderId: order.id,
            };
          }
        }
      }
    }

    // 2. Check orders by customer email or phone in shipping_address (to prevent multi-account evasion)
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    if (cleanEmail || cleanPhone) {
      const { data: recentOrders, error: recentError } = await (supabase as any)
        .from("orders")
        .select("id, status, payment_reference, shipping_address")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(250);

      if (!recentError && recentOrders && recentOrders.length > 0) {
        for (const order of recentOrders) {
          const match = (order.payment_reference || "").match(/\[([A-Za-z0-9_\-\s%]+)\]/);
          if (match) {
            const addr = order.shipping_address as Record<string, any> | null;
            const orderEmail = (addr?.email || "").trim().toLowerCase();
            const rawOrderPhone = addr?.phone ? String(addr.phone).replace(/[^0-9]/g, "") : "";

            if (cleanEmail && orderEmail && cleanEmail === orderEmail) {
              return {
                hasClaimed: true,
                previousOrderCode: match[1],
                previousOrderId: order.id,
              };
            }

            if (
              cleanPhone &&
              cleanPhone.length >= 7 &&
              rawOrderPhone &&
              (rawOrderPhone === cleanPhone ||
                rawOrderPhone.endsWith(cleanPhone) ||
                cleanPhone.endsWith(rawOrderPhone))
            ) {
              return {
                hasClaimed: true,
                previousOrderCode: match[1],
                previousOrderId: order.id,
              };
            }
          }
        }
      }
    }

    return { hasClaimed: false };
  } catch (err) {
    console.warn("Could not verify one-time offer redemption history:", err);
    return { hasClaimed: false };
  }
}
