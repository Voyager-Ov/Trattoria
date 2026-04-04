import { expect, Page } from '@playwright/test';

import { getQueryParam } from './common';

export async function expectWhatsAppRedirect(
  page: Page,
  expectedParts: string[],
): Promise<string> {
  await expect
    .poll(() => page.url(), { timeout: 15000 })
    .toMatch(/https:\/\/(wa\.me\/.+\?text=|api\.whatsapp\.com\/send\/?\?.*text=)/i);

  const currentUrl = page.url();
  expect(currentUrl).toMatch(/wa\.me\/|api\.whatsapp\.com\/send/i);

  const textParam = getQueryParam(currentUrl, 'text');
  expect(textParam).toBeTruthy();

  const decodedMessage = decodeURIComponent(textParam || '');
  for (const expectedPart of expectedParts) {
    expect(decodedMessage).toContain(expectedPart);
  }

  return decodedMessage;
}
