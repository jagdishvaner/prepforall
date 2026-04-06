import type { MetadataRoute } from "next";
import { getAllProblemSlugs } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://prepforall.com";

  // Static pages
  const staticPages = [
    "",
    "/features",
    "/problems",
    "/for-universities",
    "/about",
    "/pricing",
    "/contact",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic problem pages
  let problemPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProblemSlugs();
    problemPages = slugs.map((slug) => ({
      url: `${baseUrl}/problems/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // API might not be available at build time
  }

  return [...staticPages, ...problemPages];
}
