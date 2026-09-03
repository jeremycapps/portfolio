import { SiteHeader } from '@/components/site-header';
import './about.css';

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
          <p className="about-lede">
            Jeremy Capps is a systems-oriented, product-minded engineer who works across
            product, operations, design, and engineering. He learns how a workflow actually
            works, identifies the binding constraint, and builds the technical or operational
            system required to change it. Since 2017, that work has spanned internal operations,
            production design systems, customer-facing API integrations, legacy modernization,
            and independent AI infrastructure that turns discovered domain knowledge into
            reusable context.
          </p>
        </div>
      </main>
    </div>
  );
}
