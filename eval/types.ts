export type Persona = 'recruiter' | 'peer' | 'curious';

export interface Question {
  id: string;
  persona: Persona;
  notes?: string;
  turns: string[];
}

export type ProducerKind = 'curated' | 'live';

export interface TokenUsageEstimate {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  method: 'chars-div-4';
}

export interface TurnRecord {
  user: string;
  response: string;
  usageEstimate: TokenUsageEstimate;
}

export interface TranscriptRecord {
  id: string;
  producer: ProducerKind;
  persona?: Persona;
  model: string;
  sample: number;
  timestamp: string;
  turns: TurnRecord[];
  usageEstimate: TokenUsageEstimate;
}
