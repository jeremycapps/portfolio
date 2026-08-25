import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import {
  LOCUS, PAIR_QUESTION, TENSIONS,
  counterweightOf, lensOf, ownerOf, poleName, proofOf,
  type PlacedSide, type PoleSide, type Tension,
} from '@/lib/stratos/ontology';
import { STRATOS_RECIPES } from '@/lib/stratos/recipes.generated';
import './stratos.css';

const DEAD_ZONE = 0.05;
const fmt = (n: number): string => (n < 0 ? '−' : '') + Math.abs(n).toFixed(2);
const poleSide = (p: number): PoleSide => (p <= -DEAD_ZONE ? 'l' : p >= DEAD_ZONE ? 'r' : 'neutral');

type Positions = Record<string, number>;
type Reveals = Record<string, { evidence: boolean; trace: boolean }>;

const recipeFor = (key: string, depth: DisclosureDepth): ComponentRecipe | undefined =>
  STRATOS_RECIPES[key]?.[depth];

// ---- the answer panel: renders whatever recipe the resolver produced ----

interface PanelProps {
  elId: string;
  recipe: ComponentRecipe;
  depth: DisclosureDepth;
  sideClass: '' | 'l' | 'r';
  reveal: { evidence: boolean; trace: boolean };
  live?: { position: number; pole: string; owner: string };
  onExpand: () => void;
  onToggleReveal: (which: 'evidence' | 'trace') => void;
}

