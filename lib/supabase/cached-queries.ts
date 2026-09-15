import { unstable_cache } from "next/cache";
import { createPublicClient } from "./public";

export interface HomeProductItem {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  base_price: number;
  product_images: { url: string; position: number }[];
}

// Timeout helper: ensures Supabase network delays or paused instances never block page rendering
async function withTimeout<T>(fn: () => Promise<T>, ms: number = 3000, fallback: T): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve(fallback);
    }, ms);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch {
    clearTimeout(timeoutHandle!);
    return fallback;
  }
}

const FALLBACK_PRODUCTS: HomeProductItem[] = [
  {
    id: "fb-1",
    name: "Classic Oxford Cotton Shirt",
    slug: "classic-oxford-cotton-shirt",
    base_price: 2850,
    product_images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
  {
    id: "fb-2",
    name: "Oversized Heavyweight Cotton Tee",
    slug: "oversized-heavyweight-cotton-tee",
    base_price: 1950,
    product_images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
  {
    id: "fb-3",
    name: "Slim-Fit Textured Pique Polo",
    slug: "slim-fit-textured-pique-polo",
    base_price: 2450,
    product_images: [{ url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
  {
    id: "fb-4",
    name: "Vintage Washed Indigo Denim Shirt",
    slug: "vintage-washed-indigo-denim-shirt",
    base_price: 3200,
    product_images: [{ url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
  {
    id: "fb-5",
    name: "Breathable Linen Casual Shirt",
    slug: "breathable-linen-casual-shirt",
    base_price: 2950,
    product_images: [{ url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
  {
    id: "fb-6",
    name: "Essential Supima Crewneck Tee",
    slug: "essential-supima-crewneck-tee",
    base_price: 1650,
    product_images: [{ url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80", position: 0 }],
  },
];

export const getCachedHomeProducts = unstable_cache(
  async (): Promise<HomeProductItem[]> => {
    return withTimeout(
      async () => {
        try {
          const supabase = createPublicClient();
          const { data, error } = await supabase
            .from("products")
            .select("id, name, slug, category, base_price, product_images(url, position)")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(48);

          if (error) {
            console.warn("Supabase query error in getCachedHomeProducts:", error.message);
            return FALLBACK_PRODUCTS;
          }

          if (data && data.length > 0) {
            return data as any;
          }

          return FALLBACK_PRODUCTS;
        } catch (err) {
          console.warn("Exception in getCachedHomeProducts:", err);
          return FALLBACK_PRODUCTS;
        }
      },
      8000,
      FALLBACK_PRODUCTS
    );
  },
  ["home-products-list"],
  {
    revalidate: 30,
    tags: ["products", "home-products"],
  }
);

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

const FALLBACK_BANNER: HeroBannerItem = {
  id: "default-banner",
  is_active: true,
  image_url: "/hero_banner.png",
  badge_text: "SPRING / SUMMER 2026 DROP",
  title: "Essentials, Elevated.",
  subtitle: "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.",
  cta_text: "Shop Collection",
  cta_link: "#products",
  secondary_cta_text: "Explore Oversized",
  secondary_cta_link: "/category/oversized",
  overlay_opacity: 50,
  banner_height: "tall",
  image_fit: "cover",
};

export const getCachedBanners = unstable_cache(
  async (): Promise<HeroBannerItem[]> => {
    return withTimeout(
      async () => {
        try {
          const supabase = createPublicClient();
          const { data, error } = await supabase
            .from("store_banners")
            .select("*")
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(5);

          if (error || !data || data.length === 0) {
            return [FALLBACK_BANNER];
          }
          return data as any;
        } catch {
          return [FALLBACK_BANNER];
        }
      },
      8000,
      [FALLBACK_BANNER]
    );
  },
  ["home-store-banners-list"],
  {
    revalidate: 30,
    tags: ["banners", "home-banner"],
  }
);

export const getCachedBanner = async (): Promise<HeroBannerItem | null> => {
  const banners = await getCachedBanners();
  return banners[0] || null;
};


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

const FALLBACK_PRODUCT_DETAILS: Record<string, ProductDetailItem> = {
  "classic-oxford-cotton-shirt": {
    id: "fb-1",
    name: "Classic Oxford Cotton Shirt",
    slug: "classic-oxford-cotton-shirt",
    description: "Crafted from 100% premium long-staple combed cotton with a durable Oxford weave. Designed for versatile smart-casual styling.",
    category: "oxford-shirts",
    base_price: 2850,
    product_images: [{ url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80", position: 0 }],
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
    description: "260 GSM heavyweight combed cotton tee with drop-shoulder silhouette and ribbed collar.",
    category: "oversized-tees",
    base_price: 1950,
    product_images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", position: 0 }],
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
    description: "Tailored slim fit with breathable micro-pique cotton, collar stay, and mother-of-pearl buttons.",
    category: "polos",
    base_price: 2450,
    product_images: [{ url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80", position: 0 }],
    product_variants: [
      { id: "var-3-m", size: "M", color: "Navy", stock_qty: 18, price_override: null },
      { id: "var-3-l", size: "L", color: "Navy", stock_qty: 22, price_override: null },
    ],
  },
};

export async function getCachedProductBySlug(slug: string): Promise<ProductDetailItem | null> {
  return withTimeout(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, category, base_price, product_images(url, position), product_variants(id, size, color, stock_qty, price_override)"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        return FALLBACK_PRODUCT_DETAILS[slug] || null;
      }
      return data as any;
    },
    8000,
    FALLBACK_PRODUCT_DETAILS[slug] || null
  );
}

export async function getCachedCategoryProducts(slug: string): Promise<HomeProductItem[]> {
  const normalizedCategory = slug.replace(/-/g, " ");
  return withTimeout(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, base_price, category, product_images(url, position)")
        .ilike("category", normalizedCategory)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(36);

      if (error || !data || data.length === 0) {
        return FALLBACK_PRODUCTS.filter(
          (p) =>
            p.slug.includes(slug) ||
            p.name.toLowerCase().includes(normalizedCategory.toLowerCase())
        );
      }
      return (data as any) || [];
    },
    8000,
    FALLBACK_PRODUCTS.filter(
      (p) =>
        p.slug.includes(slug) ||
        p.name.toLowerCase().includes(normalizedCategory.toLowerCase())
    )
  );
}

export async function searchProducts(q: string): Promise<HomeProductItem[]> {
  const cleanQ = q.trim();
  if (!cleanQ) return [];

  return withTimeout(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, base_price, product_images(url, position)")
        .eq("is_active", true)
        .or(`name.ilike.%${cleanQ}%,category.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
        .order("created_at", { ascending: false })
        .limit(36);

      if (error || !data || data.length === 0) {
        const queryLower = cleanQ.toLowerCase();
        return FALLBACK_PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(queryLower) ||
            p.slug.toLowerCase().includes(queryLower) ||
            (p.category && p.category.toLowerCase().includes(queryLower))
        );
      }
      return data as any;
    },
    8000,
    FALLBACK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(cleanQ.toLowerCase()))
  );
}



