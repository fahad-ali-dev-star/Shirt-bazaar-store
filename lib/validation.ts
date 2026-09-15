const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU_RE = /^[A-Za-z0-9._-]+$/;

export const MAX_ITEMS = 50;
export const MAX_QTY_PER_ITEM = 20;
export const MAX_PRODUCT_NAME = 160;
export const MAX_DESCRIPTION = 5000;
export const MAX_CATEGORY = 80;
export const MAX_VARIANTS = 100;
export const MAX_IMAGES = 20;
export const MAX_IMAGE_URL = 2048;
export const MAX_ADDRESS_FIELD = 250;
export const MAX_DELIVERY_NOTES = 500;

export type CheckoutItemInput = { variantId: string; qty: number };
export type ShippingAddressInput = {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  address: string;
  houseNumber?: string | null;
  streetAddress?: string | null;
  landmark?: string | null;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  addressType?: "home" | "office" | "other" | null;
  deliveryNotes?: string | null;
};

export type ProductVariantInput = {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  stock_qty: number;
  price_override?: number | null;
};

export type ProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  base_price?: number;
  category?: string | null;
  is_active?: boolean;
  variants?: ProductVariantInput[];
  images?: string[];
};

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonNegativeMoney(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 10_000_000 && Math.round(value * 100) === value * 100;
}

export function isSafeText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function isOptionalText(value: unknown, maxLength: number): value is string | null | undefined {
  return value === undefined || value === null || (typeof value === "string" && value.length <= maxLength);
}

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 160 && SLUG_RE.test(value);
}

export function isSku(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 80 && SKU_RE.test(value);
}

export function isSafeUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_IMAGE_URL) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateShippingAddress(value: unknown): { ok: true; value: ShippingAddressInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid shipping address" };
  }
  const input = value as Record<string, unknown>;
  const requiredFields = ["fullName", "email", "phone", "address", "city"] as const;
  const allowedFields = [
    "fullName",
    "email",
    "phone",
    "alternatePhone",
    "address",
    "houseNumber",
    "streetAddress",
    "landmark",
    "city",
    "province",
    "postalCode",
    "addressType",
    "deliveryNotes",
  ] as const;

  for (const field of requiredFields) {
    if (!isSafeText(input[field], MAX_ADDRESS_FIELD)) {
      return { ok: false, error: `Please provide a valid ${field === "fullName" ? "full name" : field === "phone" ? "phone number" : field === "address" ? "delivery address" : field}.` };
    }
  }

  if (!isEmail(input.email)) return { ok: false, error: "Please enter a valid email address." };
  if (!/^[+0-9()\-\s]{7,30}$/.test(input.phone as string)) {
    return { ok: false, error: "Please enter a valid phone number (e.g. 0300-1234567)." };
  }

  if (input.alternatePhone && typeof input.alternatePhone === "string" && input.alternatePhone.trim().length > 0) {
    if (!/^[+0-9()\-\s]{7,30}$/.test(input.alternatePhone.trim())) {
      return { ok: false, error: "Please enter a valid alternative phone number or leave it blank." };
    }
  }

  if (input.landmark && typeof input.landmark === "string" && input.landmark.trim().length > MAX_ADDRESS_FIELD) {
    return { ok: false, error: "Landmark description is too long." };
  }

  if (input.province && typeof input.province === "string" && input.province.trim().length > 100) {
    return { ok: false, error: "Province name is too long." };
  }

  if (input.postalCode && typeof input.postalCode === "string" && input.postalCode.trim().length > 20) {
    return { ok: false, error: "Postal code is too long." };
  }

  if (input.deliveryNotes && typeof input.deliveryNotes === "string" && input.deliveryNotes.trim().length > MAX_DELIVERY_NOTES) {
    return { ok: false, error: "Delivery instructions are too long (maximum 500 characters)." };
  }

  if (input.addressType && typeof input.addressType === "string") {
    if (!["home", "office", "other"].includes(input.addressType)) {
      return { ok: false, error: "Invalid address type selection." };
    }
  }

  const extraKeys = Object.keys(input).filter((key) => !allowedFields.includes(key as (typeof allowedFields)[number]));
  if (extraKeys.length) return { ok: false, error: "Invalid shipping address fields" };

  return {
    ok: true,
    value: {
      fullName: (input.fullName as string).trim(),
      email: (input.email as string).trim().toLowerCase(),
      phone: (input.phone as string).trim(),
      alternatePhone: typeof input.alternatePhone === "string" && input.alternatePhone.trim() ? input.alternatePhone.trim() : null,
      address: (input.address as string).trim(),
      houseNumber: typeof input.houseNumber === "string" && input.houseNumber.trim() ? input.houseNumber.trim() : null,
      streetAddress: typeof input.streetAddress === "string" && input.streetAddress.trim() ? input.streetAddress.trim() : null,
      landmark: typeof input.landmark === "string" && input.landmark.trim() ? input.landmark.trim() : null,
      city: (input.city as string).trim(),
      province: typeof input.province === "string" && input.province.trim() ? input.province.trim() : null,
      postalCode: typeof input.postalCode === "string" && input.postalCode.trim() ? input.postalCode.trim() : null,
      addressType: (input.addressType as "home" | "office" | "other" | null) || null,
      deliveryNotes: typeof input.deliveryNotes === "string" && input.deliveryNotes.trim() ? input.deliveryNotes.trim() : null,
    },
  };
}

