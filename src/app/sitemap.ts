import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPosts } from "@/lib/blog";

export const revalidate = 3600;

// Only real, indexable pages (no redirects, no staff pages), plus every published blog post.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: [string, number][] = [["/", 1], ["/hall", 0.9], ["/ceremonies", 0.8], ["/enquire", 0.8], ["/how-it-works", 0.7], ["/visit", 0.7], ["/blog", 0.7], ["/contact", 0.7], ["/about", 0.6], ["/faq", 0.6], ["/policies", 0.3], ["/privacy", 0.2], ["/terms", 0.2]];
  const posts = await getPosts();
  return [
    ...pages.map(([p, priority]) => ({ url: `${SITE_URL}${p === "/" ? "/" : p}`, lastModified: now, priority })),
    ...posts.map(p => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(p.updated_at || p.published_at), priority: 0.6 })),
  ];
}
