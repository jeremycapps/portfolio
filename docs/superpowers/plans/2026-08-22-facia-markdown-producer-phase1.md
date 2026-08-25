# Facia markdown Producer (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render unmodeled portfolio questions as Facia surfaces by having the model emit markdown that a single deterministic Producer maps into an `AnswerSetV2`, instead of hand-authoring a TypeScript Producer per question.

**Architecture:** A model emitting markdown is just another Facia *Producer*. One pure module (`markdownToAnswerSet`) converts markdown → `AnswerSetV2`; `/api/answer` calls it as a fallback when no hand-authored Producer matches; the existing `@facia/core` pipeline resolves it and `SemanticSurface` renders it (new `detail` branch). Markdown is parsed to **data**, never HTML — no injection surface. Cache (Phase 2) is out of scope here.

**Tech Stack:** TypeScript, React, Vite, Vitest, `@facia/core` (in-repo), `marked` (new), OpenRouter via `collectChat`.

**Spec:** `docs/superpowers/specs/2026-08-22-facia-markdown-producer-and-cache-design.md`

## Global Constraints

- The seam is `AnswerSetV2`; `@facia/core` is not modified.
- `markdownToAnswerSet` is pure, deterministic, and **total** — it never throws; any input yields a valid `AnswerSetV2` (worst case, one prose `detail` item).
- Links are allowlisted to `https:` and `mailto:` only; any other scheme is dropped and the label kept as plain text.
- Model-produced items are tagged `payload.evidenceTier: 'model-authored'` and `evidence: { status: 'model-generated' }` (contrast hand-authored `'profile-grounded'`).
- No `dangerouslySetInnerHTML` anywhere; model text lands only in React text nodes and the scheme-checked chip anchor.
- Only one new dependency: `marked`.
- Node.js 20+.
- Tests: `api/**` run under Vitest node env; `src/**` component tests use `renderToStaticMarkup` (see existing `semantic-surface.test.tsx`).

---

### Task 1: `markdownToAnswerSet` Producer (prose, list, links, safety)

**Files:**
- Modify: `package.json` (add `marked` to dependencies)
- Create: `api/_lib/markdown-answer-producer.ts`
- Test: `api/_lib/markdown-answer-producer.test.ts`

**Interfaces:**
- Produces: `markdownToAnswerSet(question: string, markdown: string): AnswerSetV2`
- Consumes: `marked` (`marked.lexer`), `@facia/core` types (`AnswerSetV2`, `FieldInfoV2`).

- [ ] **Step 1: Add the `marked` dependency**

Run:
```bash
npm install marked@^12
```
Expected: `marked` appears under `dependencies` in `package.json` and `package-lock.json` updates.

- [ ] **Step 2: Write the failing tests**

Create `api/_lib/markdown-answer-producer.test.ts`:
```ts
import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { markdownToAnswerSet } from './markdown-answer-producer';

describe('markdownToAnswerSet', () => {
  it('maps a markdown list to a collection that resolves to a list pattern', () => {
    const md = '- Zocdoc\n- Aroko\n- NEW INC';
    const set = markdownToAnswerSet('Where has Jeremy worked?', md);
    expect(set.answerType).toBe('value');
    expect(set.items).toHaveLength(3);
    const result = resolveAnswerSet(set, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.pattern).toBe('list');
  });

  it('maps prose to a single item that resolves to a detail pattern', () => {
    const set = markdownToAnswerSet('Tell me about Jeremy', 'Jeremy is a systems-minded builder.');
    expect(set.items).toHaveLength(1);
    const result = resolveAnswerSet(set, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.pattern).toBe('detail');
  });

  it('keeps https links as a url field and strips the markdown syntax', () => {
    const md = '- [Corus](https://github.com/jeremycapps/corus-workbench)';
    const set = markdownToAnswerSet('repos?', md);
    const item = set.items[0] as { payload: Record<string, unknown>; value: string };
    expect(item.payload.url).toBe('https://github.com/jeremycapps/corus-workbench');
    expect(item.value).toBe('Corus');
  });

  it('drops non-allowlisted link schemes but keeps the label text', () => {
    const md = '- [x](javascript:alert(1))';
    const set = markdownToAnswerSet('q', md);
    const item = set.items[0] as { payload: Record<string, unknown>; value: string };
    expect(item.payload.url).toBeUndefined();
    expect(item.value).toBe('x');
  });

  it('tags every produced item as model-authored', () => {
    const set = markdownToAnswerSet('q', 'Some prose.');
    const item = set.items[0] as { payload: Record<string, unknown> };
    expect(item.payload.evidenceTier).toBe('model-authored');
  });

  it('never throws and always yields a resolvable answer set for odd input', () => {
    for (const md of ['', '###', '| a | b |\n|---|---|\n| 1 | 2 |', '<script>x</script>']) {
      const set = markdownToAnswerSet('q', md);
      const result = resolveAnswerSet(set, { depth: 'glance' });
      expect(result.ok).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run api/_lib/markdown-answer-producer.test.ts`
