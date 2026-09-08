import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('StratOS Klarna decision flow', () => {
  test('requires a contemporaneous choice before revealing the structured result and hindsight', async ({ page }) => {
    await page.goto('/stratos-flow');

    await expect(page.getByRole('heading', { name: /I turn ambiguous AI rollouts/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A strong AI pilot hid a capacity decision.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hold the next increment—not the AI program.' })).toBeVisible();
    await expect(page.getByText('Economics', { exact: true })).toBeVisible();
    await expect(page.getByText('StratOps · Architecture', { exact: true })).toBeVisible();
    await expect(page.getByText('External consequence', { exact: true })).toBeVisible();
    await expect(page.getByText('12 poles', { exact: true })).toBeVisible();
    await expect(page.getByText(/In 2025, Klarna’s CEO/)).toHaveCount(0);

    const lock = page.getByRole('button', { name: 'Lock decision and inspect the evidence' });
    await expect(lock).toBeDisabled();
    await page.getByRole('radio', { name: /Reduce scope/ }).check();
    await lock.click();
    const lab = page.locator('.sf-x-lab');
    await expect(lab.getByText('OBSERVED', { exact: true })).toHaveCount(5);
    await expect(lab.getByText('ESTIMATED', { exact: true })).toHaveCount(1);
    await expect(lab.getByText('UNKNOWN', { exact: true })).toHaveCount(3);

    await page.getByRole('button', { name: 'Read the disagreement' }).click();
    await expect(page.getByText('Complex-case external consequence')).toBeVisible();
    await expect(page.getByText('Insufficient evidence ?', { exact: true })).toBeVisible();
    await expect(page.getByText(/still transfers high-complexity work to humans/)).toBeVisible();
    await page.getByRole('button', { name: 'See the StratOS decision' }).click();

    await expect(page.getByText('Your call REDUCE SCOPE')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'HOLD — next scope increment.' })).toBeVisible();
    await expect(page.getByText('Human exception capacity', { exact: true })).toBeVisible();
    await expect(page.locator('.sf-x-result-fields').getByText('L2 · Business case', { exact: true })).toBeVisible();
    await expect(page.getByText(/In 2025, Klarna’s CEO/)).toHaveCount(0);

    await page.getByRole('button', { name: 'See what clears the hold' }).click();
    await expect(page.getByRole('heading', { name: 'Turn uncertainty into an evidence plan.' })).toBeVisible();
    await expect(page.getByText(/fraud, disputes, hardship/)).toBeVisible();
    await expect(page.getByText(/two consecutive 30-day operating cycles/)).toBeVisible();
    await page.getByRole('button', { name: 'Unlock what became known later' }).click();
    await expect(page.getByText('HINDSIGHT · 2025', { exact: true })).toBeVisible();
    await expect(page.getByText(/In 2025, Klarna’s CEO/)).toBeVisible();
  });

  test('keeps the decision experience accessible after evidence is revealed', async ({ page }) => {
    await page.goto('/stratos-flow');
    await page.getByRole('radio', { name: /Hold/ }).check();
    await page.getByRole('button', { name: 'Lock decision and inspect the evidence' }).click();

    const results = await new AxeBuilder({ page }).include('.sf-x-page').analyze();
    expect(results.violations).toEqual([]);
  });

  test('supports the six-step flow at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/stratos-flow');

    await page.getByRole('radio', { name: /Hold/ }).check();
    await page.getByRole('button', { name: 'Lock decision and inspect the evidence' }).click();
    await expect(page.getByRole('heading', { name: 'What the decision still could not establish' })).toBeVisible();
    await page.getByRole('button', { name: 'Read the disagreement' }).click();
    await page.getByRole('button', { name: 'See the StratOS decision' }).click();
    await expect(page.getByText('Binding constraint', { exact: true })).toBeVisible();
  });

  test('makes the recruiter case legible on the homepage without opening the project', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /I turn ambiguous AI rollouts/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore the Klarna decision/ })).toBeVisible();
    await expect(page.getByText('Problem', { exact: true })).toBeVisible();
    await expect(page.getByText('Diagnosis', { exact: true })).toBeVisible();
    await expect(page.getByText('Decision', { exact: true })).toBeVisible();
    await expect(page.getByText(/The model supports the diagnosis; the case demonstrates the judgment/)).toBeVisible();
  });
});
