import Link from "next/link";
import { JsonLd, SITE_URL, breadcrumbs, pageMeta } from "@/lib/site";
import { fmtPostDate, getPosts } from "@/lib/blog";

export const revalidate = 3600;

export const metadata = pageMeta({
  title: "Wedding Planning Blog – Mithila Rituals & Tips",
  description: "Guides for planning a Mithila wedding in Madhubani: tilak to chaturthi, guest lists, decoration and choosing your venue, from Hotel Videh.",
  path: "/blog",
});

export default async function BlogIndex() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;
  return <>
    <JsonLd data={[
      { "@type": "Blog", "@id": `${SITE_URL}/blog#blog`, name: "Hotel Videh wedding blog", url: `${SITE_URL}/blog`,
        blogPost: posts.slice(0, 20).map(p => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.published_at })) },
      breadcrumbs([["Blog", "/blog"]]),
    ]} />
    <div className="info-page blog-page">
      <section className="listing-heading container"><div className="eyebrow">Videh journal</div><h1>Wedding stories &amp; planning notes.</h1>
        <p>Rituals, timelines and practical tips for planning a Mithila wedding in Madhubani.</p></section>
      <section className="container blog-wrap">
        {!posts.length && <div className="blog-empty"><h2>First stories coming soon</h2><p>Meanwhile, read about the <Link href="/ceremonies">ceremonies we host</Link> or <Link href="/enquire">ask us about your date</Link>.</p></div>}
        {lead && <Link href={`/blog/${lead.slug}`} className="blog-lead">
          {lead.cover_url && <img src={lead.cover_url} alt={lead.cover_alt || ""} />}
          <div><span className="blog-meta">{lead.category || "Wedding planning"} · {fmtPostDate(lead.published_at)}</span><h2>{lead.title}</h2>{lead.excerpt && <p>{lead.excerpt}</p>}<b>Read the story →</b></div>
        </Link>}
        {rest.length > 0 && <div className="blog-grid">{rest.map(p => <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
          {p.cover_url ? <img src={p.cover_url} alt={p.cover_alt || ""} loading="lazy" /> : <div className="blog-card-art" aria-hidden />}
          <div><span className="blog-meta">{p.category || "Wedding planning"} · {fmtPostDate(p.published_at)}</span><h3>{p.title}</h3>{p.excerpt && <p>{p.excerpt}</p>}</div>
        </Link>)}</div>}
      </section>
    </div>
  </>;
}
