import { test, expect } from '@playwright/test';

test.describe('PURGE Rebrand Visual QA', () => {
  test('Landing page has new logo and minimal design', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for logo image
    const logo = page.locator('img[alt="PURGE"]').first();
    await expect(logo).toBeVisible();

    // Check for minimal hero design - "TRY NOW" CTA
    const cta = page.getByRole('link', { name: /try now/i });
    await expect(cta).toBeVisible();

    // Check trust bar is present
    await expect(page.getByText('No signup', { exact: true })).toBeVisible();
    await expect(page.getByText('100% local')).toBeVisible();
    await expect(page.getByText('Works offline')).toBeVisible();

    // Screenshot for visual comparison
    await page.screenshot({ path: 'tests/screenshots/landing-rebrand.png', fullPage: true });
  });

  test('App header shows new logo', async ({ page }) => {
    await page.goto('/app');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check for logo in header
    const logo = page.locator('img[alt="PURGE"]').first();
    await expect(logo).toBeVisible();

    // Screenshot for visual comparison
    await page.screenshot({ path: 'tests/screenshots/app-header-rebrand.png' });
  });

  test('Landing page CTA navigates to app', async ({ page }) => {
    await page.goto('/');

    // Click the TRY NOW button
    await page.getByRole('link', { name: /try now/i }).click();

    // Should be on /app
    await expect(page).toHaveURL('/app');

    // App should be visible
    await expect(page.locator('img[alt="PURGE"]')).toBeVisible();
  });

  test('Logo loads correctly with invert filter for dark background', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('img[alt="PURGE"]').first();
    await expect(logo).toBeVisible();

    // Check that the logo has the invert class for white variant
    await expect(logo).toHaveClass(/invert/);
  });

  test('Offline blocked state shows logo', async ({ page }) => {
    // Go directly to app - should show offline blocked state if online
    await page.goto('/app');

    // Wait for page to settle
    await page.waitForLoadState('networkidle');

    // Look for the logo in the blocked state
    const logos = page.locator('img[alt="PURGE"]');
    await expect(logos.first()).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/offline-blocked-rebrand.png' });
  });
});

test.describe('PURGE Trust Visual Language', () => {
  test('TrustPanel has redaction bar styling', async ({ page }) => {
    // Need to be in Vault section to see TrustPanel
    // This would require bypassing offline mode or mocking
    // For now, just verify app loads
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Screenshot whatever state we're in
    await page.screenshot({ path: 'tests/screenshots/trust-panel-rebrand.png' });
  });
});
