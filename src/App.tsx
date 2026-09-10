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

type ProofPoint = { tag: string; head: string; body: string };

const HERO_PROOF: readonly ProofPoint[] = [
  {
    tag: 'Approved',
    head: 'A 90-day operating plan, approved',
    body: 'Authored the plan spanning finance, costing, and delivery, secured the cooperative’s formal approval, and implemented it without pre-existing positional authority.',
  },
  {
    tag: 'Systems of record',
    head: 'The source-of-truth behind the numbers',
    body: 'Built a Notion system connecting time, roles, projects, and budgets — the basis for the first per-project pricing model and a year-to-date financial review.',
  },
  {
    tag: 'Shipped',
    head: 'An enterprise rebuild, through disruption',
    body: 'Led a six-phase WordPress-to-Framer migration as Tech Lead, driving delivery through a mid-project disruption to launch on a weekly client cadence.',
  },
];

type Role = {
  role: string;
  org: string;
  meta: string;
  href?: string;
  testid: string;
};

const PRIOR_ROLES: readonly Role[] = [
  {
    role: 'Design Systems Engineer — Product Delivery & Experimentation',
    org: 'Zocdoc',
    meta: '2021 – 2024',
    href: '/work/zocdoc',
    testid: 'link-role-zocdoc',
  },
  {
    role: 'Product Engineer — API Integrations',
    org: 'Applied Software',
    meta: '2019 – 2021',
    testid: 'role-applied',
  },
  {
    role: 'Software Engineer — Legacy Modernization',
    org: 'Genesco',
    meta: '2017 – 2019',
    testid: 'role-genesco',
  },
];

const AROKO_POINTS: readonly string[] = [
  'Diagnosed a design-to-development bottleneck and introduced a unified Framer-first workflow, cutting web-project delivery time by roughly 50%.',
  'Reconciled operational and financial data across Notion, YNAB, Bill.com, and spreadsheets to clarify payments, hours, work categories, and source reliability.',
  'Acted as primary client contact — translating business, SEO, content, and technical requirements into scopes, milestones, QA checkpoints, and technical handoff.',
];

function Home() {
  return (
    <main className="app-shell">
      <SiteHeader current="portfolio" />

      <section className="workspace" aria-labelledby="hero-title">
        <div className="intro home-hero">
          <p className="home-eyebrow">Strategic Projects Lead</p>
          <h1 className="home-thesis" id="hero-title">
            I turn ambiguous, high-pressure work into measurable systems and reliable delivery.
          </h1>
          <p className="home-sub">
            An operations and strategic-projects lead who owns tactical execution end to end &mdash;
            diagnosing bottlenecks, restructuring processes, and reporting clearly on cost, capacity,
            quality, and progress. Nine years across operations, product, design, and engineering.
          </p>
          <div className="home-hero-actions">
            <a href="/work/zocdoc">See the Zocdoc case study <ArrowUpRight aria-hidden="true" /></a>
            <a href="/ask">Ask the assistant</a>
          </div>

          <div className="home-case-proof" aria-label="Selected outcomes at Aroko">
            <div className="home-case-proof-grid">
              {HERO_PROOF.map((point) => (
                <article key={point.tag}>
                  <span>{point.tag}</span>
                  <strong>{point.head}</strong>
                  <p>{point.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <section className="home-now" aria-labelledby="home-exp-title">
          <div className="home-sec-head">
            <h2 id="home-exp-title" className="home-sec-tag">Experience</h2>
          </div>

          <article className="home-exp-lead" data-testid="exp-aroko">
            <div className="home-exp-lead-head">
              <div>
                <p className="home-exp-role">Strategic Projects Lead &mdash; Operations &amp; Technical Delivery</p>
                <a
                  className="home-exp-org"
                  href="https://aroko.coop"
                  target="_blank"
                  rel="noreferrer noopener"
                  data-testid="link-exp-aroko"
                >
                  Aroko <ArrowUpRight aria-hidden="true" />
                </a>
              </div>
              <p className="home-exp-meta">2024 &ndash; Present</p>
            </div>
            <ul className="home-exp-points">
              <li>
                Authored a 90-day operating plan and secured formal approval, then built a Notion
                source-of-truth system connecting time, roles, projects, and budgets &mdash; the basis
                for the cooperative&rsquo;s first per-project pricing model and its year-to-date financial review.
              </li>
              {AROKO_POINTS.map((point) => (
                <li key={point.slice(0, 24)}>{point}</li>
              ))}
            </ul>
          </article>

          <div className="home-now-grid">
            {PRIOR_ROLES.map((role) =>
              role.href ? (
                <a className="home-now-item" key={role.testid} href={role.href} data-testid={role.testid}>
                  <p className="home-now-role">{role.role} <ArrowUpRight aria-hidden="true" /></p>
                  <p className="home-now-org">{role.org}</p>
                  <p className="home-now-meta">{role.meta}</p>
                </a>
              ) : (
                <div className="home-now-item" key={role.testid} data-testid={role.testid}>
                  <p className="home-now-role">{role.role}</p>
                  <p className="home-now-org">{role.org}</p>
                  <p className="home-now-meta">{role.meta}</p>
                </div>
              ),
            )}
          </div>

          <p className="home-recognition">
            <span className="home-recognition-tag">Recognition</span>
            NEW INC Fellow, Social Architecture &mdash; New Museum, 2025
          </p>
        </section>

        <div className="home-ask-cta">
          <p className="home-ask-cta-title">Want the detail?</p>
          <p className="home-ask-cta-note">
            Ask the assistant about any role, system, or decision across the work.
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
