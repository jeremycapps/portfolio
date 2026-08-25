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
  onDepthChange: (depth: DisclosureDepth) => void;
  variant?: 'standalone' | 'conversation';
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'None';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

// A repo/url field carries authored data (never model output), but we still
// only ever emit an anchor for an explicit https link so a stray value can't
// become a link.
function repoLink(field: ResolvedFieldV2): string | null {
  if (field.key !== 'repo' && field.key !== 'url') return null;
  return typeof field.value === 'string' && field.value.startsWith('https://') ? field.value : null;
}

function RepoChip({ url }: { url: string }) {
  const label = url.replace(/^https:\/\/(www\.)?github\.com\//, '').replace(/^https:\/\//, '');
  return (
    <a className="semantic-repo-chip" href={url} target="_blank" rel="noreferrer noopener">
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.35c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z"
        />
      </svg>
      <span>{label}</span>
    </a>
  );
}

function FieldList({ fields }: { fields: ResolvedFieldV2[] }) {
  const [heading, ...details] = fields;
  return (
    <article className="semantic-item">
      <h3>{heading ? displayValue(heading.value) : 'Structured answer'}</h3>
      <dl>
        {details.map((field) => {
          const link = repoLink(field);
          return (
            <div key={field.key} className="semantic-field">
              <dt>{field.key.replace(/([A-Z])/g, ' $1')}</dt>
              <dd>{link ? <RepoChip url={link} /> : displayValue(field.value)}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

export function SemanticSurface({ recipe, onDepthChange, variant = 'standalone' }: SemanticSurfaceProps) {
  const componentIds = new Set(recipe.components.map((component) => component.id));
  const supportsList = componentIds.has('List');
  const supportsToolbar = componentIds.has('InspectionToolbar');
  const audit = recipe.context.depth === 'audit';

  const changeDepth = (depth: DisclosureDepth) => {
    if (depth === recipe.context.depth) return;
    onDepthChange(depth);
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
              onClick={() => changeDepth(depth)}
              data-testid={`button-depth-${depth}`}
            >
              {label}
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
