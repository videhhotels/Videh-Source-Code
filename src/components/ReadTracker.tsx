"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

/* Sends reader engagement back to the database (posts.view_count / read_count):
   - a "view" once per visit, after 3 seconds on the page
   - a "read" once the reader reaches the end of the article and has spent at least 20 seconds on it */
export default function ReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const once = (kind: "view" | "read") => {
      const k = `videh-${kind}:${slug}`;
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* private mode: still count */ }
      supabase.rpc("blog_track", { p_slug: slug, p_kind: kind }).then(({ error }) => error && console.warn("blog_track", error.message));
    };
    const start = Date.now();
    let reachedEnd = false, done = false;
    const tryRead = () => { if (!done && reachedEnd && Date.now() - start >= 20_000) { done = true; once("read"); } };
    const viewT = window.setTimeout(() => once("view"), 3000);
    const tick = window.setInterval(tryRead, 5000);
    const end = document.querySelector("[data-read-end]");
    const io = end ? new IntersectionObserver(([e]) => { if (e.isIntersecting) { reachedEnd = true; tryRead(); } }) : null;
    if (end && io) io.observe(end);
    return () => { window.clearTimeout(viewT); window.clearInterval(tick); io?.disconnect(); };
  }, [slug]);
  return null;
}
