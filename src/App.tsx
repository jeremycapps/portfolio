import { type ReactNode, Suspense, lazy } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { SiteHeader } from '@/components/site-header';
import { RouteMetadata } from '@/components/route-metadata';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Genre = {
  num: string;
  kind: string;
  name: string;
  what: string;
  why: string;
  href: string;
  testid: string;
};

const HOME_GENRES: readonly Genre[] = [
  {
    num: '01',
    kind: 'Professional Work',
    name: 'Zocdoc',
    what: 'A design-system migration across product teams, run as a measured product decision.',
    why: 'A change that size shipped without a regression.',
    href: '/work/zocdoc',
    testid: 'link-genre-practice',
  },
  {
    num: '02',
    kind: 'Method',
    name: 'StratOS',
    what: 'A twelve-signal model of how an organization decides.',
    why: 'It surfaces where signals diverge, and where to intervene, before the top-line metric breaks.',
    href: '/blog/method',
    testid: 'link-genre-method',
  },
];

function Home() {
  return (
    <main className="app-shell">
      <SiteHeader current="portfolio" />

      <section className="workspace" aria-labelledby="hero-title">
        <div className="intro home-hero">
          <h1 className="home-thesis" id="hero-title">
            Eight years across engineering, product, and operations.
          </h1>
          <p className="home-sub">
            The discernment is in what to build, before it&rsquo;s built. In engineering, I carried the
            business logic that still mattered out of legacy COBOL and left the rest. In product, I
            fought for the dashboard leaders judged our value by, over the flashier work beside it. In
            operations, I built the costing system that made delivery legible, not more process. An AI
            product is the same call, and it&rsquo;s mine to make: which piece carries the load, chosen before
            it&rsquo;s built.
          </p>
          <div className="home-hero-actions">
            <a href="/work/zocdoc">See the Zocdoc case study <ArrowUpRight aria-hidden="true" /></a>
            <a href="/ask">Ask the assistant</a>
          </div>
        </div>

        <section className="home-genres" aria-labelledby="home-genres-title">
          <div className="home-sec-head">
            <h2 id="home-genres-title" className="home-sec-tag">Work</h2>
          </div>
          {HOME_GENRES.map((genre) => (
            <a className="home-genre-row" key={genre.num} href={genre.href} data-testid={genre.testid}>
              <span className="home-genre-num">{genre.num}</span>
              <div className="home-genre-mid">
                <p className="home-genre-kind">{genre.kind}</p>
                <p className="home-genre-title">{genre.name}</p>
              </div>
              <div className="home-genre-summary">
                <p className="home-genre-what">{genre.what}</p>
                <p className="home-genre-why">{genre.why}</p>
              </div>
              <span className="home-genre-more"><ArrowUpRight aria-hidden="true" /></span>
            </a>
          ))}
        </section>

        <section className="home-now" aria-labelledby="home-now-title">
          <div className="home-sec-head">
            <h2 id="home-now-title" className="home-sec-tag">Experience</h2>
          </div>
          <div className="home-now-grid">
            <a
              className="home-now-item"
              href="https://aroko.coop"
              target="_blank"
              rel="noreferrer noopener"
              data-testid="link-now-aroko"
            >
              <p className="home-now-role">Head of Operations <ArrowUpRight aria-hidden="true" /></p>
              <p className="home-now-org">Aroko</p>
              <p className="home-now-meta">2025 &ndash;</p>
            </a>
            <a
              className="home-now-item"
              href="https://www.newmuseum.org/person/jeremy-capps/"
              target="_blank"
              rel="noreferrer noopener"
              data-testid="link-now-newinc"
            >
              <p className="home-now-role">Cultural Researcher and Fellow <ArrowUpRight aria-hidden="true" /></p>
              <p className="home-now-org">New Museum</p>
              <p className="home-now-meta">2025 &ndash; 2026</p>
            </a>
            <div className="home-now-item">
              <p className="home-now-role">Design Systems / Frontend Engineer</p>
              <p className="home-now-org">Zocdoc</p>
              <p className="home-now-meta">2021 &ndash; 2024</p>
            </div>
            <div className="home-now-item">
              <p className="home-now-role">Software / Product Engineer</p>
              <p className="home-now-org">Applied Software</p>
              <p className="home-now-meta">2019 &ndash; 2021</p>
            </div>
            <div className="home-now-item">
              <p className="home-now-role">Software Engineer</p>
              <p className="home-now-org">Genesco</p>
              <p className="home-now-meta">2017 &ndash; 2019</p>
            </div>
          </div>
        </section>

        <div className="home-ask-cta">
          <p className="home-ask-cta-title">Want to go deeper?</p>
          <p className="home-ask-cta-note">
            Ask the assistant about any project, decision, or the throughline across them.
          </p>
          <a className="home-ask-cta-link" href="/ask" data-testid="link-ask-cta">
            Ask the assistant <ArrowUpRight aria-hidden="true" />
          </a>
        </div>

        <p className="footer-note home-footer">Jeremy Capps &middot; 2026</p>
      </section>
    </main>
  );
}

// Lazy-loaded so the StratOS instrument (and its recipe map) ships in its own
// chunk, never in the homepage bundle.
const StratosPage = lazy(() => import('@/pages/stratos'));
const StratosV2Page = lazy(() => import('@/pages/stratos-v2'));
const StratosFlowPage = lazy(() => import('@/pages/stratos-flow'));
const MethodPage = lazy(() => import('@/pages/method'));
const ZocdocPage = lazy(() => import('@/pages/zocdoc'));
const AskPage = lazy(() => import('@/pages/ask'));
const BlogPage = lazy(() => import('@/pages/blog'));
const BlogPostPage = lazy(() => import('@/pages/blog-post'));

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ask">
          {() => <Suspense fallback={null}><AskPage /></Suspense>}
        </Route>
        <Route path="/stratos">
          {() => <Suspense fallback={null}><StratosPage /></Suspense>}
        </Route>
        <Route path="/stratos-v2">
          {() => <Suspense fallback={null}><StratosV2Page /></Suspense>}
        </Route>
        {/* The Klarna flow page is retired; its URL now sends readers to the method. */}
        <Route path="/stratos-flow">
          {() => <Redirect to="/blog/method" replace />}
        </Route>
        <Route path="/work/zocdoc">
          {() => <Suspense fallback={null}><ZocdocPage /></Suspense>}
        </Route>
        {/*
         * Unlisted preview of the flow view, reachable only by its random path.
         * Not linked from anywhere and kept out of the sitemap; the suffix is
         * obscurity, not a secret — the path ships in the public bundle and repo.
         */}
        <Route path="/stratos-flow-preview-2cebd2c17d1887106cb0">
          {() => <Suspense fallback={null}><StratosFlowPage /></Suspense>}
        </Route>
        <Route path="/blog">
          {() => <Suspense fallback={null}><BlogPage /></Suspense>}
        </Route>
        <Route path="/blog/method">
          {() => <Suspense fallback={null}><MethodPage /></Suspense>}
        </Route>
        <Route path="/blog/:slug">
          {(params) => <Suspense fallback={null}><BlogPostPage slug={params.slug} /></Suspense>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

interface AppProps {
  initialPath?: string;
}

function App({ initialPath }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(/\/$/, '')}
          {...(initialPath ? { ssrPath: initialPath } : {})}
        >
          <RouteMetadata />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
