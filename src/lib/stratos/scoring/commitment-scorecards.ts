import { ADOBE_CREATIVE_CLOUD, DOMINOS_2025_GROWTH, FORD_MODEL_E, TARGET_CANADA } from '../cases';
import type { SystemId } from '../cases/profile';
import { defineCaseScorecard } from './scorecard';
import type {
  CapacityPlacement,
  CommitmentReviewInput,
  GoalStrainInput,
  NumericRange,
  OrganizationPositionInput,
  RiskFloorInput,
  TensionPositionInput,
} from './rubric';

const SCORED_AT = '2026-08-31';

function deskPosition(
  position: number,
  confidence: number,
  rationale: string,
  metricName: string,
  sourceRefs: readonly string[],
): TensionPositionInput {
  return { position, rationale, metricName, sourceRefs, evidence: { track: 'desk', confidence } };
}

function transferability(
  portableShare: NumericRange,
  confidence: number,
  rationale: string,
  sourceRefs: readonly string[],
) {
  return { portableShare, confidence, rationale, sourceRefs };
}

function strain(
  tension: SystemId,
  companyPosition: number,
  goalPull: number,
  importance: number,
  contextChange: boolean,
  rationale: string,
  sourceRefs: readonly string[],
  portableShare: NumericRange,
  transferabilityConfidence: number,
  transferabilityRationale: string,
): GoalStrainInput {
  return {
    tension,
    companyPosition,
    goalPull,
    importance,
    contextChange,
    rationale,
    sourceLens: 'Commitment wording, initiatives, timing, and pre-outcome operating evidence.',
    sourceRefs,
    transferability: transferability(
      portableShare,
      transferabilityConfidence,
      transferabilityRationale,
      sourceRefs,
    ),
  };
}

function unknownPlacement(reason: string): CapacityPlacement {
  return { kind: 'indeterminate', reason };
}

function unknownFloors(sourceRef: string, caseSpecificRisk: string): readonly RiskFloorInput[] {
  return [
    {
      id: 'liquidity',
      status: 'unknown',
      rationale: 'The public packet does not state the liquidity floor or the maximum funded exposure for this commitment.',
      sourceRefs: [sourceRef],
    },
    {
      id: 'stakeholder-legitimacy',
      status: 'unknown',
      rationale: 'The public packet does not define the stakeholder acceptance threshold that would pause or stop the commitment.',
      sourceRefs: [sourceRef],
    },
    {
      id: 'change-readiness',
      status: 'unknown',
      rationale: 'The public packet does not quantify critical-role coverage, training capacity, or adoption readiness.',
      sourceRefs: [sourceRef],
    },
    {
      id: 'delivery-governance',
      status: 'unknown',
      rationale: caseSpecificRisk,
      sourceRefs: [sourceRef],
    },
  ];
}

function fogReview(
  valueSourceRef: string,
  valueRationale: string,
  peopleReason: string,
  timeReason: string,
  financeReason: string,
  deliveryRisk: string,
): CommitmentReviewInput {
  return {
    accessTier: 'desk',
    value: 'worth-pursuing',
    valueRationale,
    valueSourceRefs: [valueSourceRef],
    riskFloors: unknownFloors(valueSourceRef, deliveryRisk),
    placements: {
      people: unknownPlacement(peopleReason),
      time: unknownPlacement(timeReason),
      finance: unknownPlacement(financeReason),
    },
  };
}

const targetPosition: OrganizationPositionInput = {
  posture: 'incumbent',
  tensions: {
    advantage: deskPosition(-0.7, 0.5, 'Tempo characterizes Target as relying primarily on a controlled retail value chain.', 'External Value Creation Share', ['tempo:CommitmentReview/profiles/target-2011']),
    resource: deskPosition(0.2, 0.25, 'The baseline leans slightly toward capital return, but the Canada packet does not place workforce buffer or return capacity.', 'Extraction Balance', ['tempo:CommitmentReview/profiles/target-2011']),
    discernment: deskPosition(-0.6, 0.5, 'The baseline favors structured conviction and a clear answer over prolonged open inquiry.', 'Discovery Before Commitment Rate', ['tempo:CommitmentReview/profiles/target-2011']),
    execution: deskPosition(-0.4, 0.25, 'The baseline shows meaningful assurance and risk friction before release.', 'Delivery Assurance Balance', ['tempo:CommitmentReview/profiles/target-2011']),
    invention: deskPosition(-0.6, 0.5, 'The baseline renewal model emphasizes codified retail fluency more than a category-new offer.', 'Renewal Balance', ['tempo:CommitmentReview/profiles/target-2011']),
    operations: deskPosition(0.4, 0.5, 'The baseline leans toward systems and flow, although portability into Canada is unproven.', 'Systematisation Balance', ['tempo:CommitmentReview/profiles/target-2011']),
  },
};

