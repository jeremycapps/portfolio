// Builders that turn an ontology placement into a facia.answer-set/2 document.
//
// The `@facia/core` import here is a type-only import and the authoring
// constructors come from `@facia/core/authoring`, which imports types only.
// Neither pulls the Facia resolver or its ajv validator into any bundle. The
// build-time generator runs the real resolver in Node.

import {
  directTrace, fields, operationAnswerSet, valueAnswerSet, verdictAnswerSet,
} from '@facia/core/authoring';
import type { AnswerSetV2, DirectTraceV2, JsonObject } from '@facia/core';
import {
  CSUITE_SOURCE, ONTOLOGY_SOURCES, ownerOf, poleName,
  type PlacedSide, type PoleSide, type Tension,
} from './ontology';

// A sign carrier, not a position. Only the sign of the placement reaches
// resolution, so recipes are generated per side and the live value never needs
// to enter the answer. The number on the knob is UI state and stays there.
const repr = (side: PoleSide): number => (side === 'l' ? -0.5 : side === 'r' ? 0.5 : 0);

function tensionEvidence(t: Tension): JsonObject {
  const lensRefs = `${t.lensLeft} ◀ · ▶ ${t.lensRight}`
    .split(' · ').map((x) => x.split(' ')[0]);
  return { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, ...lensRefs] };
}

// Provenance records what determined the answer. The declared position is not a
// determinant — only its sign is — so it is not a trace entry.
function tensionTrace(t: Tension, side: PoleSide): DirectTraceV2 {
  return directTrace(`stratos.place.${t.id}`, [
    { step: 'pole.resolved', value: side === 'neutral' ? 'none — inside the ±0.05 dead zone' : poleName(t, side) },
    { step: 'owner.resolved', value: side === 'neutral' ? 'unresolved — both advocates stand' : ownerOf(t, side).fn },
  ]);
}

/** A placement on one tension. Neutral = an operation with nothing to act on;
 *  a real placement surfaces the selected pole and its recommendation. The
 *  owner's full mandate is reserved for the board-agenda answer. */
export function buildTensionAnswerSet(t: Tension, side: PoleSide): AnswerSetV2 {
  const evidence = tensionEvidence(t);
  const trace = tensionTrace(t, side);

  if (side === 'neutral') {
    return operationAnswerSet({
      question: t.question,
      path: 'meaning', inspection: 'available', actionable: false,
      items: [{
        type: 'Operation',
        payload: { status: 'no position taken' },
        operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
        input: 0, output: 'no position taken', evidence,
        fields: fields({ primary: ['status'] }),
      }],
      operations: [], trace,
    });
  }

  const own = ownerOf(t, side);
  const pole = poleName(t, side);
  return operationAnswerSet({
    question: t.question,
    path: 'meaning', inspection: 'available', actionable: true,
    items: [{
      type: 'Operation',
      payload: { pole, growthLens: own.lens },
      operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
      input: repr(side), output: pole, evidence,
      fields: fields({ primary: ['pole'], secondary: ['growthLens'] }),
    }],
    operations: [{
      id: `stratos.agenda.${t.id}`,
      label: 'Carried to the board agenda',
      invocation: 'host-callback',
      reference: 'agenda.add',
    }],
    trace,
  });
}

/** One officer on the board agenda — its own answer, at its own depth. The
 *  function is the one thing this answer asserts, so it is the single primary
 *  field; the reason, mandate, and questions elaborate it in that order. */
export function buildOfficerAnswerSet(t: Tension, side: PlacedSide): AnswerSetV2 {
  const own = ownerOf(t, side);
  return valueAnswerSet({
    question: `What must ${own.fn} answer?`,
    path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Value',
      payload: {
        function: own.fn,
        because: `${t.name} · ${poleName(t, side)}`,
        mandate: own.mandate,
        questions: [...own.questions],
      },
      value: own.fn,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, CSUITE_SOURCE] },
      fields: fields({
        primary: ['function'],
        secondary: ['because'],
        supporting: ['mandate', 'questions'],
      }),
    }],
    operations: [],
    trace: directTrace(`stratos.agenda.${t.id}`, [
      { step: 'pole.resolved', value: poleName(t, side) },
      { step: 'owner.resolved', value: own.fn },
      { step: 'questions.compiled', value: own.questions.length },
    ]),
  });
}

/** The aggregate verdict shown when Commitment falls below 0.20. */
export function buildVerdictAnswerSet(): AnswerSetV2 {
  return verdictAnswerSet({
    question: 'Has the company declared a material position?',
    path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Verdict', contract: 'BoundedVerdictV1',
      payload: {
        state: 'no material position declared',
        threshold: 'Commitment Index is below 0.20',
        owner: 'Executive, with Board oversight',
      },
      state: 'no material position declared', conforms: false,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES] },
      fields: fields({
        primary: ['state'],
        secondary: ['threshold'],
        supporting: ['owner'],
      }),
    }],
    operations: [],
  });
}
