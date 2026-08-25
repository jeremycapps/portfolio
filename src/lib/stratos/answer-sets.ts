// Builders that turn an ontology placement into a facia.answer-set/2 document.
//
// The `@facia/core` import here is type-only, so this module never pulls the
// Facia runtime (or its ajv validator) into any bundle. It is consumed only by
// the build-time generator, which runs the real resolver in Node.

import type { AnswerSetV2 } from '@facia/core';
import {
  CSUITE_SOURCE, ONTOLOGY_SOURCES, ownerOf, poleName,
  type PlacedSide, type PoleSide, type Tension,
} from './ontology';

// Representative position for a side; the live value is injected client-side
// into the displayed trace. Only the sign matters to resolution.
const repr = (side: PoleSide): number => (side === 'l' ? -0.5 : side === 'r' ? 0.5 : 0);
const fmt = (n: number): string => (n < 0 ? '−' : '') + Math.abs(n).toFixed(2);

function tensionEvidence(t: Tension) {
  const lensRefs = `${t.lensLeft} ◀ · ▶ ${t.lensRight}`
    .split(' · ').map((x) => x.split(' ')[0]);
  return { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, ...lensRefs] };
}

function tensionTrace(t: Tension, side: PoleSide) {
  const p = repr(side);
  return {
    kind: 'direct' as const,
    id: `stratos.place.${t.id}`,
    entries: [
      { step: 'position.declared', value: Number(p.toFixed(2)) },
      { step: 'pole.resolved', value: side === 'neutral' ? 'none — inside the ±0.05 dead zone' : poleName(t, side) },
      { step: 'owner.resolved', value: side === 'neutral' ? 'unresolved — both advocates stand' : ownerOf(t, side).fn },
    ],
  };
}

/** A placement on one tension. Neutral = an operation with nothing to act on;
 *  a real placement = an actionable operation carrying its owner's mandate. */
export function buildTensionAnswerSet(t: Tension, side: PoleSide): AnswerSetV2 {
  const evidence = tensionEvidence(t);
  const trace = tensionTrace(t, side);

  if (side === 'neutral') {
    return {
      schema: 'facia.answer-set/2', question: t.question, answerType: 'operation',
      path: 'meaning', inspection: 'available', actionable: false,
      items: [{
        type: 'Operation',
        payload: { status: 'no position taken' },
        operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
        input: 0, output: 'no position taken', evidence,
        fields: { priority: { primary: ['status'], secondary: [], supporting: [], audit: [] } },
      }],
      operations: [], trace,
    } as unknown as AnswerSetV2;
  }

  const own = ownerOf(t, side);
  return {
    schema: 'facia.answer-set/2', question: t.question, answerType: 'operation',
    path: 'meaning', inspection: 'available', actionable: true,
    items: [{
      type: 'Operation',
      payload: { mandate: own.mandate, growthLens: own.lens },
      operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
      input: repr(side), output: poleName(t, side), evidence,
      fields: { priority: { primary: ['mandate'], secondary: ['growthLens'], supporting: [], audit: [] } },
    }],
    operations: [{ id: `stratos.agenda.${t.id}`, label: 'Carried to the board agenda', invocation: 'host-callback', reference: 'agenda.add' }],
    trace,
  } as unknown as AnswerSetV2;
}

/** One officer on the board agenda — its own answer, at its own depth. A single
 *  primary field keeps density at 1, so it resolves to `stat` then `detail`. */
export function buildOfficerAnswerSet(t: Tension, side: PlacedSide): AnswerSetV2 {
  const own = ownerOf(t, side);
  const p = repr(side);
  return {
    schema: 'facia.answer-set/2',
    question: `What must ${own.fn} answer?`,
    answerType: 'value', path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Value',
      payload: {
        function: own.fn,
        because: `${t.name} ${fmt(p)} · ${poleName(t, side)}`,
        mandate: own.mandate,
        questions: own.questions.join(' · '),
      },
      value: own.fn,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, CSUITE_SOURCE] },
      fields: { priority: { primary: ['function'], secondary: ['because'], supporting: ['mandate', 'questions'], audit: [] } },
    }],
    operations: [],
    trace: {
      kind: 'direct', id: `stratos.agenda.${t.id}`,
      entries: [
        { step: 'position.declared', value: Number(p.toFixed(2)) },
        { step: 'pole.resolved', value: poleName(t, side) },
        { step: 'owner.resolved', value: own.fn },
        { step: 'questions.compiled', value: own.questions.length },
      ],
    },
  } as unknown as AnswerSetV2;
}

/** The aggregate verdict shown when Commitment falls below 0.20. */
export function buildVerdictAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: 'Has the firm declared a material position?',
    answerType: 'verdict', path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Verdict', contract: 'BoundedVerdictV1',
      payload: {
        state: 'no material position declared',
        threshold: 'Commitment Index is below 0.20',
        owner: 'Executive, with Board oversight',
      },
      state: 'no material position declared', conforms: false,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES] },
      fields: { priority: { primary: ['state'], secondary: ['threshold'], supporting: ['owner'], audit: [] } },
    }],
    operations: [],
  } as unknown as AnswerSetV2;
}