const targetRef = ['planned-stores-2013'] as const;
const targetStrains: Record<SystemId, GoalStrainInput> = {
  advantage: strain('advantage', -0.7, -0.5, 0.75, true, 'A branded, controlled store network places the goal on the controlled-value-chain pole.', targetRef, { low: 0.25, high: 0.5 }, 0.25, 'The brand and merchandising system may travel, but Canadian customer value and unit economics were not evidenced.'),
  resource: strain('resource', 0.2, 0.5, 0.75, true, 'The national rollout requires large capital deployment that must ultimately earn a return.', targetRef, { low: 0.25, high: 0.5 }, 0.25, 'Neither the investment envelope nor workforce and loss buffers were disclosed.'),
  discernment: strain('discernment', -0.6, -0.75, 0.75, true, 'A fixed 125-store endpoint within one year reflects strong structured conviction.', targetRef, { low: 0.5, high: 0.75 }, 0.25, 'Decision routines may transfer, but no test-market or disconfirming-evidence process is visible.'),
  execution: strain('execution', -0.4, 0.75, 1, true, 'The commitment pulls sharply toward release at national scale despite undisclosed gates.', targetRef, { low: 0.25, high: 0.5 }, 0.25, 'Release experience exists, but Canadian assurance, rollback, and pilot capacity were not evidenced.'),
  invention: strain('invention', -0.6, -0.5, 0.5, true, 'The commitment appears to transplant codified retail fluency rather than establish a novel Canadian proposition.', targetRef, { low: 0.25, high: 0.5 }, 0.25, 'Codified U.S. practices may travel only partially when assortment and customer expectations change.'),
  operations: strain('operations', 0.4, 0.75, 1, true, 'Opening 125 stores requires a functioning end-to-end Canadian flow system, not opening effort alone.', targetRef, { low: 0, high: 0.25 }, 0.25, 'U.S. systems do not establish Canadian distribution, inventory data, vendors, or trained operating routines.'),
};

export const TARGET_CANADA_COMMITMENT_SCORECARD = defineCaseScorecard({
  id: 'target-canada-commitment-2012-v0.2',
  profile: TARGET_CANADA,
  snapshotId: 'commitment-2012-07-12',
  scoredAt: SCORED_AT,
  position: targetPosition,
  strains: targetStrains,
  commitmentReview: fogReview(
    'planned-stores-2013',
    'A Canadian growth option could create strategic value, conditional on customer and unit-economic proof.',
    'The packet contains no critical-role counts, hiring throughput, training load, or management buffer.',
    'The 2013 deadline is observed, but internal milestone slack and minimum readiness lead times are not placeable.',
    'The packet contains no investment envelope, existing commitments, working-capital requirement, or loss tolerance.',
    'The packet does not disclose pilot gates, rollback conditions, readiness thresholds, or maximum irreversible exposure.',
  ),
  findings: [
    'The largest strains are release and Canadian operating-system instantiation, both routing directly to time and risk or finance.',
    'The commitment is directionally coherent with Target’s controlled retail model, but coherence does not prove portability.',
    'The public commitment cannot distinguish an absorbable rollout from a collision because all three reserve models remain unplaced.',
  ],
  informationPurchase: [
    'Obtain the store-wave critical path and readiness gates for distribution, inventory data, vendors, and workforce.',
    'Place authorized capital, expected operating losses, working capital, and the board’s maximum exposure.',
    'Run a smaller pilot wave with explicit pause and rollback criteria before national-scale lease and inventory commitments.',
  ],
});

