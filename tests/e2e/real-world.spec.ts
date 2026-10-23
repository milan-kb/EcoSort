import { expect, test } from '@playwright/test';

test('loaded demo submits and refreshes its local workspace while the browser is offline', async ({
  page,
  context,
}) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await page.getByRole('link', { name: 'Request waste pickup', exact: true }).click();
  const address = `Offline regression ${crypto.randomUUID()}, fictional household`;
  await page.getByLabel('Approximate quantity').fill('1 separated bag');
  await page.getByLabel('Pickup address').fill(address);
  await page.getByLabel('I confirm this waste has been segregated').check();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);
  await expect(page.getByText(address, { exact: true })).toBeVisible();
  await expect(page.locator('.page-title').getByText('Pending', { exact: true })).toBeVisible();
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText(address, { exact: true })).toBeVisible();
});

test('dashboard labels the segregation total as requests, not distinct households', async ({
  page,
}) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
  const confirmedRequests = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('ecosort-demo-v1')!);
    return data.requests.filter(
      (r: { request_type: string; is_segregated: boolean }) =>
        r.request_type === 'pickup' && r.is_segregated,
    ).length;
  });
  const label = page.getByText('Segregated pickup requests', { exact: true });
  await expect(label).toBeVisible();
  await expect(label.locator('..').locator('strong')).toHaveText(String(confirmedRequests));
});