export function validateCheckoutItems(value: unknown): { ok: true; value: CheckoutItemInput[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) {
    return { ok: false, error: "Invalid cart" };
  }
  const seen = new Set<string>();
  const normalized: CheckoutItemInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return { ok: false, error: "Invalid cart item" };
    const candidate = item as Record<string, unknown>;
    if (!isUuid(candidate.variantId)) return { ok: false, error: "Invalid product variant" };
    if (!Number.isSafeInteger(candidate.qty) || (candidate.qty as number) < 1 || (candidate.qty as number) > MAX_QTY_PER_ITEM) {
      return { ok: false, error: "Invalid quantity" };
    }
    if (Object.keys(candidate).some((key) => key !== "variantId" && key !== "qty")) {
      return { ok: false, error: "Invalid cart item fields" };
    }
    if (seen.has(candidate.variantId)) return { ok: false, error: "Duplicate cart item" };
    seen.add(candidate.variantId);
    normalized.push({ variantId: candidate.variantId, qty: candidate.qty as number });
  }
  return { ok: true, value: normalized };
}

export type PaymentMethod = "stripe" | "cod" | "jazzcash" | "easypaisa";

export function validatePaymentMethod(value: unknown): { ok: true; value: PaymentMethod } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: "cod" };
  }
  if (value === "stripe" || value === "cod" || value === "jazzcash" || value === "easypaisa") {
    return { ok: true, value };
  }
  return { ok: false, error: "Invalid payment method. Choose Stripe, Cash on Delivery, JazzCash, or Easypaisa." };
}

export function validateWalletDetails(
  method: PaymentMethod,
  transactionId: unknown,
  senderPhone: unknown
): { ok: true; transactionId: string; senderPhone: string | null } | { ok: false; error: string } {
  if (method !== "jazzcash" && method !== "easypaisa") {
    return { ok: true, transactionId: "", senderPhone: null };
  }

  if (typeof transactionId !== "string" || !transactionId.trim()) {
    return { ok: false, error: `Transaction ID (TID) is required for ${method === "jazzcash" ? "JazzCash" : "Easypaisa"} payment.` };
  }

  const tid = transactionId.trim();
  if (tid.length < 4 || tid.length > 50 || !/^[A-Za-z0-9\-_#\s]{4,50}$/.test(tid)) {
    return { ok: false, error: "Please enter a valid Transaction ID (TID)." };
  }

  let sender: string | null = null;
  if (typeof senderPhone === "string" && senderPhone.trim().length > 0) {
    sender = senderPhone.trim();
    if (sender.length > 30 || !/^[+0-9()\-\s]{7,30}$/.test(sender)) {
      return { ok: false, error: "Please enter a valid sender phone number or leave it blank." };
    }
  }

  return { ok: true, transactionId: tid, senderPhone: sender };
}

export function validateCouponCode(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value === "string" && value.trim().length <= 50 && /^[A-Za-z0-9_\-\s%]{1,50}$/.test(value.trim())) {
    return { ok: true, value: value.trim().toUpperCase() };
  }
  return { ok: false, error: "Invalid coupon code format" };
}

function validateVariant(value: unknown): value is ProductVariantInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (v.id !== undefined && !isUuid(v.id)) return false;
  if (!isSafeText(v.size, 40) || !isSafeText(v.color, 80)) return false;
  if (v.sku !== undefined && v.sku !== "" && !isSku(v.sku)) return false;
  if (!Number.isSafeInteger(v.stock_qty) || (v.stock_qty as number) < 0 || (v.stock_qty as number) > 1_000_000) return false;
  if (v.price_override !== undefined && v.price_override !== null && !isNonNegativeMoney(v.price_override)) return false;
  return true;
}

