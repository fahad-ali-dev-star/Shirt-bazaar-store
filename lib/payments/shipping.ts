export const FREE_SHIPPING_THRESHOLD = 3000;
export const MAJOR_CITY_SHIPPING_FEE = 150;
export const STANDARD_SHIPPING_FEE = 250;

const MAJOR_CITIES = [
  "karachi",
  "lahore",
  "islamabad",
  "rawalpindi",
  "faisalabad",
  "multan",
  "peshawar",
  "quetta",
  "hyderabad",
  "sialkot",
  "gujranwala",
  "bahawalpur",
  "sargodha",
  "sukkur",
  "larkana",
  "abbottabad",
  "wah cantt",
  "mardan",
  "gujrat",
  "rahim yar khan",
  "sahiwal",
  "okara",
  "kasur",
];

export function calculateShipping(subtotal: number, city?: string | null): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

  if (!city || !city.trim()) {
    return MAJOR_CITY_SHIPPING_FEE;
  }

  const normalized = city.trim().toLowerCase();
  const isMajor = MAJOR_CITIES.some((majorCity) => normalized.includes(majorCity));

  return isMajor ? MAJOR_CITY_SHIPPING_FEE : STANDARD_SHIPPING_FEE;
}
