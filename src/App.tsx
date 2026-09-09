import { type ReactNode, Suspense, lazy } from 'react';
import { ArrowUpRight, Linkedin, Mail, Sparkles } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { SiteHeader } from '@/components/site-header';
import { RouteMetadata } from '@/components/route-metadata';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

// The three genres, in reader order: see it (Perspective) → trust it (Practice)
// → understand it (Method). Each is a door into one engine; the pages already
// exist, so the home curates them rather than re-authoring their content.
const HOME_GENRES: readonly {
  genre: string;
  question: string;
  title: string;
  blurb: string;
  href: string;
  cta: string;
  accent: 'stratos' | 'facia' | 'libera';
  testid: string;
}[] = [
  {
    genre: 'Perspective',
    question: 'Does this person see what I would miss?',
    title: 'Klarna — a decision worked in public',
    blurb:
      'A strong AI-support pilot made scaling look obvious. I named the human-capacity boundary the headline hid, and sized the next increment to the evidence.',
    href: '/stratos-flow#case-study',
    cta: 'Read the perspective',
    accent: 'stratos',
    testid: 'link-genre-perspective',
  },
  {
    genre: 'Practice',
    question: 'Has this person actually done the work?',
    title: 'Zocdoc — experience, reframed',
    blurb:
      'A company-wide design-system migration, run as a measured product decision: reviewable units, coordinated teams, and an A/B-proven rollout.',
    href: '/work/zocdoc',
    cta: 'See the practice',
    accent: 'facia',
    testid: 'link-genre-practice',
  },
  {
    genre: 'Method',
    question: 'Is there real rigor behind the insight?',
    title: 'StratOS — the framework itself',
    blurb:
      'Build the twelve-pole model yourself, one question at a time, then read where the signals diverge and where to intervene.',
    href: '/method',
    cta: 'Learn the method',
    accent: 'libera',
    testid: 'link-genre-method',
  },
];

function Home() {
  return (
    <main className="app-shell">
      <SiteHeader current="portfolio" />

      <section className="workspace" aria-labelledby="hero-title">
        <div className="intro home-hero">
          <p className="home-eyebrow" data-testid="text-eyebrow">Technical product management · enterprise AI</p>
          <h1 className="home-thesis" id="hero-title">
            I&rsquo;m the technical PM who owns the call between what AI recommends and{' '}
            <span>what an organization can safely commit to.</span>
          </h1>
          <p className="home-sub">
            I find where the evidence is strong, name the boundary a confident headline hides, and
            carry a prototype through to a decision an organization can actually run. Three ways
            in&mdash;see it, trust it, understand it.
          </p>
          <div className="home-hero-actions">
            <a href="/stratos-flow#case-study">See the Klarna decision <ArrowUpRight aria-hidden="true" /></a>
            <a href="/ask">Ask the assistant</a>
          </div>
        </div>

        <section className="home-genres" aria-labelledby="home-genres-title">
          <div className="home-sec-head">
            <p className="home-sec-tag">The work</p>
            <p className="home-sec-note">See it &middot; trust it &middot; understand it</p>
          </div>
          <h2 id="home-genres-title" className="sr-only">Three ways into the work</h2>
          <div className="home-genre-grid">
            {HOME_GENRES.map((g) => (
              <a className="home-genre-card" key={g.genre} href={g.href} data-testid={g.testid}>
                <span className={`home-genre-dot accent-${g.accent}`} aria-hidden="true" />
                <p className="home-genre-kind">{g.genre}</p>
                <p className="home-genre-q">{g.question}</p>
                <p className="home-genre-title">{g.title}</p>
                <p className="home-genre-blurb">{g.blurb}</p>
                <span className="home-genre-more">{g.cta} <ArrowUpRight aria-hidden="true" /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="home-now" aria-labelledby="home-now-title">
          <div className="home-sec-head">
            <p className="home-sec-tag">Where I&rsquo;ve done it</p>
            <p className="home-sec-note">Engineering, operations, and product &mdash; the same move across each</p>
          </div>
          <h2 id="home-now-title" className="sr-only">Where I&rsquo;ve done it</h2>
          <div className="home-now-grid">
            <a
              className="home-now-item"
              href="https://aroko.coop"
              target="_blank"
              rel="noreferrer noopener"
              data-testid="link-now-aroko"
            >
              <span className="home-now-dot accent-stratos" aria-hidden="true" />
              <div>
                <p className="home-now-role">Head of Operations <ArrowUpRight aria-hidden="true" /></p>
                <p className="home-now-org">Aroko &mdash; cooperative agency</p>
                <p className="home-now-meta">2024 &ndash; present &middot; ops systems, delivery, costing</p>
              </div>
            </a>
            <a
              className="home-now-item"
              href="https://www.newmuseum.org/person/jeremy-capps/"
              target="_blank"
              rel="noreferrer noopener"
              data-testid="link-now-newinc"
            >
              <span className="home-now-dot accent-facia" aria-hidden="true" />
              <div>
                <p className="home-now-role">Musician &amp; researcher <ArrowUpRight aria-hidden="true" /></p>
                <p className="home-now-org">NEW INC / New Museum</p>
                <p className="home-now-meta">2025 &ndash; 2026 &middot; cultural-systems research</p>
              </div>
            </a>
            <div className="home-now-item">
              <span className="home-now-dot accent-libera" aria-hidden="true" />
              <div>
                <p className="home-now-role">Design Systems / Frontend Engineer</p>
                <p className="home-now-org">Zocdoc</p>
                <p className="home-now-meta">2021 &ndash; 2024 &middot; design-system migration, frontend A/B experiment</p>
              </div>
            </div>
            <div className="home-now-item">
              <span className="home-now-dot accent-facia" aria-hidden="true" />
              <div>
                <p className="home-now-role">Software / Product Engineer</p>
                <p className="home-now-org">Applied Software</p>
                <p className="home-now-meta">2019 &ndash; 2021 &middot; construction-data integrations, C#</p>
              </div>
            </div>
            <div className="home-now-item">
              <span className="home-now-dot accent-stratos" aria-hidden="true" />
              <div>
                <p className="home-now-role">Software Engineer</p>
                <p className="home-now-org">Genesco</p>
                <p className="home-now-meta">2017 &ndash; 2019 &middot; legacy COBOL &rarr; Java modernization</p>
              </div>
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

        <div className="footer-contact" aria-label="Contact Jeremy">
          <a href="mailto:jeremy@nycwork.space" data-testid="link-email">
            <Mail aria-hidden="true" /> jeremy@nycwork.space
          </a>
          <a href="https://www.linkedin.com/in/jeremycapps" target="_blank" rel="noreferrer noopener" data-testid="link-linkedin">
            <Linkedin aria-hidden="true" /> LinkedIn
          </a>
        </div>

        <p className="footer-note"><Sparkles aria-hidden="true" /> A small surface for big thinking.</p>
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
const AboutPage = lazy(() => import('@/pages/about'));

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ask">
          {() => <Suspense fallback={null}><AskPage /></Suspense>}
        </Route>
        <Route path="/about">
          {() => <Suspense fallback={null}><AboutPage /></Suspense>}
        </Route>
        <Route path="/stratos">
          {() => <Suspense fallback={null}><StratosPage /></Suspense>}
        </Route>
        <Route path="/stratos-v2">
          {() => <Suspense fallback={null}><StratosV2Page /></Suspense>}
        </Route>
        <Route path="/stratos-flow">
          {() => <Suspense fallback={null}><StratosFlowPage /></Suspense>}
        </Route>
        <Route path="/method">
          {() => <Suspense fallback={null}><MethodPage /></Suspense>}
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