export function validateProductInput(value: unknown, partial = false): { ok: true; value: ProductInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Invalid product payload" };
  const input = value as Record<string, unknown>;
  const allowed = ["name", "slug", "description", "base_price", "category", "is_active", "variants", "images"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) return { ok: false, error: "Invalid product fields" };

  if (!partial || input.name !== undefined) {
    if (!isSafeText(input.name, MAX_PRODUCT_NAME)) return { ok: false, error: "Invalid product name" };
  }
  if (input.slug !== undefined && !isSlug(input.slug)) return { ok: false, error: "Invalid product slug" };
  if (!partial || input.base_price !== undefined) {
    if (!isNonNegativeMoney(input.base_price)) return { ok: false, error: "Invalid base price" };
  }
  if (!isOptionalText(input.description, MAX_DESCRIPTION)) return { ok: false, error: "Invalid description" };
  if (!isOptionalText(input.category, MAX_CATEGORY)) return { ok: false, error: "Invalid category" };
  if (input.is_active !== undefined && typeof input.is_active !== "boolean") return { ok: false, error: "Invalid active flag" };

  let variants: ProductVariantInput[] | undefined;
  if (input.variants !== undefined) {
    if (!Array.isArray(input.variants) || input.variants.length > MAX_VARIANTS) return { ok: false, error: "Invalid variants" };
    variants = input.variants.filter(Boolean).map((v) => v as ProductVariantInput);
    if (variants.some((v) => !validateVariant(v))) return { ok: false, error: "Invalid product variant" };
    const skus = new Set<string>();
    const combinations = new Set<string>();
    for (const variant of variants) {
      const sku = variant.sku?.trim();
      if (sku) {
        if (skus.has(sku.toLowerCase())) return { ok: false, error: "Duplicate SKU" };
        skus.add(sku.toLowerCase());
      }
      const combination = `${variant.size.trim().toLowerCase()}::${variant.color.trim().toLowerCase()}`;
      if (combinations.has(combination)) return { ok: false, error: "Duplicate variant size/color" };
      combinations.add(combination);
    }
  }

  let images: string[] | undefined;
  if (input.images !== undefined) {
    if (!Array.isArray(input.images) || input.images.length > MAX_IMAGES || input.images.some((url) => !isSafeUrl(url))) {
      return { ok: false, error: "Invalid product images" };
    }
    images = input.images.map((url) => (url as string).trim());
    if (new Set(images).size !== images.length) return { ok: false, error: "Duplicate product image" };
  }

  return {
    ok: true,
    value: {
      name: input.name === undefined ? undefined : (input.name as string).trim(),
      slug: input.slug === undefined ? undefined : (input.slug as string).trim(),
      description: input.description === undefined ? undefined : input.description === null ? null : (input.description as string).trim(),
      base_price: input.base_price as number,
      category: input.category === undefined ? undefined : input.category === null ? null : (input.category as string).trim(),
      is_active: input.is_active as boolean | undefined,
      variants,
      images,
    },
  };
}

export function parseJsonObject(body: unknown): Record<string, unknown> | null {
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

export type ReviewInput = {
  author_name: string;
  author_email?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
};

export const MAX_REVIEW_NAME = 60;
export const MAX_REVIEW_TITLE = 120;
export const MAX_REVIEW_COMMENT = 2000;

export function validateReviewInput(value: unknown): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid review data" };
  }
  const input = value as Record<string, unknown>;

  if (!isSafeText(input.author_name, MAX_REVIEW_NAME)) {
    return { ok: false, error: "Please enter your name (up to 60 characters)." };
  }

  if (input.author_email !== undefined && input.author_email !== null && String(input.author_email).trim() !== "") {
    if (!isEmail(String(input.author_email).trim())) {
      return { ok: false, error: "Please enter a valid email address or leave it blank." };
    }
  }

  if (typeof input.rating !== "number" || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Please select a valid rating between 1 and 5 stars." };
  }

  if (input.title !== undefined && input.title !== null && String(input.title).trim() !== "") {
    if (!isSafeText(input.title, MAX_REVIEW_TITLE)) {
      return { ok: false, error: "Review title is too long (maximum 120 characters)." };
    }
  }

  if (!isSafeText(input.comment, MAX_REVIEW_COMMENT) || String(input.comment).trim().length < 5) {
    return { ok: false, error: "Please write a review comment (between 5 and 2000 characters)." };
  }

  return {
    ok: true,
    value: {
      author_name: String(input.author_name).trim(),
      author_email: input.author_email ? String(input.author_email).trim().toLowerCase() : null,
      rating: input.rating,
      title: input.title ? String(input.title).trim() : null,
      comment: String(input.comment).trim(),
    },
  };
}
