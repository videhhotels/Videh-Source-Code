"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, X, Trash2, ExternalLink, Eye, PenLine, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { renderMarkdown, readingMinutes, slugify } from "@/lib/markdown";

/* Blog posts table + editor inside the staff CRM. Writes go straight to Supabase (protected by supabase/blog.sql);
   after each save the live pages are refreshed through /api/blog/revalidate. */
type Post = {
  id: string; slug: string; title: string; excerpt: string | null; content_md: string; cover_url: string | null; cover_alt: string | null;
  author_name: string; category: string | null; tags: string[]; status: "draft" | "published"; published_at: string | null;
  seo_title: string | null; seo_description: string | null; view_count: number; read_count: number; created_at: string; updated_at: string;
};
const EMPTY: Omit<Post, "id" | "created_at" | "updated_at" | "view_count" | "read_count"> = {
  slug: "", title: "", excerpt: "", content_md: "", cover_url: "", cover_alt: "", author_name: "Team Videh", category: "Wedding planning",
  tags: [], status: "draft", published_at: null, seo_title: "", seo_description: "",
};
const CATEGORIES = ["Wedding planning", "Mithila rituals", "Food & menu", "Decoration", "Venue news"];
const when = (d: string | null) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "";
const toLocalInput = (d: string | null) => { if (!d) return ""; const t = new Date(d); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

async function refreshSite(slug: string, oldSlug?: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const res = await fetch("/api/blog/revalidate", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ slug, oldSlug }) });
  return res.ok;
}

