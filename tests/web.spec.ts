import { test, expect } from '@playwright/test';

test.describe('Clarity Web App', () => {
  test('Dashboard loads', async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be loaded
    await expect(page).toHaveTitle(/Clarity/);
    // Verify "Clarity" is in the nav
    const navBrand = page.locator('nav a', { hasText: 'Clarity' });
    await expect(navBrand).toBeVisible();
  });

  test('Brain Dump page loads', async ({ page }) => {
    await page.goto('/dump');
    // Verify the textarea input area exists
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    // Verify the placeholder text
    await expect(textarea).toHaveAttribute('placeholder', /dump|mind|write/i);
  });

  test('Create a brain dump', async ({ page }) => {
    await page.goto('/dump');
    // Wait for textarea to be ready
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Type text into the textarea
    const dumpText = 'I need to learn TypeScript and build a side project this month';
    await textarea.fill(dumpText);

    // Click the Capture/submit button
    const submitButton = page.locator('button', { hasText: /Capture/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Verify redirect to dump detail page (URL should be /dump/<some-id>)
    await page.waitForURL(/\/dump\/.+/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/dump\/.+/);
  });

  test('Dump detail page shows raw text and process button', async ({ page }) => {
    // First create a dump so we have a detail page to visit
    await page.goto('/dump');
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    const dumpText = 'Test dump for detail page verification';
    await textarea.fill(dumpText);

    const submitButton = page.locator('button', { hasText: /Capture/i });
    await submitButton.click();

    // Wait for redirect to detail page
    await page.waitForURL(/\/dump\/.+/, { timeout: 15000 });

    // Verify the raw text is shown
    const rawTextSection = page.locator('text=Raw Thoughts');
    await expect(rawTextSection).toBeVisible();

    const rawContent = page.locator('p', { hasText: dumpText });
    await expect(rawContent).toBeVisible();

    // Verify "Process with AI" button exists
    const processButton = page.locator('button', { hasText: /Process with AI/i });
    await expect(processButton).toBeVisible();
  });

  test('Dashboard link in nav works', async ({ page }) => {
    // Start on the dump page
    await page.goto('/dump');
    await expect(page.locator('h1', { hasText: 'Brain Dump' })).toBeVisible();

    // Click Dashboard link in the nav
    const dashboardLink = page.locator('nav a', { hasText: 'Dashboard' });
    await dashboardLink.click();

    // Verify we navigated to dashboard
    await page.waitForURL('/');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('404 page for nonexistent route', async ({ page }) => {
    await page.goto('/nonexistent');
    // Verify not-found page shows
    const notFoundHeading = page.locator('h2', { hasText: /not found/i });
    await expect(notFoundHeading).toBeVisible();
    // Verify the "Back to Dashboard" link exists
    const backLink = page.locator('a', { hasText: /Back to Dashboard/i });
    await expect(backLink).toBeVisible();
  });

  test('Dark mode toggle', async ({ page }) => {
    await page.goto('/');
    // Clear any stored theme preference so we start in light mode
    await page.evaluate(() => localStorage.removeItem('clarity-theme'));
    await page.reload();

    // Verify we start without 'dark' class (or with it depending on system preference)
    const html = page.locator('html');

    // Find and click the theme toggle button
    const themeToggle = page.locator('button[aria-label="Toggle dark mode"]');
    await expect(themeToggle).toBeVisible();

    // Get initial dark state
    const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

    // Click the toggle
    await themeToggle.click();

    // Verify the html element's dark class toggled
    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Click again to toggle back
    await themeToggle.click();

    if (wasDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });
});
