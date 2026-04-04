import { expect, Page, TestInfo } from '@playwright/test';

export type QaIssue = {
  flow: string;
  message: string;
  url?: string;
};

export async function collectIssue(
  issues: QaIssue[],
  flow: string,
  message: string,
  page?: Page,
): Promise<void> {
  issues.push({
    flow,
    message,
    url: page?.url(),
  });
}

export async function attachIssues(testInfo: TestInfo, issues: QaIssue[]): Promise<void> {
  await testInfo.attach('qa-issues.json', {
    body: Buffer.from(JSON.stringify(issues, null, 2), 'utf-8'),
    contentType: 'application/json',
  });
}

export function assertNoIssues(issues: QaIssue[]): void {
  expect(
    issues,
    issues.length
      ? `Se detectaron ${issues.length} hallazgos de QA. Revisá el adjunto qa-issues.json.`
      : 'Sin hallazgos críticos en los flujos auditados.',
  ).toHaveLength(0);
}