export const TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD = defineCaseScorecard({
  id: 'target-canada-outcome-retrodiction-2015-v0.2',
  profile: TARGET_CANADA,
  snapshotId: 'outcome-2015-02-25',
  scoredAt: SCORED_AT,
  mode: 'outcome-calibrated-retrodiction',
  position: targetPosition,
  strains: targetStrains,
  commitmentReview: {
    accessTier: 'desk',
    value: 'worth-pursuing',
    valueRationale: 'Canadian market entry had a plausible strategic value case; the retrodiction tests whether the committed scale and sequence were absorbable.',
    valueSourceRefs: ['planned-stores-2013'],
    riskFloors: [
      {
        id: 'liquidity',
        status: 'pass',
        rationale: 'The parent recognized the $5.105 billion exit exposure and continued as an operating company; liquidity was not the fatal boundary in this case.',
        sourceRefs: ['exit-charge-2014'],
      },
      {
        id: 'legal-operability',
        status: 'pass',
        rationale: 'Target reached a 133-store operating footprint; the case does not show a legal or regulatory prohibition preventing operation.',
        sourceRefs: ['stores-at-exit'],
      },
    ],
    placements: {
      people: {
        kind: 'structural-bound',
        fit: { low: -400, high: 2600 },
        unit: 'employees',
        confidence: 0.5,
        rationale: 'The 17,600-person realized Canadian workforce is compared with the rounded 15,000–18,000 estimate for a 125-store footprint. This is a program-load coverage proxy, not an inside reserve calculation; it assumes the observed workforce is dedicated to Canada and does not place shared management commitments or operational readiness.',
        sources: [
          { ref: 'employees-at-exit', sourceClass: 'C' },
          { ref: 'estimated-people-load-range', sourceClass: 'C' },
        ],
      },
      time: {
        kind: 'structural-upper-bound',
        fitAtMost: -11,
        unit: 'months to stable operations',
        confidence: 0.5,
        rationale: 'The rollout allowed at most ten months, while the operation still had not become continuing after more than 21 months. The outcome therefore establishes a one-sided time deficit without inventing a lower endpoint.',
        sources: [
          { ref: 'planned-opening-window-months', sourceClass: 'C' },
          { ref: 'operating-learning-window', sourceClass: 'C' },
          { ref: 'operational-time-fit-upper-bound', sourceClass: 'C' },
        ],
      },
      finance: {
        kind: 'structural-upper-bound',
        fitAtMost: -941,
        unit: 'USD millions EBIT versus break-even floor',
        confidence: 0.5,
        rationale: 'The Canadian segment generated a $941 million EBIT loss in 2013. Against a nonnegative operating-economics floor, the observed fit is at most negative $941 million; this is distinct from parent-company liquidity.',
        sources: [
          { ref: 'canada-ebit-2013', sourceClass: 'A' },
          { ref: 'ebit-loss-share-of-sales', sourceClass: 'A' },
        ],
      },
    },
  },
  findings: [
    'Physical rollout capacity existed: Target opened a national footprint and staffed 133 stores. Opening throughput was not the binding failure.',
    'Operational learning time was structurally negative by more than 11 months, while the people-quantity estimate remained near the boundary and did not establish readiness.',
    'The $941 million segment EBIT loss establishes negative operating-economics fit, while the $5.105 billion exit charge records the scale of irreversible exposure.',
    'The outcome-calibrated verdict is Collision: time and finance are definitely negative even though workforce readiness remains uncertain.',
  ],
  informationPurchase: [
    'Recover the original store-wave readiness gates, distribution and inventory milestones, and the date at which each failed or was waived.',
    'Recover the authorized investment, planned loss curve, working-capital envelope, lease exposure, and board stop-loss threshold.',
    'Separate store headcount from ready critical-role capacity across leadership, distribution, merchandising, inventory systems, and training.',
  ],
});

const adobePosition: OrganizationPositionInput = {
  posture: 'incumbent',
  tensions: {
    advantage: deskPosition(-0.5, 0.5, 'Adobe controlled the creative products and the subscription platform through which it intended to deliver value.', 'External Value Creation Share', ['creative-cloud-launched']),
    resource: deskPosition(0.25, 0.25, 'Recurring revenue is a capital-return thesis, but launch-period return and workforce capacity were not yet observable.', 'Extraction Balance', ['transition-risks-disclosed']),
    discernment: deskPosition(0.25, 0.5, 'Adobe disclosed material counter-risks and acknowledged that renewal evidence was not yet available.', 'Discovery Before Commitment Rate', ['transition-risks-disclosed', 'renewal-data-not-yet-available']),
    execution: deskPosition(0.25, 0.25, 'The offer had shipped, while renewal and complete adoption feedback remained unavailable.', 'Delivery Assurance Balance', ['creative-cloud-launched', 'renewal-data-not-yet-available']),
    invention: deskPosition(0.75, 0.5, 'Subscription access and continuous cloud delivery represented a materially new offer and business model.', 'Renewal Balance', ['creative-cloud-launched']),
    operations: deskPosition(0, 0.25, 'The packet establishes a need for scalable cloud operations but provides no operating-performance evidence.', 'Systematisation Balance', ['transition-risks-disclosed']),
  },
};

const adobeRefs = ['creative-cloud-launched', 'transition-risks-disclosed', 'renewal-data-not-yet-available'] as const;
const adobeStrains: Record<SystemId, GoalStrainInput> = {
  advantage: strain('advantage', -0.5, -0.5, 0.75, true, 'The transition monetizes a controlled creative platform through direct recurring access.', adobeRefs, { low: 0.5, high: 0.75 }, 0.5, 'Product ownership transfers, but subscription pricing, retention, and cloud economics had not yet been validated.'),
  resource: strain('resource', 0.25, 0.75, 1, true, 'Recurring revenue and renewal economics pull strongly toward durable capital return.', adobeRefs, { low: 0.25, high: 0.5 }, 0.25, 'Perpetual-license economics do not directly transfer through revenue deferral and continuing cloud investment.'),
  discernment: strain('discernment', 0.25, 0.25, 0.75, true, 'The launch preserved an inquiry burden because renewal and full adoption evidence were not yet available.', adobeRefs, { low: 0.5, high: 0.75 }, 0.5, 'Adobe’s disclosed risk awareness is portable, but public decision thresholds remain unknown.'),
  execution: strain('execution', 0.25, 0.5, 0.75, true, 'The model requires repeated release, adoption, renewal, and learning cycles.', adobeRefs, { low: 0.25, high: 0.5 }, 0.25, 'Software-release capability transfers only partly to subscription operations, renewal, and continuous service assurance.'),
  invention: strain('invention', 0.75, 0.75, 1, true, 'The commitment centers on a new delivery and business model rather than only deeper reuse of the perpetual model.', adobeRefs, { low: 0.5, high: 0.75 }, 0.5, 'Creative-product fluency transfers, while subscription packaging and cloud adoption still require learning.'),
  operations: strain('operations', 0, 0.75, 1, true, 'Continuous cloud functionality requires scalable billing, service, support, and deployment flow.', adobeRefs, { low: 0, high: 0.25 }, 0.25, 'The packet discloses the need for cloud operations but no evidence that perpetual-delivery operations were portable.'),
};

