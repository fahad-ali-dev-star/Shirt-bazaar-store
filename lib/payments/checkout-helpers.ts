import { createAdminClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/errors";

type CheckoutItem = { variantId: string; qty: number };
type ShippingAddress = Record<string, string>;

type CheckoutVariant = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export async function createPendingStripeOrder({
  items,
  shippingAddress,
  userId,
}: {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  userId: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_pending_order", {
    p_user_id: userId,
    p_shipping_address: shippingAddress,
    p_items: items,
  });

  if (error || !data) {
    const errorDetails = error ? { ...error } : { reason: "No data returned" };
    logServerError("Failed to create pending order", errorDetails, { userId });
    throw new Error("Unable to create order");
  }

  const result = data as {
    order_id: string;
    total: number;
    variants: CheckoutVariant[];
  };

  return {
    order: { id: result.order_id, total: result.total },
    variants: result.variants,
  };
}

export async function cancelPendingStripeOrder(orderId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", payment_status: "failed" })
    .eq("id", orderId)
    .eq("status", "pending")
    .eq("payment_status", "unpaid");

  if (error) {
    logServerError("Failed to cancel pending Stripe order", error, { orderId });
  }
}

export async function markStripeOrderPaid(
  orderId: string,
  paymentReference: string,
  amountMinor: number,
  currency: string
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("finalize_stripe_order", {
    p_order_id: orderId,
    p_payment_reference: paymentReference,
    p_amount_minor: amountMinor,
    p_currency: currency,
  });

  if (error) {
    logServerError("Failed to finalize Stripe order", error, { orderId, paymentReference });
    throw new Error("Unable to finalize payment");
  }

  const result = data as {
    finalized: boolean;
    already_processed: boolean;
    total: number;
    shipping_address: ShippingAddress;
  };

  if (result.finalized) {
    try {
      const { sendOrderConfirmationEmail } = await import("@/lib/email/resend");
      const address = result.shipping_address;
      const toEmail = address?.email;
      const customerName = address?.fullName || address?.name || "Customer";
      if (toEmail) {
        await sendOrderConfirmationEmail(
          toEmail,
          customerName,
          orderId,
          result.total
        );
      }
    } catch (error) {
      logServerError("Failed to send order confirmation email", error, { orderId });
    }
  }

  return result;
}

export async function createCodOrder({
  items,
  shippingAddress,
  userId,
}: {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  userId: string;
}) {
  const supabase = createAdminClient();

  // Try PostgreSQL RPC create_cod_order first
  const { data, error } = await supabase.rpc("create_cod_order", {
    p_user_id: userId,
    p_shipping_address: shippingAddress,
    p_items: items,
  });

  let orderId: string;
  let total: number;

  if (!error && data) {
    const result = data as {
      order_id: string;
      total: number;
      variants: CheckoutVariant[];
    };
    orderId = result.order_id;
    total = result.total;
  } else {
    // Graceful fallback if RPC is not yet applied
    const variantIds = items.map((i) => i.variantId);
    const { data: variants, error: varError } = await supabase
      .from("product_variants")
      .select("id, stock_qty, price_override, products(name, base_price, is_active)")
      .in("id", variantIds);

    if (varError || !variants || variants.length !== items.length) {
      throw new Error("One or more products are unavailable");
    }

    let calculatedTotal = 0;
    for (const item of items) {
      const v = variants.find((variant) => variant.id === item.variantId);
      const product = Array.isArray(v?.products) ? v?.products[0] : v?.products;
      if (!v || !product || !product.is_active) {
        throw new Error("One or more products are unavailable");
      }
      if (v.stock_qty < item.qty) {
        throw new Error("One or more items are out of stock");
      }
      const price = v.price_override ?? product.base_price;
      calculatedTotal += price * item.qty;
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "processing",
        payment_status: "unpaid",
        payment_method: "cod",
        total: calculatedTotal,
        shipping_address: shippingAddress,
        payment_reference: `COD-${Date.now()}-${userId.slice(0, 8)}`,
      })
      .select("id, total")
      .single();

    if (orderError || !orderData) {
      logServerError("Failed to create COD order", orderError, { userId });
      throw new Error("Unable to create order");
    }

    orderId = orderData.id;
    total = orderData.total;

    const orderItems = items.map((item) => {
      const v = variants.find((variant) => variant.id === item.variantId);
      const product = Array.isArray(v?.products) ? v?.products[0] : v?.products;
      const price = v?.price_override ?? product?.base_price ?? 0;
      return {
        order_id: orderId,
        variant_id: item.variantId,
        qty: item.qty,
        price_at_purchase: price,
      };
    });

    await supabase.from("order_items").insert(orderItems);

    for (const item of items) {
      const v = variants.find((variant) => variant.id === item.variantId);
      if (v) {
        await supabase
          .from("product_variants")
          .update({ stock_qty: Math.max(0, v.stock_qty - item.qty) })
          .eq("id", item.variantId);
      }
    }

    const { data: carts } = await supabase.from("carts").select("id").eq("user_id", userId);
    if (carts && carts.length > 0) {
      const cartIds = carts.map((c) => c.id);
      await supabase.from("cart_items").delete().in("cart_id", cartIds);
    }
  }

  // Send confirmation email
  try {
    const { sendOrderConfirmationEmail } = await import("@/lib/email/resend");
    const toEmail = shippingAddress?.email;
    const customerName = shippingAddress?.fullName || shippingAddress?.name || "Customer";
    if (toEmail) {
      await sendOrderConfirmationEmail(toEmail, customerName, orderId, total, "cod");
    }
  } catch (emailErr) {
    logServerError("Failed to send COD order confirmation email", emailErr, { orderId });
  }

  return {
    order: { id: orderId, total },
  };
}

