// Deterministic "what is Jeremy working on now" card, built from the live GitHub
// activity feed (github-activity.ts) rather than hand-authored prose. It is the shaped
// read surface for a load-bearing question: repos he is actively pushing to, most-recent
// first, each with his curated significance. When there is no feed yet it returns null,
// and the caller falls through to the grounded prose path.
import type { AnswerSetV2, FieldInfoV2, ValueAnswerV2 } from '@facia/core';
import { describeActivity, type GithubActivityDocument, type GithubRepoActivity } from './github-activity';

const CURRENT_WORK_PHRASES = [
  'working on',
  'work on now',
  'what is he building',
  "what's he building",
  'building right now',
  'current project',
  'current projects',
  'recent project',
  'recent projects',
  'recent work',
  'these days',
  'up to lately',
  'up to these',
  'up to right now',
  'shipping',
];
const CURRENT_WORK_WORDS = ['github', 'repos', 'repositories', 'commits'];

function normalize(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function supportsCurrentWorkQuestion(question: string): boolean {
  const normalized = normalize(question);
  const words = new Set(normalized.split(' '));
  // "at aroko" is the operations role, not GitHub activity — let that card own it.
  if (words.has('aroko')) return false;
  if (CURRENT_WORK_PHRASES.some((phrase) => normalized.includes(phrase))) return true;
  return CURRENT_WORK_WORDS.some((word) => words.has(word));
}

function repoFields(withSignificance: boolean): FieldInfoV2 {
  return {
    priority: {
      primary: withSignificance ? ['repo', 'significance'] : ['repo'],
      secondary: ['lastActive'],
      supporting: ['latest'],
      audit: ['url'],
    },
  };
}

function repoItem(repo: GithubRepoActivity): ValueAnswerV2 {
  const url = `https://github.com/${repo.repo}`;
  const withSignificance = typeof repo.framing === 'string';
  // A titled PR says more about the work than a later push, so it leads when present.
  const headline = repo.activity.find((item) => item.kind === 'pull_request' && item.title) ?? repo.activity[0];
  return {
    type: 'Value' as const,
    payload: {
      repo: repo.repo,
      ...(withSignificance ? { significance: repo.framing as string } : {}),
      lastActive: repo.lastActive.slice(0, 10),
      latest: headline ? describeActivity(headline) : 'recent activity',
      url,
    },
    value: repo.repo,
    evidence: {
      status: 'github-activity',
      sourceRefs: [url],
    },
    fields: repoFields(withSignificance),
  };
}

/**
 * Build the current-work card from the feed, newest repo first. Returns null when the
 * feed is missing or empty so the caller falls through to grounded prose.
 */
export function currentWorkAnswerSet(doc: GithubActivityDocument | null): AnswerSetV2 | null {
  if (!doc || doc.items.length === 0) return null;
  const items = doc.items.map(repoItem) as [ValueAnswerV2, ...ValueAnswerV2[]];
  const set: AnswerSetV2 = {
    schema: 'facia.answer-set/2',
    question: 'What is Jeremy working on now?',
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items,
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.current-work.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.current-work' },
        { step: 'source.loaded', value: `github-activity.json @ ${doc.generated_at}` },
        { step: 'answer.emitted', value: doc.items.length },
      ],
    },
  };
  // A singular answer set may not declare structure; only a multi-repo feed is a sequence.
  if (items.length > 1) {
    set.structure = 'sequence';
    set.sequenceKind = 'temporal';
  }
  return set;
}