export const ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD = defineCaseScorecard({
  id: 'adobe-creative-cloud-commitment-2013-v0.2',
  profile: ADOBE_CREATIVE_CLOUD,
  snapshotId: 'commitment-2013-01-22',
  scoredAt: SCORED_AT,
  position: adobePosition,
  strains: adobeStrains,
  commitmentReview: fogReview(
    'creative-cloud-launched',
    'A recurring, continuously delivered creative platform has a clear strategic value thesis.',
    'Required cloud, sales-transition, support, compliance, and product capacity is described but not quantified.',
    'No public completion deadline or internal migration cadence places the time model.',
    'Revenue deferral and continuing investment are disclosed, but the cash trough, committed load, and tolerance are not.',
    'Adoption, renewal, reliability, pricing, and partner risks are named without hard limits or release gates.',
  ),
  findings: [
    'The strongest installed alignment is invention; the largest new load is operationalizing continuous subscription delivery.',
    'Adobe explicitly acknowledged missing renewal evidence, which raises evidence quality but does not resolve viability.',
    'Without a time horizon, cash trough, or quantified people plan, the desk verdict must remain Fog.',
  ],
  informationPurchase: [
    'Define renewal, adoption, and service-reliability gates by cohort before removing perpetual alternatives.',
    'Place the transition cash trough and continuing cloud-investment envelope against committed corporate capacity.',
    'Set a migration horizon and quantify critical-role capacity for cloud operations, support, sales, and compliance.',
  ],
});

export const ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD = defineCaseScorecard({
  id: 'adobe-creative-cloud-outcome-retrodiction-2017-v0.2',
  profile: ADOBE_CREATIVE_CLOUD,
  snapshotId: 'outcome-2017-01-20',
  scoredAt: SCORED_AT,
  mode: 'outcome-calibrated-retrodiction',
  position: adobePosition,
  strains: adobeStrains,
  commitmentReview: {
    accessTier: 'desk',
    value: 'worth-pursuing',
    valueRationale: 'The transition sought a durable recurring creative business with continuous delivery and direct customer relationships.',
    valueSourceRefs: ['creative-cloud-launched', 'transition-risks-disclosed'],
    riskFloors: [
      {
        id: 'liquidity',
        status: 'pass',
        rationale: 'Adobe funded the transition through the revenue-recognition shift and reached $4.5848 billion of subscription revenue without a disclosed liquidity failure.',
        sourceRefs: ['subscription-revenue-2016'],
      },
      {
        id: 'legal-operability',
        status: 'pass',
        rationale: 'The subscription model operated at scale and became the dominant revenue model; no fatal legal-operability barrier appears in the case packet.',
        sourceRefs: ['subscription-share-2016', 'perpetual-creative-immaterial'],
      },
    ],
    placements: {
      people: {
        kind: 'structural-lower-bound',
        fitAtLeast: 0,
        unit: 'delivered transition coverage',
        confidence: 0.5,
        rationale: 'The organization supported growth to 1.4 million paid subscriptions by fiscal 2013 and completed the business-model transition by fiscal 2016. The outcome establishes coverage, but not spare critical-role reserve.',
        sources: [
          { ref: 'paid-subscribers-2013', sourceClass: 'A' },
          { ref: 'perpetual-creative-immaterial', sourceClass: 'A' },
        ],
      },
      time: {
        kind: 'structural-lower-bound',
        fitAtLeast: 0,
        unit: 'transition completion against public horizon',
        confidence: 0.5,
        rationale: 'No public completion deadline constrained the launch, and the observable transition completed over approximately 55 months. This establishes nonnegative time fit without inventing schedule surplus.',
        sources: [
          { ref: 'transition-duration-months', sourceClass: 'A' },
          { ref: 'perpetual-creative-immaterial', sourceClass: 'A' },
        ],
      },
      finance: {
        kind: 'structural-lower-bound',
        fitAtLeast: 28,
        unit: 'percentage points subscription share above majority threshold',
        confidence: 0.5,
        rationale: 'Subscription revenue reached $4.5848 billion and 78% of total revenue, 28 points above a disclosed majority test, while Digital Media ARR increased by $1.13 billion in fiscal 2016. This measures business-model attainment, not unused corporate cash reserve.',
        sources: [
          { ref: 'subscription-revenue-2016', sourceClass: 'A' },
          { ref: 'subscription-majority-surplus-2016', sourceClass: 'A' },
          { ref: 'digital-media-arr-increase-2016', sourceClass: 'A' },
        ],
      },
    },
  },
  findings: [
    'Adobe converted a launch with unavailable renewal data into a dominant subscription model over approximately 55 months.',
    'Paid adoption and ARR supplied intermediate evidence before perpetual creative revenue became immaterial.',
    'The outcome establishes nonnegative people, time, and financial coverage, but it does not quantify unused reserve in any model.',
    'The outcome-calibrated verdict is Absorbable rather than a claim that the transition was costless or risk-free.',
  ],
  informationPurchase: [
    'Recover the transition cash trough, cumulative program cost, and case-specific return on invested capital.',
    'Quantify cloud-operations, support, sales-transition, and compliance staffing through the migration.',
    'Recover the internal renewal, reliability, and migration gates that governed removal of perpetual alternatives.',
  ],
});

