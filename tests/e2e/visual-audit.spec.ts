import { expect, test } from '@playwright/test';
import { createSeed } from '../../src/data/seed';
import { mkdir } from 'node:fs/promises';

for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`major pages fit ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text());
    });
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    const routes = [
      '/resident',
      '/resident/pickup',
      '/resident/dumping',
      '/resident/guide',
      '/resident/requests',
      '/resident/requests/10000004-0000-4000-8000-000000000000',
      '/profile',
      '/about',
      '/collector',
      '/collector/requests/10000005-0000-4000-8000-000000000000',
      '/collector/requests/10000005-0000-4000-8000-000000000000/confirm',
      '/admin',
      '/admin/requests',
      '/admin/assignments',
      '/admin/map',
      '/admin/analytics',
      '/admin/requests/10000001-0000-4000-8000-000000000000',
    ];
    for (const path of routes) {
      if (path === '/collector')
        await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
      if (path === '/admin')
        await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
      await page.goto(path);
      await expect(page.locator('main h1, main h2').first()).toBeVisible();
      if (path === '/admin/map' || path === '/resident/dumping') {
        await expect(page.locator('.leaflet-map')).toBeVisible();
      }
      if (path === '/admin' || path === '/admin/analytics') {
        await expect(page.locator('.recharts-pie-sector').first()).toBeVisible();
      }
      // Recharts' default bar entrance animation is 1.5s of JS-driven geometry;
      // CSS screenshot animation disabling does not settle those paths.
      if (path === '/admin/analytics') await page.waitForTimeout(1700);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
      const name = path.replaceAll('/', '-').slice(1);
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${viewport.width}.png`),
        fullPage: true,
      });
      if (['/resident', '/collector', '/admin'].includes(path)) {
        await mkdir('qa-artifacts', { recursive: true });
        await page.screenshot({
          path: `qa-artifacts/${name}-${viewport.width}.png`,
          fullPage: true,
        });
      }
    }
    expect(errors).toEqual([]);
  });
}

test('maximum-length valid profile and request text stays within mobile layout', async ({
  page,
}) => {
  const seed = createSeed();
  seed.profiles[0].name = 'N'.repeat(80);
  seed.requests[0].address = 'A'.repeat(300);
  seed.requests[0].quantity = 'Q'.repeat(100);
  seed.requests[0].description = 'D'.repeat(2000);
  await page.addInitScript((seed) => {
    localStorage.setItem('ecosort-demo-v1', JSON.stringify(seed));
    localStorage.setItem('ecosort-demo-actor', seed.profiles[0].id);
  }, seed);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    '/resident',
    '/resident/requests',
    `/resident/requests/${seed.requests[0].id}`,
    '/profile',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      path,
    ).toBe(true);
  }
});
