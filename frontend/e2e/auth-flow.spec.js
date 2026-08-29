import { test, expect } from '@playwright/test';

test.describe('Authentication & Landing Page Flow', () => {
  test('should load landing page with hero CTA and features', async ({ page }) => {
    await page.goto('/');

    // Check page title or brand
    await expect(page).toHaveTitle(/TrackAsap/i);

    // Check primary hero elements
    const getStartedBtn = page.getByRole('link', { name: /start your journey|get started|sign in/i });
    await expect(getStartedBtn.first()).toBeVisible();
  });

  test('should navigate to login page and render input fields', async ({ page }) => {
    await page.goto('/login');

    // Verify email and password fields exist
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify submit button
    const submitBtn = page.getByRole('button', { name: /sign in|login/i });
    await expect(submitBtn).toBeVisible();
  });
});
