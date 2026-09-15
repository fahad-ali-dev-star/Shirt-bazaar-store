import { createPublicClient } from "./public";
import { getCache, setCache } from "@/lib/redis";

export interface HomeProductItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  base_price: number;
  product_images: { url: string; position: number }[];
}

export interface HeroBannerItem {
  id?: string;
  is_active?: boolean;
  image_url?: string | null;
  badge_text?: string | null;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  overlay_opacity?: number;
  banner_height?: "screen" | "tall" | "standard";
  image_fit?: "cover" | "contain";
}

export interface ProductDetailItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  base_price: number;
  product_images: { url: string; position: number }[];
  product_variants: {
    id: string;
    size: string;
    color: string;
    stock_qty: number;
    price_override: number | null;
  }[];
}

const FALLBACK_BANNER: HeroBannerItem = {
  id: "default-banner",
  is_active: true,
  image_url: "/hero_banner.png",
  badge_text: "SPRING / SUMMER 2026 DROP",
  title: "Essentials, Elevated.",
  subtitle:
    "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.",
  cta_text: "Shop Collection",
  cta_link: "#products",
  secondary_cta_text: "Explore Oversized",
  secondary_cta_link: "/category/oversized",
  overlay_opacity: 50,
  banner_height: "tall",
  image_fit: "cover",
};

