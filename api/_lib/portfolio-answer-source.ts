import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';

const CANONICAL_QUESTION = 'What did Jeremy work on at Zocdoc?';

const ZOCDOC_QUESTION_TERMS = ['work', 'build', 'do', 'design system', 'accessibility', 'header'];

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function supportsPortfolioQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  return words.has('zocdoc') && ZOCDOC_QUESTION_TERMS.some((term) => (
    term.includes(' ') ? normalized.includes(term) : words.has(term)
  ));
}

export function supportsImpactQuestion(question: string): boolean {
  const words = new Set(normalizedQuestion(question).split(' '));
  const asksForRanking = words.has('most') || words.has('greatest') || words.has('biggest');
  const asksAboutImpact = words.has('impact') || words.has('impactful');
  const asksAboutWork = words.has('project') || words.has('projects') || words.has('work');
  return asksForRanking && asksAboutImpact && asksAboutWork;
}

function zocdocAnswerSet(): AnswerSetV2 {
  const fields: FieldInfoV2 = {
    priority: {
      primary: ['title', 'contribution'],
      secondary: ['outcome'],
      supporting: ['scope'],
      audit: ['evidenceTier', 'source'],
    },
  };

  return {
    schema: 'facia.answer-set/2',
    question: CANONICAL_QUESTION,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      {
        type: 'Value',
        payload: {
          title: 'Accessible design-system migration',
          contribution: 'Rebuilt and migrated assigned React components under a company-wide accessibility mandate.',
          outcome: 'Delivered reusable buttons, links, form inputs, and Header components for product-team adoption.',
          scope: 'Jeremy owned assigned components and participated in the initial audit; he did not lead the company-wide accessibility program.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Accessible design-system migration',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Header migration experiment',
          contribution: "Applied Zocdoc's existing A/B testing framework to the design-system team's first frontend-component experiment.",
          outcome: 'Supported a gradual test/control rollout across browsers and mobile.',
          scope: 'Jeremy applied the existing engineering-wide experimentation framework; he did not design that framework.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Header migration experiment',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Delivery workflow improvements',
          contribution: 'Built Jira dashboards, split initiatives into smaller tickets, and introduced a pull-request merge template.',
          outcome: 'Velocity increased by roughly 2–3 points per sprint, and average merge time fell by about one workday.',
          scope: 'These are delivery-process contributions, not a claim of formal people management.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Delivery workflow improvements',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.zocdoc-work.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.zocdoc-work' },
        { step: 'source.loaded', value: 'content/profile.md#career-history' },
        { step: 'answer.emitted', value: 3 },
      ],
    },
  };
}

function impactVerdictAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: 'Which of Jeremy’s projects had the most impact?',
    answerType: 'verdict',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      {
        type: 'Verdict',
        contract: 'BoundedVerdictV1',
        state: 'needs_criteria',
        finding: 'no_comparable_impact_measure',
        reason: 'The profile records different kinds of outcomes and does not define one comparable impact measure across projects and roles.',
        actual: {
          directlyAttributedOutcomes: [
            'Applied Software troubleshooting reduced by roughly 3–4 business days',
            'Zocdoc merge time reduced by about one workday',
            'Zocdoc delivery velocity increased by roughly 2–3 points per sprint',
          ],
          companyLevelOutcome: 'Aroko matched its full-year 2025 revenue of $135,000 in the first half of 2026',
        },
        evidence: {
          status: 'profile-grounded',
          sourceRefs: [
            'content/profile.md#what-he-is-doing-now',
            'content/profile.md#career-history',
            'content/profile.md#selected-projects',
          ],
        },
        payload: {
          answer: 'No single project can be named responsibly from the available evidence.',
          basis: 'The evidence mixes directly attributed delivery improvements, company-level outcomes, technical scope, and prototype maturity; those are not one comparable impact scale.',
          directlyAttributedEvidence: 'Applied Software has the largest directly attributed time reduction in the profile: trace logging reduced customer troubleshooting by roughly 3–4 business days. Zocdoc records a one-workday merge-time reduction and a roughly 2–3 point sprint-velocity increase.',
          companyOutcomeCaveat: 'Aroko’s $135,000 figure is the largest company-level number, but the source explicitly says it is a company result—not an outcome Jeremy alone caused—so it cannot support naming Aroko as his most impactful project.',
          missingCriterion: 'A defensible ranking needs a declared criterion such as operational time saved, user reach, revenue context, technical scope, or strategic importance.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md',
        },
        fields: {
          priority: {
            primary: ['answer', 'basis'],
            secondary: ['directlyAttributedEvidence'],
            supporting: ['companyOutcomeCaveat', 'missingCriterion'],
            audit: ['evidenceTier', 'source'],
          },
        },
      },
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.impact-ranking.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.impact-ranking' },
        { step: 'criterion.checked', value: 'missing' },
        { step: 'company-causality.checked', value: 'not_attributable_to_individual' },
        { step: 'verdict.emitted', value: 'needs_criteria' },
      ],
    },
  };
}

export function answerPortfolioQuestion(question: string): AnswerSetV2 | null {
  if (supportsImpactQuestion(question)) return impactVerdictAnswerSet();
  if (supportsPortfolioQuestion(question)) return zocdocAnswerSet();
  return null;
}