export async function createManualWalletOrder({
  items,
  shippingAddress,
  userId,
  paymentMethod,
  transactionId,
  senderPhone,
  discountPercent = 0,
  couponCode = null,
}: {
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  userId: string;
  paymentMethod: "jazzcash" | "easypaisa";
  transactionId: string;
  senderPhone?: string | null;
  discountPercent?: number;
  couponCode?: string | null;
}) {
  const supabase = createAdminClient();

  const variantIds = items.map((i) => i.variantId);
  const { data: variants, error: varError } = await supabase
    .from("product_variants")
    .select("id, stock_qty, price_override, products(name, base_price, is_active)")
    .in("id", variantIds);

  if (varError || !variants || variants.length !== items.length) {
    throw new Error("One or more products are unavailable");
  }

  let calculatedTotal = 0;
  for (const item of items) {
    const v = variants.find((variant) => variant.id === item.variantId);
    const product = Array.isArray(v?.products) ? v?.products[0] : v?.products;
    if (!v || !product || !product.is_active) {
      throw new Error("One or more products are unavailable");
    }
    if (v.stock_qty < item.qty) {
      throw new Error("One or more items are out of stock");
    }
    const price = v.price_override ?? product.base_price;
    calculatedTotal += price * item.qty;
  }

  let finalTotal = calculatedTotal;
  if (discountPercent > 0) {
    finalTotal = Math.max(0, Math.round(calculatedTotal * (1 - discountPercent / 100) * 100) / 100);
  }

  const walletName = paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa";
  let paymentRef = `${walletName} | TID: ${transactionId}`;
  if (senderPhone) {
    paymentRef += ` | Sender: ${senderPhone}`;
  }
  if (couponCode) {
    paymentRef += ` [${couponCode}]`;
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "processing",
      payment_status: "unpaid",
      payment_method: paymentMethod,
      total: finalTotal,
      shipping_address: shippingAddress,
      payment_reference: paymentRef,
    })
    .select("id, total")
    .single();

  if (orderError || !orderData) {
    logServerError(`Failed to create ${walletName} order`, orderError, { userId });
    throw new Error("Unable to create order");
  }

  const orderId = orderData.id;

  const orderItems = items.map((item) => {
    const v = variants.find((variant) => variant.id === item.variantId);
    const product = Array.isArray(v?.products) ? v?.products[0] : v?.products;
    const price = v?.price_override ?? product?.base_price ?? 0;
    return {
      order_id: orderId,
      variant_id: item.variantId,
      qty: item.qty,
      price_at_purchase: price,
    };
  });

  await supabase.from("order_items").insert(orderItems);

  for (const item of items) {
    const v = variants.find((variant) => variant.id === item.variantId);
    if (v) {
      await supabase
        .from("product_variants")
        .update({ stock_qty: Math.max(0, v.stock_qty - item.qty) })
        .eq("id", item.variantId);
    }
  }

  const { data: carts } = await supabase.from("carts").select("id").eq("user_id", userId);
  if (carts && carts.length > 0) {
    const cartIds = carts.map((c) => c.id);
    await supabase.from("cart_items").delete().in("cart_id", cartIds);
  }

  // Send confirmation email
  try {
    const { sendOrderConfirmationEmail } = await import("@/lib/email/resend");
    const toEmail = shippingAddress?.email;
    const customerName = shippingAddress?.fullName || shippingAddress?.name || "Customer";
    if (toEmail) {
      await sendOrderConfirmationEmail(toEmail, customerName, orderId, finalTotal, paymentMethod, transactionId);
    }
  } catch (emailErr) {
    logServerError(`Failed to send ${walletName} order confirmation email`, emailErr, { orderId });
  }

  return {
    order: { id: orderId, total: finalTotal },
  };
}

