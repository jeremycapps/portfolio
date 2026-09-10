import { ArrowUpRight } from 'lucide-react';
import { SiteHeader } from '../components/site-header';
import { BLOG_POSTS, type BlogPostMeta } from '../lib/blog/posts.generated';
import './blog.css';

export function formatBlogDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

// Posts unlisted from the index but still reachable by direct URL. The
// independent-work pieces (the StratOS method at /blog/method, the query-compiler
// case study) are kept live but off the listing so the blog reads to the
// delivery-and-operations story the rest of the site now tells.
const UNLISTED_SLUGS: ReadonlySet<string> = new Set(['method', 'query-compiler-induced']);

export function BlogIndex({
  posts = BLOG_POSTS,
}: { posts?: readonly BlogPostMeta[] }) {
  const orderedPosts = [...posts]
    .filter((post) => !UNLISTED_SLUGS.has(post.slug))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

  return (
    <main className="workspace blog-workspace">
      <div className="intro blog-intro">
        <p className="eyebrow">Essays, papers, and system notes</p>
        <h1 className="hero-title">Written <em>work.</em></h1>
        <p className="hero-description blog-lede">
          Notes on delivery, process, and shipping under constraint &mdash; how the work actually gets done.
        </p>
      </div>

      {orderedPosts.length === 0 ? (
        <div className="blog-empty" data-testid="blog-empty">
          <p>The first pieces are being prepared.</p>
          <span>Check back soon for essays and downloadable papers.</span>
        </div>
      ) : (
        <div className="blog-list" data-testid="blog-list">
          {orderedPosts.map((post) => {
            const href = post.kind === 'article'
              ? `/blog/${post.slug}`
              : post.pdf ?? post.sourceUrl!;
            const external = href.startsWith('https://');
            return (
              <article className="blog-card" key={post.slug} data-testid={`blog-card-${post.slug}`}>
                <a
                  className="blog-card-link"
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                >
                  <div className="blog-card-meta">
                    <span className="state-badge blog-kind">{post.kind === 'article' ? 'Essay' : 'Paper'}</span>
                    <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                    {post.status && <span>{post.status}</span>}
                  </div>
                  <div className="blog-card-heading">
                    <h2>{post.title}</h2>
                    <ArrowUpRight aria-hidden="true" />
                  </div>
                  <p>{post.summary}</p>
                </a>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function BlogPage() {
  return (
    <div className="app-shell blog-shell">
      <SiteHeader current="blog" />
      <BlogIndex />
    </div>
  );
}
