import { expect, test } from '@playwright/test';

// The Klarna flow page is retired: its public URL redirects to the method write-up.
test('retires the public flow URL by redirecting it to the method write-up', async ({ page }) => {
  await page.goto('/stratos-flow');
  await expect(page).toHaveURL(/\/blog\/method$/);
  await expect(page.getByRole('heading', { name: /A way to locate the next responsible commitment/ })).toBeVisible();
});
