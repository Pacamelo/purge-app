import { test } from '@playwright/test';

test.describe('UX Review Screenshots', () => {
  test('capture landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/ux-landing.png', fullPage: true });
  });

  test('capture offline blocked state', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/ux-offline-blocked.png', fullPage: true });
  });

  test('capture trust warning modal', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Look for the "Proceed Online" button and click it
    const proceedButton = page.getByRole('button', { name: /proceed online/i });
    if (await proceedButton.isVisible()) {
      await proceedButton.click();
      await page.waitForTimeout(500);
    }

    // Screenshot the trust warning modal
    await page.screenshot({ path: 'test-results/ux-trust-warning.png', fullPage: true });
  });

  test('capture app with online acknowledged', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Proceed Online" button
    const proceedButton = page.getByRole('button', { name: /proceed online/i });
    if (await proceedButton.isVisible()) {
      await proceedButton.click();
      await page.waitForTimeout(500);

      // Click the checkbox label/container instead of the hidden input
      const checkboxLabel = page.locator('label').filter({ hasText: 'I understand and accept' });
      if (await checkboxLabel.isVisible()) {
        await checkboxLabel.click();
        await page.waitForTimeout(200);
      }

      // Now click "I Understand, Proceed"
      const acknowledgeButton = page.getByRole('button', { name: 'I Understand, Proceed' });
      await page.waitForTimeout(200);
      if (await acknowledgeButton.isEnabled()) {
        await acknowledgeButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'test-results/ux-app-main.png', fullPage: true });
  });
});