const FALLBACK_PRODUCTS: HomeProductItem[] = [
  {
    id: "fb-1",
    name: "Classic Oxford Cotton Shirt",
    slug: "classic-oxford-cotton-shirt",
    base_price: 2850,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
  {
    id: "fb-2",
    name: "Oversized Heavyweight Cotton Tee",
    slug: "oversized-heavyweight-cotton-tee",
    base_price: 1950,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
  {
    id: "fb-3",
    name: "Slim-Fit Textured Pique Polo",
    slug: "slim-fit-textured-pique-polo",
    base_price: 2450,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
  {
    id: "fb-4",
    name: "Vintage Washed Indigo Denim Shirt",
    slug: "vintage-washed-indigo-denim-shirt",
    base_price: 3200,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
  {
    id: "fb-5",
    name: "Breathable Linen Casual Shirt",
    slug: "breathable-linen-casual-shirt",
    base_price: 2950,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
  {
    id: "fb-6",
    name: "Essential Supima Crewneck Tee",
    slug: "essential-supima-crewneck-tee",
    base_price: 1650,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
  },
];

const FALLBACK_PRODUCT_DETAILS: Record<string, ProductDetailItem> = {
  "classic-oxford-cotton-shirt": {
    id: "fb-1",
    name: "Classic Oxford Cotton Shirt",
    slug: "classic-oxford-cotton-shirt",
    description:
      "Crafted from 100% premium long-staple combed cotton with a durable Oxford weave. Designed for versatile smart-casual styling.",
    category: "oxford-shirts",
    base_price: 2850,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
    product_variants: [
      { id: "var-1-s", size: "S", color: "White", stock_qty: 15, price_override: null },
      { id: "var-1-m", size: "M", color: "White", stock_qty: 25, price_override: null },
      { id: "var-1-l", size: "L", color: "White", stock_qty: 20, price_override: null },
      { id: "var-1-xl", size: "XL", color: "White", stock_qty: 10, price_override: null },
    ],
  },
  "oversized-heavyweight-cotton-tee": {
    id: "fb-2",
    name: "Oversized Heavyweight Cotton Tee",
    slug: "oversized-heavyweight-cotton-tee",
    description:
      "260 GSM heavyweight combed cotton tee with drop-shoulder silhouette and ribbed collar.",
    category: "oversized-tees",
    base_price: 1950,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
    product_variants: [
      { id: "var-2-s", size: "S", color: "Black", stock_qty: 20, price_override: null },
      { id: "var-2-m", size: "M", color: "Black", stock_qty: 30, price_override: null },
      { id: "var-2-l", size: "L", color: "Black", stock_qty: 25, price_override: null },
    ],
  },
  "slim-fit-textured-pique-polo": {
    id: "fb-3",
    name: "Slim-Fit Textured Pique Polo",
    slug: "slim-fit-textured-pique-polo",
    description:
      "Tailored slim fit with breathable micro-pique cotton, collar stay, and mother-of-pearl buttons.",
    category: "polos",
    base_price: 2450,
    product_images: [
      {
        url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
        position: 0,
      },
    ],
    product_variants: [
      { id: "var-3-m", size: "M", color: "Navy", stock_qty: 18, price_override: null },
      { id: "var-3-l", size: "L", color: "Navy", stock_qty: 22, price_override: null },
    ],
  },
};

/**
 * Execute query with automatic retry to handle Supabase cold starts seamlessly.
 */
async function fetchWithRetry<T>(
  queryFn: () => Promise<T>,
  retries: number = 1,
  delayMs: number = 300
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await queryFn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Fetch all active hero banners. First checks Redis cache, then queries Supabase.
 */
export async function getCachedBanners(): Promise<HeroBannerItem[]> {
  const cacheKey = "cache:store:banners";

  // 1. Check Redis Cache
  const cached = await getCache<HeroBannerItem[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // 2. Fetch from Supabase with retry
  try {
    const banners = await fetchWithRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("store_banners")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data as any[]) || [];
    });

    if (banners && banners.length > 0) {
      // Store in Redis with 1 hour TTL
      await setCache(cacheKey, banners, 3600);
      return banners;
    }

    // Default banner if no banners are configured in database
    return [FALLBACK_BANNER];
  } catch (err) {
    console.warn("Error loading banners from Supabase:", err);
    return [FALLBACK_BANNER];
  }
}

/**
 * Fetch active home products. First checks Redis cache, then queries Supabase.
 */
export async function getCachedHomeProducts(): Promise<HomeProductItem[]> {
  const cacheKey = "cache:store:home-products";

  // 1. Check Redis Cache
  const cached = await getCache<HomeProductItem[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // 2. Fetch from Supabase with retry
  try {
    const products = await fetchWithRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, base_price, product_images(url, position)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(48);

      if (error) throw error;
      return (data as any[]) || [];
    });

    if (products && products.length > 0) {
      // Store in Redis with 1 hour TTL
      await setCache(cacheKey, products, 3600);
      return products;
    }

    return products;
  } catch (err) {
    console.warn("Error loading home products from Supabase:", err);
    return FALLBACK_PRODUCTS;
  }
}

/**
 * Fetch a single product by its slug. First checks Redis, then Supabase.
 */
export async function getCachedProductBySlug(slug: string): Promise<ProductDetailItem | null> {
  const cacheKey = `cache:store:product:${slug}`;

  // 1. Check Redis Cache
  const cached = await getCache<ProductDetailItem>(cacheKey);
  if (cached && cached.id) {
    return cached;
  }

  // 2. Fetch from Supabase with retry
  try {
    const product = await fetchWithRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, category, base_price, product_images(url, position), product_variants(id, size, color, stock_qty, price_override)"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    });

    if (product) {
      await setCache(cacheKey, product, 3600);
      return product;
    }

    return FALLBACK_PRODUCT_DETAILS[slug] || null;
  } catch (err) {
    console.warn(`Error loading product by slug "${slug}":`, err);
    return FALLBACK_PRODUCT_DETAILS[slug] || null;
  }
}

/**
 * Fetch products for a specific category slug. First checks Redis, then Supabase.
 */
export async function getCachedCategoryProducts(slug: string): Promise<HomeProductItem[]> {
  const cacheKey = `cache:store:category:${slug}`;
  const normalizedCategory = slug.replace(/-/g, " ");

  // 1. Check Redis Cache
  const cached = await getCache<HomeProductItem[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // 2. Fetch from Supabase with retry
  try {
    const products = await fetchWithRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, base_price, category, product_images(url, position)")
        .ilike("category", normalizedCategory)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(36);

      if (error) throw error;
      return (data as any[]) || [];
    });

    if (products && products.length > 0) {
      await setCache(cacheKey, products, 3600);
      return products;
    }

    return products;
  } catch (err) {
    console.warn(`Error loading category "${slug}" products:`, err);
    return FALLBACK_PRODUCTS.filter(
      (p) =>
        p.slug.includes(slug) ||
        p.name.toLowerCase().includes(normalizedCategory.toLowerCase())
    );
  }
}

/**
 * Search products by query term.
 */
export async function searchProducts(q: string): Promise<HomeProductItem[]> {
  const cleanQ = q.trim();
  if (!cleanQ) return [];

  try {
    const products = await fetchWithRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, base_price, product_images(url, position)")
        .eq("is_active", true)
        .or(`name.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
        .order("created_at", { ascending: false })
        .limit(36);

      if (error) throw error;
      return (data as any[]) || [];
    });

    return products;
  } catch (err) {
    console.warn(`Error searching products for "${cleanQ}":`, err);
    const queryLower = cleanQ.toLowerCase();
    return FALLBACK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(queryLower) ||
        p.slug.toLowerCase().includes(queryLower) ||
        (p.category && p.category.toLowerCase().includes(queryLower))
    );
  }
}
