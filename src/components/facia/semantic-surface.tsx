import { useState } from 'react';
import type {
  ComponentRecipe,
  DisclosureDepth,
  ResolvedFieldV2,
} from '@facia/core';

const DEPTHS: Array<{ depth: DisclosureDepth; label: string }> = [
  { depth: 'glance', label: 'Glance' },
  { depth: 'inspect', label: 'Inspect' },
  { depth: 'focus', label: 'Focus' },
  { depth: 'audit', label: 'Audit' },
];

interface SemanticSurfaceProps {
  recipe: ComponentRecipe;
  onDepthChange: (depth: DisclosureDepth) => Promise<void>;
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'None';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

function FieldList({ fields }: { fields: ResolvedFieldV2[] }) {
  const [heading, ...details] = fields;
  return (
    <article className="semantic-item">
      <p className="semantic-item-priority">{heading?.effectivePriority ?? 'primary'}</p>
      <h3>{heading ? displayValue(heading.value) : 'Structured answer'}</h3>
      <dl>
        {details.map((field) => (
          <div key={field.key} className="semantic-field">
            <dt>{field.key.replace(/([A-Z])/g, ' $1')}</dt>
            <dd>{displayValue(field.value)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function SemanticSurface({ recipe, onDepthChange }: SemanticSurfaceProps) {
  const [changingDepth, setChangingDepth] = useState<DisclosureDepth | null>(null);
  const componentIds = new Set(recipe.components.map((component) => component.id));
  const supportsList = componentIds.has('List');
  const supportsDetail = componentIds.has('DetailView');
  const supportsToolbar = componentIds.has('InspectionToolbar')
    || recipe.inspectionControls.includes('inspect');
  const audit = recipe.context.depth === 'audit';

  const changeDepth = async (depth: DisclosureDepth) => {
    if (depth === recipe.context.depth || changingDepth !== null) return;
    setChangingDepth(depth);
    try {
      await onDepthChange(depth);
    } finally {
      setChangingDepth(null);
    }
  };

  return (
    <section className="semantic-surface" aria-labelledby="semantic-question" data-testid="semantic-surface">
      <header className="semantic-header">
        <div>
          <p className="semantic-kicker">Deterministic answer · Facia v2</p>
          <h2 id="semantic-question">{recipe.answer.question}</h2>
        </div>
        <span className="semantic-pattern">{recipe.pattern}</span>
      </header>

      {supportsToolbar && (
        <div className="semantic-depths" aria-label="Answer disclosure depth" data-testid="semantic-depth-controls">
          {DEPTHS.map(({ depth, label }) => (
            <button
              key={depth}
              type="button"
              aria-pressed={recipe.context.depth === depth}
              disabled={changingDepth !== null}
              onClick={() => void changeDepth(depth)}
              data-testid={`button-depth-${depth}`}
            >
              {changingDepth === depth ? 'Loading…' : label}
            </button>
          ))}
        </div>
      )}

      {supportsList ? (
        <div className="semantic-list" data-testid="semantic-list">
          {recipe.visibleFields.map((item) => (
            <FieldList key={item.itemIndex} fields={item.fields} />
          ))}
        </div>
      ) : supportsDetail ? (
        <div className="semantic-detail" data-testid="semantic-detail">
          {recipe.visibleFields.map((item) => (
            <FieldList key={item.itemIndex} fields={item.fields} />
          ))}
        </div>
      ) : (
        <p className="semantic-unsupported" role="alert">
          This renderer does not support the {recipe.pattern} recipe yet.
        </p>
      )}

      {audit && (
        <div className="semantic-audit" data-testid="semantic-audit">
          <h3>Evidence and trace</h3>
          {recipe.answer.items.map((item, index) => (
            <details key={index}>
              <summary>Item {index + 1} evidence</summary>
              <pre>{displayValue(item.evidence ?? null)}</pre>
            </details>
          ))}
          {recipe.answer.trace && (
            <details>
              <summary>Resolution trace</summary>
              <pre>{displayValue(recipe.answer.trace)}</pre>
            </details>
          )}
        </div>
      )}

      <footer className="semantic-meta">
        <span>{recipe.density.source} density: {recipe.density.density}</span>
        <span>{recipe.patternReasonCode}</span>
      </footer>
    </section>
  );
}
