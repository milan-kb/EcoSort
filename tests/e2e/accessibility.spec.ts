import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('WCAG AA automated checks on the public and three role journeys', async ({ page }) => {
  test.setTimeout(90000);
  async function audit(path: string) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect
      .soft(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, failure: n.failureSummary })),
        })),
        path,
      )
      .toEqual([]);
  }
  await audit('/');
  await audit('/signin');
  await audit('/about');
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await audit('/resident');
  await audit('/resident/pickup');
  await audit('/resident/guide');
  await audit('/resident/requests');
  await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
  await audit('/collector');
  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  await audit('/admin');
  await audit('/admin/requests');
  await audit('/admin/analytics');
  await page.setViewportSize({ width: 390, height: 844 });
  await audit('/admin');
  await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
  await audit('/resident');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    outline: getComputedStyle(document.activeElement!).outlineStyle,
  }));
  expect(['A', 'BUTTON', 'SELECT', 'INPUT']).toContain(focus.tag);
  expect(focus.outline).not.toBe('none');
});
