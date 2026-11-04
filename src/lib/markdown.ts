// A small, safe Markdown renderer for blog posts. Everything is HTML-escaped first, so a post can never
// inject scripts or raw HTML; only the formatting below is turned back into tags.
//   ## Heading   ### Smaller heading   - bullet   1. numbered   > quote   ![alt](https://image)   **bold**  *italic*  [text](link)

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const okUrl = (u: string) => /^(https?:\/\/|\/(?!\/)|mailto:|tel:|#)/i.test(u);

function inline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, url: string) => {
      const raw = url.replace(/&amp;/g, "&");
      if (!okUrl(raw)) return text;
      const ext = /^https?:\/\//i.test(raw);
      return `<a href="${url}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}

export function renderMarkdown(src: string): string {
  const blocks = esc(src.replace(/\r\n?/g, "\n")).split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return blocks.map(b => {
    const lines = b.split("\n");
    let m: RegExpMatchArray | null;
    if ((m = b.match(/^###\s+(.+)$/))) return `<h3>${inline(m[1])}</h3>`;
    if ((m = b.match(/^##\s+(.+)$/))) return `<h2>${inline(m[1])}</h2>`;
    if ((m = b.match(/^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/))) return `<figure><img src="${m[2]}" alt="${m[1]}" loading="lazy" />${m[1] ? `<figcaption>${m[1]}</figcaption>` : ""}</figure>`;
    if (lines.every(l => /^[-*]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    if (lines.every(l => /^\d+[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${inline(l.replace(/^\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
    if (lines.every(l => /^&gt;\s?/.test(l))) return `<blockquote><p>${lines.map(l => inline(l.replace(/^&gt;\s?/, ""))).join("<br />")}</p></blockquote>`;
    return `<p>${lines.map(inline).join("<br />")}</p>`;
  }).join("\n");
}

export const readingMinutes = (src: string) => Math.max(1, Math.round(src.split(/\s+/).filter(Boolean).length / 200));
export const plainText = (src: string) => src.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`-]+/g, " ").replace(/\s+/g, " ").trim();
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/, "");
