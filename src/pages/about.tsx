import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import './about.css';

interface CareerEntry {
  role: string;
  org: string;
  years: string;
  detail: string;
}

const CAREER: CareerEntry[] = [
  {
    role: 'Head of Operations',
    org: 'Aroko',
    years: '2024–present',
    detail:
      "A cooperative/agency. Jeremy joined as lead web designer on a Shutterstock landing-page engagement, then authored and secured approval for a 90-day operating plan spanning workflows, design-system planning, and composable costing. He built the Notion-based project budgeting and estimating system the company now runs on, and leads client web delivery as lead web designer / technical director.",
  },
  {
    role: 'Design Systems Engineer / Frontend Engineer',
    org: 'Zocdoc',
    years: '2021–2024',
    detail:
      'Rebuilt and migrated the design system under a company-wide accessibility mandate, owning components including PrimaryButton, TextInput, and the Header. Introduced a PR merge template that cut average merge time by a full workday, and ran the design-system team’s first frontend A/B experiment during the Header migration.',
  },
  {
    role: 'Software / Product Engineer, C#',
    org: 'Applied Software',
    years: '2019–2021',
    detail:
      'Worked on 360Sync, a construction-data integration product. Built the Procore, Bluebeam, Asite, and Viewpoint integrations end to end, authored five-plus REST API wrapper libraries, and introduced trace logging that reduced customer troubleshooting by three to four business days.',
  },
  {
    role: 'Freelance Developer',
    org: 'Weill Cornell Medicine',
    years: '2020–2021',
    detail: 'Built a Python-to-Google-Sheets integration to parse, clean, and update admissions data.',
  },
  {
    role: 'Software Engineer, legacy modernization',
    org: 'Genesco',
    years: '2017–2019',
    detail:
      'Modernized legacy COBOL systems into Java-based replacement workflows — translating embedded business logic and legacy data flows without disrupting operational continuity.',
  },
];

interface ProjectLink {
  name: string;
  status: string;
  detail: string;
  href: string;
  external: boolean;
}

const PROJECTS: ProjectLink[] = [
  {
    name: 'Libera',
    status: 'Runtime built & tested',
    detail:
      'A platform for composing, sharing, and deploying executable semantic models — write the model once, share the meaning, deploy the behavior. The deterministic runtime underneath is written in Mojo with 898 test assertions and a layering test that mechanically enforces its own architecture.',
    href: 'https://github.com/jeremycapps/libera',
    external: true,
  },
  {
    name: 'Facia',
    status: 'Shipped',
    detail:
      'The answer-to-interface contract: a pure, total function chain that turns a classified answer into a UI recipe. Shipped as the @facia/core package — the same copy of it runs this portfolio.',
    href: 'https://github.com/jeremycapps/facia',
    external: true,
  },
  {
    name: 'StratOS',
    status: 'Active prototype',
    detail:
      'An instrument for making strategic tradeoffs explicit across six paired tensions, resolving a declared direction into a pole-specific recommendation and board agenda.',
    href: '/stratos',
    external: false,
  },
];

