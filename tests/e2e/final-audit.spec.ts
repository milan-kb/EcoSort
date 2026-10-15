import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createSeed } from '../../src/data/seed';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS9sAAAAASUVORK5CYII=',
  'base64',
);
async function enter(page: Page, role = 'Resident') {
  await page.goto('/signin');
  await page.getByRole('button', { name: role, exact: true }).click();
}
async function fillPickup(page: Page, address: string) {
  await page.goto('/resident/pickup');
  await page.getByLabel('Approximate quantity').fill('2 bags');
  await page.getByLabel('Pickup address').fill(address);
  await page.getByLabel('I confirm this waste has been segregated').check();
}
async function snapshot(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('ecosort-demo-v1')!)) as Promise<
    ReturnType<typeof createSeed>
  >;
}

test('rapid repeated submissions create only one request', async ({ page }) => {
  await enter(page);
  const address = `QA rapid ${crypto.randomUUID()}`;
  await fillPickup(page, address);
  // Same event-loop turn models keyboard/automation reentry before React disables the button.
  await page.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);
  expect((await snapshot(page)).requests.filter((r) => r.address === address)).toHaveLength(1);
  const record = (await snapshot(page)).requests.find((r) => r.address === address)!;
  expect(record.latitude).toBeNull();
  expect(record.longitude).toBeNull();
});

test('removing and choosing the same photo again keeps preview and persisted evidence consistent', async ({
  page,
}) => {
  await enter(page);
  await fillPickup(page, `QA image ${crypto.randomUUID()}`);
  const image = { name: 'qa.png', mimeType: 'image/png', buffer: png };
  await page.getByLabel('Waste photo').setInputFiles(image);
  await page.getByRole('button', { name: 'Remove photo' }).click();
  expect(
    await page.getByLabel('Waste photo').evaluate((el: HTMLInputElement) => el.files?.length),
  ).toBe(0);
  await page.getByLabel('Waste photo').setInputFiles(image);
  await expect(page.getByAltText('Selected upload preview')).toBeVisible();
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.getByAltText('Submitted waste or dumping-site photograph')).toBeVisible();
});

test('online map toggle keeps OSM attribution and manually entered remote pins visible', async ({
  page,
}) => {
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: png }),
  );
  await enter(page);
  await page.goto('/resident/dumping');
  await page.getByLabel('Online map tiles').check();
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
  await page.getByLabel('Latitude', { exact: true }).fill('11.5');
  await page.getByLabel('Longitude', { exact: true }).fill('77.5');
  const marker = page.locator('.leaflet-interactive');
  await expect(marker).toBeVisible();
  const mapBox = await page.locator('.leaflet-map').boundingBox();
  const markerBox = await marker.boundingBox();
  expect(markerBox!.x).toBeGreaterThanOrEqual(mapBox!.x);
  expect(markerBox!.x).toBeLessThan(mapBox!.x + mapBox!.width);
  await page.locator('.leaflet-map').click({ position: { x: 120, y: 100 } });
  expect(Number(await page.getByLabel('Latitude', { exact: true }).inputValue())).not.toBe(11.5);
  await page.getByLabel('Online map tiles').uncheck();
});

