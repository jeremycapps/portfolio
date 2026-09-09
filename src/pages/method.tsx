import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { LOCUS, PAIR_QUESTION, TENSIONS, type Tension } from '@/lib/stratos/ontology';
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

const ALTITUDES: readonly {
  layer: Tension['layer'];
  gloss: string;
  question: string;
}[] = [
  { layer: 'StratOps', gloss: 'Architecture', question: 'What machine are we building?' },
  { layer: 'BizOps', gloss: 'Mechanics', question: 'Where is the running machine succeeding or failing?' },
];

const LOCI: readonly {
  name: string;
  where: string;
  protects: string;
}[] = [
  { name: 'Internal condition', where: LOCUS.l.where, protects: LOCUS.l.protects },
  { name: 'External consequence', where: LOCUS.r.where, protects: LOCUS.r.protects },
];

const LEVELS = [
  ['L1', 'Strategy', 'What are we trying to accomplish?'],
  ['L2', 'Business case', 'What must be true before we commit?'],
  ['L3', 'Implementation', 'What must be true before we launch?'],
  ['L4', 'Operations', 'What must remain true while we run?'],
  ['L5', 'Audit', 'Did the claimed outcome occur?'],
] as const;

// Within each pair TENSIONS is ordered StratOps then BizOps, so this returns the
// two altitudes of one enterprise question in reading order.
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
            StratOS separates the question being asked, the level where the system operates, and the
            place where proof lives. Build it with me one question at a time—by the third step you
            will have assembled the whole model yourself, and know exactly what each part is for.
          </p>
          <div className="method-actions">
            <a href="#questions">Build the method <ArrowRight aria-hidden="true" /></a>
            <a href="/stratos-flow#case-study">See it applied to Klarna</a>
          </div>
        </header>

        <nav className="method-path" aria-label="Method sequence">
          <a href="#questions"><span>01</span> Question</a>
          <a href="#altitude"><span>02</span> Altitude</a>
          <a href="#locus"><span>03</span> Locus</a>
          <a href="#divergence"><span>04</span> Divergence</a>
          <a href="#levels"><span>05</span> Intervention</a>
        </nav>

        <section className="method-section" id="questions" aria-labelledby="questions-title">
          <div className="method-section-head">
            <span>01 · Start with the question</span>
            <h2 id="questions-title">Three questions define the decision.</h2>
            <p>What are we really asking? Every enterprise decision protects one of three conditions the organization needs to keep moving. Name which, and the rest of the method has somewhere to stand.</p>
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
          <p className="method-tally" aria-label="Running total: three questions">
            <b>3 questions</b>
            <span>the axis we will multiply</span>
          </p>
        </section>

        <section className="method-section" id="altitude" aria-labelledby="altitude-title">
          <div className="method-section-head">
            <span>02 · Add altitude</span>
            <h2 id="altitude-title">Ask each question at two altitudes.</h2>
            <p>At what level of the machine? Architecture is the machine you are building; mechanics is that machine as it runs. The same question answered at both keeps the design honest about delivery.</p>
          </div>

          <div className="method-poles-two">
            {ALTITUDES.map((altitude) => (
              <article key={altitude.layer}>
                <span>{altitude.layer}</span>
                <strong>{altitude.gloss}</strong>
                <p>{altitude.question}</p>
              </article>
            ))}
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
                    <p className="method-tension-q">{tension.question}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>

          <p className="method-tally" aria-label="Running total: three questions times two altitudes equals six tensions">
            <b>3 questions × 2 altitudes = 6 tensions</b>
            <span>each question, at architecture and at mechanics</span>
          </p>
        </section>

        <section className="method-section" id="locus" aria-labelledby="locus-title">
          <div className="method-section-head">
            <span>03 · Add locus</span>
            <h2 id="locus-title">Split each tension by where its proof lives.</h2>
            <p>Where does the proof live? One pole is proven by evidence inside the enterprise—the condition it needs in order to act. The other is proven at the boundary and beyond—the consequence it actually caused. Every tension now has two poles.</p>
          </div>

          <div className="method-poles-two">
            {LOCI.map((locus) => (
              <article key={locus.name}>
                <span>{locus.name}</span>
                <strong>{locus.where}</strong>
                <p>Protects {locus.protects}.</p>
              </article>
            ))}
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

          <p className="method-tally" aria-label="Running total: three questions times two altitudes times two loci equals twelve poles">
            <b>3 questions × 2 altitudes × 2 loci = 12 poles</b>
            <span>you built the model—now we can read it</span>
          </p>
        </section>

        <section className="method-section method-divergence" id="divergence" aria-labelledby="divergence-title">
          <div className="method-section-head">
            <span>04 · Read the divergence</span>
            <h2 id="divergence-title">The disagreement is the signal.</h2>
            <p>Where do the signals disagree? A strong aggregate can sit directly above a strained operating condition. Divergence keeps both poles visible—so a headline result cannot hide the capacity, control, or consequence it depends on. This is the Klarna move, generalized.</p>
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
            <span>05 · Locate the intervention</span>
            <h2 id="levels-title">Move at the level that owns the condition.</h2>
            <p>At what level do you intervene? Divergence identifies what needs attention. L1–L5 identifies where the organization can govern it, from the original intent through the evidence of what occurred.</p>
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
            <span>Return to accountability</span>
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
