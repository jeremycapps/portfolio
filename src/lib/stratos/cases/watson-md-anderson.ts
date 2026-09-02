import {
  CASE_PROFILE_SCHEMA,
  defineCaseProfile,
  type CaseAssessment,
} from './profile';

const unknown = (
  summary: string,
  unknowns: readonly string[],
  factRefs: readonly string[] = [],
): CaseAssessment => ({
  status: 'insufficient-evidence',
  confidence: 'not-assessed',
  summary,
  factRefs,
  unknowns,
});

const inferred = (
  summary: string,
  factRefs: readonly string[],
  unknowns: readonly string[],
): CaseAssessment => ({
  status: 'inferred',
  confidence: 'low',
  summary,
  factRefs,
  unknowns,
});

const evidenced = (
  summary: string,
  factRefs: readonly string[],
  unknowns: readonly string[] = [],
  confidence: CaseAssessment['confidence'] = 'high',
): CaseAssessment => ({
  status: 'evidenced',
  confidence,
  summary,
  factRefs,
  unknowns,
});

/**
 * MD Anderson's Oncology Expert Advisor, read at three actual commitment
 * boundaries rather than as a generic story about Watson.
 *
 * T1 deliberately uses the February 2014 Regents authorization. The later
 * audit describes twelve extensions and repeated scope changes, but those
 * findings were not public in 2014 and cannot be used to manufacture a
 * contemporaneous mid-program verdict. The Regents record was public at the
 * decision: it authorizes another $15 million while saying everyday physician
 * adoption still had to be established. That is enough for FOG, and no more.
 */
