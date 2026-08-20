export type Persona = 'recruiter' | 'peer' | 'curious';

// Answer-shape a question is meant to exercise, mapped to Facia's answerType
// roles: atomic=value, composite=verdict, operational=operation,
// converging=convergence. Lets coverage be reported by pattern, not just persona.
export type QuestionPattern = 'atomic' | 'composite' | 'operational' | 'converging';

export interface Question {
  id: string;
  persona: Persona;
  pattern?: QuestionPattern;
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
