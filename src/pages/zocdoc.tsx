import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import './zocdoc.css';

const AT_A_GLANCE: readonly [string, string][] = [
  ['Role', 'Design Systems Engineer'],
  ['Span', '2021–2024'],
  ['Reach', 'The header on every page'],
  ['Codebases', '4–5, independently owned'],
  ['Team', '3 engineers'],
];

const DECISIONS: readonly { tag: string; title: string; body: string }[] = [
  {
    tag: 'Coordination',
    title: 'A page-by-page migration workflow.',
    body: 'Identify engineering ownership, bring stakeholders in early, and line up QA ahead of each change—so every dependent team advances together. I audited the legacy header and then read how downstream teams actually called it, because real usage is what would break.',
  },
  {
    tag: 'Evidence',
    title: 'Prove the header through the A/B framework.',
    body: "The design-system team's first frontend-component experiment: a gradual rollout, measured across browsers and mobile, with test/control analysis. A load-bearing change, released like a product rather than shipped in one cut.",
  },
];

const OUTCOMES: readonly { metric: string; label: string; body: string }[] = [
  {
    metric: 'Built on',
    label: 'A rollout teams could trust',
    body: 'A measured, confident migration the dependent teams advanced on together.',
  },
  {
    metric: '+2–3',
    label: 'Velocity points per sprint',
    body: 'Smaller, well-scoped tickets made the work legible and moved it faster.',
  },
  {
    metric: '1 workday',
    label: 'Returned to the team',
    body: 'A PR merge template that changed how the team shipped, not just my own tickets.',
  },
];

export default function ZocdocPage() {
  return (
    <div className="app-shell zc-shell">
      <SiteHeader current="stratos" />
      <main className="zc-main">
        <header className="zc-hero" aria-labelledby="zc-title">
          <p className="zc-kicker">Practice · Zocdoc · 2021–2024</p>
          <h1 id="zc-title">Migrating the component every page shipped on, run as a product decision.</h1>
          <p className="zc-lede">
            As a design-systems engineer at Zocdoc, I owned the header migration under a company-wide
            accessibility mandate. What made it land was product judgment, not more code: change the
            size of the reviewable unit, coordinate everyone who depends on it, and let evidence
            confirm each step. The same move as the Klarna call—three years earlier, and in code.
          </p>
          <div className="zc-actions">
            <a href="#decision">See the decision <ArrowRight aria-hidden="true" /></a>
            <a href="/blog/zocdoc-header-migration">Read the full write-up</a>
          </div>
          <dl className="zc-meta">
            {AT_A_GLANCE.map(([term, value]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="zc-section" id="context" aria-labelledby="zc-context-title">
          <div className="zc-section-head">
            <span>01 · Context</span>
            <h2 id="zc-context-title">A mandate turned a maintenance job into leverage.</h2>
          </div>
          <p className="zc-prose">
            Zocdoc was working toward a fully WCAG-compliant site. Mezzanine—the TypeScript/React
            design system many teams built their products on—was the mechanism: fix a component once,
            and every product surface consuming it inherits the fix. The header was the highest-reach
            instance of that leverage: present on every page, on a legacy API that had to be replaced
            rather than wrapped, and consumed across four to five independently owned codebases.
          </p>
        </section>

        <section className="zc-section" id="constraint" aria-labelledby="zc-constraint-title">
          <div className="zc-section-head">
            <span>02 · The real constraint</span>
            <h2 id="zc-constraint-title">The work was correct long before it could land.</h2>
          </div>
          <p className="zc-prose">
            Partway through, the feedback was to push more code to production. But the components were
            built and correct—they sat in review, in branches that drifted while product teams kept
            editing the codebases underneath them. The constraint was not how much I produced; it was
            how large and illegible each unit of work had become by the time someone had to review it.
          </p>
          <p className="zc-pull">Blocked by review, not by code. Changing the shape of the work—not the amount—is what moved it.</p>
        </section>

        <section className="zc-section" id="decision" aria-labelledby="zc-decision-title">
          <div className="zc-section-head">
            <span>03 · Decision</span>
            <h2 id="zc-decision-title">Move with evidence and coordination.</h2>
          </div>
          <div className="zc-cards">
            {DECISIONS.map((item) => (
              <article key={item.tag}>
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="zc-section" id="result" aria-labelledby="zc-result-title">
          <div className="zc-section-head">
            <span>04 · Result</span>
            <h2 id="zc-result-title">A measured change the whole company kept shipping on.</h2>
          </div>
          <div className="zc-outcomes">
            {OUTCOMES.map((item) => (
              <article key={item.label}>
                <strong>{item.metric}</strong>
                <span>{item.label}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="zc-section zc-judgment" id="judgment" aria-labelledby="zc-judgment-title">
          <div className="zc-section-head">
            <span>05 · Judgment</span>
            <h2 id="zc-judgment-title">A load-bearing change is a shared, measurable commitment.</h2>
          </div>
          <p className="zc-prose">
            Coordinate everyone who depends on it, size the unit of change so it stays reviewable, and
            let the evidence confirm the change is good. That is the same instinct as the Klarna
            decision—name the boundary a strong headline hides, and move only as far as the evidence
            supports. Three years earlier, and in code.
          </p>
        </section>
      </main>
    </div>
  );
}