export default function PostsAdmin({ flash }: { flash: (m: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("posts").select("*").order("updated_at", { ascending: false }).limit(500);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setErr(""); setPosts((data || []) as Post[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => { const n = q.trim().toLowerCase(); return posts.filter(p => !n || [p.title, p.slug, p.category, p.excerpt].some(v => (v || "").toLowerCase().includes(n))); }, [posts, q]);
  const live = posts.filter(p => p.status === "published").length;

  return <>
    {err && <div className="sb-banner">{err}{/relation|schema cache|does not exist|permission|policy/i.test(err) && " — run supabase/blog.sql in the Supabase SQL Editor."} <button onClick={() => setErr("")}><X size={14} /></button></div>}
    <div className="sb-toolbar">
      <label className="sb-search"><Search size={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, slug, category…" /></label>
      <button className="sb-btn" onClick={load} title="Refresh"><RefreshCw size={14} className={loading ? "sb-spin" : ""} /> <span>Refresh</span></button>
      <button className="sb-btn sb-btn-green" onClick={() => setEditing("new")}><Plus size={14} /> <span>New post</span></button>
    </div>
    <div className="sb-grid" role="region" aria-label="posts table" tabIndex={0}>
      <table>
        <thead><tr>{[["title", "text", 300], ["status", "text", 110], ["published_at", "timestamptz", 180], ["view_count", "int4", 110], ["read_count", "int4", 110], ["category", "text", 160], ["slug", "text", 240], ["updated_at", "timestamptz", 180]].map(([k, t, w]) =>
          <th key={k as string} style={{ minWidth: w as number }}><span className="sb-col">{k}</span><span className="sb-type">{t}</span></th>)}</tr></thead>
        <tbody>
          {shown.map(p => <tr key={p.id} onClick={() => setEditing(p)}>
            <td style={{ maxWidth: 300 }}><b>{p.title}</b></td>
            <td>{(() => { const sched = p.status === "published" && !!p.published_at && new Date(p.published_at) > new Date(); return <span className={`sb-pill ${sched ? "st-called" : p.status === "published" ? "st-won" : "st-lost"}`}>{sched ? "scheduled" : p.status}</span>; })()}</td>
            <td>{when(p.published_at) || <span className="sb-null">NULL</span>}</td>
            <td>{p.view_count}</td><td>{p.read_count}</td>
            <td>{p.category || <span className="sb-null">NULL</span>}</td>
            <td style={{ maxWidth: 240 }}>{p.slug}</td>
            <td>{when(p.updated_at)}</td>
          </tr>)}
          {!shown.length && <tr><td colSpan={8} className="sb-empty">{loading ? "Loading posts…" : posts.length ? "No posts match." : "No posts yet. Click “New post” to write the first one."}</td></tr>}
        </tbody>
      </table>
    </div>
    <footer className="sb-foot"><span>{posts.length} posts · {live} published</span><div><a className="sb-btn" href="/blog" target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> <span>Open blog</span></a></div></footer>

    {editing && <PostEditor key={editing === "new" ? "new" : editing.id} post={editing === "new" ? null : editing} taken={posts.map(p => p.slug)}
      onClose={() => setEditing(null)}
      onSaved={async (p, oldSlug) => {
        setPosts(ps => [p, ...ps.filter(x => x.id !== p.id)]);
        setEditing(p);
        const ok = await refreshSite(p.slug, oldSlug);
        flash(ok ? (p.status === "published" ? "Saved — live on the site" : "Saved as draft") : "Saved, but the site cache didn’t refresh (it will within an hour)");
      }}
      onDeleted={async (p) => { setPosts(ps => ps.filter(x => x.id !== p.id)); setEditing(null); await refreshSite(p.slug); flash("Post deleted"); }} />}
  </>;
}

function PostEditor({ post, taken, onClose, onSaved, onDeleted }: {
  post: Post | null; taken: string[]; onClose: () => void; onSaved: (p: Post, oldSlug?: string) => void; onDeleted: (p: Post) => void;
}) {
  const [f, setF] = useState(() => post ? { ...EMPTY, ...post, excerpt: post.excerpt || "", cover_url: post.cover_url || "", cover_alt: post.cover_alt || "", seo_title: post.seo_title || "", seo_description: post.seo_description || "", category: post.category || "" } : { ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [tags, setTags] = useState((post?.tags || []).join(", "));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(s => ({ ...s, [k]: v }));
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  const preview = useMemo(() => tab === "preview" ? renderMarkdown(f.content_md) : "", [tab, f.content_md]);

  async function upload(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setMsg("Use a JPG, PNG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg("Image is over 5 MB — please resize it first."); return; }
    setUploading(true); setMsg("");
    const path = `${new Date().getFullYear()}/${Date.now()}-${slugify(file.name.replace(/\.\w+$/, "")) || "photo"}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await supabase.storage.from("blog").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setUploading(false);
    if (error) { setMsg(error.message + (/bucket|not found|policy/i.test(error.message) ? " — run supabase/blog.sql first." : "")); return; }
    return supabase.storage.from("blog").getPublicUrl(path).data.publicUrl;
  }

  async function save(status: "draft" | "published") {
    const slug = slugify(f.slug || f.title);
    if (f.title.trim().length < 3) return setMsg("Add a title (at least 3 characters).");
    if (!slug) return setMsg("Add a slug (the web address), e.g. tilak-ceremony-guide.");
    if (taken.includes(slug) && slug !== post?.slug) return setMsg(`Another post already uses /blog/${slug}.`);
    if (status === "published" && f.content_md.trim().length < 50) return setMsg("Write the post before publishing (it looks empty).");
    if (f.cover_url && !/^https:\/\//.test(f.cover_url)) return setMsg("The cover photo link must start with https://");
    setSaving(true); setMsg("");
    const row = {
      slug, title: f.title.trim(), excerpt: f.excerpt?.trim() || null, content_md: f.content_md, cover_url: f.cover_url?.trim() || null,
      cover_alt: f.cover_alt?.trim() || null, author_name: f.author_name.trim() || "Team Videh", category: f.category?.trim() || null,
      tags: tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 12), status,
      published_at: status === "published" ? (f.published_at || new Date().toISOString()) : f.published_at,
      seo_title: f.seo_title?.trim() || null, seo_description: f.seo_description?.trim() || null,
    };
    const q = post ? supabase.from("posts").update(row).eq("id", post.id) : supabase.from("posts").insert(row);
    const { data, error } = await q.select("*").single();
    setSaving(false);
    if (error) { setMsg(error.message.includes("posts_slug_key") ? "That slug is already used." : error.message); return; }
    setF(s => ({ ...s, slug, status, published_at: (data as Post).published_at }));
    onSaved(data as Post, post && post.slug !== slug ? post.slug : undefined);
  }

  async function remove() {
    if (!post) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { setMsg(error.message); setConfirmDel(false); return; }
    onDeleted(post);
  }

  const seoT = f.seo_title || f.title, seoD = f.seo_description || f.excerpt || "";
  return <>
    <div className="sb-scrim sb-scrim-panel" onClick={onClose} />
    <aside className="sb-panel sb-panel-wide" role="dialog" aria-label={post ? `Edit ${post.title}` : "New post"}>
      <header><div><small>{post ? "Edit post" : "New post"} · {f.status}</small><b>{f.title || "Untitled post"}</b></div>
        <div className="sb-head-actions">{post?.status === "published" && <a className="sb-btn" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> <span>View</span></a>}
          <button className="sb-icon" onClick={onClose} aria-label="Close"><X size={18} /></button></div></header>
      <div className="sb-panel-body">
        <label className="sb-field"><span>title <em>text</em></span><input className="sb-input" value={f.title} maxLength={140} onChange={e => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder="A guide to the tilak ceremony in Mithila" /></label>
        <label className="sb-field"><span>slug <em>web address: /blog/{slugify(f.slug || f.title) || "…"}</em></span><input className="sb-input" value={f.slug} maxLength={90} onChange={e => { setSlugTouched(true); set("slug", e.target.value); }} onBlur={() => set("slug", slugify(f.slug))} /></label>
        <label className="sb-field"><span>excerpt <em>shown on the blog list and in Google · {(f.excerpt || "").length}/320</em></span><textarea rows={2} maxLength={320} value={f.excerpt || ""} onChange={e => set("excerpt", e.target.value)} /></label>

        <div className="sb-field"><span>content_md <em>{readingMinutes(f.content_md)} min read</em></span>
          <div className="sb-tabs"><button className={tab === "write" ? "on" : ""} onClick={() => setTab("write")}><PenLine size={13} /> Write</button><button className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}><Eye size={13} /> Preview</button>
            <label className="sb-btn sb-mini">{uploading ? <Loader2 size={13} className="sb-spin" /> : <ImagePlus size={13} />} Add photo<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; const url = await upload(file); if (url) set("content_md", `${f.content_md.trimEnd()}\n\n![Describe the photo](${url})\n\n`); }} /></label></div>
          {tab === "write"
            ? <textarea className="sb-editor" rows={18} value={f.content_md} onChange={e => set("content_md", e.target.value)} placeholder={"Write the post here. Leave a blank line between paragraphs.\n\n## A heading\n\nSome text with **bold** words and a [link](/enquire).\n\n- a bullet\n- another bullet"} />
            : <div className="sb-preview post-body" dangerouslySetInnerHTML={{ __html: preview || "<p><i>Nothing written yet.</i></p>" }} />}
          <small className="sb-help">## heading · ### small heading · **bold** · *italic* · [text](link) · - bullet · 1. numbered · &gt; quote · blank line = new paragraph</small>
        </div>

        <div className="sb-field"><span>cover_url <em>main photo</em></span>
          <div className="sb-row"><input className="sb-input" value={f.cover_url || ""} onChange={e => set("cover_url", e.target.value)} placeholder="Upload, or paste an https:// link" />
            <label className="sb-btn">{uploading ? <Loader2 size={14} className="sb-spin" /> : <ImagePlus size={14} />} Upload<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; const url = await upload(file); if (url) set("cover_url", url); }} /></label></div>
          {f.cover_url && /^https:\/\//.test(f.cover_url) && <img className="sb-cover" src={f.cover_url} alt="" />}
        </div>
        <label className="sb-field"><span>cover_alt <em>describe the photo for blind readers and Google</em></span><input className="sb-input" value={f.cover_alt || ""} maxLength={200} onChange={e => set("cover_alt", e.target.value)} /></label>

        <div className="sb-two">
          <label className="sb-field"><span>category <em>text</em></span><input className="sb-input" list="sb-cats" value={f.category || ""} maxLength={60} onChange={e => set("category", e.target.value)} /><datalist id="sb-cats">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist></label>
          <label className="sb-field"><span>author_name <em>text</em></span><input className="sb-input" value={f.author_name} maxLength={80} onChange={e => set("author_name", e.target.value)} /></label>
        </div>
        <div className="sb-two">
          <label className="sb-field"><span>tags <em>comma separated</em></span><input className="sb-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="tilak, madhubani" /></label>
          <label className="sb-field"><span>published_at <em>a future time schedules it</em></span><input className="sb-input" type="datetime-local" value={toLocalInput(f.published_at)} onChange={e => set("published_at", fromLocalInput(e.target.value))} /></label>
        </div>

        <details className="sb-seo"><summary>Search engine (SEO) — optional</summary>
          <label className="sb-field"><span>seo_title <em>{(f.seo_title || "").length}/70 · defaults to the title</em></span><input className="sb-input" value={f.seo_title || ""} maxLength={70} onChange={e => set("seo_title", e.target.value)} /></label>
          <label className="sb-field"><span>seo_description <em>{(f.seo_description || "").length}/170 · defaults to the excerpt</em></span><textarea rows={2} maxLength={170} value={f.seo_description || ""} onChange={e => set("seo_description", e.target.value)} /></label>
          <div className="sb-serp"><cite>videhhotels.com › blog › {slugify(f.slug || f.title)}</cite><b>{seoT} | Hotel Videh</b><p>{seoD.slice(0, 160) || "Add an excerpt or SEO description."}</p></div>
        </details>
        {post && <p className="sb-help">Readers: {post.view_count} views · {post.read_count} full reads · created {when(post.created_at)}</p>}
        {msg && <p className="sb-error" role="alert">{msg}</p>}
      </div>
      <footer>
        {post ? (confirmDel
          ? <div><button className="sb-btn sb-btn-danger" onClick={remove}><Trash2 size={14} /> Yes, delete</button><button className="sb-btn" onClick={() => setConfirmDel(false)}>Keep</button></div>
          : <button className="sb-btn sb-btn-danger" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> Delete</button>) : <span />}
        <div>
          <button className="sb-btn" disabled={saving} onClick={() => save("draft")}>{f.status === "published" ? "Unpublish" : "Save draft"}</button>
          <button className="sb-btn sb-btn-green" disabled={saving} onClick={() => save("published")}>{saving ? "Saving…" : f.status === "published" ? "Update" : "Publish"}</button>
        </div>
      </footer>
    </aside>
  </>;
}
