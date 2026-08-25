export interface StratosSource {
  readonly author: string;
  readonly title: string;
  readonly year: number;
  readonly publisher?: string;
  readonly url: string;
  readonly pillar: string;
  readonly framings: Readonly<Record<string, string>>;
}

export interface LensCitation extends StratosSource {
  readonly id: string;
  readonly role: string;
  readonly framing: string;
}

// Bibliographic data and attributed framing are drawn from the canonical
// source records in Tempo/engine/v2/00_Sources. The framing describes the
// concept StratOS borrows; it is not presented as a verbatim quotation.
export const SOURCES: Readonly<Record<string, StratosSource>> = {
  porter_01: {
    author: 'Michael E. Porter',
    title: 'Competitive Strategy: Techniques for Analyzing Industries and Competitors',
    year: 1980,
    publisher: 'Free Press',
    url: 'https://www.hbs.edu/faculty/Pages/profile.aspx?facId=6532',
    pillar: 'Market Positioning',
    framings: {
      thesis: "A firm's advantage is a defensible spread between cost and customer value that it controls through its activity system.",
    },
  },
  maister_07: {
    author: 'David H. Maister, Charles H. Green & Robert M. Galford',
    title: 'The Trusted Advisor',
    year: 2000,
    publisher: 'Free Press',
    url: 'https://davidmaister.com/book/the-trusted-advisor/',
    pillar: 'Advisor Relationship',
    framings: {
      supporting: 'The economic relationship is measured by whether it accumulates or consumes client trust, not just technical delivery.',
    },
  },
  parker_11: {
    author: 'Geoffrey G. Parker, Marshall W. Van Alstyne & Sangeet Paul Choudary',
    title: 'Platform Revolution: How Networked Markets Are Transforming the Economy',
    year: 2016,
    publisher: 'W. W. Norton',
    url: 'https://platformrevolution.com',
    pillar: 'Network Ecosystems',
    framings: {
      counterweight: 'Value is increasingly created by interactions among external participants and network effects, not by owned assets.',
      supporting: 'Parts of the value proposition must be discovered from participant behavior rather than pre-decided.',
    },
  },
  ton_10: {
    author: 'Zeynep Ton',
    title: "The Case for Good Jobs: How Great Companies Bring Dignity, Pay, and Meaning to Everyone's Work",
    year: 2023,
    publisher: 'Harvard Business Review Press',
    url: 'https://goodjobsscorecard.com/',
    pillar: 'Human Economics',
    framings: {
      counterweight: 'Workforce capacity is a strategic asset, not a utilization pool: skill, decision authority, and protected slack can raise total system throughput.',
    },
  },
  dupont_03: {
    author: 'F. Donaldson Brown / DuPont Corporation',
    title: 'DuPont Analysis',
    year: 1914,
    url: 'https://en.wikipedia.org/wiki/DuPont_analysis',
    pillar: 'Financial Return',
    framings: {
      thesis: 'Return decomposes into margin, asset turnover, and leverage; the pole asks which lever drives ROE and whether that driver is durable.',
    },
  },
  minto_02: {
    author: 'Barbara Minto',
    title: 'The Pyramid Principle: Logic in Writing and Thinking',
    year: 1987,
    url: 'https://www.barbaraminto.com',
    pillar: 'Structural Reasoning',
    framings: {
      thesis: 'A governing assertion must rest on a mutually exclusive, collectively exhaustive support structure: conviction that is structured rather than asserted.',
    },
  },
  edmondson_09: {
    author: 'Amy C. Edmondson',
    title: 'Psychological Safety and Learning Behavior in Work Teams',
    year: 1999,
    publisher: 'Administrative Science Quarterly, 44(2), 350–383',
    url: 'https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Group_Performance/Edmondson%20Psychological%20safety.pdf',
    pillar: 'Team Psychology',
    framings: {
      counterweight: 'Contradictory evidence must be able to change the governing conclusion without interpersonal penalty.',
    },
  },
  nist_12: {
    author: 'National Institute of Standards and Technology',
    title: 'AI Risk Management Framework (AI RMF 1.0)',
    year: 2023,
    publisher: 'NIST',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
    pillar: 'Agentic Integrity',
    framings: {
      'governance foundation': 'Every material autonomous decision should be governed, mapped, measured, and managed at its actual scale.',
    },
  },
  anthropic_13: {
    author: 'Yuntao Bai et al. / Anthropic',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    year: 2022,
    publisher: 'arXiv:2212.08073',
    url: 'https://arxiv.org/abs/2212.08073',
    pillar: 'Agentic Integrity',
    framings: {
      'runtime control': 'An agent should critique and revise its proposed action against an explicit constitution at runtime.',
    },
  },
  dora_15: {
    author: 'Nicole Forsgren, Jez Humble & Gene Kim',
    title: 'Accelerate: The Science of Lean Software and DevOps',
    year: 2018,
    publisher: 'IT Revolution',
    url: 'https://itrevolution.com/product/accelerate/',
    pillar: 'Delivery Performance',
    framings: {
      thesis: 'The pole asks how fast change can reach production without raising the failure rate.',
      supporting: 'The efficiency–resilience tradeoff may be a symptom of manual process rather than a structural constraint.',
    },
  },
  teamops_14: {
    author: 'GitLab',
    title: 'TeamOps: Redefining Teamwork',
    year: 2022,
    publisher: 'GitLab',
    url: 'https://about.gitlab.com/teamops/',
    pillar: 'Delegation Protocol',
    framings: {
      supporting: 'Distinguish approval gates that add control from those that are pure coordination tax.',
    },
  },
  nonaka_17: {
    author: 'Ikujiro Nonaka & Hirotaka Takeuchi',
    title: 'The Knowledge-Creating Company',
    year: 1995,
    publisher: 'Oxford University Press',
    url: 'https://global.oup.com/academic/product/the-knowledge-creating-company-9780195092691',
    pillar: 'Knowledge Creation',
    framings: {
      thesis: 'Renewal comes from converting tacit mastery into transferable institutional knowledge.',
    },
  },
  apqc_05: {
    author: 'American Productivity & Quality Center',
    title: 'Process Classification Framework (PCF), v8.0',
    year: 2018,
    publisher: 'APQC',
    url: 'https://www.apqc.org/pcf',
    pillar: 'Process Taxonomy',
    framings: {
      supporting: 'The pace of renewal is bounded by how quickly the process architecture can be changed.',
      thesis: 'The pole asks which processes are defined and stable enough to standardize, compare, or automate.',
    },
  },
  aaker_16: {
    author: 'David A. Aaker',
    title: 'Brand Relevance: Making Competitors Irrelevant',
    year: 2011,
    publisher: 'Jossey-Bass/Wiley',
    url: 'https://www.wiley.com/en-us/Brand+Relevance%3A+Making+Competitors+Irrelevant-p-9780470613580',
    pillar: 'Category Creation',
    framings: {
      thesis: 'The strongest renewal does not compete to be preferred; it creates a new subcategory that makes competitors irrelevant.',
    },
  },
  goldratt_04: {
    author: 'Eliyahu M. Goldratt & Jeff Cox',
    title: 'The Goal: A Process of Ongoing Improvement',
    year: 1984,
    publisher: 'North River Press',
    url: 'https://www.tocinstitute.org/the-goal.html',
    pillar: 'Throughput Physics',
    framings: {
      thesis: 'Output is governed by the single binding constraint limiting the flow of value.',
    },
  },
};

export function lensCitations(lensString: string): LensCitation[] {
  return lensString.split(' · ').map((entry) => {
    const match = /^([a-z][a-z0-9]*_\d+)\s+(.+)$/.exec(entry.trim());
    if (!match) throw new Error(`Invalid StratOS lens entry: ${entry}`);

    const [, id, role] = match;
    const source = SOURCES[id];
    if (!source) throw new Error(`Missing StratOS source: ${id}`);

    const framing = source.framings[role];
    if (!framing) throw new Error(`Missing ${id} framing for lens role: ${role}`);

    return { id, role, framing, ...source };
  });
}