const dominosPosition: OrganizationPositionInput = {
  posture: 'incumbent',
  tensions: {
    advantage: deskPosition(0.75, 0.5, 'Value is orchestrated through franchisees, digital ordering, loyalty participation, and customer interactions.', 'External Value Creation Share', ['digital-sales-us-2018', 'loyalty-users-2018']),
    resource: deskPosition(0.75, 0.5, 'Sub-three-year new-store payback places the disclosed resource model toward durable capital return.', 'Extraction Balance', ['new-store-payback-2018']),
    discernment: deskPosition(-0.5, 0.5, 'Clear seven-year endpoints and operating fundamentals indicate structured conviction.', 'Discovery Before Commitment Rate', ['target-stores-2025', 'target-sales-2025']),
    execution: deskPosition(0.5, 0.5, 'Adopted digital channels and repeatable store economics show meaningful release into the environment.', 'Delivery Assurance Balance', ['digital-sales-us-2018', 'new-store-payback-2018']),
    invention: deskPosition(-0.5, 0.5, 'The growth thesis deepens adopted digital, loyalty, franchise, and store capabilities rather than depending on a category-new offer.', 'Renewal Balance', ['digital-sales-us-2018', 'loyalty-users-2018']),
    operations: deskPosition(0.5, 0.5, 'Operational simplicity, digital ordering, and repeatable store economics support a systems-and-flow position.', 'Systematisation Balance', ['digital-sales-us-2018', 'new-store-payback-2018']),
  },
};

const dominosRefs = ['target-stores-2025', 'target-sales-2025', 'digital-sales-us-2018', 'loyalty-users-2018', 'new-store-payback-2018'] as const;
const dominosStrains: Record<SystemId, GoalStrainInput> = {
  advantage: strain('advantage', 0.75, 0.75, 0.75, true, 'Global growth depends on franchisee, customer, loyalty, and digital-network participation.', dominosRefs, { low: 0.75, high: 1 }, 0.5, 'The franchised model is designed to travel, although market-level partner quality and economics vary.'),
  resource: strain('resource', 0.75, 0.75, 1, true, 'The goal explicitly depends on maintaining attractive franchisee returns while adding stores.', dominosRefs, { low: 0.5, high: 0.75 }, 0.5, 'Observed average payback is portable evidence, but its dispersion and market-specific funding supply are unknown.'),
  discernment: strain('discernment', -0.5, -0.5, 0.75, true, 'The fixed endpoints and operating thesis favor structured conviction.', dominosRefs, { low: 0.75, high: 1 }, 0.5, 'The decision model appears repeatable, but annual revision and market-pause rules are not disclosed.'),
  execution: strain('execution', 0.5, 0.75, 0.75, true, 'The goal requires sustained store openings and customer adoption across many markets.', dominosRefs, { low: 0.5, high: 0.75 }, 0.5, 'Existing digital adoption and store payback travel meaningfully, but local release gates are not disclosed.'),
  invention: strain('invention', -0.5, -0.5, 0.5, true, 'Growth primarily exploits codified digital, loyalty, franchise, and store fluency.', dominosRefs, { low: 0.75, high: 1 }, 0.5, 'The core capabilities are already codified and adopted, with remaining variation by market.'),
  operations: strain('operations', 0.5, 0.75, 1, true, 'Reaching 25,000 stores requires repeatable end-to-end store, supply, and digital flow.', dominosRefs, { low: 0.5, high: 0.75 }, 0.5, 'Operational simplicity and digital adoption are portable, while market-level labor and delivery capacity are unknown.'),
};

