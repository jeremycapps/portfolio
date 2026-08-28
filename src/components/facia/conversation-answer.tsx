// A chat-native renderer. Where SemanticSurface builds a structured card for a
// standalone surface, this renders a Facia answer the way it would be spoken in
// conversation: prose by default, escalating to more structure only where the
// content is genuinely structured (an operation's reasoning, a career timeline).
//
// It reads the same recipes SemanticSurface does, but composes their fields into
// sentences rather than a chip-and-label list. Depth controls are deliberately
// absent — the answer arrives at a balanced level and shows its own guardrail
// (a caution) inline, rather than hiding it behind an "Inspect" button.

import type { ComponentRecipe, DisclosureDepth, ResolvedFieldV2 } from '@facia/core';

interface ConversationAnswerProps {
  recipe: ComponentRecipe;
  recipesByDepth?: Record<DisclosureDepth, ComponentRecipe>;
}

function itemFields(recipe: ComponentRecipe, index: number): ResolvedFieldV2[] {
  return recipe.visibleFields.find((item) => item.itemIndex === index)?.fields ?? [];
}

function fieldValue(fields: ResolvedFieldV2[], key: string): string | null {
  const field = fields.find((candidate) => candidate.key === key);
  if (field === undefined) return null;
  return Array.isArray(field.value) ? field.value.join(' · ') : String(field.value);
}

function Verdict({ fields }: { fields: ResolvedFieldV2[] }) {
  const answer = fieldValue(fields, 'answer');
  const basis = fieldValue(fields, 'basis');
  return (
    <p className="conversation-answer conversation-verdict">
      <span className="conversation-lead">{answer}</span>
      {basis ? <span> {basis}</span> : null}
    </p>
  );
}

function Operation({ fields }: { fields: ResolvedFieldV2[] }) {
  const relation = fieldValue(fields, 'relation');
  const grounding = fieldValue(fields, 'grounding');
  return (
    <div className="conversation-answer conversation-operation">
      <p className="conversation-relation">{relation}</p>
      {grounding ? (
        <p className="conversation-grounding"><span className="conversation-grounding-label">Grounded in</span> {grounding}</p>
      ) : null}
    </div>
  );
}

function ValueList({ recipe }: { recipe: ComponentRecipe }) {
  return (
    <div className="conversation-answer conversation-list">
      {recipe.visibleFields.map((item) => {
        const title = fieldValue(item.fields, 'title');
        const contribution = fieldValue(item.fields, 'contribution');
        const outcome = fieldValue(item.fields, 'outcome');
        return (
          <p key={item.itemIndex} className="conversation-list-item">
            {title ? <strong>{title}.</strong> : null}
            {contribution ? <span> {contribution}</span> : null}
            {outcome ? <span className="conversation-aside"> {outcome}</span> : null}
          </p>
        );
      })}
    </div>
  );
}

function SingleValue({ fields }: { fields: ResolvedFieldV2[] }) {
  const [head, ...rest] = fields;
  return (
    <p className="conversation-answer conversation-value">
      {head ? <strong>{fieldValue([head], head.key)}</strong> : null}
      {rest.map((f) => <span key={f.key}> — {Array.isArray(f.value) ? f.value.join(' · ') : String(f.value)}</span>)}
    </p>
  );
}

function Timeline({ recipe }: { recipe: ComponentRecipe }) {
  return (
    <ol className="conversation-answer conversation-timeline">
      {recipe.visibleFields.map((item) => {
        const role = fieldValue(item.fields, 'role');
        const org = fieldValue(item.fields, 'organization');
        const period = fieldValue(item.fields, 'period');
        const focus = fieldValue(item.fields, 'focus');
        return (
          <li key={item.itemIndex} className="conversation-timeline-item">
            {period ? <span className="conversation-period">{period}</span> : null}
            <span className="conversation-role">{role}{org ? <span className="conversation-org"> · {org}</span> : null}</span>
            {focus ? <span className="conversation-focus">{focus}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function ConversationAnswer(props: ConversationAnswerProps) {
  // The chat requests a single depth, but a chat answer wants the balanced
  // level — the position and its basis, the relation and its grounding — not
  // the bare glance. Render the focus recipe when it is available.
  const recipe = props.recipesByDepth?.focus ?? props.recipe;
  const ids = new Set(recipe.components.map((component) => component.id));
  const role = recipe.answer.answerType;

  if (ids.has('Timeline')) return <Timeline recipe={recipe} />;
  if (ids.has('OperationDetail')) {
    return <Operation fields={itemFields(recipe, 0)} />;
  }
  if (role === 'verdict') {
    return <Verdict fields={itemFields(recipe, 0)} />;
  }
  if (recipe.answer.items.length > 1) return <ValueList recipe={recipe} />;
  return <SingleValue fields={itemFields(recipe, 0)} />;
}
