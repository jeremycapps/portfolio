import { useMemo, useState } from 'react';
import type {
  ComponentRecipe,
  DisclosureDepth,
  InspectionControl,
  ResolvedFieldV2,
} from '@facia/core';

type ElementDepth = Exclude<DisclosureDepth, 'audit'>;
type RecipesByDepth = Record<DisclosureDepth, ComponentRecipe>;
type SortMode = 'source' | 'ascending' | 'descending';

interface SemanticSurfaceProps {
  recipe: ComponentRecipe;
  recipesByDepth?: RecipesByDepth;
  variant?: 'standalone' | 'conversation';
}

interface PresentedItem {
  itemIndex: number;
  fields: ResolvedFieldV2[];
  depth: DisclosureDepth;
  controls: InspectionControl[];
}

const ELEMENT_CONTROLS = new Set<InspectionControl>([
  'inspect',
  'expand',
  'drill-down',
  'view-evidence',
]);

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'None';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

export function nextElementDepth(
  current: ElementDepth,
  control: Extract<InspectionControl, 'inspect' | 'expand' | 'drill-down'>,
): ElementDepth {
  if (control === 'drill-down') return 'focus';
  if (control === 'expand') return current === 'focus' ? 'inspect' : 'focus';
  if (current === 'glance') return 'inspect';
  return current === 'inspect' ? 'glance' : 'inspect';
}

export function updateElementDepth(
  current: Record<number, ElementDepth>,
  itemIndex: number,
  control: Extract<InspectionControl, 'inspect' | 'expand' | 'drill-down'>,
  fallback: ElementDepth = 'glance',
): Record<number, ElementDepth> {
  return {
    ...current,
    [itemIndex]: nextElementDepth(current[itemIndex] ?? fallback, control),
  };
}

