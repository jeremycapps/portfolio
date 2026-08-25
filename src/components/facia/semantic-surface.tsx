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
  variant?: 'standalone' | 'conversation';
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

export function SemanticSurface({ recipe, onDepthChange, variant = 'standalone' }: SemanticSurfaceProps) {
  const [changingDepth, setChangingDepth] = useState<DisclosureDepth | null>(null);
  const componentIds = new Set(recipe.components.map((component) => component.id));
  const supportsList = componentIds.has('List');
  const supportsToolbar = componentIds.has('InspectionToolbar');
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
    <section
      className={`semantic-surface semantic-surface-${variant}`}
      aria-label={`Structured answer: ${recipe.answer.question}`}
      data-testid="semantic-surface"
    >
      {variant === 'standalone' && (
        <header className="semantic-header">
          <h2>{recipe.answer.question}</h2>
        </header>
      )}

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
        </div>
      )}
    </section>
  );
}