function AnswerPanel({ elId, recipe, depth, sideClass, reveal, live, onExpand, onToggleReveal }: PanelProps) {
  const fields = recipe.visibleFields[0]?.fields ?? [];
  const controls = recipe.inspectionControls;
  const hasEvidence = controls.includes('view-evidence');
  const hasTrace = controls.includes('view-trace');

  const evidence = recipe.answer.items[0]?.evidence as { status?: string; sourceRefs?: string[] } | undefined;
  const trace = recipe.answer.trace as { id: string; entries: { step: string; value: unknown }[] } | undefined;
  const traceValue = (step: string, value: unknown): string => {
    if (!live) return String(value);
    if (step === 'position.declared') return fmt(live.position);
    if (step === 'pole.resolved') return live.pole;
    if (step === 'owner.resolved') return live.owner;
    return String(value);
  };

  return (
    <div
      className={`panel ${sideClass}`.trim()}
      data-depth={depth}
      data-pattern={recipe.pattern}
      data-el={elId}
      tabIndex={0}
      role="group"
      aria-label={`${recipe.answer.question} — ${depth}`}
    >
      <div className="panel-meta">
        <span className="chip pat">{recipe.pattern}</span>
        <span className="chip depth">{depth}</span>
        <span className="chip">density {recipe.density.density}</span>
      </div>

      {fields.length > 0 && (
        <dl className="flds">
          {fields.map((f) => (
            <div key={f.key} className="fld" data-p={f.effectivePriority} data-k={f.key}>
              <dt>{f.key.replace(/([A-Z])/g, ' $1')}</dt>
              <dd>
                {f.key === 'questions' ? (
                  <ul className="qs">
                    {String(f.value).split(' · ').map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                ) : String(f.value)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="affs">
        {controls.map((c) => {
          if (c === 'expand') {
            return (
              <button key={c} type="button" className="aff live" data-aff="expand"
                aria-pressed={depth === 'focus'}
                onClick={(e) => { e.stopPropagation(); onExpand(); }}>expand</button>
            );
          }
          if (c === 'view-evidence' || c === 'view-trace') {
            const which = c === 'view-evidence' ? 'evidence' : 'trace';
            return (
              <button key={c} type="button" className="aff live" data-aff={c}
                aria-pressed={reveal[which]}
                onClick={(e) => { e.stopPropagation(); onToggleReveal(which); }}>{c}</button>
            );
          }
          return <span key={c} className="aff">{c}</span>;
        })}
        {recipe.actionControls.map((a, i) => (
          <span key={`act-${i}`} className="aff act">{a.operation?.label ?? 'action'}</span>
        ))}
      </div>

      {hasEvidence && reveal.evidence && evidence && (
        <p className="reveal"><b>evidence</b> {evidence.status}<br />
          <b>sources</b> {(evidence.sourceRefs ?? []).join(' · ')}</p>
      )}
      {hasTrace && reveal.trace && trace && (
        <p className="reveal"><b>trace</b> {trace.id}<br />
          {trace.entries.map((e, i) => (
            <span key={i}>{e.step} = {traceValue(e.step, e.value)}{i < trace.entries.length - 1 ? <br /> : null}</span>
          ))}</p>
      )}
    </div>
  );
}

// ---- pole label with its definition popover ----

function Pole({ tension, side, open, onToggle }: {
  tension: Tension; side: PlacedSide; open: boolean; onToggle: () => void;
}) {
  const own = ownerOf(tension, side);
  const name = poleName(tension, side);
  const loc = LOCUS[side];
  return (
    <span className={`pole ${side}`}>
      <button type="button" className="pole-btn" aria-expanded={open}
        aria-label={`${name}, a ${own.fn} call — tap for what this pole requires`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}>
        <span className="pole-name">{side === 'l' ? '◀ ' : ''}{name}{side === 'r' ? ' ▶' : ''}</span>
      </button>
      <span className="pole-pop" role="tooltip">
        <b>{name}</b>
        <em>Owner</em>{own.fn}
        <em>Decisive proof</em>{proofOf(tension, side)}
        <em>Validation locus</em>{loc.where} — protects {loc.protects}
        <em>Lenses</em><span className="mono">{lensOf(tension, side)}</span>
      </span>
    </span>
  );
}

// ---- one tension: name, question, poles, the axis, the answer panel ----

function TensionRow({ tension, position, depth, focused, reveal, openPole,
  onDrag, onFocusToggle, onHover, onExpand, onToggleReveal, onPoleToggle }: {
  tension: Tension; position: number; depth: DisclosureDepth; focused: boolean;
  reveal: { evidence: boolean; trace: boolean }; openPole: PlacedSide | null;
  onDrag: (v: number) => void; onFocusToggle: () => void; onHover: (on: boolean) => void;
  onExpand: () => void; onToggleReveal: (which: 'evidence' | 'trace') => void;
  onPoleToggle: (side: PlacedSide) => void;
}) {
  const axisRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const side = poleSide(position);
  const pct = (position + 1) / 2 * 100;
  const key = `tension:${tension.id}:${side}`;
  const recipe = recipeFor(key, depth);
  const own = side !== 'neutral' ? ownerOf(tension, side) : null;

  const setFromClientX = useCallback((cx: number) => {
    const el = axisRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let v = (cx - r.left) / r.width * 2 - 1;
    v = Math.max(-1, Math.min(1, v));
    if (Math.abs(v) < 0.04) v = 0;
    onDrag(Math.round(v * 100) / 100);
  }, [onDrag]);

  const sideClass = (side === 'neutral' ? '' : side) as '' | 'l' | 'r';

  return (
    <div className="tension" data-dim={focused ? '0' : '1'} data-tid={tension.id}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover(false); }}>
      <div className="t-name">{tension.name}</div>
      <p className="t-q">{tension.question}</p>
      <div className="poles">
        <Pole tension={tension} side="l" open={openPole === 'l'} onToggle={() => onPoleToggle('l')} />
        <Pole tension={tension} side="r" open={openPole === 'r'} onToggle={() => onPoleToggle('r')} />
      </div>
      <div ref={axisRef} className="axis" tabIndex={0} role="slider"
        aria-valuemin={-1} aria-valuemax={1} aria-valuenow={position}
        aria-label={`${tension.name}: ${tension.left} to ${tension.right}`}
        aria-valuetext={own ? `${position.toFixed(2)} toward ${poleName(tension, side as PlacedSide)}, a ${own.fn} call` : 'no position taken'}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; setFromClientX(e.clientX); e.preventDefault(); }}
        onPointerMove={(e) => { if (dragging.current) setFromClientX(e.clientX); }}
        onPointerUp={(e) => { dragging.current = false; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ } }}
        onPointerCancel={() => { dragging.current = false; }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.10 : 0.02; let v = position;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
          else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
          else if (e.key === 'Home') v = -1; else if (e.key === 'End') v = 1;
          else if (e.key === '0' || e.key === 'Escape') v = 0; else return;
          e.preventDefault(); onDrag(Math.round(Math.max(-1, Math.min(1, v)) * 100) / 100);
        }}>
        <div className={`fill ${sideClass}`.trim()} style={side === 'l' ? { left: `${pct}%`, width: `${50 - pct}%` } : side === 'r' ? { left: '50%', width: `${pct - 50}%` } : { width: 0 }} />
        <div className="grid">{[0, 25, 50, 75, 100].map((p) => <i key={p} style={{ left: `${p}%` }} />)}</div>
        <span className="fn l">{ownerOf(tension, 'l').fn}</span>
        <span className="fn r">{ownerOf(tension, 'r').fn}</span>
        <div className="zero" />
        <div className={`tick ${sideClass}`.trim()} style={{ left: `${pct}%` }} />
        <div className={`knob ${sideClass || 'empty'}`.trim()} style={{ left: `${pct}%` }}><span>{fmt(position)}</span></div>
        <div className="hint" style={{ opacity: side === 'neutral' ? 1 : 0 }}>drag to place</div>
      </div>

      {recipe && (
        <div onClick={onFocusToggle}>
          <AnswerPanel elId={tension.id} recipe={recipe} depth={depth} sideClass={sideClass}
            reveal={reveal}
            live={own ? { position, pole: poleName(tension, side as PlacedSide), owner: own.fn } : undefined}
            onExpand={onExpand} onToggleReveal={onToggleReveal} />
        </div>
      )}
    </div>
  );
}

// ---- the page ----

export default function StratosPage() {
  const [positions, setPositions] = useState<Positions>(() =>
    Object.fromEntries(TENSIONS.map((t) => [t.id, 0])));
  const [focused, setFocused] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  const [reveals, setReveals] = useState<Reveals>({});
  const [openPole, setOpenPole] = useState<string | null>(null); // `${tid}:${side}`

  const depthFor = useCallback((id: string): DisclosureDepth => {
    if (auditMode) return 'audit';
    if (focused === id) return 'focus';
    if (focused !== null) return 'glance';
    if (hovered === id) return 'inspect';
    return 'glance';
  }, [auditMode, focused, hovered]);

  const revealOf = (id: string) => reveals[id] ?? { evidence: false, trace: false };
  const toggleReveal = (id: string, which: 'evidence' | 'trace') =>
    setReveals((r) => ({ ...r, [id]: { ...revealOf(id), [which]: !revealOf(id)[which] } }));
  const toggleFocus = (id: string) => setFocused((f) => (f === id ? null : id));

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('.pole')) setOpenPole(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (openPole) setOpenPole(null); else setFocused(null); }
    };
    document.addEventListener('click', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDown); document.removeEventListener('keydown', onKey); };
  }, [openPole]);

  const placements = useMemo(
    () => TENSIONS.map((t) => ({ t, p: positions[t.id], side: poleSide(positions[t.id]) }))
      .filter((x) => x.side !== 'neutral') as { t: Tension; p: number; side: PlacedSide }[],
    [positions],
  );

  const { commitment, spread } = useMemo(() => {
    const vals = TENSIONS.map((t) => positions[t.id]);
    const mass = vals.reduce((a, v) => a + Math.abs(v), 0);
    let H = 0;
    if (mass > 1e-9) vals.forEach((v) => { const q = Math.abs(v) / mass; if (q > 0) H -= q * Math.log(q); });
    return { commitment: mass / 6, spread: mass > 1e-9 ? H / Math.log(6) : null };
  }, [positions]);

  const verdictRecipe = commitment < 0.20 ? recipeFor('verdict', auditMode ? 'audit' : 'glance') : undefined;

  return (
    <div className="stratos" data-focused={focused !== null ? '' : undefined}>
      <div className="wrap">
        <p className="eyebrow">StratOS v5.1 · rendered by facia.answer-set/2</p>
        <h1>Place your firm.</h1>
        <p className="lede">
          Drag each axis to set a position — you hold the interior knowledge. Each answer carries its own
          depth: it rests at <em>glance</em>, opens to <em>inspect</em> on hover, and to <em>focus</em> when
          you click it. Every panel is a recipe the Facia resolver produced; nothing here is generated on the fly.
        </p>
        <a className="back" href="/">← back to the portfolio</a>

        <div className="bar">
          <span className="lbl">Provenance<b>audit depth adds view-evidence and view-trace, where the answer has them</b></span>
          <button type="button" className="audit-btn" aria-pressed={auditMode}
            onClick={() => setAuditMode((a) => !a)}>Audit</button>
        </div>

        {verdictRecipe && (
          <div className="badge-wrap">
            <span className="p">{verdictRecipe.pattern} · {verdictRecipe.patternReasonCode}</span>
            {verdictRecipe.visibleFields[0]?.fields.map((f) => (
              <span key={f.key} className={f.effectivePriority === 'primary' ? 's' : 'w'}>{String(f.value)}</span>
            ))}
          </div>
        )}

        <div className="tiles">
          <div className="tile"><h3>Commitment</h3><div className="val">{commitment.toFixed(2)}</div>
            <p className="note">{commitment < 0.20 ? 'Below 0.20 — see the verdict above.' : 'How far from neutral the firm sits. Every tension counts one sixth.'}</p></div>
          <div className="tile"><h3>Spread</h3><div className="val">{spread === null ? '—' : spread.toFixed(2)}</div>
            <p className="note">{spread === null ? 'No commitment mass to distribute.' : spread < 0.75 ? 'Concentrated — a few real bets.' : 'Thin — commitment spread across all six.'}</p></div>
        </div>

        {(['Economics', 'Commitment', 'Renewal'] as const).map((pair) => (
          <section className="pair" key={pair}>
            <div className="pair-head"><h2>{pair}</h2><span className="q">{PAIR_QUESTION[pair]}</span></div>
            {TENSIONS.filter((t) => t.pair === pair).map((t) => (
              <TensionRow key={t.id} tension={t} position={positions[t.id]} depth={depthFor(t.id)}
                focused={focused === t.id} reveal={revealOf(t.id)}
                openPole={openPole?.startsWith(`${t.id}:`) ? (openPole.split(':')[1] as PlacedSide) : null}
                onDrag={(v) => setPositions((s) => ({ ...s, [t.id]: v }))}
                onFocusToggle={() => toggleFocus(t.id)}
                onHover={(on) => setHovered(on ? t.id : null)}
                onExpand={() => toggleFocus(t.id)}
                onToggleReveal={(which) => toggleReveal(t.id, which)}
                onPoleToggle={(sd) => setOpenPole((o) => (o === `${t.id}:${sd}` ? null : `${t.id}:${sd}`))} />
            ))}
            <LayerBalance pair={pair} positions={positions} />
          </section>
        ))}

        <Agenda placements={placements} depthFor={depthFor} revealOf={revealOf}
          toggleReveal={toggleReveal} toggleFocus={toggleFocus} setHovered={setHovered} />

        <section className="contract">
          <h2>Claims this instrument does not make</h2>
          <p className="sub">Stated by the model itself, not discovered by a reviewer.</p>
          <ul>
            <li>That the model objectively measures strategy</li>
            <li>That a position or a commitment can pass or fail a firm</li>
            <li>That neutral is failure, or that either pole is the better place to stand</li>
            <li>That any verdict is rendered on a firm — no gates, no floors, no RPE are computed here</li>
            <li>That it knows how well you know. Confidence is not asked for, so no interval is drawn</li>
          </ul>
          <p className="foot">
            <b>Depth is per element, and it comes from the resolver.</b> Each placement is a facia.answer-set/2
            document resolved at build time by the real resolver; the browser only looks the recipe up. The
            pattern comes from the decision manifest; which fields appear comes from declared field priority;
            the affordances are recipe.inspectionControls — glance offers only inspect, inspect adds expand,
            focus adds filter and sort to collections, and audit adds view-evidence and view-trace only where
            that answer carries them.<br />
            <b>Target-based Coherence</b> was removed in v4.1: scoring the distance to a target the audit
            invented graded our own guesswork.<br />
            Ontology from <b>_metadata/Tension_Model.md</b> and <b>_metadata/Ownership_Model.md</b>; mandates
            and boardroom questions quoted from <b>StratOS_v5_CSuite_Micro_Reports.docx</b>.
          </p>
        </section>
      </div>
    </div>
  );
}

