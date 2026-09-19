/**
 * Utility functions for pricing calculations, discount deductions, and formatting.
 */

/**
 * Calculates the active selling price for a product based on its base price and discount percentage.
 *
 * @param basePrice The original regular base price (e.g. 2500)
 * @param discountPercent The discount percentage integer (0 to 100)
 * @returns The final discounted selling price (rounded to nearest integer)
 */
export function getEffectivePrice(basePrice: number, discountPercent?: number | null): number {
  const safeBase = Number(basePrice) || 0;
  const safeDiscount = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);

  if (safeDiscount <= 0) {
    return safeBase;
  }

  const discounted = safeBase * (1 - safeDiscount / 100);
  return Math.max(0, Math.round(discounted));
}

/**
 * Calculates the amount saved in PKR.
 *
 * @param basePrice The original regular base price
 * @param discountPercent The discount percentage (0 to 100)
 * @returns The absolute rupee amount saved
 */
export function getSavingsAmount(basePrice: number, discountPercent?: number | null): number {
  const safeBase = Number(basePrice) || 0;
  const effective = getEffectivePrice(safeBase, discountPercent);
  return Math.max(0, safeBase - effective);
}

/**
 * Formats a numeric price into a clean PKR currency display string.
 *
 * @param amount Numeric price
 * @returns e.g. "Rs 2,500"
 */
export function formatPrice(amount: number): string {
  const safeAmount = Number(amount) || 0;
  return `Rs ${safeAmount.toLocaleString("en-PK")}`;
}
