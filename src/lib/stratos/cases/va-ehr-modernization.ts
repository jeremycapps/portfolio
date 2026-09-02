import { CASE_PROFILE_SCHEMA, defineCaseProfile } from './profile';

/**
 * VA's Electronic Health Record modernization, read as a sequence of release
 * decisions rather than as one program.
 *
 * The case earns its place in the library because the verdict moves. A desk
 * reviewer holding only sources published before each date should reach FOG at
 * the 2018 award, COLLISION at the 2020 first site, and FIT at the 2023 pause —
 * the pause being a *reduction* in requested increment, which is a different
 * question from the one the rollout kept failing. A case that scored COLLISION
 * throughout would prove nothing about discrimination.
 *
 * The T1 result is the strongest retrodiction here: the inspector general
 * published the staffing, infrastructure, and mitigation evidence on
 * 2020-04-27, six months before the October go-live. None of the later ticket
 * burden or patient-harm findings are needed to reach it, and none of them may
 * be used — they sit in the hindsight layer, where the cutoff derivation puts
 * them automatically.
 */
export const VA_EHR_MODERNIZATION = defineCaseProfile({
  schema: CASE_PROFILE_SCHEMA,
  id: 'va-ehr-modernization-2018-2025',
  version: '1.0.0',
  company: { name: 'U.S. Department of Veterans Affairs' },
  case: {
    name: 'Electronic Health Record modernization',
    scope: 'VA replacement of VistA with the Cerner federal EHR platform, from the 2018 contract award through the 2025 restart planning.',
    announcedAt: '2018-05-17',
    status: 'ongoing',
    commitment: 'Replace VA\'s existing electronic health record with the same Cerner platform being deployed by the Department of Defense, under a ten-year contract with a ceiling of approximately $10 billion.',
    targets: [
      {
        id: 'va-shared-record',
        label: 'Adopt the DoD-common platform to produce a single record spanning VA, DoD, and community providers.',
        evidence: [{ sourceId: 'va-cerner-contract-2018', locator: 'Contract announcement, opening paragraphs' }],
      },
    ],
  },
  scoring: {
    status: 'unscored',
    reason: 'Decision-point scorecards are authored per release date; the profile carries the shared fact and source registry they draw on.',
  },
  sources: [
    {
      id: 'va-cerner-contract-2018',
      title: 'VA Signs Contract with Cerner for an Electronic Health Record System',
      publisher: 'U.S. Department of Veterans Affairs',
      kind: 'agency-release',
      publishedAt: '2018-05-17',
      url: 'https://digital.va.gov/ehr-modernization/news-releases/va-signs-contract-with-cerner-for-an-electronic-health-record-system/',
    },
    {
      id: 'va-wilkie-statement-2018',
      title: 'Statement by Acting Secretary Robert Wilkie: VA Signs Contract with Cerner for an Electronic Health Record System',
      publisher: 'U.S. Department of Veterans Affairs',
      kind: 'agency-release',
      publishedAt: '2018-05-17',
      url: 'https://news.va.gov/press-room/statement-by-acting-secretary-robert-wilkie-va-signs-contract-with-cerner-for-an-electronic-health-record-system/',
    },
    {
      id: 'va-oig-access-capabilities-2020',
      title: 'Review of Access to Care and Capabilities during VA\'s Transition to a New Electronic Health Record System at the Mann-Grandstaff VA Medical Center',
      publisher: 'U.S. Department of Veterans Affairs Office of Inspector General',
      kind: 'audit-report',
      publishedAt: '2020-04-27',
      url: 'https://www.vaoig.gov/reports/hotline-healthcare-inspection/review-access-care-and-capabilities-during-vas-transition-new',
    },
    {
      id: 'va-oig-infrastructure-2020',
      title: 'Deficiencies in Infrastructure Readiness for Deploying VA\'s New Electronic Health Record System',
      publisher: 'U.S. Department of Veterans Affairs Office of Inspector General',
      kind: 'audit-report',
      publishedAt: '2020-04-27',
      url: 'https://www.vaoig.gov/reports/audit/deficiencies-infrastructure-readiness-deploying-vas-new-electronic-health-record',
    },
    {
      id: 'va-launch-2020',
      title: 'VA Launches New Electronic Health Record System in Pacific Northwest',
      publisher: 'U.S. Department of Veterans Affairs',
      kind: 'agency-release',
      publishedAt: '2020-10-24',
      url: 'https://news.va.gov/press-room/va-launches-new-electronic-health-record-system-in-pacific-northwest-in-mission-to-modernize-care-for-veterans/',
    },
    {
      id: 'va-oig-ticket-process-2022',
      title: 'Ticket Process Concerns and Underlying Factors Contributing to Deficiencies after the New Electronic Health Record Go-Live',
      publisher: 'U.S. Department of Veterans Affairs Office of Inspector General',
      kind: 'audit-report',
      publishedAt: '2022-03-17',
      url: 'https://www.vaoig.gov/reports/hotline-healthcare-inspection/ticket-process-concerns-and-underlying-factors-contributing',
    },
  ],
  facts: [
    {
      id: 'va-contract-ceiling-2018',
      statement: 'VA signed a ten-year contract with Cerner carrying a ceiling of approximately $10 billion to replace its existing electronic health record.',
      observedAt: '2018-05-17',
      origin: 'reported',
      metric: { value: 10, unit: 'USD billions contract ceiling' },
      evidence: [{ sourceId: 'va-cerner-contract-2018', locator: 'Contract announcement, opening paragraphs' }],
    },
    {
      id: 'va-fy2018-appropriation',
      statement: 'VA stated that $782 million had already been appropriated for electronic health record modernization in fiscal 2018.',
      observedAt: '2018-05-17',
      origin: 'reported',
      metric: { value: 782, unit: 'USD millions appropriated' },
      evidence: [{ sourceId: 'va-wilkie-statement-2018', locator: 'Statement, funding paragraph' }],
    },
    {
      id: 'va-specific-capability-additions-2018',
      statement: 'VA said it would adopt the same platform as DoD while adding capabilities needed for Veterans, VA clinicians, and community-care partners, so the required VA configuration was not identical to the DoD source configuration.',
      observedAt: '2018-05-17',
      origin: 'reported',
      evidence: [{ sourceId: 'va-wilkie-statement-2018', locator: 'Statement, interoperability and VA-specific capability paragraphs' }],
    },
    {
      id: 'va-mission-value-2018',
      statement: 'VA framed the expected value as continuity and coordination of care: seamless data sharing among VA, DoD, and community providers, with improved transparency for care teams.',
      observedAt: '2018-05-17',
      origin: 'reported',
      evidence: [{ sourceId: 'va-wilkie-statement-2018', locator: 'Statement, mission rationale paragraphs' }],
    },
    {
      id: 'va-rollout-support-required-2020',
      statement: 'The inspector general identified 108 positions as necessary to support the EHR rollout at Mann-Grandstaff.',
      observedAt: '2020-01-08',
      origin: 'reported',
      metric: { value: 108, unit: 'rollout-support positions' },
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, rollout-support staffing' }],
    },
    {
      id: 'va-rollout-support-filled-2020',
      statement: 'Before go-live, Mann-Grandstaff had filled a little more than 48 of those 108 rollout-support positions.',
      observedAt: '2020-01-08',
      origin: 'derived',
      metric: { low: 48, high: 60, unit: 'rollout-support positions' },
      calculation: 'The report states "a little more than 48" without giving an exact count. The range holds 48 as the stated floor and allows a generous reading of "a little more" up to 60, which is still well short of the 108 identified.',
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, rollout-support staffing' }],
    },
    {
      id: 'va-expected-productivity-loss-2020',
      statement: 'Facility leaders expected a 30 percent reduction in productivity while staff tested and learned the new EHR.',
      observedAt: '2020-04-27',
      origin: 'reported',
      metric: { value: 30, unit: 'percent productivity reduction' },
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, expected productivity effect' }],
    },
    {
      id: 'va-risk-systems-2020',
      statement: 'VA planned as many as 84 mitigations for 62 systems rated moderate or high risk, because required capabilities would not all be available at go-live.',
      observedAt: '2020-04-27',
      origin: 'reported',
      metric: { value: 62, unit: 'moderate or high-risk systems' },
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, capability gaps and mitigations' }],
    },
    {
      id: 'va-planned-mitigations-2020',
      statement: 'The mitigation plan for those unavailable capabilities extended to as many as 84 separate workarounds.',
      observedAt: '2020-04-27',
      origin: 'reported',
      metric: { value: 84, unit: 'planned mitigations' },
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, capability gaps and mitigations' }],
    },
    {
      id: 'va-patient-safety-risk-2020',
      statement: 'The inspector general concluded that deploying with reduced capabilities requiring mitigation introduced patient-safety risk beyond that inherently associated with an EHR deployment.',
      observedAt: '2020-04-27',
      origin: 'reported',
      evidence: [{ sourceId: 'va-oig-access-capabilities-2020', locator: 'Summary, patient-safety conclusion' }],
    },
    {
      id: 'va-infrastructure-incomplete-2020',
      statement: 'Critical physical and IT infrastructure upgrades were incomplete six months before the originally scheduled deployment, and some remained incomplete on January 8, 2020.',
      observedAt: '2020-01-08',
      origin: 'reported',
      evidence: [{ sourceId: 'va-oig-infrastructure-2020', locator: 'Summary, infrastructure readiness findings' }],
    },
    {
      id: 'va-date-committed-without-readiness-2020',
      statement: 'The inspector general stated that VA had committed to its original March 28 deployment date without sufficient information about the medical center\'s infrastructure state.',
      observedAt: '2020-04-27',
      origin: 'reported',
      evidence: [{ sourceId: 'va-oig-infrastructure-2020', locator: 'Summary, deployment-date commitment finding' }],
    },
    {
      id: 'va-initial-population-2020',
      statement: 'More than 24,000 Veterans receiving primary care were in the initial operating population at Mann-Grandstaff and its associated clinics.',
      observedAt: '2020-10-24',
      origin: 'reported',
      metric: { value: 24000, unit: 'Veterans in the initial operating population' },
      evidence: [{ sourceId: 'va-launch-2020', locator: 'Launch announcement, operating population' }],
    },
    {
      id: 'va-go-live-2020',
      statement: 'The new electronic health record went live at Mann-Grandstaff VA Medical Center and associated clinics on October 24, 2020.',
      observedAt: '2020-10-24',
      origin: 'reported',
      evidence: [{ sourceId: 'va-launch-2020', locator: 'Launch announcement, opening paragraphs' }],
    },
    {
      id: 'va-support-tickets-2021',
      statement: 'Between October 24, 2020 and March 31, 2021, Mann-Grandstaff users submitted more than 38,700 EHR support tickets.',
      observedAt: '2021-03-31',
      origin: 'reported',
      metric: { value: 38700, unit: 'support tickets' },
      evidence: [{ sourceId: 'va-oig-ticket-process-2022', locator: 'Report summary, ticket volume' }],
    },
    {
      id: 'va-unresolved-medication-tickets-2021',
      statement: 'Of 221 medication-management tickets the inspector general reviewed, 33 percent had been closed without documented resolution.',
      observedAt: '2021-03-31',
      origin: 'reported',
      metric: { value: 33, unit: 'percent of reviewed tickets closed without documented resolution' },
      evidence: [{ sourceId: 'va-oig-ticket-process-2022', locator: 'Report summary, ticket resolution findings' }],
    },
  ],
  snapshots: [
    {
      id: 'authorization-2018-05-17',
      label: 'Cerner contract authorized',
      phase: 'commitment',
      knowledgeCutoff: '2018-05-17',
      factRefs: [
        'va-contract-ceiling-2018',
        'va-fy2018-appropriation',
        'va-specific-capability-additions-2018',
        'va-mission-value-2018',
      ],
      systems: {
        discernment: { status: 'inferred', confidence: 'low', summary: 'The award establishes a platform choice and a mission rationale, but the public record does not show the disconfirming evidence weighed before committing.', factRefs: ['va-mission-value-2018'], unknowns: ['Alternatives considered', 'Decision record', 'Conditions that would have stopped the award'] },
        invention: { status: 'inferred', confidence: 'low', summary: 'VA stated that Veteran, clinician, and community-care capabilities would be added to the common platform, without describing what that configuration work involved.', factRefs: ['va-specific-capability-additions-2018'], unknowns: ['Scope of VA-specific configuration', 'Clinical workflow design', 'Community-care integration design'] },
        operations: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'DoD deployment experience supplies source-context capability; nothing in the award evidences VA-context conversion capability.', factRefs: [], unknowns: ['Site conversion cycle time', 'Clinical change capacity', 'Site-readiness criteria'] },
        execution: { status: 'inferred', confidence: 'low', summary: 'A ten-year calendar envelope is documented; release gates, pilot criteria, and reversibility conditions are not.', factRefs: ['va-contract-ceiling-2018'], unknowns: ['Release gates', 'Pilot acceptance criteria', 'Pause or rollback conditions'] },
        advantage: { status: 'inferred', confidence: 'medium', summary: 'The expected advantage is a single record spanning VA, DoD, and community providers — a stated mission benefit rather than a demonstrated one.', factRefs: ['va-mission-value-2018'], unknowns: ['Measured continuity-of-care effect', 'Clinician-facing benefit', 'Interoperability in practice'] },
        resource: { status: 'evidenced', confidence: 'medium', summary: 'A $10 billion ceiling and $782 million of fiscal 2018 appropriation establish authorization capacity, not total lifecycle affordability.', factRefs: ['va-contract-ceiling-2018', 'va-fy2018-appropriation'], unknowns: ['Total lifecycle cost estimate', 'Sustainment cost', 'Per-site deployment cost'] },
      },
      constraints: {
        people: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'No implementation staffing, clinical change capacity, or site-readiness capacity is publicly placed at award.', factRefs: [], unknowns: ['Implementation staffing', 'Clinical change capacity', 'Site-readiness capacity'] },
        finance: { status: 'evidenced', confidence: 'medium', summary: 'The contract ceiling and first-year appropriation are disclosed; the affordability of the full conversion is not.', factRefs: ['va-contract-ceiling-2018', 'va-fy2018-appropriation'], unknowns: ['Lifecycle estimate', 'Sustainment funding', 'Site-level deployable funding'] },
        time: { status: 'inferred', confidence: 'low', summary: 'The ten-year term bounds the calendar, but no evidence places the cycle time required to configure, verify, and remediate the system in a VA clinical setting.', factRefs: ['va-contract-ceiling-2018'], unknowns: ['Configuration cycle time', 'Verification cycle time', 'Remediation cycle time'] },
        risk: { status: 'inferred', confidence: 'low', summary: 'The award creates substantial committed financial exposure; the irreversible portion and the tolerance for it are not disclosed.', factRefs: ['va-contract-ceiling-2018'], unknowns: ['Irreversible exposure at award', 'Risk tolerance', 'Termination terms'] },
      },
    },
    {
      id: 'first-release-2020-10-24',
      label: 'First production deployment at Mann-Grandstaff',
      phase: 'material-update',
      knowledgeCutoff: '2020-10-24',
      factRefs: [
        'va-rollout-support-required-2020',
        'va-rollout-support-filled-2020',
        'va-expected-productivity-loss-2020',
        'va-risk-systems-2020',
        'va-planned-mitigations-2020',
        'va-patient-safety-risk-2020',
        'va-infrastructure-incomplete-2020',
        'va-date-committed-without-readiness-2020',
        'va-initial-population-2020',
        'va-go-live-2020',
      ],
      systems: {
        discernment: { status: 'evidenced', confidence: 'high', summary: 'The inspector general had published readiness findings six months earlier and recommended reassessing deployment timing; the public record does not show that reassessment changing the date.', factRefs: ['va-date-committed-without-readiness-2020', 'va-patient-safety-risk-2020'], unknowns: ['Whether the recommendations were adopted', 'Internal readiness thresholds', 'Who held the release decision'] },
        invention: { status: 'inferred', confidence: 'medium', summary: 'The configured VA build reached production carrying dozens of planned workarounds, which indicates the intended configuration was not finished.', factRefs: ['va-planned-mitigations-2020', 'va-risk-systems-2020'], unknowns: ['Which capabilities were deferred', 'Clinical acceptance of workarounds', 'Configuration backlog size'] },
        operations: { status: 'evidenced', confidence: 'high', summary: 'Infrastructure upgrades were incomplete, rollout-support staffing was materially below the identified requirement, and leaders expected a 30 percent productivity loss during transition.', factRefs: ['va-infrastructure-incomplete-2020', 'va-rollout-support-filled-2020', 'va-expected-productivity-loss-2020'], unknowns: ['Post-go-live throughput', 'Support-response capacity', 'Training completion rate'] },
        execution: { status: 'evidenced', confidence: 'high', summary: 'The release advanced to a live patient-care population while 62 moderate or high-risk systems still required as many as 84 mitigations.', factRefs: ['va-risk-systems-2020', 'va-planned-mitigations-2020', 'va-go-live-2020'], unknowns: ['Release gate criteria', 'Rollback plan', 'Mitigation retirement schedule'] },
        advantage: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'No first-site operational value had been demonstrated before release.', factRefs: [], unknowns: ['Continuity-of-care effect', 'Clinician-reported benefit', 'Interoperability in practice'] },
        resource: { status: 'inferred', confidence: 'low', summary: 'The program was funded at scale, and finance is not the constraint the pre-release evidence places as binding at this site.', factRefs: [], unknowns: ['Site-level deployment cost', 'Remediation funding', 'Remaining lifecycle capacity'] },
      },
      constraints: {
        people: { status: 'evidenced', confidence: 'high', summary: 'A little more than 48 of the 108 identified rollout-support positions were filled — a shortfall evidenced locally without any claim about VA enterprise staffing capacity.', factRefs: ['va-rollout-support-required-2020', 'va-rollout-support-filled-2020'], unknowns: ['VA-wide implementation staffing reserve', 'Contractor support capacity', 'Time to fill remaining positions'] },
        finance: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'No cutoff-safe evidence places site-level financial capacity as the binding constraint at this release.', factRefs: [], unknowns: ['Site deployment cost', 'Remediation budget', 'Remaining obligated capacity'] },
        time: { status: 'evidenced', confidence: 'medium', summary: 'The original March date had already slipped and remediation continued, but no published evidence shows a completed verification cycle before October.', factRefs: ['va-date-committed-without-readiness-2020', 'va-infrastructure-incomplete-2020'], unknowns: ['Verification cycle completion', 'Remaining remediation time', 'Schedule slack before the next site'] },
        risk: { status: 'evidenced', confidence: 'high', summary: 'The inspector general found that releasing with mitigated, reduced capabilities added patient-safety risk beyond the level inherent to an EHR deployment.', factRefs: ['va-patient-safety-risk-2020', 'va-risk-systems-2020', 'va-planned-mitigations-2020'], unknowns: ['Quantified safety tolerance', 'Accepted-risk register', 'Stop conditions'] },
      },
    },
    {
      id: 'expansion-2022-03-26',
      label: 'Expansion beyond the first site',
      phase: 'ongoing',
      knowledgeCutoff: '2022-03-26',
      factRefs: [
        'va-go-live-2020',
        'va-support-tickets-2021',
        'va-unresolved-medication-tickets-2021',
      ],
      systems: {
        discernment: { status: 'evidenced', confidence: 'high', summary: 'Nine days before the next site went live, the inspector general reported that first-site problems remained unresolved and said resolving them before further deployment could reduce patient-safety risk.', factRefs: ['va-support-tickets-2021', 'va-unresolved-medication-tickets-2021'], unknowns: ['Whether the finding reached the release decision', 'Internal readiness criteria for site two', 'Who held the expansion decision'] },
        invention: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'The published evidence covers support and resolution behaviour, not changes made to the configuration itself.', factRefs: [], unknowns: ['Configuration changes since first release', 'Retired mitigations', 'Clinical workflow redesign'] },
        operations: { status: 'evidenced', confidence: 'high', summary: 'More than 38,700 support tickets in roughly five months, with a third of reviewed medication tickets closed without documented resolution, describe a support system absorbing more than it was clearing.', factRefs: ['va-support-tickets-2021', 'va-unresolved-medication-tickets-2021'], unknowns: ['Ticket inflow at steady state', 'Resolution cycle time', 'Support capacity per site'] },
        execution: { status: 'evidenced', confidence: 'high', summary: 'Seventeen months of calendar time had passed since the first release, but the diagnosis-to-verified-resolution cycle was publicly evidenced as still open when the next site was released.', factRefs: ['va-go-live-2020', 'va-unresolved-medication-tickets-2021'], unknowns: ['Gate criteria for the second site', 'Mitigation retirement progress', 'Rollback plan'] },
        advantage: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'No published evidence yet establishes realized continuity-of-care value at the first site.', factRefs: [], unknowns: ['Continuity-of-care effect', 'Clinician-reported benefit', 'Interoperability in practice'] },
        resource: { status: 'inferred', confidence: 'low', summary: 'Remediation and new-site deployment draw on the same program capacity, though public evidence does not size either draw.', factRefs: [], unknowns: ['Remediation staffing', 'Deployment staffing', 'Shared capacity between the two'] },
      },
      constraints: {
        people: { status: 'inferred', confidence: 'medium', summary: 'A sustained support and remediation burden is evidenced at the first site; VA-wide capacity to carry it alongside new deployments is not publicly placeable.', factRefs: ['va-support-tickets-2021'], unknowns: ['Enterprise implementation capacity', 'Support staffing per site', 'Contractor capacity'] },
        finance: { status: 'insufficient-evidence', confidence: 'not-assessed', summary: 'No cutoff-safe evidence places finance as the binding constraint on the expansion decision.', factRefs: [], unknowns: ['Remediation budget', 'Per-site deployment cost', 'Remaining obligated capacity'] },
        time: { status: 'evidenced', confidence: 'high', summary: 'Elapsed calendar time was ample; the learning cycle it was meant to contain was evidenced as incomplete nine days before the next release.', factRefs: ['va-go-live-2020', 'va-unresolved-medication-tickets-2021'], unknowns: ['Time required to close the open findings', 'Verification cycle length', 'Schedule slack before site three'] },
        risk: { status: 'evidenced', confidence: 'high', summary: 'Unresolved medication-management and support-process problems remained present at the first site while a second site was added.', factRefs: ['va-unresolved-medication-tickets-2021', 'va-support-tickets-2021'], unknowns: ['Quantified safety tolerance', 'Accepted-risk register', 'Conditions that would have paused expansion'] },
      },
    },
  ],
});