function LayerBalance({ pair, positions }: { pair: Tension['pair']; positions: Positions }) {
  const [a, b] = TENSIONS.filter((t) => t.pair === pair);
  const strat = a.layer === 'StratOps' ? a : b;
  const ops = a.layer === 'StratOps' ? b : a;
  const d = Math.abs(positions[strat.id]) - Math.abs(positions[ops.id]);
  if (Math.abs(d) <= 0.25) {
    return <div className="balance quiet">Layer balance <span className="d">Δ {fmt(d)}</span> — within ±0.25, not reported.</div>;
  }
  const neutral = d > 0 ? ops : strat;
  return (
    <div className="balance">Layer balance <span className="d">Δ {fmt(d)}</span> — commitment sits on the{' '}
      <b>{d > 0 ? 'strategic' : 'operational'}</b> side of {pair}.{' '}
      <b>{ownerOf(neutral, 'l').fn}</b> and <b>{ownerOf(neutral, 'r').fn}</b> are accountable for explaining why {neutral.name} carries no matching position.</div>
  );
}

function Agenda({ placements, depthFor, revealOf, toggleReveal, toggleFocus, setHovered }: {
  placements: { t: Tension; p: number; side: PlacedSide }[];
  depthFor: (id: string) => DisclosureDepth;
  revealOf: (id: string) => { evidence: boolean; trace: boolean };
  toggleReveal: (id: string, which: 'evidence' | 'trace') => void;
  toggleFocus: (id: string) => void;
  setHovered: (id: string | null) => void;
}) {
  if (placements.length === 0) {
    return (
      <section className="agenda">
        <h2>Board agenda</h2>
        <p className="sub">Compiled from the positions you take.</p>
        <p className="agenda-empty">Nothing yet — place a position and the function that owns it is carried here.</p>
      </section>
    );
  }
  return (
    <section className="agenda">
      <h2>Board agenda</h2>
      <p className="sub">{placements.length} function{placements.length === 1 ? '' : 's'} carried here by the
        positions you took — each one its own answer, at its own depth.</p>
      <div className="officers">
        {placements.map(({ t, p, side }) => {
          const elId = `officer:${t.id}`;
          const depth = depthFor(elId);
          const recipe = recipeFor(`officer:${t.id}:${side}`, depth);
          if (!recipe) return null;
          const own = ownerOf(t, side);
          return (
            <div key={t.id} onClick={() => toggleFocus(elId)}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(elId); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(null); }}>
              <AnswerPanel elId={elId} recipe={recipe} depth={depth}
                sideClass={side} reveal={revealOf(elId)}
                live={{ position: p, pole: poleName(t, side), owner: own.fn }}
                onExpand={() => toggleFocus(elId)}
                onToggleReveal={(which) => toggleReveal(elId, which)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