test('corrupt but parseable demo records are recoverable without an uncaught render error', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const seed = createSeed();
  await page.addInitScript(
    ({ seed }) => {
      seed.requests[0].created_at = 'invalid timestamp';
      localStorage.setItem('ecosort-demo-v1', JSON.stringify(seed));
      localStorage.setItem('ecosort-demo-actor', seed.profiles[0].id);
    },
    { seed },
  );
  await page.goto('/resident');
  await expect(page.getByRole('heading', { name: 'Could not load your workspace' })).toBeVisible();
  expect((await snapshot(page)).requests[0].created_at).toBe('invalid timestamp');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Anjali.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('empty analytics, missing storage, invalid inputs and storage quota failure', async ({
  page,
}) => {
  await enter(page, 'Panchayat Administrator');
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('ecosort-demo-v1')!);
    for (const key of ['requests', 'assignments', 'collections', 'history']) data[key] = [];
    localStorage.setItem('ecosort-demo-v1', JSON.stringify(data));
  });
  await page.reload();
  await expect(page.getByTestId('stat-total-requests')).toHaveText('0');
  await page.goto('/admin/analytics');
  await expect(page.getByRole('heading', { name: '0%', exact: true })).toBeVisible();
  await page.evaluate(() => localStorage.removeItem('ecosort-demo-v1'));
  await page.goto('/admin');
  await expect(page.getByTestId('stat-total-requests')).toHaveText('12');
  await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
  await fillPickup(page, `QA invalid ${crypto.randomUUID()}`);
  await page.getByText('Add a map location (optional)', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('91');
  await page.getByLabel('Longitude', { exact: true }).fill('181');
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.locator('#latitude + .field-error')).toBeVisible();
  expect((await snapshot(page)).requests).toHaveLength(12);
  await page.getByRole('button', { name: 'Clear coordinates' }).click();
  await page.getByLabel('Additional details').fill('x'.repeat(2001));
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.locator('#description + .field-error')).toBeVisible();
  await page.getByLabel('Additional details').fill('');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ecosort-demo-v1') throw new DOMException('Quota reached', 'QuotaExceededError');
      original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(
    page.getByText('Browser storage is full or unavailable.', { exact: false }),
  ).toBeVisible();
  expect((await snapshot(page)).requests).toHaveLength(12);
  await expect(
    page.getByRole('heading', { name: 'Request waste pickup', exact: true }),
  ).toBeVisible();
});

test('named assignment modal passes accessibility checks', async ({ page }) => {
  await enter(page, 'Panchayat Administrator');
  await page.goto('/admin/requests/10000001-0000-4000-8000-000000000000');
  await page.getByRole('button', { name: 'Assign collector', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Confirm collector assignment' })).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('role switching during an image submission does not redirect the new role', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function (blob) {
      setTimeout(() => original.call(this, blob), 1000);
    };
  });
  await enter(page);
  const address = `QA role-switch ${crypto.randomUUID()}`;
  await fillPickup(page, address);
  await page
    .getByLabel('Waste photo')
    .setInputFiles({ name: 'qa.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  await expect
    .poll(async () => (await snapshot(page)).requests.filter((r) => r.address === address).length)
    .toBe(1);
  await expect(page).toHaveURL('/admin');
  await page.reload();
  await expect(page.getByTestId('stat-total-requests')).toHaveText('13');
});

test('collector cannot complete unassigned or already-collected jobs; refresh preserves start and completion', async ({
  page,
}) => {
  await enter(page, 'Collector · Ravi Kumar');
  await page.goto('/collector/requests/10000001-0000-4000-8000-000000000000/confirm');
  await expect(
    page.getByRole('heading', { name: 'Collection confirmation unavailable' }),
  ).toBeVisible();
  await page.goto('/collector/requests/10000002-0000-4000-8000-000000000000');
  await page.getByRole('button', { name: 'Start collection' }).click();
  await page.reload();
  await expect(page.locator('.page-title').getByText('In Progress', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Confirm physical collection', exact: true }).click();
  await page.getByRole('button', { name: 'Mark collected & save destination' }).click();
  await expect(page.getByText('Enter the destination name', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Confirm that the waste was physically collected', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Destination name').fill('QA actual handover — fictional');
  await page.getByLabel('What are you recording?').selectOption('handed_over');
  await page.getByLabel('I confirm that this waste has been physically collected').check();
  await page.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(
    page.getByRole('heading', { name: 'Collection confirmation', exact: true }),
  ).toBeVisible();
  await page.reload();
  const data = await snapshot(page);
  expect(data.collections.filter((c) => c.request_id.startsWith('10000002'))).toHaveLength(1);
  expect(
    data.collections.find((c) => c.request_id.startsWith('10000002'))?.destination_status,
  ).toBe('handed_over');
  await page.goto('/collector/requests/10000002-0000-4000-8000-000000000000/confirm');
  await expect(
    page.getByRole('heading', { name: 'Collection confirmation unavailable' }),
  ).toBeVisible();
});
