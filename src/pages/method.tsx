import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { PAIR_QUESTION, TENSIONS, type Tension } from '@/lib/stratos/ontology';
import './method.css';

const ENTERPRISE_QUESTIONS: readonly {
  pair: Tension['pair'];
  question: string;
  purpose: string;
}[] = [
  {
    pair: 'Economics',
    question: 'Does this create enough value to sustain itself?',
    purpose: 'Follow the value created and the capacity required to keep creating it.',
  },
  {
    pair: 'Commitment',
    question: 'Can the organization deliver what it is committing to?',
    purpose: 'Match conviction and release velocity to evidence, controls, and reversibility.',
  },
  {
    pair: 'Renewal',
    question: 'Can the organization keep adapting as conditions change?',
    purpose: 'Balance what the organization knows how to run with what it needs to create next.',
  },
];

const LEVELS = [
  ['L1', 'Strategy', 'What are we trying to accomplish?'],
  ['L2', 'Business case', 'What must be true before we commit?'],
  ['L3', 'Implementation', 'What must be true before we launch?'],
  ['L4', 'Operations', 'What must remain true while we run?'],
  ['L5', 'Audit', 'Did the claimed outcome occur?'],
] as const;

const tensionsFor = (pair: Tension['pair']) =>
  TENSIONS.filter((tension) => tension.pair === pair);

export default function MethodPage() {
  return (
    <div className="app-shell method-shell">
      <SiteHeader current="stratos" />
      <main className="method-main">
        <header className="method-hero" aria-labelledby="method-title">
          <p className="method-kicker">StratOS · the method</p>
          <h1 id="method-title">A way to locate the next responsible commitment.</h1>
          <p>
            StratOS is an accountability method for AI-enabled transformation. It separates the
            question being asked, the level where the system operates, and the place where proof
            lives—then uses divergence between those signals to size the next move.
          </p>
          <div className="method-actions">
            <a href="#questions">Follow the method <ArrowRight aria-hidden="true" /></a>
            <a href="/stratos-flow#case-study">See it applied to Klarna</a>
          </div>
        </header>

        <nav className="method-path" aria-label="Method sequence">
          <a href="#questions"><span>01</span> Question</a>
          <a href="#poles"><span>02</span> Poles</a>
          <a href="#divergence"><span>03</span> Divergence</a>
          <a href="#levels"><span>04</span> Intervention</a>
          <a href="#accountability"><span>05</span> Accountability</a>
        </nav>

        <section className="method-section" id="questions" aria-labelledby="questions-title">
          <div className="method-section-head">
            <span>01 · Start with the question</span>
            <h2 id="questions-title">Three questions define the decision.</h2>
            <p>Each one protects a different condition the organization needs to keep moving.</p>
          </div>
          <div className="method-question-grid">
            {ENTERPRISE_QUESTIONS.map((item) => (
              <article key={item.pair}>
                <span>{item.pair}</span>
                <h3>{item.question}</h3>
                <p>{item.purpose}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="method-section" id="poles" aria-labelledby="poles-title">
          <div className="method-section-head">
            <span>02 · Add altitude and locus</span>
            <h2 id="poles-title">Each question is tested from four positions.</h2>
            <p>
              Two operating altitudes keep architecture and mechanics distinct. Two loci of
              evidence keep internal condition and external consequence visible. Together they
              produce twelve poles: 3 questions × 2 altitudes × 2 loci.
            </p>
          </div>

          <div className="method-equation" aria-label="Three questions times two altitudes times two evidence loci equals twelve poles">
            <div><strong>3</strong><span>questions</span></div>
            <b>×</b>
            <div><strong>2</strong><span>altitudes</span></div>
            <b>×</b>
            <div><strong>2</strong><span>evidence loci</span></div>
            <b>=</b>
            <div className="method-equation-result"><strong>12</strong><span>poles</span></div>
          </div>

          <div className="method-pole-groups">
            {ENTERPRISE_QUESTIONS.map(({ pair }) => (
              <article className="method-pole-group" key={pair}>
                <header>
                  <span>{pair}</span>
                  <p>{PAIR_QUESTION[pair]}</p>
                </header>
                {tensionsFor(pair).map((tension) => (
                  <div className="method-tension" key={tension.id}>
                    <div className="method-tension-meta">
                      <span>{tension.layer}</span>
                      <strong>{tension.name}</strong>
                    </div>
                    <div className="method-pole-pair">
                      <span>{tension.left}</span>
                      <i aria-hidden="true" />
                      <span>{tension.right}</span>
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section className="method-section method-divergence" id="divergence" aria-labelledby="divergence-title">
          <div className="method-section-head">
            <span>03 · Read the divergence</span>
            <h2 id="divergence-title">The disagreement is the signal.</h2>
            <p>
              A strong aggregate can coexist with a strained operating condition. Divergence keeps
              both visible. It shows where the system is producing value and where the capacity,
              control, or consequence supporting that value deserves its own measure.
            </p>
          </div>
          <div className="method-divergence-line" aria-label="Headline signal and operating signal assessed together">
            <article>
              <span>Headline signal</span>
              <strong>What appears to be working?</strong>
              <p>The aggregate result, adoption, speed, or return.</p>
            </article>
            <div aria-hidden="true"><span>read together</span></div>
            <article>
              <span>Operating signal</span>
              <strong>What makes that result sustainable?</strong>
              <p>The capacity, control, quality, and exception path underneath it.</p>
            </article>
          </div>
        </section>

        <section className="method-section" id="levels" aria-labelledby="levels-title">
          <div className="method-section-head">
            <span>04 · Locate the intervention</span>
            <h2 id="levels-title">Move at the level that owns the condition.</h2>
            <p>
              Divergence identifies what needs attention. L1–L5 identifies where the organization
              can govern it, from the original intent through the evidence of what occurred.
            </p>
          </div>
          <ol className="method-levels">
            {LEVELS.map(([level, name, question]) => (
              <li key={level}>
                <span>{level}</span>
                <strong>{name}</strong>
                <p>{question}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="method-section method-accountability" id="accountability" aria-labelledby="accountability-title">
          <div className="method-section-head">
            <span>05 · Return to accountability</span>
            <h2 id="accountability-title">Did we get what we said we wanted?</h2>
            <p>
              The method ends where the commitment began: with the declared objective. The next
              move is sized to the evidence, given a clearing condition, and revisited as the
              operating system changes.
            </p>
          </div>
          <div className="method-outcomes">
            <article><span>Verdict</span><strong>What can the evidence support now?</strong></article>
            <article><span>Operation</span><strong>What is the bounded next move?</strong></article>
            <article><span>Convergence</span><strong>Are we approaching the declared objective?</strong></article>
          </div>
          <div className="method-final-actions">
            <a href="/stratos-flow#case-study">Read the Klarna perspective <ArrowRight aria-hidden="true" /></a>
            <a href="/stratos">Open the full instrument</a>
          </div>
        </section>
      </main>
    </div>
  );
}
