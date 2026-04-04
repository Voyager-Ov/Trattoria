import { expect, Locator, Page, TestInfo } from '@playwright/test';

export function createUniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  if (page.isClosed()) {
    return;
  }

  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

export async function captureFailure(
  page: Page,
  testInfo: TestInfo,
  name: string,
  error: unknown,
): Promise<never> {
  if (!page.isClosed()) {
    try {
      await page.screenshot({
        path: testInfo.outputPath(`${name}-error.png`),
        fullPage: true,
      });
    } catch {
      // Preserve the original test error even if the page is already torn down.
    }
  }

  throw error;
}

export async function openRadixSelectAndChoose(
  page: Page,
  trigger: Locator,
  optionName: RegExp | string,
): Promise<void> {
  await expect(trigger).toBeVisible();
  await trigger.click();

  const candidates = [
    page.getByRole('option', { name: optionName }).first(),
    page.getByRole('menuitem', { name: optionName }).first(),
    page.locator('[role="option"], [role="menuitem"]').filter({ hasText: optionName }).first(),
    page.locator('[data-radix-popper-content-wrapper]').getByText(optionName).first(),
    page.getByText(optionName).last(),
  ];

  for (const option of candidates) {
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return;
    }
  }

  await expect(candidates[0]).toBeVisible();
}

export async function expectToastOrFeedback(page: Page, expectedText: RegExp): Promise<void> {
  const feedback = page
    .locator('[data-sonner-toast], [role="status"], [role="alert"]')
    .filter({ hasText: expectedText })
    .first()
    .or(page.getByText(expectedText).first());

  await expect(feedback.first()).toBeVisible();
}

export function getQueryParam(url: string, key: string): string | null {
  const parsed = new URL(url);
  return parsed.searchParams.get(key);
}
