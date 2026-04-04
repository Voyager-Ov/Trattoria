import { expect, Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'octavio.velo2022@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'seguridad';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');

  const emailInput = page.getByLabel(/email/i);
  const passwordInput = page.getByLabel(/contrase(?:ñ|n)a|password/i);
  const submitButton = page.getByRole('button', { name: /ingresar/i });

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();

  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST',
  );

  await submitButton.click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  await page.waitForLoadState('networkidle');
  if (!/\/admin\/dashboard(?:\/)?$/.test(page.url())) {
    await page.goto('/admin/dashboard');
  }

  await expect(page).toHaveURL(/\/admin\/dashboard(?:\/)?$/);
  await expect(page.getByRole('link', { name: /pedidos/i }).first()).toBeVisible();
}

export async function logoutAsAdmin(page: Page): Promise<void> {
  await logout(page);
}

export async function logout(page: Page): Promise<void> {
  const logoutButton = page
    .getByRole('button', { name: /cerrar sesi(?:ó|o)n/i })
    .or(page.locator('button:has-text("Cerrar sesión")'));

  await expect(logoutButton.first()).toBeVisible();
  await logoutButton.first().click();

  await expect(page).toHaveURL(/\/login(?:\/)?$/);
  await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
}
