import { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  const supabase = createPublicClient();

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    const fetchPromise = supabase
      .from("products")
      .select("slug, updated_at, category")
      .eq("is_active", true);

    const timeoutPromise = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 2000)
    );

    const { data: products } = await Promise.race([fetchPromise, timeoutPromise]);

    if (products) {
      products.forEach((p) => {
        routes.push({
          url: `${baseUrl}/products/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        });
      });

      // Collect unique categories
      const categories = new Set<string>();
      products.forEach((p) => {
        if (p.category && p.category.trim()) {
          categories.add(p.category.trim().toLowerCase().replace(/\s+/g, "-"));
        }
      });

      categories.forEach((cat) => {
        routes.push({
          url: `${baseUrl}/category/${cat}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    }
  } catch {
    // Return base routes if DB fetch fails during build
  }

  return routes;
}
