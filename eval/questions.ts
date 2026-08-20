import yaml from 'js-yaml';
import type { Persona, Question } from './types';

const PERSONAS: readonly Persona[] = ['recruiter', 'peer', 'curious'];

function fail(message: string): never {
  throw new Error(`questions.yaml: ${message}`);
}

export function loadQuestions(yamlText: string): Question[] {
  const raw = yaml.load(yamlText);
  if (!Array.isArray(raw)) fail('top level must be a list of questions');

  const seen = new Set<string>();
  return (raw as unknown[]).map((entry, index) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`entry ${index} must be a mapping`);
    }

    const value = entry as Record<string, unknown>;
    const id = value.id;
    if (typeof id !== 'string' || id.trim() === '') {
      fail(`entry ${index} needs a non-empty string id`);
    }
    if (seen.has(id)) fail(`duplicate id: ${id}`);
    seen.add(id);

    if (typeof value.persona !== 'string' || !PERSONAS.includes(value.persona as Persona)) {
      fail(`id ${id}: persona must be one of ${PERSONAS.join(', ')}`);
    }

    const turns = value.turns;
    if (!Array.isArray(turns) || turns.length < 1 || turns.length > 10) {
      fail(`id ${id}: turns must be a list of 1 to 10 strings`);
    }
    turns.forEach((turn) => {
      if (typeof turn !== 'string' || turn.trim() === '') {
        fail(`id ${id}: each turn must be a non-empty string`);
      }
    });

    if (value.notes !== undefined && typeof value.notes !== 'string') {
      fail(`id ${id}: notes must be a string when present`);
    }

    const question: Question = {
      id,
      persona: value.persona as Persona,
      turns: turns as string[],
    };
    if (typeof value.notes === 'string') question.notes = value.notes;
    return question;
  });
}