export const WATSON_MD_ANDERSON = defineCaseProfile({
  schema: CASE_PROFILE_SCHEMA,
  id: 'watson-md-anderson-2013-2017',
  version: '1.0.0',
  company: { name: 'The University of Texas MD Anderson Cancer Center' },
  case: {
    name: 'Watson Oncology Expert Advisor',
    scope: 'MD Anderson development of the Watson-powered Oncology Expert Advisor from its 2013 public launch through the 2017 halt.',
    announcedAt: '2013-10-18',
    status: 'completed',
    commitment: 'Develop a Watson-powered clinical decision-support system that could combine patient records, research, and clinical expertise to recommend evidence-based cancer treatment in routine practice, beginning with leukemia and extending across cancers.',
    targets: [
      {
        id: 'oea-routine-clinical-use',
        label: 'Put the Oncology Expert Advisor into routine clinical use across cancer types and care settings.',
        evidence: [{ sourceId: 'mda-ibm-announce-2013', locator: 'Announcement, paragraphs 2–5' }],
      },
    ],
  },
  scoring: {
    status: 'unscored',
    reason: 'Decision-point reviews are authored separately for the launch, the next-phase authorization, and the terminal audit-and-halt boundary.',
  },
  sources: [
    {
      id: 'mda-ibm-announce-2013',
      title: 'MD Anderson Taps IBM Watson to Power “Moon Shots” Mission Aimed at Ending Cancer, Starting with Leukemia',
      publisher: 'The University of Texas MD Anderson Cancer Center and IBM',
      kind: 'company-release',
      publishedAt: '2013-10-18',
      url: 'https://www.mdanderson.org/newsroom/md-anderson--ibm-watson-work-together-to-fight-cancer.h00-158833590.html',
    },
    {
      id: 'ut-regents-oea-2014',
      title: 'Meeting No. 1,116 of the Board of Regents of The University of Texas System',
      publisher: 'The University of Texas System Board of Regents',
      kind: 'agency-release',
      publishedAt: '2014-02-06',
      url: 'https://www.utsystem.edu/sites/default/files/offices/board-of-regents/board-meetings/board-minutes/02-2014meeting1116.pdf',
    },
    {
      id: 'ut-audit-oea-2017',
      title: 'Special Review of Procurement Procedures Related to the M.D. Anderson Cancer Center Oncology Expert Advisor Project',
      publisher: 'The University of Texas System Audit Office',
      kind: 'audit-report',
      publishedAt: '2017-02-19',
      url: 'https://web.archive.org/web/20171022000000/https://www.utsystem.edu/sites/default/files/documents/UT/System/Administration/Special/Review/of/Procurement/Procedures/Related/to/utmdacc-oncology-expert-advis.pdf',
    },
    {
      id: 'forbes-oea-halt-2017',
      title: 'MD Anderson Benches IBM Watson In Setback For Artificial Intelligence In Medicine',
      publisher: 'Forbes',
      kind: 'news',
      publishedAt: '2017-02-19',
      url: 'https://www.forbes.com/sites/matthewherper/2017/02/19/md-anderson-benches-ibm-watson-in-setback-for-artificial-intelligence-in-medicine/',
    },
  ],
  facts: [
    {
      id: 'oea-prototype-after-year',
      statement: 'MD Anderson and IBM presented an Oncology Expert Advisor prototype after a year-long collaboration.',
      observedAt: '2013-10-18',
      origin: 'reported',
      evidence: [{ sourceId: 'mda-ibm-announce-2013', locator: 'Announcement, opening paragraph' }],
    },
    {
      id: 'oea-routine-care-goal',
      statement: 'The Oncology Expert Advisor was intended to combine patient and research data with clinical expertise to support safe, evidence-based treatment decisions in routine oncology care.',
      observedAt: '2013-10-18',
      origin: 'reported',
      evidence: [{ sourceId: 'mda-ibm-announce-2013', locator: 'Announcement, product purpose and expected clinical use' }],
    },
    {
      id: 'oea-leukemia-first',
      statement: 'The announced deployment path started with leukemia before extending the advisor to other cancers and care settings.',
      observedAt: '2013-10-18',
      origin: 'reported',
      evidence: [{ sourceId: 'mda-ibm-announce-2013', locator: 'Announcement, leukemia scope and network-access paragraphs' }],
    },
    {
      id: 'oea-live-testing-2013',
      statement: 'MD Anderson and IBM launched the leukemia advisor for live-system testing and clinical evaluation on October 1, 2013, and reported initial results as positive.',
      observedAt: '2013-10-01',
      origin: 'reported',
      evidence: [{ sourceId: 'ut-regents-oea-2014', locator: 'Health Affairs Committee report, OEA background, page 30' }],
    },
    {
      id: 'oea-phase-1a-authorization',
      statement: 'The Regents authorized up to $15 million from restricted gift funds for an external transformation team for OEA Phase 1A.',
      observedAt: '2014-02-06',
      origin: 'reported',
      metric: { value: 15, unit: 'USD millions authorized' },
      evidence: [{ sourceId: 'ut-regents-oea-2014', locator: 'Health Affairs Committee item 3, page 30' }],
    },
    {
      id: 'oea-community-adoption-unproven',
      statement: 'At the Phase 1A authorization, MD Anderson said willingness of physicians outside a specialty cancer center to use the tool in everyday practice still needed to be established.',
      observedAt: '2014-02-06',
      origin: 'reported',
      evidence: [{ sourceId: 'ut-regents-oea-2014', locator: 'Health Affairs Committee report, OEA background, page 30' }],
    },
    {
      id: 'oea-community-integration-next',
      statement: 'The authorized transformation phase was intended to integrate and test OEA in MD Anderson network delivery systems and establish whether the application could scale broadly.',
      observedAt: '2014-02-06',
      origin: 'reported',
      evidence: [{ sourceId: 'ut-regents-oea-2014', locator: 'Health Affairs Committee report, OEA background, pages 30–31' }],
    },
    {
      id: 'oea-total-spend',
      statement: 'MD Anderson recorded $62,113,459.55 of Oncology Expert Advisor project spending through the audit period.',
      observedAt: '2016-11-11',
      origin: 'reported',
      metric: { value: 62.1135, unit: 'USD millions total spend' },
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'Appendix C, project total, page C-1' }],
    },
    {
      id: 'oea-noncompetitive-awards',
      statement: 'The audit reviewed six noncompetitive procurements to IBM and PwC with a total value of approximately $51.4 million.',
      observedAt: '2016-11-11',
      origin: 'reported',
      metric: { value: 51.4, unit: 'USD millions noncompetitively awarded' },
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'Executive summary and procurement review, pages 2–4' }],
    },
    {
      id: 'oea-spend-overshoot',
      statement: 'Reported total spend exceeded the audited value of the six noncompetitive awards by approximately $10.7 million.',
      observedAt: '2016-11-11',
      origin: 'derived',
      metric: { value: 10.7135, unit: 'USD millions above reviewed awards' },
      calculation: '$62.1135 million total project spend minus $51.4 million of reviewed noncompetitive awards equals $10.7135 million.',
      evidence: [
        { sourceId: 'ut-audit-oea-2017', locator: 'Appendix C, project total, page C-1' },
        { sourceId: 'ut-audit-oea-2017', locator: 'Executive summary and procurement review, pages 2–4' },
      ],
    },
    {
      id: 'oea-contract-extensions',
      statement: 'The IBM agreement was extended twelve times while the project remained under development.',
      observedAt: '2016-11-11',
      origin: 'reported',
      metric: { value: 12, unit: 'contract extensions' },
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'IBM procurement history and contract-extension schedule' }],
    },
    {
      id: 'oea-gift-fund-deficit',
      statement: 'The audit identified approximately $11.6 million of deficits across gift-funded project accounts after spending preceded receipt of the related gifts.',
      observedAt: '2016-11-11',
      origin: 'reported',
      metric: { value: 11.6, unit: 'USD millions gift-fund deficit' },
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'Gift-fund analysis and Appendix C' }],
    },
    {
      id: 'oea-incomplete-work-paid',
      statement: 'The audit identified vendor payments for work that was not completed.',
      observedAt: '2016-11-11',
      origin: 'reported',
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'Procurement and invoice findings' }],
    },
    {
      id: 'oea-no-epic-integration',
      statement: 'OEA had not been updated to integrate with MD Anderson’s current Epic electronic health record.',
      observedAt: '2016-11-11',
      origin: 'reported',
      evidence: [{ sourceId: 'ut-audit-oea-2017', locator: 'Project status and current-system integration finding' }],
    },
    {
      id: 'oea-never-used-on-patients',
      statement: 'The Oncology Expert Advisor had not been used to direct care for an actual patient before the IBM contract expired.',
      observedAt: '2017-02-19',
      origin: 'reported',
      evidence: [{ sourceId: 'forbes-oea-halt-2017', locator: 'Project outcome and clinical-use paragraphs' }],
    },
    {
      id: 'oea-benched-2017',
      statement: 'MD Anderson benched the Oncology Expert Advisor after the IBM contract expired and said it would seek bids from other contractors before further development.',
      observedAt: '2017-02-19',
      origin: 'reported',
      evidence: [{ sourceId: 'forbes-oea-halt-2017', locator: 'Opening and project-status paragraphs' }],
    },
  ],
  snapshots: [
    {
      id: 'commitment-2013-10-18',
      label: 'Oncology Expert Advisor publicly launched',
      phase: 'commitment',
      knowledgeCutoff: '2013-10-18',
      factRefs: ['oea-prototype-after-year', 'oea-routine-care-goal', 'oea-leukemia-first'],
      systems: {
        discernment: inferred('The announcement states a strong clinical ambition but no disconfirming test or stop condition.', ['oea-routine-care-goal'], ['Alternatives considered', 'Clinical acceptance threshold', 'Stopping rule']),
        invention: evidenced('A prototype existed after a year of joint work, beginning in leukemia.', ['oea-prototype-after-year', 'oea-leukemia-first'], ['Prototype performance', 'Production architecture'], 'medium'),
        operations: inferred('Routine clinical use implied patient-record and workflow integration that the announcement did not place.', ['oea-routine-care-goal'], ['EHR integration plan', 'Workflow readiness', 'Support capacity']),
        execution: unknown('No release gate, pilot acceptance criterion, or bounded deployment sequence was disclosed.', ['Release gates', 'Pilot acceptance criteria', 'Rollback conditions']),
        advantage: inferred('The proposed value was faster access to MD Anderson expertise and evidence-based treatment options, not yet demonstrated in care.', ['oea-routine-care-goal'], ['Patient outcome measure', 'Clinician adoption measure', 'Economic value measure']),
        resource: unknown('The announcement disclosed no budget envelope, staffing requirement, or renewal capacity.', ['Budget envelope', 'Critical-role capacity', 'Maximum exposure']),
      },
      constraints: {
        people: unknown('Clinical and technical staffing requirements were not placed.', ['Clinical expert time', 'Engineering capacity', 'Workflow-change capacity']),
        finance: unknown('No public commitment ceiling or funding reserve accompanied the launch.', ['Authorized budget', 'Available funding', 'Loss tolerance']),
        time: inferred('A prototype existed, but no date for routine clinical adoption was disclosed.', ['oea-prototype-after-year'], ['Deployment deadline', 'Verification cycle', 'Schedule slack']),
        risk: unknown('No safety, readiness, or governance floor was publicly defined.', ['Clinical-safety threshold', 'Integration readiness floor', 'Procurement controls']),
      },
    },
    {
      id: 'phase-1a-2014-02-06',
      label: 'External transformation phase authorized',
      phase: 'material-update',
      knowledgeCutoff: '2014-02-06',
      factRefs: ['oea-live-testing-2013', 'oea-phase-1a-authorization', 'oea-community-adoption-unproven', 'oea-community-integration-next'],
      systems: {
        discernment: evidenced('The Regents packet named the unresolved adoption question while authorizing the next phase.', ['oea-community-adoption-unproven', 'oea-phase-1a-authorization'], ['Adoption threshold', 'Decision response if adoption failed'], 'medium'),
        invention: evidenced('The leukemia build had reached live-system testing with initially positive results.', ['oea-live-testing-2013'], ['Independent validation', 'Production performance'], 'medium'),
        operations: inferred('The next phase still had to integrate and test OEA in network delivery systems.', ['oea-community-integration-next'], ['EHR integration readiness', 'Community workflow readiness', 'Support model']),
        execution: inferred('Another funded phase was authorized before broad adoption had been established.', ['oea-phase-1a-authorization', 'oea-community-adoption-unproven'], ['Release gates', 'Acceptance criteria', 'Exit condition']),
        advantage: inferred('Early testing was described as positive, but use in everyday practice remained explicitly unproven.', ['oea-live-testing-2013', 'oea-community-adoption-unproven'], ['Observed clinician adoption', 'Patient benefit', 'Economic return']),
        resource: evidenced('The Regents placed a $15 million authorization for Phase 1A, but not total project affordability.', ['oea-phase-1a-authorization'], ['Cumulative commitment', 'Remaining funding', 'Maximum project exposure'], 'medium'),
      },
      constraints: {
        people: unknown('The record did not size the clinical, technical, or change capacity required for the next phase.', ['Clinical expert capacity', 'Integration staffing', 'Adoption support']),
        finance: evidenced('The next phase had a $15 million authorization from restricted gift funds; the full lifecycle envelope remained unknown.', ['oea-phase-1a-authorization'], ['Total lifecycle budget', 'Gift funding received', 'Loss tolerance'], 'medium'),
        time: unknown('No cutoff-safe evidence placed the time required to establish adoption and integrate the tool across delivery systems.', ['Adoption test duration', 'Integration cycle time', 'Deadline']),
        risk: inferred('The public record identified adoption as unresolved but disclosed no floor that would gate the next release.', ['oea-community-adoption-unproven'], ['Adoption floor', 'Clinical-safety threshold', 'Stop condition']),
      },
    },
    {
      id: 'audit-and-halt-2017-02-19',
      label: 'Audit public and project benched',
      phase: 'outcome',
      knowledgeCutoff: '2017-02-19',
      factRefs: [
        'oea-total-spend',
        'oea-noncompetitive-awards',
        'oea-spend-overshoot',
        'oea-contract-extensions',
        'oea-gift-fund-deficit',
        'oea-incomplete-work-paid',
        'oea-no-epic-integration',
        'oea-never-used-on-patients',
        'oea-benched-2017',
      ],
      systems: {
        discernment: evidenced('Twelve extensions accumulated before the project was benched, with no clinical-use gate cleared.', ['oea-contract-extensions', 'oea-never-used-on-patients', 'oea-benched-2017'], ['Internal extension criteria']),
        invention: inferred('The advisor remained a development asset rather than an adopted clinical offering.', ['oea-never-used-on-patients', 'oea-no-epic-integration'], ['Retained intellectual property', 'Reusable technical components']),
        operations: evidenced('The advisor never integrated with the current EHR and never entered actual patient care.', ['oea-no-epic-integration', 'oea-never-used-on-patients']),
        execution: evidenced('The commitment accumulated twelve extensions and paid incomplete work before the contract expired.', ['oea-contract-extensions', 'oea-incomplete-work-paid', 'oea-benched-2017']),
        advantage: evidenced('The routine-care value proposition failed its minimum observable gate: no actual patient was treated with the advisor.', ['oea-routine-care-goal', 'oea-never-used-on-patients']),
        resource: evidenced('Reported spending reached $62.1 million against $51.4 million of reviewed noncompetitive awards and gift-funded accounts ran deficits.', ['oea-total-spend', 'oea-noncompetitive-awards', 'oea-spend-overshoot', 'oea-gift-fund-deficit']),
      },
      constraints: {
        people: unknown('The terminal record does not place a counted clinical or technical staffing reserve.', ['Clinical staffing requirement', 'Technical staffing capacity', 'Redeployment of project staff']),
        finance: evidenced('Total spend exceeded the reviewed contract value by about $10.7 million and gift-funded accounts were in deficit.', ['oea-total-spend', 'oea-noncompetitive-awards', 'oea-spend-overshoot', 'oea-gift-fund-deficit']),
        time: evidenced('Twelve contract extensions elapsed without routine clinical use before the contract expired.', ['oea-contract-extensions', 'oea-never-used-on-patients', 'oea-benched-2017'], ['Time spent under each extension']),
        risk: evidenced('Clinical readiness and procurement governance both failed: the tool was not integrated, incomplete work was paid, and the reviewed awards were noncompetitive.', ['oea-no-epic-integration', 'oea-incomplete-work-paid', 'oea-noncompetitive-awards']),
      },
    },
  ],
});
