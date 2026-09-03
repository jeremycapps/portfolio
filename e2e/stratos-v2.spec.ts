import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('StratOS decision library', () => {
  test('renders the McDonald’s arc without inventing a zero-dollar cost line', async ({ page }) => {
    await page.goto('/stratos-flow');

    await page.getByRole('radio', { name: "McDonald's", exact: true }).check();

    // No disclosed dollars: the convergence read falls back to the offering,
    // and the chart carries no money line at all (asserted below).
    await expect(page.getByText('No dollar goal disclosed — convergence reads on the offering, not spend.'))
      .toBeVisible();

    const timeline = page.getByRole('radiogroup', { name: 'Decision timeline' });
    await expect(timeline.getByRole('radio')).toHaveCount(3);
    await expect(timeline.getByText('no line', { exact: true })).toHaveCount(3);
    await expect(timeline.locator('.sf-spend')).toHaveCount(0);

    await timeline.getByRole('radio').last().check();
    await expect(page.getByText(
      "Get the restaurant-operations lead's read on order accuracy readiness before the next release.",
    )).toBeVisible();
  });

  test('switches between authored cutoff-safe packets with the native radio group', async ({ page }) => {
    await page.goto('/stratos-v2');

    const decision = page.locator('.sv2-decision');
    await expect(decision.getByRole('heading', { name: 'Scaling decision after 68 stores' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /T2 · August 21, 2013/ })).toBeChecked();

    const adobe = page.getByRole('radio', { name: /Adobe Systems Incorporated.*Creative Cloud commitment/ });
    await adobe.check();

    await expect(adobe).toBeChecked();
    await expect(decision.getByRole('heading', { name: 'Subscription transition before renewal evidence' })).toBeVisible();
    await expect(decision.getByText('Adobe Systems Incorporated · T0')).toBeVisible();
    await expect(decision.getByText('Scale the creative business-model transition', { exact: true }).first()).toBeVisible();

    const evidenceRow = decision.locator('.sv2-evidence-item').first();
    await evidenceRow.locator('summary').click();
    await expect(evidenceRow.getByText('Display status')).toBeVisible();
    await expect(evidenceRow.getByText(/Adobe Systems Incorporated Fiscal 2012 Form 10-K/)).toBeVisible();
  });

  test('supports keyboard selection and keeps the selected packet synchronized', async ({ page }) => {
    await page.goto('/stratos-v2');

    const targetT2 = page.getByRole('radio', { name: /T2 · August 21, 2013/ });
    await targetT2.focus();
    await page.keyboard.press('ArrowRight');

    const adobe = page.getByRole('radio', { name: /Adobe Systems Incorporated.*Creative Cloud commitment/ });
    await expect(adobe).toBeChecked();
    await expect(page.locator('.sv2-page-head aside')).toContainText('Adobe Systems Incorporated');
  });

  test('has no automatically detectable accessibility violations in the decision surface', async ({ page }) => {
    await page.goto('/stratos-v2');

    const results = await new AxeBuilder({ page })
      .include('.sv2-decision')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
