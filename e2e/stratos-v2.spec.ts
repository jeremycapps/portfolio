import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('StratOS surfaces', () => {
  test('leads with the 3×2×2 model and Klarna decision instead of framework jargon', async ({ page }) => {
    await page.goto('/stratos-v2');

    await expect(page.getByRole('heading', { name: 'When the company looks healthy inside, but the customer is telling you something else.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The twelve roles resolved into three dimensions.' })).toBeVisible();
    await expect(page.getByText('3 questions', { exact: true })).toBeVisible();
    await expect(page.getByText('2 altitudes', { exact: true })).toBeVisible();
    await expect(page.getByText('2 loci of evidence', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Klarna makes the divergence concrete.' })).toBeVisible();
    await expect(page.getByText('Should Klarna deepen the commitment?')).toBeVisible();
    await expect(page.getByText('FOG + constraint collision', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'HOLD the next increment—not the AI program.' })).toBeVisible();
  });

  test('keeps the 60 outcomes and conversion prototype available as inspection depth', async ({ page }) => {
    await page.goto('/stratos-v2');

    await page.getByText('Explore the 60-cell model', { exact: true }).click();
    const matrix = page.getByRole('table', { name: /Sixty accountable outcomes/ });
    await expect(matrix).toBeVisible();
    await expect(matrix.getByText('Backlog age by segment', { exact: true })).toBeVisible();

    await page.getByText('Inspect the conversion-system prototype', { exact: true }).click();
    await page.getByRole('button', { name: /Operations.*People binds/i }).click();
    await expect(page.getByRole('heading', { name: 'Work → customer-visible flow → corrected system' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Cycle 2 elapsed time in weeks' })).toBeVisible();
  });

  test('has no automatically detectable accessibility violations in the narrative surface', async ({ page }) => {
    await page.goto('/stratos-v2');
    await page.waitForTimeout(700);

    const results = await new AxeBuilder({ page })
      .include('.sv2-workspace')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
