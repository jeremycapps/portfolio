import { type ReactNode, Suspense, lazy, useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { SiteHeader } from '@/components/site-header';
import { RouteMetadata } from '@/components/route-metadata';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Experience = {
  role: string;
  org: string;
  orgHref?: string;
  meta: string;
  bullets: readonly string[];
  testid: string;
};

// One uniform, source-grounded record per role. Each is an expandable card, all
// closed on load. Content is drawn from content/profile.md.
const EXPERIENCE: readonly Experience[] = [
  {
    role: 'Strategic Projects Lead — Operations & Technical Delivery',
    org: 'Aroko',
    orgHref: 'https://aroko.coop',
    meta: '2024 – Present',
    testid: 'exp-aroko',
    bullets: [
      'Authored a 90-day operating plan and secured formal approval, then built a Notion source-of-truth system connecting time, roles, projects, and budgets — the basis for the cooperative’s first per-project pricing model and its year-to-date financial review.',
      'Diagnosed a design-to-development bottleneck and introduced a unified Framer-first workflow, cutting web-project delivery time by roughly 50%.',
      'Reconciled operational and financial data across Notion, YNAB, Bill.com, and spreadsheets to clarify payments, hours, work categories, and source reliability.',
      'Acted as primary client contact — translating business, SEO, content, and technical requirements into scopes, milestones, QA checkpoints, and technical handoff.',
    ],
  },
  {
    role: 'Design Systems Engineer — Product Delivery & Experimentation',
    org: 'Zocdoc',
    meta: '2021 – 2024',
    testid: 'exp-zocdoc',
    bullets: [
      'Rebuilt and migrated an outdated TypeScript/React design system under a company-wide accessibility mandate.',
      'Ran the design-system team’s first frontend-component A/B experiment on Zocdoc’s engineering-wide testing framework, tracking behavior and click-through by device and browser.',
      'Introduced a PR merge template and Jira dashboards and sequenced smaller changes — raising velocity 2–3 points per sprint and cutting average merge time by about a workday.',
    ],
  },
  {
    role: 'Product Engineer — API Integrations',
    org: 'Applied Software',
    meta: '2019 – 2021',
    testid: 'exp-applied',
    bullets: [
      'Built the Procore, Bluebeam, Asite, and Viewpoint construction-data integrations end to end on the 360Sync product, extending the inherited BIM 360 reference implementation.',
      'Authored 5+ REST API wrapper libraries and an Azure-hosted authentication service for 100+ users.',
      'Introduced trace logging that cut customer troubleshooting by 3–4 business days; roadmap work with sales and product raised release frequency ~15%.',
    ],
  },
  {
    role: 'Software Engineer — Legacy Modernization',
    org: 'Genesco',
    meta: '2017 – 2019',
    testid: 'exp-genesco',
    bullets: [
      'Modernized legacy COBOL systems into Java-based replacement workflows.',
      'Translated embedded business logic and legacy data flows into maintainable implementations without disrupting operational continuity.',
    ],
  },
];

// Awards use the Experience record and card so the two sections look and behave
// identically. NEW INC is a fellowship, not a job — it belongs here, not in Experience.
const AWARDS: readonly Experience[] = [
  {
    role: 'NEW INC Fellow — Social Architecture',
    org: 'NEW INC · New Museum',
    orgHref: 'https://www.newinc.org',
    meta: '2025',
    bullets: [
      'Interview-based cultural-systems research connecting David Byrne’s How Music Works with Christopher Alexander’s The Timeless Way of Building and A Pattern Language — how spaces, contexts, tools, and systems shape creative work. Published as a NEW INC / Metalabel record.',
      'Curated guest-specific Spotify playlists for Big Shot, a talk series linking the New Museum’s Karen Wong with Water Street Armory programming, with research for guests including Gabe Whaley (MSCHF), author Radha Lin Chaddah, and Craig Kallman (Warner Music Group).',
    ],
    testid: 'award-newinc',
  },
];

function ExperienceItem({ item }: { item: Experience }) {
  const [open, setOpen] = useState(false);
  const panelId = `${item.testid}-panel`;
  return (
    <article className="home-role" data-testid={item.testid} data-open={open}>
      <button
        type="button"
        className="home-role-head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="home-role-headings">
          <span className="home-role-title">{item.role}</span>
          <span className="home-role-org">{item.org}</span>
        </span>
        <span className="home-role-meta">{item.meta}</span>
        <ChevronDown className="home-role-chevron" aria-hidden="true" />
      </button>
      <div id={panelId} className="home-role-panel" hidden={!open}>
        <ul className="home-role-points">
          {item.bullets.map((bullet) => (
            <li key={bullet.slice(0, 32)}>{bullet}</li>
          ))}
        </ul>
        {item.orgHref ? (
          <a
            className="home-role-org-link"
            href={item.orgHref}
            target="_blank"
            rel="noreferrer noopener"
          >
            {item.org} <ArrowUpRight aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function Home() {
  return (
    <main className="app-shell">
      <SiteHeader current="portfolio" />

      <section className="workspace home-workspace" aria-labelledby="hero-title">
        <div className="intro home-hero">
          <h1 className="home-thesis" id="hero-title">
            I build production AI systems inside real operations, and ship them end to end.
          </h1>
          <p className="home-sub">
            An engineer who works directly with the people who own the problem. Nine years across
            engineering, product, design, and operations &mdash; I scope with the customer, write the
            code, and stay through adoption. The assistant on this site is a production RAG agent I
            built on my own work logs.
          </p>
          <div className="home-hero-actions">
            <a href="/ask">Chat with my assistant <ArrowUpRight aria-hidden="true" /></a>
            <a href="/blog/production-rag-personal-corpus">See how it works <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>

        <section className="home-now" aria-labelledby="home-exp-title">
          <div className="home-sec-head">
            <h2 id="home-exp-title" className="home-sec-tag">Experience</h2>
          </div>

          <div className="home-role-list">
            {EXPERIENCE.map((item) => (
              <ExperienceItem key={item.testid} item={item} />
            ))}
          </div>

        </section>

        <section className="home-now home-awards" aria-labelledby="home-awards-title">
          <div className="home-sec-head">
            <h2 id="home-awards-title" className="home-sec-tag">Awards</h2>
          </div>

          <div className="home-role-list">
            {AWARDS.map((item) => (
              <ExperienceItem key={item.testid} item={item} />
            ))}
          </div>
        </section>

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