export const DOMINOS_GROWTH_COMMITMENT_SCORECARD = defineCaseScorecard({
  id: 'dominos-growth-commitment-2019-v0.2',
  profile: DOMINOS_2025_GROWTH,
  snapshotId: 'commitment-2019-02-21',
  scoredAt: SCORED_AT,
  position: dominosPosition,
  strains: dominosStrains,
  commitmentReview: fogReview(
    'target-stores-2025',
    'The commitment extends an adopted franchise, digital, loyalty, and unit-economic system into further growth.',
    'The packet does not quantify franchisee supply, store leadership, delivery labor, or technology capacity by market.',
    'The 2025 endpoint is known, but annual milestone pace and market-specific opening lead times are not.',
    'Average payback supports the thesis but does not place market-level capital supply, return dispersion, or aggregate commitments.',
    'The packet does not state quality, cyber, closure, franchisee-stress, or market-pause thresholds.',
  ),
  findings: [
    'Domino’s has the strongest alignment and portability profile of the four cases because the goal extends already adopted capabilities.',
    'Sub-three-year average payback is useful return evidence, but an average cannot establish capacity in every expansion market.',
    'The goal remains Fog at desk tier because people capacity, annual time load, and downside gates are unplaced.',
  ],
  informationPurchase: [
    'Build a market-by-market franchisee, store-leadership, delivery-labor, and capital-capacity schedule.',
    'Convert the 2025 endpoints into annual gates with explicit revision and market-pause rules.',
    'Inspect the distribution—not only the average—of new-store payback and operating performance.',
  ],
});

export const DOMINOS_GROWTH_OUTCOME_RETRODICTION_SCORECARD = defineCaseScorecard({
  id: 'dominos-growth-outcome-retrodiction-2026-v0.2',
  profile: DOMINOS_2025_GROWTH,
  snapshotId: 'outcome-2026-02-23',
  scoredAt: SCORED_AT,
  mode: 'outcome-calibrated-retrodiction',
  position: dominosPosition,
  strains: dominosStrains,
  commitmentReview: {
    accessTier: 'desk',
    value: 'worth-pursuing',
    valueRationale: 'The goal extended an adopted franchise, digital, loyalty, and store-economic system while seeking explicit 2025 scale endpoints.',
    valueSourceRefs: ['target-stores-2025', 'target-sales-2025'],
    riskFloors: [
      {
        id: 'liquidity',
        status: 'pass',
        rationale: 'Domino’s continued adding net stores and increased operating income 8.5% in the endpoint year; the case does not show liquidity as the binding floor.',
        sourceRefs: ['net-store-growth-2025', 'operating-income-growth-2025'],
      },
      {
        id: 'legal-operability',
        status: 'pass',
        rationale: 'The system operated 22,142 stores globally at year-end without a disclosed fatal legal-operability barrier.',
        sourceRefs: ['actual-stores-2025'],
      },
    ],
    placements: {
      people: {
        kind: 'indeterminate',
        reason: 'The outcome does not isolate whether franchisee supply, store leadership, delivery labor, or technology talent constrained the endpoint.',
      },
      time: {
        kind: 'structural-upper-bound',
        fitAtMost: -2858,
        unit: 'stores delivered by the stated deadline versus target',
        confidence: 0.75,
        rationale: 'The 2025 deadline elapsed with 22,142 stores versus the explicit 25,000-store endpoint, establishing a 2,858-store time-bound delivery deficit.',
        sources: [
          { ref: 'target-stores-2025', sourceClass: 'A' },
          { ref: 'actual-stores-2025', sourceClass: 'A' },
          { ref: 'store-target-shortfall', sourceClass: 'A' },
        ],
      },
      finance: {
        kind: 'structural-upper-bound',
        fitAtMost: -4.8732,
        unit: 'USD billions global retail sales versus target',
        confidence: 0.75,
        rationale: 'Fiscal 2025 global retail sales were $20.1268 billion versus the explicit $25 billion endpoint, establishing a $4.8732 billion endpoint deficit while operating income still grew.',
        sources: [
          { ref: 'target-sales-2025', sourceClass: 'A' },
          { ref: 'actual-sales-2025', sourceClass: 'A' },
          { ref: 'sales-target-shortfall', sourceClass: 'A' },
          { ref: 'operating-income-growth-2025', sourceClass: 'A' },
        ],
      },
    },
  },
  findings: [
    'The explicit 2025 endpoints collided: stores were 2,858 below target and global retail sales were $4.8732 billion below target.',
    'Continued net store additions and 8.5% operating-income growth prevent the endpoint collision from becoming a generic strategic-failure claim.',
    'People capacity remains causally unresolved, but definite deadline and sales deficits establish CAN = no for the original commitment.',
    'The correct retrodictive verdict is Collision against the stated endpoints, with a still-viable underlying growth system.',
  ],
  informationPurchase: [
    'Recover annual store and sales milestones, formal forecast revisions, and the date management retired or replaced the 2025 endpoints.',
    'Decompose the store shortfall by franchisee supply, labor, closures, market economics, and approval lead time.',
    'Inspect the distribution of store payback and market-level sales rather than relying on system averages.',
  ],
});

