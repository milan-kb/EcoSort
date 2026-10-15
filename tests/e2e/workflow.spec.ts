import { expect, test } from '@playwright/test';

test('complete household workflow, live totals, persistence and reset', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).hostname === 'localhost') return route.continue();
    externalRequests.push(route.request().url());
    return route.abort();
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await page.getByRole('link', { name: 'Request waste pickup', exact: true }).click();
  await page.getByLabel('Approximate quantity').fill('2 separated bags');
  const uniqueAddress = `QA full journey ${crypto.randomUUID()}, fictional north lane`;
  await page.getByLabel('Pickup address').fill(uniqueAddress);
  await page.getByLabel('I confirm this waste has been segregated').check();
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);
  const requestId = await page.getByRole('heading', { level: 1 }).innerText();
  const detailPath = new URL(page.url()).pathname;
  await expect(page.getByText('Awaiting assignment', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: requestId, exact: true })).toBeVisible();

  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  await expect(page.getByTestId('stat-total-requests')).toHaveText('13');
  const collectedBefore = Number(await page.getByTestId('stat-collected').innerText());
  await page.getByRole('link', { name: 'All requests', exact: true }).click();
  await page.getByRole('link', { name: requestId, exact: true }).click();
  await page.getByLabel('Authorized collector').selectOption({ label: 'Ravi Kumar · Ward 3' });
  await page.getByRole('button', { name: 'Assign collector', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm assignment', exact: true }).click();
  await expect(page.getByText('Ravi Kumar', { exact: true }).first()).toBeVisible();

  await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
  const task = page.locator('article').filter({ hasText: requestId });
  await expect(task).toBeVisible();
  await task.getByRole('button', { name: 'Start collection' }).click();
  await task.getByRole('link', { name: 'Confirm collection' }).click();
  await page.getByLabel('Destination name').fill('Classroom demo sorting point (fictional)');
  await page
    .getByLabel('Collection notes')
    .fill('Physically collected during the synthetic demonstration.');
  await page.getByLabel('I confirm that this waste has been physically collected').check();
  await page.getByRole('button', { name: 'Mark collected & save destination' }).click();
  await expect(
    page.getByRole('heading', { name: 'Collection confirmation', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Intended destination only', { exact: true })).toBeVisible();

  await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
  await page.goto(detailPath);
  await expect(
    page.getByRole('heading', { name: 'Collection confirmation', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.page-title').getByText('Collected', { exact: true })).toBeVisible();
  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  await expect(page.getByTestId('stat-collected')).toHaveText(String(collectedBefore + 1));
  await page.reload();
  await expect(page.getByTestId('stat-collected')).toHaveText(String(collectedBefore + 1));
  const saved = await page.evaluate((address) => {
    const data = JSON.parse(localStorage.getItem('ecosort-demo-v1')!);
    const request = data.requests.find((r: { address: string }) => r.address === address);
    return {
      request,
      collection: data.collections.find((c: { request_id: string }) => c.request_id === request.id),
      history: data.history
        .filter((h: { request_id: string }) => h.request_id === request.id)
        .map((h: { new_status: string }) => h.new_status),
    };
  }, uniqueAddress);
  expect(saved.request.status).toBe('Collected');
  expect(saved.collection.destination_status).toBe('intended');
  expect(saved.history).toEqual(['Pending', 'Assigned', 'In Progress', 'Collected']);
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByTestId('stat-total-requests')).toHaveText('12');
  await expect(page.getByTestId('stat-collected')).toHaveText('3');
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('pickup validation, dumping submission, photo preview and GPS denial alternative', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) =>
          failure({ code: 1 }),
      },
    });
  });
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await page.goto('/resident/pickup');
  await page.getByRole('button', { name: 'Submit pickup request' }).click();
  await expect(page.getByText('Enter an approximate quantity', { exact: true })).toBeVisible();
  await expect(page.getByText('Enter a location with at least 5 characters')).toBeVisible();
  await expect(
    page.getByText('Please segregate waste and confirm before requesting pickup'),
  ).toBeVisible();
  await page.goto('/resident/dumping');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(page.getByText('GPS was denied or unavailable.', { exact: false })).toBeVisible();
  await page.getByLabel('Waste category').selectOption('Mixed');
  await page
    .getByLabel('Location or nearby landmark')
    .fill('Synthetic public dumping site, classroom road');
  await page
    .getByLabel('Describe the dumping site')
    .fill('Mixed waste beside a fictional public footpath.');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS9sAAAAASUVORK5CYII=',
    'base64',
  );
  await page
    .getByLabel('Site photo')
    .setInputFiles({ name: 'demo.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Selected upload preview')).toBeVisible();
  await page.getByRole('button', { name: 'Submit dumping report' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);
  await expect(page.getByText('PUBLIC DUMPING REPORT', { exact: true })).toBeVisible();
  await expect(page.getByAltText('Submitted waste or dumping-site photograph')).toBeVisible();
  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  await page.goto('/admin/requests');
  await page.getByRole('searchbox').fill('classroom road');
  await expect(
    page.getByText('Synthetic public dumping site, classroom road', { exact: true }),
  ).toBeVisible();
});

test('protected routes and unauthorized role access', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/signin$/);
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await expect(page.getByTestId('stat-total-requests')).toHaveCount(0);
  await page.goto('/collector');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
});

test('mobile profile edits persist, shared About works, and sign-out and 404 are functional', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  await page.getByRole('link', { name: 'My profile', exact: true }).click();
  await page.getByLabel('Full name').fill('Anjali Demo');
  await page.getByLabel('Phone number').fill('9999912345');
  await page.getByLabel('Ward', { exact: true }).selectOption('Ward 2');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile updated.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Anjali Demo');
  await expect(page.getByLabel('Ward', { exact: true })).toHaveValue('Ward 2');
  await page.locator('.account-links').getByRole('link', { name: 'About EcoSort' }).click();
  await expect(
    page.getByRole('heading', { name: 'Better systems begin with human care.' }),
  ).toBeVisible();
  await page.goto('/profile');
  await page.locator('.account-links').getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/not-a-real-page');
  await expect(page.getByRole('heading', { name: 'This page isn’t here.' })).toBeVisible();
});

test('responsive navigation and offline maps at phone, tablet and desktop widths', async ({
  page,
}) => {
  await page.goto('/signin');
  await page.getByRole('button', { name: 'Resident', exact: true }).click();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/resident');
    await expect(page.getByRole('heading', { name: 'Hello, Anjali.' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width === 320) {
      const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
      await expect(nav).toBeVisible();
      await nav.getByRole('link', { name: 'My requests' }).click();
      await expect(page.getByRole('heading', { name: 'My requests', exact: true })).toBeVisible();
      await nav.getByRole('link', { name: 'Segregation guide' }).click();
      await expect(
        page.getByRole('heading', { name: 'Separate today. Care for tomorrow.' }),
      ).toBeVisible();
    }
  }
  await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin');
    await expect(page.getByTestId('stat-total-requests')).toHaveText('12');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('/admin/map');
  await expect(
    page.getByText('Offline coordinate view · Synthetic pins', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.leaflet-interactive')).toHaveCount(12);
  await page.screenshot({ path: 'test-results/admin-map-desktop.png', fullPage: true });
  await page.goto('/admin');
  await expect(page.locator('.recharts-pie-sector').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
  await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/resident-mobile.png', fullPage: true });
});