Expected: FAIL — `markdownToAnswerSet` is not defined / module not found.

- [ ] **Step 4: Implement the Producer**

Create `api/_lib/markdown-answer-producer.ts`:
```ts
import { marked, type Tokens } from 'marked';
import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/;

function safeUrl(url: string): string | null {
  return /^https:\/\//i.test(url) || /^mailto:/i.test(url) ? url : null;
}

// Replace the first markdown link with its label for display; return a safe url if present.
function extractLink(text: string): { display: string; url: string | null } {
  const match = LINK_RE.exec(text);
  if (!match) return { display: text.trim(), url: null };
  const [, label, rawUrl] = match;
  return { display: text.replace(LINK_RE, label).trim(), url: safeUrl(rawUrl) };
}

function modelFields(primaryKey: string, withUrl: boolean): FieldInfoV2 {
  return {
    priority: {
      primary: withUrl ? [primaryKey, 'url'] : [primaryKey],
      secondary: [],
      supporting: [],
      audit: ['evidenceTier'],
    },
  };
}

function modelItem(primaryKey: 'label' | 'summary', text: string) {
  const { display, url } = extractLink(text);
  const payload: Record<string, string> = { [primaryKey]: display, evidenceTier: 'model-authored' };
  if (url) payload.url = url;
  return {
    type: 'Value' as const,
    payload,
    value: display,
    evidence: { status: 'model-generated' },
    fields: modelFields(primaryKey, Boolean(url)),
  };
}

function envelope(question: string, items: AnswerSetV2['items']): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items,
    operations: [],
    // No `density` field: a single value item then resolves to the `detail` pattern.
    trace: {
      kind: 'direct',
      id: 'portfolio.model.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.model' },
        { step: 'source.loaded', value: 'model-generated' },
        { step: 'answer.emitted', value: items.length },
      ],
    },
  };
}

function proseText(markdown: string): string {
  const text = markdown.replace(/[#>*_`-]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : 'No answer was produced.';
}

/** Deterministically map a markdown answer to a Facia AnswerSet. Never throws. */
export function markdownToAnswerSet(question: string, markdown: string): AnswerSetV2 {
  try {
    const tokens = marked.lexer(markdown ?? '');
    const list = tokens.find((t): t is Tokens.List => t.type === 'list');
    if (list && list.items.length > 1) {
      const items = list.items.map((item) => modelItem('label', item.text)) as AnswerSetV2['items'];
      return envelope(question, items);
    }
    return envelope(question, [modelItem('summary', proseText(markdown))] as AnswerSetV2['items']);
  } catch {
    return envelope(question, [modelItem('summary', proseText(markdown))] as AnswerSetV2['items']);
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run api/_lib/markdown-answer-producer.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json api/_lib/markdown-answer-producer.ts api/_lib/markdown-answer-producer.test.ts
git commit -m "feat(answer): add markdown-to-AnswerSet Producer"
```

---

### Task 2: model fallback in `/api/answer`

**Files:**
- Modify: `api/_lib/answer-core.ts` (the `answerSet === null` branch)
- Test: `api/_lib/answer-core.test.ts`

**Interfaces:**
- Consumes: `markdownToAnswerSet` (Task 1), `collectChat` from `./provider`, `systemPrompt` from `./config`.
- Produces: `handleAnswerRequest(request, deps)` gains `deps.produce?: (question: string) => Promise<AnswerSetV2>`.

- [ ] **Step 1: Write the failing test**

Add to `api/_lib/answer-core.test.ts`:
```ts
it('falls back to a produced AnswerSet when no deterministic Producer matches', async () => {
  const produced = {
    schema: 'facia.answer-set/2', question: 'q', answerType: 'value', path: 'meaning',
    inspection: 'available', actionable: false, operations: [],
    items: [{
      type: 'Value', payload: { summary: 'Produced answer.', evidenceTier: 'model-authored' },
      value: 'Produced answer.', evidence: { status: 'model-generated' },
      fields: { priority: { primary: ['summary'], secondary: [], supporting: [], audit: ['evidenceTier'] } },
    }],
  } as const;

  const request = new Request('http://localhost/api/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'anything unmodeled', depth: 'glance' }),
  });

  const response = await handleAnswerRequest(request, {
    answer: () => null,
    produce: async () => produced,
    checkLimit: async () => ({ ok: true }),
  });

  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.recipe.pattern).toBe('detail');
});
```
(Check the top of `answer-core.test.ts` for the existing import of `handleAnswerRequest`; add it if absent.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run api/_lib/answer-core.test.ts`
Expected: FAIL — `produce` is not a recognized dep; the null branch still returns 404 `QUESTION_NOT_MODELED`.