const fordPosition: OrganizationPositionInput = {
  posture: 'incumbent',
  tensions: {
    advantage: deskPosition(-0.75, 0.5, 'Ford’s plan relies on controlled vehicle platforms, plants, battery supply, and material contracts.', 'External Value Creation Share', ['battery-capacity-sourced-2022', 'planned-ev-investment']),
    resource: deskPosition(0.25, 0.5, 'The plan names a large investment and future margin, but realized return and workforce buffer are not yet established.', 'Extraction Balance', ['planned-ev-investment', 'target-margin-2026']),
    discernment: deskPosition(-0.5, 0.5, 'Specific production, investment, sourcing, and margin commitments reflect structured conviction.', 'Discovery Before Commitment Rate', ['target-run-rate-2023', 'target-run-rate-2026', 'target-margin-2026']),
    execution: deskPosition(-0.25, 0.25, 'The plan retains meaningful supply and industrial risk friction before the intended scale release.', 'Delivery Assurance Balance', ['battery-capacity-sourced-2022', 'target-run-rate-2023']),
    invention: deskPosition(0.75, 0.5, 'New EV products, battery chemistries, and manufacturing systems pull toward novel offering creation.', 'Renewal Balance', ['target-run-rate-2026', 'battery-capacity-sourced-2022']),
    operations: deskPosition(0, 0.25, 'Ford has deep execution discipline, while the new battery-to-vehicle flow system was still being assembled.', 'Systematisation Balance', ['battery-capacity-sourced-2022']),
  },
};

const fordRefs = ['target-run-rate-2023', 'target-run-rate-2026', 'target-margin-2026', 'planned-ev-investment', 'battery-capacity-sourced-2022'] as const;
const fordStrains: Record<SystemId, GoalStrainInput> = {
  advantage: strain('advantage', -0.75, -0.75, 0.75, true, 'The goal depends on controlled platforms, manufacturing assets, batteries, and raw-material supply.', fordRefs, { low: 0.25, high: 0.5 }, 0.5, 'ICE-era assets and supplier power transfer only partly to batteries, software, and EV platforms.'),
  resource: strain('resource', 0.25, 0.75, 1, true, 'More than $50 billion of investment must ultimately produce an 8% Model e EBIT margin.', fordRefs, { low: 0.25, high: 0.5 }, 0.25, 'Corporate capital access transfers, but EV return, loss tolerance, and specialized workforce capacity were unproven.'),
  discernment: strain('discernment', -0.5, -0.75, 0.75, true, 'The plan makes high-conviction scale and margin commitments on a fixed clock.', fordRefs, { low: 0.5, high: 0.75 }, 0.5, 'Planning discipline transfers, while demand-downside and re-timing thresholds remain undisclosed.'),
  execution: strain('execution', -0.25, 0.75, 1, true, 'The commitment pulls from industrial assurance toward rapid market release and scale.', fordRefs, { low: 0.25, high: 0.5 }, 0.25, 'Vehicle launch capability transfers only partly to new platforms, batteries, software, and supplier dependencies.'),
  invention: strain('invention', 0.75, 0.75, 1, true, 'The goal relies on new EV platforms, products, battery chemistries, and customer adoption.', fordRefs, { low: 0.25, high: 0.5 }, 0.5, 'Automotive engineering fluency transfers, but technology maturity and EV unit economics remain context-specific.'),
  operations: strain('operations', 0, 1, 1, true, 'Two million annual units require a new end-to-end battery, materials, plant, software, and vehicle flow system.', fordRefs, { low: 0, high: 0.25 }, 0.25, 'Only 70% of required battery capacity was sourced, and installed ICE flow does not directly establish EV flow.'),
};

export const FORD_MODEL_E_COMMITMENT_SCORECARD = defineCaseScorecard({
  id: 'ford-model-e-commitment-2022-v0.2',
  profile: FORD_MODEL_E,
  snapshotId: 'commitment-2022-07-21',
  scoredAt: SCORED_AT,
  position: fordPosition,
  strains: fordStrains,
  commitmentReview: fogReview(
    'target-run-rate-2026',
    'A scaled, profitable EV business is strategically valuable if demand and unit economics support the industrial conversion.',
    'The packet does not quantify battery, software, engineering, manufacturing, or skilled-trades capacity and commitments.',
    'The milestones are explicit, but schedule reserve, plant ramp curves, supplier lead times, and quality gates are not placeable.',
    'The investment load exceeds $50 billion, but the funding peak, existing commitments, loss tolerance, and recoverable return are unknown.',
    'Thirty percent of required battery capacity was not yet sourced, while contract firmness, quality gates, and reversible ramp steps were undisclosed.',
  ),
  findings: [
    'Operations and release are the leading strains: the plan asks an incumbent industrial system to instantiate a new EV flow on a fixed clock.',
    'Seventy percent sourced battery capacity is material progress, but it is not evidence that the remaining system or schedule reserve fits.',
    'The combination of a large capital load and unplaced time and people reserves makes Collision plausible, but the defensible desk verdict is Fog.',
  ],
  informationPurchase: [
    'Place demand-linked production scenarios, battery-contract firmness, plant ramp curves, yield, and critical-path schedule reserve.',
    'Quantify the annual cash trough, Model e loss tolerance, cancellation costs, and capital reallocation triggers.',
    'Define quality, contribution-margin, demand, and supplier gates for each reversible capacity increment.',
  ],
});

