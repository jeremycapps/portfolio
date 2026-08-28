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
      </main>
    </div>
  );
}
