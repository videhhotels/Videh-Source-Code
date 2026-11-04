import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { BUSINESS } from "@/lib/business";

/* Clears the cached blog pages after a post changes, so the change is live at once.
   Called by /admin after every save or delete, with the staff member's sign-in token.
   It also accepts a Supabase Database Webhook (header x-webhook-secret = BLOG_WEBHOOK_SECRET),
   so edits made directly in the Supabase table editor refresh the site too. */
const STAFF = [BUSINESS.email.toLowerCase()];
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const okSlug = (s: unknown): s is string => typeof s === "string" && /^[a-z0-9-]{1,90}$/.test(s);

async function isStaff(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || token.length > 4000) return false;
  const res = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return false;
  const user = await res.json();
  return STAFF.includes(String(user?.email || "").toLowerCase());
}

function secretOk(req: Request) {
  const want = process.env.BLOG_WEBHOOK_SECRET, got = req.headers.get("x-webhook-secret");
  if (!want || !got || want.length !== got.length) return false;
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 200_000) return NextResponse.json({ ok: false }, { status: 413 });
  const viaWebhook = secretOk(req);
  if (!viaWebhook && !(await isStaff(req))) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  // Admin sends { slug, oldSlug }; a Supabase webhook sends { record, old_record }.
  const slugs = [body.slug, body.oldSlug, body.record?.slug, body.old_record?.slug].filter(okSlug);

  revalidateTag("posts", { expire: 0 });
  const unique = Array.from(new Set(slugs));
  for (const s of unique) { revalidateTag(`post:${s}`, { expire: 0 }); revalidatePath(`/blog/${s}`); }
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true, purged: unique });
}