export default function AboutPage() {
  return (
    <div className="app-shell about-shell">
      <SiteHeader current="about" />
      <main className="workspace about-workspace">
        <div className="intro about-intro">
          <p className="eyebrow" data-testid="text-about-eyebrow">About</p>
          <h1 className="hero-title" id="about-title">
            An engineer who works<br />
            across the <em>seams.</em>
          </h1>
          <p className="hero-description about-lede">
            Jeremy Capps is a systems-oriented, product-minded engineer working across
            product, operations, design, and engineering. His throughline is building the
            source-of-truth and context layer for messy workflows — turning ambiguous,
            scattered work into structured systems people can actually run. He's worked in
            software and systems since 2017, pairing a working engineer's background
            (frontend design systems, API integrations, legacy modernization) with
            operations and product-systems work, and a parallel practice in creative and
            cultural-systems research.
          </p>
        </div>

        <section className="about-section" aria-labelledby="about-now-title">
          <p className="about-kicker">Now</p>
          <h2 id="about-now-title">Head of Operations at Aroko.</h2>
          <p>
            Aroko is a cooperative/agency. Alongside operations, Jeremy leads client web
            delivery as lead web designer / technical director — migration roadmaps, scopes
            of work, stakeholder coordination, and launch readiness. Aroko matched its
            full-year 2025 revenue of $135,000 during the first half of 2026. Through
            NEW INC, the New Museum's incubator, he also does interview-based
            cultural-systems research and music curation.
          </p>
        </section>

        <section className="about-section" aria-labelledby="about-building-title">
          <p className="about-kicker">Independent work</p>
          <h2 id="about-building-title">One system, not side projects.</h2>
          <p>
            The spine, in his own words: a question maps to a deterministic path, which
            produces a checkable answer, which renders as a deterministic interface. The
            throughline across all of it is accountability — "we can build faster, but are
            we approaching what we said we wanted to do or moving further away from it."
          </p>
          <ul className="about-projects" data-testid="about-projects">
            {PROJECTS.map((project) => (
              <li key={project.name} className="about-project">
                <a
                  className="about-project-link"
                  href={project.href}
                  {...(project.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                >
                  <div className="about-project-heading">
                    <h3>{project.name}</h3>
                    <span className="about-project-status">{project.status}</span>
                    <ArrowUpRight aria-hidden="true" />
                  </div>
                  <p>{project.detail}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-section" aria-labelledby="about-career-title">
          <p className="about-kicker">Career</p>
          <h2 id="about-career-title">Nine years across engineering, operations, and product.</h2>
          <ol className="about-timeline" data-testid="about-timeline">
            {CAREER.map((entry) => (
              <li key={`${entry.org}-${entry.years}`} className="about-timeline-entry">
                <div className="about-timeline-heading">
                  <span className="about-timeline-role">{entry.role}</span>
                  <span className="about-timeline-org">{entry.org}</span>
                  <span className="about-timeline-years">{entry.years}</span>
                </div>
                <p>{entry.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section" aria-labelledby="about-cultural-title">
          <p className="about-kicker">Cultural work</p>
          <h2 id="about-cultural-title">NEW INC / New Museum.</h2>
          <p>
            Through NEW INC, Jeremy prepared interview-based research connecting David
            Byrne's <em>How Music Works</em> with Christopher Alexander's{' '}
            <em>The Timeless Way of Building</em> and <em>A Pattern Language</em> — examining
            how spaces, contexts, tools, and systems shape creative work, published as a NEW
            INC / Metalabel record. He also curates guest-specific playlists for Big Shot, a
            talk series linking the New Museum's Karen Wong with Water Street Armory
            programming.
          </p>
        </section>

        <section className="about-section about-looking" aria-labelledby="about-looking-title">
          <p className="about-kicker">Looking for</p>
          <h2 id="about-looking-title">Knowledge, ontology, and context-infrastructure engineering.</h2>
          <p>
            Forward-deployed / knowledge / ontology engineering; context-infrastructure,
            knowledge-graph, and agent-memory work; and founding or early product-engineering
            roles on teams building structured knowledge or AI-context systems. He works best
            in small-to-mid and early-stage teams where one person spans product, operations,
            and engineering. Based in New York City, open to hybrid or onsite (NYC-area), not
            seeking fully remote. Available now.
          </p>
        </section>

        <div className="footer-contact about-contact" aria-label="Contact Jeremy">
          <a href="mailto:jeremy@nycwork.space" data-testid="link-about-email">
            <Mail aria-hidden="true" /> jeremy@nycwork.space
          </a>
          <a
            href="https://www.linkedin.com/in/jeremycapps"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="link-about-linkedin"
          >
            <Linkedin aria-hidden="true" /> LinkedIn
          </a>
          <a
            href="https://github.com/jeremycapps"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="link-about-github"
          >
            <Github aria-hidden="true" /> GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
