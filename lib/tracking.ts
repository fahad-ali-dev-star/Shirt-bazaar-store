/**
 * Returns a live online tracking URL for common courier partners in Pakistan and internationally.
 */
export function getCourierTrackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  if (!trackingNumber || !trackingNumber.trim()) return null;

  const code = encodeURIComponent(trackingNumber.trim());
  const c = (courier || "").toLowerCase().trim();

  if (c.includes("tcs")) {
    return `https://www.tcsexpress.com/track/${code}`;
  }
  if (c.includes("leopard")) {
    return `https://www.leopardscourier.com/tracking?track_number=${code}`;
  }
  if (c.includes("trax")) {
    return `https://trax.pk/tracking/?tracking_id=${code}`;
  }
  if (c.includes("postex")) {
    return `https://postex.pk/tracking?tracking_id=${code}`;
  }
  if (c.includes("m&p") || c.includes("mnp")) {
    return `https://www.mulphilog.com/tracking.aspx?consNo=${code}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${code}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${code}`;
  }

  // Generic courier search fallback
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${courier || "courier"} tracking ${trackingNumber.trim()}`
  )}`;
}
