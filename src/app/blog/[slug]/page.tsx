import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd, SITE_URL, breadcrumbs, pageMeta, venueSchema } from "@/lib/site";
import { fmtPostDate, getPost, getPosts } from "@/lib/blog";
import { plainText, readingMinutes, renderMarkdown } from "@/lib/markdown";
import EnquiryForm from "@/components/EnquiryForm";
import ReadTracker from "@/components/ReadTracker";

export const revalidate = 3600;      // safety net; saving on /admin refreshes the page immediately
export const dynamicParams = true;   // a new post renders on its first visit, then stays cached

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts()).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Story not found", robots: { index: false } };
  const description = post.seo_description || post.excerpt || plainText(post.content_md).slice(0, 155);
  const meta = pageMeta({
    title: post.seo_title || post.title, description, path: `/blog/${post.slug}`,
    images: post.cover_url ? [{ url: post.cover_url, alt: post.cover_alt || post.title }] : undefined,
  });
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.published_at, modifiedTime: post.updated_at, authors: [post.author_name] } };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const more = (await getPosts(4)).filter(p => p.slug !== slug).slice(0, 3);
  const mins = readingMinutes(post.content_md);
  const url = `${SITE_URL}/blog/${post.slug}`;

  return <>
    <JsonLd data={[
      { "@type": "BlogPosting", "@id": `${url}#post`, headline: post.title, description: post.seo_description || post.excerpt || undefined,
        image: post.cover_url ? [post.cover_url] : undefined, datePublished: post.published_at, dateModified: post.updated_at,
        author: { "@type": "Organization", name: post.author_name }, publisher: { "@id": `${SITE_URL}/#venue` },
        mainEntityOfPage: url, articleSection: post.category || undefined, keywords: post.tags?.length ? post.tags.join(", ") : undefined },
      venueSchema(),
      breadcrumbs([["Blog", "/blog"], [post.title, `/blog/${post.slug}`]]),
    ]} />
    <article className="post" data-post={post.slug}>
      <header className="post-head container">
        <nav className="post-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link></nav>
        {post.category && <div className="eyebrow">{post.category}</div>}
        <h1>{post.title}</h1>
        {post.excerpt && <p className="post-lede">{post.excerpt}</p>}
        <p className="post-byline">{post.author_name} · <time dateTime={post.published_at}>{fmtPostDate(post.published_at)}</time> · {mins} min read</p>
      </header>
      {post.cover_url && <figure className="post-cover container"><img src={post.cover_url} alt={post.cover_alt || ""} /></figure>}
      <div className="post-body container" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content_md) }} />
      <div data-read-end aria-hidden />
      {post.tags?.length > 0 && <p className="post-tags container">{post.tags.map(t => <span key={t}>#{t}</span>)}</p>}
    </article>
    <ReadTracker slug={post.slug} />

    <section className="post-cta container" aria-labelledby="post-cta-h">
      <div><div className="eyebrow">Planning your own wedding?</div><h2 id="post-cta-h">Ask us about your date.</h2>
        <p>Tell us your lagan date and guest count. Our team calls you back within one working day.</p></div>
      <EnquiryForm source={`blog:${post.slug}`.slice(0, 100)} title="Send an enquiry" />
    </section>

    {more.length > 0 && <section className="container post-more"><h2>More from the blog</h2><div className="blog-grid">{more.map(p => <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
      {p.cover_url ? <img src={p.cover_url} alt={p.cover_alt || ""} loading="lazy" /> : <div className="blog-card-art" aria-hidden />}
      <div><span className="blog-meta">{fmtPostDate(p.published_at)}</span><h3>{p.title}</h3></div></Link>)}</div></section>}
  </>;
}
