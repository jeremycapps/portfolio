import { useEffect } from 'react';
import { BlogContent } from '../components/blog-content';
import { BlogHeader } from '../components/blog-header';
import {
  BLOG_ARTICLE_BODIES,
  BLOG_POSTS,
  type BlogPostMeta,
} from '../lib/blog/posts.generated';
import NotFound from './not-found';
import { formatBlogDate } from './blog';
import './blog.css';

export function paperDestination(post: BlogPostMeta): string | null {
  return post.kind === 'paper' ? post.pdf ?? post.sourceUrl ?? null : null;
}

function PaperRedirect({ destination }: { destination: string }) {
  useEffect(() => {
    window.location.assign(destination);
  }, [destination]);

  return (
    <div className="blog-redirect" role="status">
      Opening the paper… <a href={destination}>Continue</a>
    </div>
  );
}

interface BlogPostPageProps {
  slug: string;
  posts?: readonly BlogPostMeta[];
  articleBodies?: Readonly<Record<string, string>>;
}

export default function BlogPostPage({
  slug,
  posts = BLOG_POSTS,
  articleBodies = BLOG_ARTICLE_BODIES,
}: BlogPostPageProps) {
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) return <NotFound />;

  const destination = paperDestination(post);
  if (destination) return <PaperRedirect destination={destination} />;
  if (post.kind !== 'article' || articleBodies[slug] === undefined) return <NotFound />;

  return (
    <div className="app-shell blog-shell">
      <BlogHeader />
      <main className="workspace blog-article-workspace">
        <article className="blog-article">
          <a className="blog-back" href="/blog">← Blog</a>
          <header className="blog-article-header">
            <div className="blog-card-meta">
              <span className="blog-kind">Essay</span>
              <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
              {post.status && <span>{post.status}</span>}
            </div>
            <h1>{post.title}</h1>
            <p>{post.summary}</p>
          </header>
          <BlogContent content={articleBodies[slug]} />
        </article>
      </main>
    </div>
  );
}
