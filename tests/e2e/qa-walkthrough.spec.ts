/**
 * Comprehensive QA Walkthrough
 * Captures screenshots of all major UI states for UX review
 */

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'test-results/qa-walkthrough';

test.describe('QA Walkthrough - Landing Page', () => {
  test('Landing page - full view with new improvements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for logo animation
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-landing-full.png`,
      fullPage: true,
    });
  });

  test('Landing page - trust badges section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Focus on trust badges area
    const trustBadges = page.locator('.flex.flex-wrap.items-center.justify-center.gap-4');
    if (await trustBadges.count() > 0) {
      await trustBadges.first().screenshot({
        path: `${SCREENSHOT_DIR}/02-trust-badges.png`,
      });
    }
  });

  test('Landing page - how it works section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to How It Works section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-how-it-works.png`,
    });
  });

  test('Landing page - demo preview animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to demo section and wait for animation
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-demo-preview.png`,
    });
  });
});

test.describe('QA Walkthrough - Offline Blocked State', () => {
  test('Offline blocked - full view with platform guides', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-offline-blocked-full.png`,
      fullPage: true,
    });
  });

  test('Offline blocked - platform accordion expanded', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // The detected platform should auto-expand
    // Click on a different platform to show accordion behavior
    const windowsButton = page.locator('button:has-text("Windows")');
    if (await windowsButton.count() > 0) {
      await windowsButton.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-platform-accordion.png`,
    });
  });

  test('Offline blocked - status journey indicator', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Scroll to status indicator
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-status-journey.png`,
    });
  });
});

test.describe('QA Walkthrough - Trust Warning Modal', () => {
  test('Trust warning - modal with visual comparison', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click "Proceed Online" button
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-trust-warning-modal.png`,
    });
  });

  test('Trust warning - checkbox interaction', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);
    }

    // Check the acknowledgment checkbox by clicking the label
    const label = page.locator('label:has-text("I understand")');
    if (await label.count() > 0) {
      await label.click();
      await page.waitForTimeout(200);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-trust-warning-checked.png`,
    });
  });
});

test.describe('QA Walkthrough - Main App Interface', () => {
  test('Main app - drop zone with file type badges', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline requirement
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) {
        await label.click();
        await page.waitForTimeout(200);
      }

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-main-app-dropzone.png`,
      fullPage: true,
    });
  });

  test('Main app - Lumbergh speech with avatar', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) await label.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Focus on Lumbergh speech bubble
    const speechBubble = page.locator('.speech-bubble');
    if (await speechBubble.count() > 0) {
      await speechBubble.first().screenshot({
        path: `${SCREENSHOT_DIR}/11-lumbergh-speech.png`,
      });
    }
  });

  test('Main app - drop zone hover state', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) await label.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Hover over feed slot
    const feedSlot = page.locator('.feed-slot');
    if (await feedSlot.count() > 0) {
      await feedSlot.hover();
      await page.waitForTimeout(200);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-dropzone-hover.png`,
    });
  });
});

test.describe('QA Walkthrough - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test('Mobile - landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-mobile-landing.png`,
      fullPage: true,
    });
  });

  test('Mobile - offline blocked state', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-mobile-offline-blocked.png`,
      fullPage: true,
    });
  });

  test('Mobile - main app with hamburger menu', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) await label.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) await confirmButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-mobile-main-app.png`,
      fullPage: true,
    });
  });

  test('Mobile - sidebar drawer open', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) await label.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) await confirmButton.click();
      await page.waitForTimeout(500);
    }

    // Click hamburger menu
    const menuButton = page.locator('button[aria-label="Toggle trust panel"]');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-mobile-sidebar-open.png`,
    });
  });
});

test.describe('QA Walkthrough - Tablet View', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('Tablet - landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-tablet-landing.png`,
      fullPage: true,
    });
  });

  test('Tablet - main app', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Bypass offline
    const proceedButton = page.locator('button:has-text("Proceed Online")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(300);

      const label = page.locator('label:has-text("I understand")');
      if (await label.count() > 0) await label.click();
      await page.waitForTimeout(200);

      const confirmButton = page.locator('button:has-text("I Understand, Proceed")');
      if (await confirmButton.count() > 0) await confirmButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-tablet-main-app.png`,
      fullPage: true,
    });
  });
});