export const FORD_MODEL_E_LATEST_EVIDENCE_SCORECARD = defineCaseScorecard({
  id: 'ford-model-e-latest-evidence-2025-v0.2',
  profile: FORD_MODEL_E,
  snapshotId: 'ongoing-2025-02-06',
  scoredAt: SCORED_AT,
  mode: 'latest-evidence-calibration',
  position: fordPosition,
  strains: fordStrains,
  commitmentReview: {
    accessTier: 'desk',
    value: 'worth-pursuing',
    valueRationale: 'A scaled, profitable EV business remains strategically valuable; this calibration tests the original milestones, not a revised portfolio plan.',
    valueSourceRefs: ['target-run-rate-2026', 'target-margin-2026'],
    riskFloors: [
      {
        id: 'liquidity',
        status: 'pass',
        rationale: 'Ford absorbed a $5.076 billion Model e EBIT loss in 2024 and continued operating; liquidity was not yet the fatal floor in the included evidence window.',
        sourceRefs: ['model-e-ebit-2024'],
      },
      {
        id: 'legal-operability',
        status: 'pass',
        rationale: 'Model e continued wholesaling vehicles and reporting revenue; no fatal legal-operability barrier appears in the packet.',
        sourceRefs: ['model-e-wholesales-2024', 'model-e-revenue-2024'],
      },
    ],
    placements: {
      people: {
        kind: 'indeterminate',
        reason: 'Critical battery, software, engineering, manufacturing, and skilled-trades capacity remains unquantified in the included evidence.',
      },
      time: {
        kind: 'structural-upper-bound',
        fitAtMost: -1,
        unit: 'missed dated intermediate milestones',
        confidence: 0.75,
        rationale: 'The explicit late-2023 600,000-unit production run-rate milestone moved into 2024. This counts the missed milestone without substituting 2024 wholesale volume for production run rate.',
        sources: [
          { ref: 'target-run-rate-2023', sourceClass: 'C' },
          { ref: 'run-rate-retimed-2023', sourceClass: 'C' },
          { ref: 'missed-intermediate-run-rate-milestone', sourceClass: 'C' },
        ],
      },
      finance: {
        kind: 'structural-upper-bound',
        fitAtMost: -139.8,
        unit: 'percentage points versus 8% EBIT-margin target',
        confidence: 0.75,
        rationale: 'The reported 2024 Model e EBIT margin was negative 131.8%, placing current economic fit 139.8 percentage points below the positive 8% endpoint. The 2026 deadline remains open, so this is a latest-evidence collision, not a final endpoint result.',
        sources: [
          { ref: 'target-margin-2026', sourceClass: 'C' },
          { ref: 'model-e-margin-2024', sourceClass: 'A' },
          { ref: 'model-e-margin-gap-2024', sourceClass: 'A' },
        ],
      },
    },
  },
  findings: [
    'The original intermediate production milestone missed its date; wholesale volume is deliberately not used as a substitute for production run rate.',
    'Model e stood 139.8 percentage points below the stated margin endpoint in 2024 and produced a $5.076 billion EBIT loss.',
    'Revenue and EBIT per wholesale unit are reported only as segment-scale ratios, not vehicle pricing or contribution-margin measures.',
    'The latest-evidence verdict is Collision against the original plan, while the final 2026 outcome remains open.',
  ],
  informationPurchase: [
    'Obtain the current official status and probability distribution for the original two-million-unit and 8% margin endpoints.',
    'Place battery, software, engineering, plant, and skilled-trades capacity against the revised product and manufacturing sequence.',
    'Recover platform-level contribution margins, cancellation costs, demand scenarios, and capital reallocation triggers.',
  ],
});

export const STRATOS_COMMITMENT_SCORECARDS = [
  TARGET_CANADA_COMMITMENT_SCORECARD,
  ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD,
  DOMINOS_GROWTH_COMMITMENT_SCORECARD,
  FORD_MODEL_E_COMMITMENT_SCORECARD,
] as const;

export const STRATOS_RETRODICTION_SCORECARDS = [
  TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD,
  ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD,
  DOMINOS_GROWTH_OUTCOME_RETRODICTION_SCORECARD,
] as const;

export const STRATOS_LATEST_EVIDENCE_SCORECARDS = [
  FORD_MODEL_E_LATEST_EVIDENCE_SCORECARD,
] as const;

export const STRATOS_CASE_SCORECARDS = [
  ...STRATOS_COMMITMENT_SCORECARDS,
  ...STRATOS_RETRODICTION_SCORECARDS,
  ...STRATOS_LATEST_EVIDENCE_SCORECARDS,
] as const;
