// Server-side reads of published blog posts from Supabase.
// Every request is cached by Next.js and tagged, so readers never wait on the database:
//   "posts"        → the blog index, the sitemap and "more posts" lists
//   "post:<slug>"  → one article
// Saving a post on /admin calls /api/blog/revalidate, which clears those tags straight away.
// The hourly `revalidate` is a safety net (and makes scheduled posts appear within the hour).

export type Post = {
  id: string; slug: string; title: string; excerpt: string | null; content_md: string;
  cover_url: string | null; cover_alt: string | null; author_name: string; category: string | null; tags: string[];
  published_at: string; updated_at: string; seo_title: string | null; seo_description: string | null;
};
export type PostCard = Pick<Post, "slug" | "title" | "excerpt" | "cover_url" | "cover_alt" | "category" | "published_at" | "updated_at" | "author_name">;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const CARD = "slug,title,excerpt,cover_url,cover_alt,category,published_at,updated_at,author_name";
const FULL = "id,slug,title,excerpt,content_md,cover_url,cover_alt,author_name,category,tags,published_at,updated_at,seo_title,seo_description";

// The database itself only returns published posts whose publish time has passed (see supabase/blog.sql),
// so the query needs no date filter — which also keeps the cache key stable.
async function rest<T>(query: string, tags: string[]): Promise<T | null> {
  if (!URL || !KEY) return null;
  try {
    const res = await fetch(`${URL}/rest/v1/posts?${query}`, { headers: { apikey: KEY }, next: { tags, revalidate: 3600 } });
    if (!res.ok) { console.error("blog fetch", res.status, await res.text()); return null; }
    return (await res.json()) as T;
  } catch (e) { console.error("blog fetch", e); return null; }
}

export async function getPosts(limit = 200): Promise<PostCard[]> {
  return (await rest<PostCard[]>(`select=${CARD}&order=published_at.desc&limit=${limit}`, ["posts"])) ?? [];
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!/^[a-z0-9-]{1,90}$/.test(slug)) return null;
  const rows = await rest<Post[]>(`select=${FULL}&slug=eq.${slug}&limit=1`, ["posts", `post:${slug}`]);
  return rows?.[0] ?? null;
}

export const fmtPostDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