function elementControlLabel(control: InspectionControl, depth: DisclosureDepth): string {
  if (control === 'inspect') return depth === 'glance' ? 'Inspect' : 'Less';
  if (control === 'expand') return depth === 'focus' ? 'Collapse' : 'Expand';
  if (control === 'drill-down') return 'Drill down';
  if (control === 'view-evidence') return 'Evidence';
  return control.replace('-', ' ');
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

interface FieldListProps {
  item: PresentedItem;
  evidence: unknown;
  auditMode: boolean;
  evidenceOpen: boolean;
  compareMode: boolean;
  compared: boolean;
  onControl: (control: InspectionControl) => void;
  onCompare: () => void;
}

function FieldList({
  item,
  evidence,
  auditMode,
  evidenceOpen,
  compareMode,
  compared,
  onControl,
  onCompare,
}: FieldListProps) {
  const [heading, ...details] = item.fields;
  const controls = item.controls.filter((control) => (
    ELEMENT_CONTROLS.has(control)
    && (!auditMode || control === 'view-evidence')
  ));

  return (
    <article
      className={`semantic-item${compared ? ' is-compared' : ''}`}
      data-depth={item.depth}
      data-testid={`semantic-item-${item.itemIndex}`}
    >
      <div className="semantic-item-head">
        <div>
          <p className="semantic-item-depth">{item.depth}</p>
          <h3>{heading ? displayValue(heading.value) : 'Structured answer'}</h3>
        </div>
        {compareMode && (
          <button
            className="semantic-item-compare"
            type="button"
            aria-pressed={compared}
            onClick={onCompare}
            data-testid={`button-item-${item.itemIndex}-compare`}
          >
            {compared ? 'Selected' : 'Compare'}
          </button>
        )}
      </div>
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
      {controls.length > 0 && (
        <div className="semantic-item-controls" aria-label={`Inspect item ${item.itemIndex + 1}`}>
          {controls.map((control) => (
            <button
              key={control}
              type="button"
              aria-expanded={control === 'view-evidence' ? evidenceOpen : undefined}
              onClick={() => onControl(control)}
              data-control={control}
              data-testid={`button-item-${item.itemIndex}-${control}`}
            >
              {elementControlLabel(control, item.depth)}
            </button>
          ))}
        </div>
      )}
      {evidenceOpen && (
        <div className="semantic-item-evidence" data-testid={`semantic-item-${item.itemIndex}-evidence`}>
          <p>Evidence</p>
          <pre>{displayValue(evidence ?? null)}</pre>
        </div>
      )}
    </article>
  );
}

// A temporal-sequence entry, rendered as a quiet, static row: the period anchors
// it on the rail, role and organization are the identity, and focus and
// highlight are the only description. Inspection behaviours (inspect, expand,
// evidence, audit) are deliberately omitted here — the timeline is for reading,
// not operating.
interface TimelineEntryProps {
  itemIndex: number;
  fields: ResolvedFieldV2[];
}

function TimelineEntry({ itemIndex, fields }: TimelineEntryProps) {
  const valueOf = (key: string): string | null => {
    const field = fields.find((candidate) => candidate.key === key);
    return field ? displayValue(field.value) : null;
  };
  const role = valueOf('role');
  const organization = valueOf('organization');
  const period = valueOf('period');
  const focus = valueOf('focus');
  const highlight = valueOf('highlight');

  return (
    <li className="timeline-entry" data-testid={`timeline-entry-${itemIndex}`}>
      <span className="timeline-rail" aria-hidden="true">
        <span className="timeline-node" />
      </span>
      <div className="timeline-content">
        <div className="timeline-head">
          {period && <p className="timeline-period">{period}</p>}
          <h3 className="timeline-role">{role ?? 'Role'}</h3>
          {organization && <p className="timeline-org">{organization}</p>}
        </div>
        {focus && <p className="timeline-focus">{focus}</p>}
        {highlight && <p className="timeline-highlight">{highlight}</p>}
      </div>
    </li>
  );
}

function fieldsForItem(recipe: ComponentRecipe, itemIndex: number): ResolvedFieldV2[] {
  return recipe.visibleFields.find((item) => item.itemIndex === itemIndex)?.fields ?? [];
}

function headingValue(item: PresentedItem): string {
  return item.fields.length > 0 ? displayValue(item.fields[0].value) : '';
}

export function SemanticSurface({ recipe, recipesByDepth, variant = 'standalone' }: SemanticSurfaceProps) {
  const componentIds = new Set(recipe.components.map((component) => component.id));
  const supportsList = componentIds.has('List');
  const supportsTimeline = componentIds.has('Timeline');
  const supportsToolbar = componentIds.has('InspectionToolbar');
  const startingDepth: ElementDepth = recipe.context.depth === 'audit' ? 'glance' : recipe.context.depth;
  const itemIndices = recipe.answer.items.map((_, itemIndex) => itemIndex);
  const [itemDepths, setItemDepths] = useState<Record<number, ElementDepth>>(() => (
    Object.fromEntries(itemIndices.map((itemIndex) => [itemIndex, startingDepth]))
  ));
  const [auditMode, setAuditMode] = useState(recipe.context.depth === 'audit');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('source');
  const [traceOpen, setTraceOpen] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<Set<number>>(() => new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [comparedItems, setComparedItems] = useState<Set<number>>(() => new Set());

  const recipeAt = (depth: DisclosureDepth): ComponentRecipe => recipesByDepth?.[depth] ?? recipe;
  // The timeline reads at a fixed focus depth: identity plus focus and highlight,
  // and nothing deeper. Audit provenance stays out of this surface entirely.
  const timelineItems = recipeAt('focus').visibleFields;
  const auditRecipe = recipesByDepth?.audit;
  const auditAvailable = supportsToolbar && auditRecipe !== undefined
    && auditRecipe.inspectionControls.length > 0;

  const presentedItems = useMemo<PresentedItem[]>(() => itemIndices.map((itemIndex) => {
    const depth: DisclosureDepth = auditMode ? 'audit' : (itemDepths[itemIndex] ?? startingDepth);
    const activeRecipe = recipeAt(depth);
    return {
      itemIndex,
      depth,
      fields: fieldsForItem(activeRecipe, itemIndex),
      controls: [...activeRecipe.inspectionControls],
    };
  }), [auditMode, itemDepths, itemIndices.join(','), recipe, recipesByDepth, startingDepth]);

  const activeControls = new Set(presentedItems.flatMap((item) => item.controls));
  const filterAvailable = activeControls.has('filter');
  const sortAvailable = activeControls.has('sort');
  const compareAvailable = activeControls.has('compare');
  const traceAvailable = auditMode && activeControls.has('view-trace');

  const visibleItems = useMemo(() => {
    const normalizedQuery = filterQuery.trim().toLowerCase();
    const filtered = filterAvailable && normalizedQuery
      ? presentedItems.filter((item) => item.fields.some((field) => (
          displayValue(field.value).toLowerCase().includes(normalizedQuery)
        )))
      : [...presentedItems];
    if (!sortAvailable || sortMode === 'source') return filtered;
    const direction = sortMode === 'ascending' ? 1 : -1;
    return filtered.sort((a, b) => headingValue(a).localeCompare(headingValue(b)) * direction);
  }, [filterAvailable, filterQuery, presentedItems, sortAvailable, sortMode]);

  const setElementDepth = (
    itemIndex: number,
    control: Extract<InspectionControl, 'inspect' | 'expand' | 'drill-down'>,
  ) => {
    setItemDepths((current) => updateElementDepth(current, itemIndex, control, startingDepth));
  };

  const toggleSetMember = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    itemIndex: number,
  ) => setter((current) => {
    const next = new Set(current);
    if (next.has(itemIndex)) next.delete(itemIndex);
    else next.add(itemIndex);
    return next;
  });

  const handleElementControl = (itemIndex: number, control: InspectionControl) => {
    if (control === 'inspect' || control === 'expand' || control === 'drill-down') {
      setElementDepth(itemIndex, control);
      return;
    }
    if (control === 'view-evidence') toggleSetMember(setEvidenceItems, itemIndex);
  };

  const cycleSort = () => {
    setSortMode((current) => (
      current === 'source' ? 'ascending' : current === 'ascending' ? 'descending' : 'source'
    ));
  };

  const toggleAudit = () => {
    setAuditMode((current) => !current);
    setTraceOpen(false);
    setEvidenceItems(new Set());
  };

  return (
    <section
      className={`semantic-surface semantic-surface-${variant}${auditMode ? ' is-auditing' : ''}`}
      aria-label={`Structured answer: ${recipe.answer.question}`}
      data-testid="semantic-surface"
    >
      {variant === 'standalone' && (
        <header className="semantic-header">
          <h2>{recipe.answer.question}</h2>
        </header>
      )}

      {!supportsTimeline && supportsToolbar
        && (auditAvailable || filterAvailable || sortAvailable || compareAvailable) && (
        <div className="semantic-affordances" data-testid="semantic-inspection-controls">
          <div className="semantic-affordance-row" aria-label="Answer inspection controls">
            {filterAvailable && (
              <button
                type="button"
                aria-pressed={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
                data-control="filter"
                data-testid="button-affordance-filter"
              >
                Filter
              </button>
            )}
            {sortAvailable && (
              <button
                type="button"
                onClick={cycleSort}
                data-control="sort"
                data-testid="button-affordance-sort"
              >
                {sortMode === 'source' ? 'Sort' : sortMode === 'ascending' ? 'A–Z' : 'Z–A'}
              </button>
            )}
            {compareAvailable && (
              <button
                type="button"
                aria-pressed={compareMode}
                onClick={() => setCompareMode((active) => !active)}
                data-control="compare"
                data-testid="button-affordance-compare"
              >
                Compare{comparedItems.size > 0 ? ` (${comparedItems.size})` : ''}
              </button>
            )}
            {traceAvailable && (
              <button
                type="button"
                aria-expanded={traceOpen}
                onClick={() => setTraceOpen((open) => !open)}
                data-control="view-trace"
                data-testid="button-affordance-view-trace"
              >
                Trace
              </button>
            )}
            {auditAvailable && (
              <button
                className="semantic-audit-trigger"
                type="button"
                aria-pressed={auditMode}
                onClick={toggleAudit}
                data-testid="button-affordance-audit"
              >
                {auditMode ? 'Exit audit' : 'Audit'}
              </button>
            )}
          </div>
          {filterAvailable && filterOpen && (
            <label className="semantic-filter">
              <span>Filter results</span>
              <input
                type="search"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Type to narrow this answer…"
                data-testid="input-affordance-filter"
              />
            </label>
          )}
        </div>
      )}

      {supportsTimeline ? (
        <ol className="semantic-timeline" data-testid="semantic-timeline">
          {timelineItems.map((item) => (
            <TimelineEntry key={item.itemIndex} itemIndex={item.itemIndex} fields={item.fields} />
          ))}
        </ol>
      ) : supportsList ? (
        visibleItems.length > 0 ? (
          <div className="semantic-list" data-testid="semantic-list">
            {visibleItems.map((item) => (
              <FieldList
                key={item.itemIndex}
                item={item}
                evidence={recipe.answer.items[item.itemIndex]?.evidence}
                auditMode={auditMode}
                evidenceOpen={evidenceItems.has(item.itemIndex)}
                compareMode={compareMode && compareAvailable}
                compared={comparedItems.has(item.itemIndex)}
                onControl={(control) => handleElementControl(item.itemIndex, control)}
                onCompare={() => toggleSetMember(setComparedItems, item.itemIndex)}
              />
            ))}
          </div>
        ) : (
          <p className="semantic-empty" data-testid="semantic-empty">No items match that filter.</p>
        )
      ) : (
        <p className="semantic-unsupported" role="alert">
          This renderer does not support the {recipe.pattern} recipe yet.
        </p>
      )}

      {traceOpen && (
        <div className="semantic-audit semantic-trace" data-testid="semantic-trace">
          <h3>Decision trace</h3>
          <pre>{displayValue(recipe.answer.trace ?? null)}</pre>
        </div>
      )}
    </section>
  );
}
