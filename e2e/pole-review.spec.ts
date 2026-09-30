import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
  test(`pole review at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto('/pole-review');
    await expect(page.getByRole('heading', { name: '106 telecom poles, checked against a LiDAR scan' })).toBeVisible();
    await expect(page.getByText('72 match the scan · 34 under review')).toBeVisible();
    await expect(page.locator('.pole-marker')).toHaveCount(106);
    await expect(page.locator('tbody tr')).toHaveCount(34);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /World_Light_Gray/);
    await page.screenshot({ path: testInfo.outputPath('light.png'), fullPage: true });
    // The basemap follows the system color scheme; the page has no theme toggle.
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /World_Dark_Gray/);
    await expect(page.locator('.leaflet-tile-pane img[src*="World_Light_Gray"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('dark.png'), fullPage: true });

    await page.getByRole('button', { name: 'Under review (34)', exact: true }).click();
    await expect(page.locator('.pole-marker')).toHaveCount(34);
    await expect(page.locator('tbody tr')).toHaveCount(34);
    await expect(page.locator('.pole-marker .pole-glyph--top_near_ground')).toHaveCount(29);
    await expect(page.locator('.pole-marker .pole-glyph--top_above_pole_range')).toHaveCount(5);
    const marker = page.locator('.pole-marker').first();
    const markerTitle = await marker.getAttribute('title');
    await marker.click();
    await expect(page.locator('#pole-detail-title')).toHaveText(markerTitle!.split(' · ')[0]);
    await expect(page.locator('.pole-detail')).toHaveCSS('position', viewport.width < 900 ? 'fixed' : 'static');
    await page.getByRole('button', { name: 'Close pole detail' }).click();

    await page.getByRole('button', { name: 'Matches scan (72)', exact: true }).click();
    await expect(page.locator('.pole-marker')).toHaveCount(72);
    const row = page.getByRole('button', { name: /Review pole/ }).first();
    const rowId = await row.innerText();
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#pole-detail-title')).toHaveText(`Pole ${rowId}`);
    await expect(page.getByRole('button', { name: 'Under review (34)', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toHaveAttribute('aria-disabled', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // Surface tokens from index.css; wait for them so axe never measures mid-transition.
    const surface = { dark: 'rgb(33, 31, 28)', light: 'rgb(245, 242, 234)' } as const;
    for (const theme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.locator('.leaflet-control-attribution')).toHaveCSS('background-color', surface[theme]);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    }
    await page.keyboard.press('Escape');
    // Shapes retain their identity when color is removed.
    await page.getByRole('button', { name: 'All (106)', exact: true }).click();
    await page.addStyleTag({ content: '.pole-map, .pole-legend { filter: grayscale(1); }' });
    const solid = page.locator('.pole-legend .pole-glyph--matches_scan');
    const ring = page.locator('.pole-legend .pole-glyph--top_near_ground');
    const diamond = page.locator('.pole-legend .pole-glyph--top_above_pole_range');
    await expect(ring).toHaveCSS('border-radius', '50%');
    await expect(diamond).toHaveCSS('border-radius', '0px');
    expect(await diamond.evaluate((element) => getComputedStyle(element).transform)).not.toBe('none');
    expect(await solid.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(await ring.evaluate((element) => getComputedStyle(element).backgroundColor));
    await page.screenshot({ path: testInfo.outputPath('grayscale.png'), fullPage: true });
  });
}

test('pole review is readable without JavaScript and excluded from discovery', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/pole-review');
  await expect(page.getByText('72 match the scan · 34 under review')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(34);
  for (const path of ['/sitemap.xml', '/llms.txt']) {
    expect(await (await request.get(path)).text()).not.toContain('/pole-review');
  }
  await context.close();
});
