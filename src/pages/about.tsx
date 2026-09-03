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
            I build instruments that let people<br />
            reach the right conclusion <em>themselves.</em>
          </h1>
          <p className="about-lede">
            Jeremy Capps builds the systems &mdash; and the shared understanding around them &mdash;
            that keep real work legible and accountable as it grows. The pattern has held across
            every tool: translating business logic out of legacy COBOL, owning production
            design-system components other teams shipped on, leading customer API integrations,
            running operations. He learns how a domain already works, finds what actually governs
            it, and builds the system that lets people act on it with confidence. His recent
            independent work carries the same principle into a space now taking shape &mdash; AI
            infrastructure built to assert only what the evidence supports. Along the way he has
            mentored contributors, coordinated across teams, and shipped for other engineers &mdash;
            the work has always been more than code.
          </p>
        </div>
      </main>
    </div>
  );
}