- [ ] **Step 3: Implement the fallback**

In `api/_lib/answer-core.ts`, add imports near the top:
```ts
import { collectChat } from './provider';
import { systemPrompt } from './config';
import { markdownToAnswerSet } from './markdown-answer-producer';
```

Extend the `deps` type in `handleAnswerRequest`'s signature:
```ts
  deps: {
    answer?: AnswerSource;
    produce?: (question: string) => Promise<AnswerSetV2>;
    checkLimit?: RateLimitCheck;
  } = {},
```

Replace the `answerSet === null` block:
```ts
  let answerSet = (deps.answer ?? answerPortfolioQuestion)(validation.value.question);
  if (answerSet === null) {
    const produce = deps.produce ?? (async (question: string) =>
      markdownToAnswerSet(
        question,
        await collectChat([
          { role: 'system', content: systemPrompt() },
          { role: 'user', content: question },
        ]),
      ));
    try {
      answerSet = await produce(validation.value.question);
    } catch (error) {
      console.error('markdown Producer failed:', error);
      return jsonError('The answer service is unavailable.', 'ANSWER_UNAVAILABLE', 502);
    }
  }
```
(`AnswerSetV2` is already imported in this file; confirm and add if not.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run api/_lib/answer-core.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/answer-core.ts api/_lib/answer-core.test.ts
git commit -m "feat(answer): produce a markdown AnswerSet when no deterministic model matches"
```

---

### Task 3: `detail` renderer branch + model-authored tag

**Files:**
- Modify: `src/components/facia/semantic-surface.tsx`
- Modify: `src/index.css` (add `.semantic-detail`, `.semantic-model-tag`)
- Test: `src/components/facia/semantic-surface.test.tsx`

**Interfaces:**
- Consumes: `ComponentRecipe` from `@facia/core` (unchanged); reuses `RepoChip`/`repoLink` from Task 1's chip work already in this file.
- Produces: no exported API change.

- [ ] **Step 1: Write the failing tests**

Add to `src/components/facia/semantic-surface.test.tsx`:
```ts
import { markdownToAnswerSet } from '../../../api/_lib/markdown-answer-producer';

it('renders a prose detail recipe with a model-written tag', () => {
  const set = markdownToAnswerSet('Tell me about Jeremy', 'Jeremy is a systems-minded builder.');
  const result = resolveAnswerSet(set, { depth: 'glance' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  const html = renderToStaticMarkup(
    <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
  );
  expect(html).toContain('data-testid="semantic-detail"');
  expect(html).toContain('Jeremy is a systems-minded builder.');
  expect(html).toContain('semantic-model-tag');
});

it('does not show the model-written tag for a profile-grounded answer', () => {
  const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
  const result = resolveAnswerSet(answer, { depth: 'glance' });
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  const html = renderToStaticMarkup(
    <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
  );
  expect(html).not.toContain('semantic-model-tag');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/facia/semantic-surface.test.tsx`
Expected: FAIL — no `semantic-detail`, no `semantic-model-tag`.

- [ ] **Step 3: Implement the detail branch and tag**

In `src/components/facia/semantic-surface.tsx`, add a helper above `SemanticSurface`:
```ts
function isModelAuthored(recipe: ComponentRecipe): boolean {
  return recipe.answer.items.some(
    (item) =>
      typeof item.payload === 'object' &&
      item.payload !== null &&
      (item.payload as Record<string, unknown>).evidenceTier === 'model-authored',
  );
}

function DetailItem({ fields }: { fields: ResolvedFieldV2[] }) {
  return (
    <article className="semantic-item">
      {fields.map((field) => {
        const link = repoLink(field);
        if (link) return <p key={field.key}><RepoChip url={link} /></p>;
        return <p key={field.key} className="semantic-prose">{displayValue(field.value)}</p>;
      })}
    </article>
  );
}
```

In the component body, add:
```ts
  const supportsDetail = componentIds.has('DetailView');
  const modelAuthored = isModelAuthored(recipe);
```

In the header, after the kicker `<p>`, add the tag:
```tsx
          {modelAuthored && <span className="semantic-model-tag">model-written</span>}
```

Replace the `supportsList ? (...) : (unsupported)` conditional with:
```tsx
      {supportsList ? (
        <div className="semantic-list" data-testid="semantic-list">
          {recipe.visibleFields.map((item) => (
            <FieldList key={item.itemIndex} fields={item.fields} />
          ))}
        </div>
      ) : supportsDetail ? (
        <div className="semantic-detail" data-testid="semantic-detail">
          {recipe.visibleFields.map((item) => (
            <DetailItem key={item.itemIndex} fields={item.fields} />
          ))}
        </div>
      ) : (
        <p className="semantic-unsupported" role="alert">
          This renderer does not support the {recipe.pattern} recipe yet.
        </p>
      )}
```

- [ ] **Step 4: Add styles**

In `src/index.css`, after the `.semantic-repo-chip` rules, add:
```css
.semantic-detail { display: grid; gap: 12px; }
.semantic-prose { margin: 0; color: #4d5d72; font-size: 14px; line-height: 1.6; }
.semantic-model-tag {
  align-self: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(116, 139, 162, 0.16);
  color: #8291a4;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/facia/semantic-surface.test.tsx`
Expected: PASS (all, including the two existing chip tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/facia/semantic-surface.tsx src/components/facia/semantic-surface.test.tsx src/index.css
git commit -m "feat(facia): render detail pattern and mark model-authored answers"
```

---

### Task 4: markdown-subset output contract in the system prompt

**Files:**
- Modify: `content/profile.md` (the "How the assistant should talk about Jeremy" section)

**Interfaces:** none (prompt copy only). No test — verified end-to-end in Task 5.

- [ ] **Step 1: Add the contract**

In `content/profile.md`, inside the "How the assistant should talk about Jeremy" section, add a bullet:
```markdown
- **Output format:** answer in plain markdown using only these constructs —
  short paragraphs, unordered or ordered lists, links (`[label](https://…)`),
  bold/italic emphasis, and inline code. Do not emit raw HTML, images, or
  headings deeper than `##`. Prefer a list when the answer is several items
  (e.g. places worked, technologies); prefer a short paragraph otherwise.
```

- [ ] **Step 2: Regenerate the profile artifact**

Run:
```bash
npm run gen:profile
```
Expected: `api/_lib/profile.generated.ts` updates without error.

- [ ] **Step 3: Commit**

```bash
git add content/profile.md api/_lib/profile.generated.ts
git commit -m "feat(prompt): constrain assistant output to a clean markdown subset"
```

---

### Task 5: full verification

**Files:** none (verification only).

- [ ] **Step 1: Typecheck and full test suite**

Run:
```bash
npm run typecheck && npx vitest run
```
Expected: typecheck clean; all tests pass (including the pre-existing 160 plus the new Producer/answer-core/renderer tests).

- [ ] **Step 2: Start a dev server and drive an unmodeled question**

Start the dev server (`preview_start` name `portfolio-dev`, or `npm run dev` on a free port). In the browser, ask an unmodeled question as the first message of a session, e.g. **"Where has Jeremy worked?"**

- [ ] **Step 3: Confirm the Facia render**

Verify via `read_page` / `javascript_tool`:
- the answer renders inside `data-testid="semantic-list"` or `data-testid="semantic-detail"` (not a raw `.chat-bubble`),
- a `.semantic-model-tag` ("model-written") is present,
- no literal `**`, `-`, or `#` markdown markers appear as text,
- `read_console_messages({onlyErrors:true})` is empty.
Capture a screenshot as proof.

- [ ] **Step 4: Confirm no regression on modeled questions**

Ask "What technologies has Jeremy worked with?" and confirm it still renders the deterministic list with the Corus repo chip and **no** model-written tag.

---

## Notes / explicit non-goals for Phase 1

- **App.tsx is unchanged.** The first-question path already calls
  `sendStructuredAnswer`; it now receives a produced recipe instead of
  `QUESTION_NOT_MODELED`, so unmodeled first questions render as Facia with no
  client change. Routing *follow-up* turns through the structured path (rather
  than chat) is deliberately deferred — it trades away conversational context
  and belongs in a later decision.
- **No cache.** Every uncached unmodeled question calls the model; Phase 2 adds
  the Upstash cache and deterministic replay.
- **Tables** degrade to a prose `detail` item (a markdown table is neither a
  multi-item list nor plain prose, so it falls through to `proseText`).
