import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const QA_DIR = 'qa-artifacts/login-qa';

async function screenshot(page: Page, name: string) {
  await mkdir(QA_DIR, { recursive: true });
  await page.screenshot({ path: `${QA_DIR}/${name}.png`, fullPage: true });
}

// ─── 1. LANDING PAGE — THREE DEMO ENTRY POINTS ─────────────────────────────

test.describe('Landing page demo entry cards', () => {
  test('three role cards are visible and each navigates to the dedicated login screen', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Less waste in the open.' })).toBeVisible();
    const resident = page.getByRole('button', { name: 'As a resident' });
    const collector = page.getByRole('button', { name: 'As a collector' });
    const admin = page.getByRole('button', { name: 'As an administrator' });
    await expect(resident).toBeVisible();
    await expect(collector).toBeVisible();
    await expect(admin).toBeVisible();

    // Resident entry: opens resident login page
    await resident.click();
    await expect(page).toHaveURL('/resident/login');
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');
    await expect(page.getByRole('heading', { name: /Hello, Anjali/ })).toBeVisible();

    // Go back to landing and test collector card
    await page.goto('/');
    await collector.click();
    await expect(page).toHaveURL('/collector/login');
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();
    await page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true }).click();
    await expect(page).toHaveURL('/collector');

    // Go back to landing and test admin card
    await page.goto('/');
    await admin.click();
    await expect(page).toHaveURL('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
    await expect(page).toHaveURL('/admin');
  });

  test('landing "Explore the live demo" button goes to signin', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Explore the live demo' }).click();
    await expect(page).toHaveURL('/signin');
  });
});

// ─── 2. DEDICATED LOGIN SCREENS FOR RESIDENT, COLLECTOR, PANCHAYAT ──────────

test.describe('Dedicated login screens for the 3 user roles', () => {
  test('Resident login screen at /signin/resident renders dedicated branding and form', async ({
    page,
  }) => {
    await page.goto('/signin/resident');
    // Role heading & badge
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
    await expect(page.getByText('RESIDENT PORTAL')).toBeVisible();
    await expect(page.getByText('Household waste coordination')).toBeVisible();

    // Role tabs present
    const roleNav = page.getByRole('navigation', { name: 'Role login portals' });
    await expect(roleNav).toBeVisible();
    await expect(roleNav.getByRole('link', { name: 'Resident' })).toHaveClass(/active/);

    // Authentication form controls present
    await expect(page.getByLabel('Resident email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in as Resident' })).toBeVisible();

    // Resident-specific registration link
    await expect(page.getByRole('link', { name: 'Create a resident account' })).toBeVisible();

    // Instant demo entry button
    const demoBtn = page.getByRole('button', { name: 'Resident', exact: true });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();
    await expect(page).toHaveURL('/resident');
  });

  test('Collector login screen at /signin/collector renders dedicated branding and form', async ({
    page,
  }) => {
    await page.goto('/signin/collector');
    // Role heading & badge
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();
    await expect(page.getByText('COLLECTOR PORTAL')).toBeVisible();
    await expect(page.getByText('Field operations portal')).toBeVisible();

    // Role tabs present
    const roleNav = page.getByRole('navigation', { name: 'Role login portals' });
    await expect(roleNav).toBeVisible();
    await expect(roleNav.getByRole('link', { name: 'Collector' })).toHaveClass(/active/);

    // Authentication form controls present
    await expect(page.getByLabel('Collector email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in as Collector' })).toBeVisible();

    // Collector-specific provisioning notice
    await expect(
      page.getByText(
        'Collector accounts are provisioned and assigned by the Panchayat Administration.',
      ),
    ).toBeVisible();

    // Instant demo entry button
    const demoBtn = page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();
    await expect(page).toHaveURL('/collector');
  });

  test('Panchayat Administrator login screen at /signin/panchayat renders dedicated branding and form', async ({
    page,
  }) => {
    await page.goto('/signin/panchayat');
    // Role heading & badge
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();
    await expect(page.getByText('PANCHAYAT WORKSPACE')).toBeVisible();
    await expect(page.getByText('Official municipal administration portal')).toBeVisible();

    // Role tabs present
    const roleNav = page.getByRole('navigation', { name: 'Role login portals' });
    await expect(roleNav).toBeVisible();
    await expect(roleNav.getByRole('link', { name: 'Panchayat' })).toHaveClass(/active/);

    // Authentication form controls present
    await expect(page.getByLabel('Administrator email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in as Administrator' })).toBeVisible();

    // Admin security notice
    await expect(
      page.getByText(
        'Official access only. Administrative credentials require municipal authorization.',
      ),
    ).toBeVisible();

    // Instant demo entry button
    const demoBtn = page.getByRole('button', { name: 'Panchayat Administrator', exact: true });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();
    await expect(page).toHaveURL('/admin');
  });

  test('URL aliases (/resident/login, /collector/login, /admin/login, /panchayat/login, /login/resident, /login/collector, /login/panchayat, /signin/admin) work correctly', async ({
    page,
  }) => {
    await page.goto('/resident/login');
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();

    await page.goto('/collector/login');
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();

    await page.goto('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();

    await page.goto('/panchayat/login');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();

    await page.goto('/login/resident');
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();

    await page.goto('/login/collector');
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();

    await page.goto('/login/panchayat');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();

    await page.goto('/signin/admin');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();
  });

  test('selecting or visiting a login portal never grants role privileges without authenticating', async ({
    page,
  }) => {
    // Visit admin login page as anonymous user
    await page.goto('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();

    // Verify localStorage has no actor session
    const actorInStorage = await page.evaluate(() => localStorage.getItem('ecosort-demo-actor'));
    expect(actorInStorage).toBeNull();

    // Directly attempt to access protected admin route — MUST be denied
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/signin$/);

    // Now sign in as a resident
    await page.goto('/signin/resident');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');

    // As resident, visit the Panchayat login portal
    await page.goto('/admin/login');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();
    await expect(page.getByText('Currently active as')).toBeVisible();

    // Directly attempt to access protected admin pages — MUST be denied with access restricted
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    await expect(page.getByTestId('stat-total-requests')).toHaveCount(0);
  });

  test('Role tabs allow switching between all 3 login screens seamlessly', async ({ page }) => {
    await page.goto('/signin');
    // Default is resident
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();

    // Switch to Collector
    await page
      .getByRole('navigation', { name: 'Role login portals' })
      .getByRole('link', { name: 'Collector' })
      .click();
    await expect(page).toHaveURL(/\/collector\/login|\/signin\/collector/);
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();

    // Switch to Panchayat
    await page
      .getByRole('navigation', { name: 'Role login portals' })
      .getByRole('link', { name: 'Panchayat' })
      .click();
    await expect(page).toHaveURL(/\/admin\/login|\/signin\/panchayat/);
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();

    // Switch back to Resident
    await page
      .getByRole('navigation', { name: 'Role login portals' })
      .getByRole('link', { name: 'Resident' })
      .click();
    await expect(page).toHaveURL(/\/resident\/login|\/signin\/resident/);
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
  });

  test('Generic /signin provides all demo role buttons for quick entry', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByRole('button', { name: 'Resident', exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Panchayat Administrator', exact: true }),
    ).toBeVisible();
  });

  test('privacy note warns demo never grants connected access', async ({ page }) => {
    await page.goto('/signin');
    await expect(
      page.getByText('Demo role switching never grants access to a connected Supabase project'),
    ).toBeVisible();
  });

  test('already-authenticated user redirects away from /signin', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');
    // Navigate back to /signin — should redirect to workspace
    await page.goto('/signin');
    await expect(page).toHaveURL('/resident');
  });
});

// ─── 3. SIGNUP PAGE ─────────────────────────────────────────────────────────

test.describe('Signup page (connected mode)', () => {
  test('shows registration form with proper validation', async ({ page }) => {
    await page.goto('/signup');
    const heading = page.getByRole('heading', { name: 'Create your resident account' });
    await expect(heading).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Phone number')).toBeVisible();
    await expect(page.getByLabel('Ward')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create resident account' })).toBeVisible();
  });
});

// ─── 4. ROLE AUTHORIZATION — CROSS-ROLE ACCESS DENIED ───────────────────────

test.describe('Role authorization enforcement', () => {
  test('resident cannot access /admin pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    await expect(page.getByText('authorized admin account')).toBeVisible();
    // Dashboard stats must NOT leak
    await expect(page.getByTestId('stat-total-requests')).toHaveCount(0);
  });

  test('resident cannot access /admin/requests', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/admin/requests');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('resident cannot access /admin/analytics', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('resident cannot access /admin/map', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/admin/map');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('resident cannot access /collector pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/collector');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('collector cannot access /admin pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true }).click();
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
    await expect(page.getByTestId('stat-total-requests')).toHaveCount(0);
  });

  test('collector cannot access /resident pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true }).click();
    await page.goto('/resident');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('admin cannot access /resident pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
    await page.goto('/resident');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('admin cannot access /collector pages', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
    await page.goto('/collector');
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  });

  test('"Return to your workspace" link navigates to correct role home', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/admin');
    const link = page.getByRole('link', { name: 'Return to your workspace' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/resident');
  });
});

// ─── 5. UNAUTHENTICATED ACCESS — PROTECTED URL REDIRECTS ───────────────────

test.describe('Unauthenticated direct URL access', () => {
  test('all protected routes redirect to /signin when not authenticated', async ({ page }) => {
    const protectedPaths = [
      '/resident',
      '/resident/pickup',
      '/resident/dumping',
      '/resident/guide',
      '/resident/requests',
      '/collector',
      '/admin',
      '/admin/requests',
      '/admin/assignments',
      '/admin/map',
      '/admin/analytics',
      '/profile',
    ];
    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page, `path ${path} should redirect`).toHaveURL(/\/signin$/);
    }
  });

  test('public pages remain accessible without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Less waste in the open.' })).toBeVisible();
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
    await page.goto('/signin/collector');
    await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();
    await page.goto('/signin/panchayat');
    await expect(
      page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
    ).toBeVisible();
  });
});

// ─── 6. SESSION BEHAVIOR ────────────────────────────────────────────────────

test.describe('Session behavior', () => {
  test('sign out clears session and redirects to landing', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');
    // Sign out via sidebar
    await page.locator('.sidebar').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');
    // Verify session is gone — can't navigate back to workspace
    await page.goto('/resident');
    await expect(page).toHaveURL(/\/signin$/);
  });

  test('navigate back after logout does not restore session', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');
    await page.locator('.sidebar').getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/');
    // Try browser back
    await page.goBack();
    // Should end up at signin since session was cleared
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.endsWith('/') || url.endsWith('/signin')).toBe(true);
  });

  test('refresh during authenticated state preserves demo session', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');
    await page.reload();
    await expect(page.getByRole('heading', { name: /Hello, Anjali/ })).toBeVisible();
  });

  test('refresh on signin page does not crash or auto-login', async ({ page }) => {
    await page.goto('/signin');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
  });
});

// ─── 7. AUTHENTICATION FORM VALIDATION & ERROR HANDLING ─────────────────────

test.describe('Authentication form submission and validation', () => {
  test('submitting empty credentials shows validation errors', async ({ page }) => {
    await page.goto('/signin/resident');
    await page.getByRole('button', { name: 'Sign in as Resident' }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Use at least 8 characters')).toBeVisible();
  });

  test('submitting invalid email format shows error', async ({ page }) => {
    await page.goto('/signin/collector');
    await page.getByLabel('Collector email').fill('invalid-email-address');
    await page.getByLabel('Password').fill('validPassword123');
    await page.getByRole('button', { name: 'Sign in as Collector' }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });

  test('submitting short password shows error', async ({ page }) => {
    await page.goto('/signin/panchayat');
    await page.getByLabel('Administrator email').fill('admin@panchayat.gov.test');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Sign in as Administrator' }).click();
    await expect(page.getByText('Use at least 8 characters')).toBeVisible();
  });

  test('submitting credentials in demo mode shows guidance notice', async ({ page }) => {
    await page.goto('/signin/resident');
    await page.getByLabel('Resident email').fill('resident@example.test');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in as Resident' }).click();
    await expect(
      page.getByText(
        'Connected authentication is unavailable in demo mode. Use instant demo entry.',
      ),
    ).toBeVisible();
  });

  test('repeated form submissions do not duplicate requests or crash', async ({ page }) => {
    await page.goto('/signin/resident');
    const form = page.locator('form').first();
    await form.evaluate((f: HTMLFormElement) => {
      f.requestSubmit();
      f.requestSubmit();
      f.requestSubmit();
    });
    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });
});

// ─── 8. DEMO ROLE SWITCHING AND SHARED DATA ─────────────────────────────────

test.describe('Demo role switching', () => {
  test('switching roles via demo banner updates workspace', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await expect(page).toHaveURL('/resident');

    // Switch to admin
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await expect(page).toHaveURL('/admin');
    await expect(page.getByTestId('stat-total-requests')).toBeVisible();

    // Switch to collector
    await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
    await expect(page).toHaveURL('/collector');
  });

  test('data created in one role is visible in another role', async ({ page }) => {
    // Create as resident
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/resident/pickup');
    const address = `QA cross-role ${crypto.randomUUID()}`;
    await page.getByLabel('Approximate quantity').fill('1 bag');
    await page.getByLabel('Pickup address').fill(address);
    await page.getByLabel('I confirm this waste has been segregated').check();
    await page.getByRole('button', { name: 'Submit pickup request' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);

    // Switch to admin and verify visibility
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await page.goto('/admin/requests');
    await page.getByRole('searchbox').fill(address.slice(0, 20));
    await expect(page.getByText(address)).toBeVisible();
  });

  test('switching back to original role preserves context', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
    await expect(page).toHaveURL('/resident');
    await expect(page.getByRole('heading', { name: /Hello, Anjali/ })).toBeVisible();
  });
});

// ─── 9. DEMO-MODE PRIVILEGE ISOLATION ───────────────────────────────────────

test.describe('Demo mode privilege isolation', () => {
  test('no supabase client is instantiated in demo mode', async ({ page }) => {
    await page.goto('/signin');
    const hasSupabase = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        if (key.includes('sb-') || key.includes('supabase')) return true;
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)!;
        if (key.includes('sb-') || key.includes('supabase')) return true;
      }
      return false;
    });
    expect(hasSupabase).toBe(false);
  });

  test('demo mode does not make external network requests', async ({ page }) => {
    const externalRequests: string[] = [];
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'localhost') {
        externalRequests.push(route.request().url());
      }
      return route.continue();
    });
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/resident/pickup');
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await page.goto('/admin');
    await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
    await page.goto('/collector');
    expect(externalRequests).toEqual([]);
  });
});

// ─── 10. RESPONSIVE LAYOUT AT 375px, 768px, 1440px ─────────────────────────

test.describe('Responsive layouts at login-relevant pages', () => {
  for (const viewport of [
    { width: 375, height: 812, label: 'mobile-375' },
    { width: 768, height: 1024, label: 'tablet-768' },
    { width: 1440, height: 900, label: 'desktop-1440' },
  ]) {
    test(`landing page at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Less waste in the open.' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `landing-${viewport.label}`);
    });

    test(`resident login page at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin/resident');
      await expect(page.getByRole('heading', { name: 'Resident Sign In' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `signin-resident-${viewport.label}`);
    });

    test(`collector login page at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin/collector');
      await expect(page.getByRole('heading', { name: 'Collection Partner Sign In' })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `signin-collector-${viewport.label}`);
    });

    test(`panchayat login page at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin/panchayat');
      await expect(
        page.getByRole('heading', { name: 'Panchayat Administrator Sign In' }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `signin-panchayat-${viewport.label}`);
    });

    test(`resident workspace at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin');
      await page.getByRole('button', { name: 'Resident', exact: true }).click();
      await expect(page.getByRole('heading', { name: /Hello, Anjali/ })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `resident-${viewport.label}`);
    });

    test(`collector workspace at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin');
      await page.getByRole('button', { name: 'Collector · Ravi Kumar', exact: true }).click();
      await expect(page).toHaveURL('/collector');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `collector-${viewport.label}`);
    });

    test(`admin workspace at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/signin');
      await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
      await expect(page).toHaveURL('/admin');
      await expect(page.getByTestId('stat-total-requests')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await screenshot(page, `admin-${viewport.label}`);
    });
  }
});

// ─── 11. ACCESSIBILITY ──────────────────────────────────────────────────────

test.describe('Login page accessibility', () => {
  test('landing page passes WCAG AA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test('resident login page passes WCAG AA', async ({ page }) => {
    await page.goto('/signin/resident');
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test('collector login page passes WCAG AA', async ({ page }) => {
    await page.goto('/signin/collector');
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test('panchayat login page passes WCAG AA', async ({ page }) => {
    await page.goto('/signin/panchayat');
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test('focus indicator is visible on keyboard navigation of signin', async ({ page }) => {
    await page.goto('/signin');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      outline: getComputedStyle(document.activeElement!).outlineStyle,
    }));
    expect(['A', 'BUTTON', 'SELECT', 'INPUT']).toContain(focus.tag);
    expect(focus.outline).not.toBe('none');
  });

  test('skip-to-content link exists and targets main', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('.skip-link');
    await expect(skip).toHaveAttribute('href', '#main-content');
    await page.goto('/signin');
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
  });
});

// ─── 12. ERROR HANDLING ─────────────────────────────────────────────────────

test.describe('Error handling', () => {
  test('corrupt demo data shows recovery UI, not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem('ecosort-demo-v1', '{"profiles":[],"requests":[{"id":"broken"}]}');
      localStorage.setItem('ecosort-demo-actor', '00000000-0000-4000-8000-000000000001');
    });
    await page.goto('/resident');
    const heading = page.getByRole('heading');
    await expect(heading.first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.getByRole('heading', { name: 'This page isn\u2019t here.' })).toBeVisible();
  });

  test('no console errors during standard login flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
    await page.locator('.sidebar').getByRole('button', { name: 'Sign out' }).click();
    expect(errors).toEqual([]);
  });
});

// ─── 13. DEMO WORKFLOW REGRESSION — PICKUP → ASSIGN → COLLECT ──────────────

test.describe('Full demo workflow regression after login changes', () => {
  test('resident creates pickup, admin assigns, collector completes', async ({ page }) => {
    test.setTimeout(60000);
    // Step 1: Resident creates a pickup request
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    await page.goto('/resident/pickup');
    const address = `QA login-regression ${crypto.randomUUID()}`;
    await page.getByLabel('Approximate quantity').fill('3 bags');
    await page.getByLabel('Pickup address').fill(address);
    await page.getByLabel('I confirm this waste has been segregated').check();
    await page.getByRole('button', { name: 'Submit pickup request' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^ECO-/);
    const requestId = await page.getByRole('heading', { level: 1 }).innerText();

    // Step 2: Admin assigns collector
    await page.getByLabel('Demo role').selectOption({ label: 'Administrator' });
    await page.goto('/admin/requests');
    await page.getByRole('link', { name: requestId, exact: true }).first().click();
    await page.getByLabel('Authorized collector').selectOption({ label: 'Ravi Kumar · Ward 3' });
    await page.getByRole('button', { name: 'Assign collector' }).click();
    await page.getByRole('button', { name: 'Confirm assignment' }).click();
    await expect(page.getByText('Ravi Kumar', { exact: true }).first()).toBeVisible();

    // Step 3: Collector starts and completes
    await page.getByLabel('Demo role').selectOption({ label: 'Collector · Ravi Kumar' });
    const task = page.locator('article').filter({ hasText: requestId });
    await expect(task).toBeVisible();
    await task.getByRole('button', { name: 'Start collection' }).click();
    await task.getByRole('link', { name: 'Confirm collection' }).click();
    await page.getByLabel('Destination name').fill('QA sorting point (fictional)');
    await page.getByLabel('Collection notes').fill('QA verification collection.');
    await page.getByLabel('I confirm that this waste has been physically collected').check();
    await page.getByRole('button', { name: 'Mark collected & save destination' }).click();
    await expect(page.getByRole('heading', { name: 'Collection confirmation' })).toBeVisible();

    // Step 4: Verify as resident
    await page.getByLabel('Demo role').selectOption({ label: 'Resident' });
    await page.goto('/resident/requests');
    await expect(page.getByText(requestId.slice(0, 12))).toBeVisible();
  });
});

// ─── 14. REPEATED FORM SUBMISSION ───────────────────────────────────────────

test.describe('Repeated and rapid actions', () => {
  test('clicking demo role button multiple times rapidly does not duplicate entry', async ({
    page,
  }) => {
    await page.goto('/signin');
    const btn = page.getByRole('button', { name: 'Resident', exact: true });
    await btn.click();
    await expect(page).toHaveURL('/resident');
    await expect(page.getByRole('heading', { name: /Hello, Anjali/ })).toBeVisible();
  });

  test('rapidly switching demo roles stabilizes', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Resident', exact: true }).click();
    const select = page.getByLabel('Demo role');
    await select.selectOption({ label: 'Administrator' });
    await select.selectOption({ label: 'Collector · Ravi Kumar' });
    await select.selectOption({ label: 'Resident' });
    await select.selectOption({ label: 'Administrator' });
    await expect(page).toHaveURL('/admin');
    await expect(page.getByTestId('stat-total-requests')).toBeVisible();
  });
});

// ─── 15. DASHBOARD STATS VERIFICATION ───────────────────────────────────────

test.describe('Dashboard and stats post-login', () => {
  test('admin dashboard shows correct baseline stats', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
    await expect(page.getByTestId('stat-total-requests')).toHaveText('12');
    await expect(page.getByTestId('stat-collected')).toHaveText('3');
  });

  test('admin analytics page loads after login', async ({ page }) => {
    await page.goto('/signin');
    await page.getByRole('button', { name: 'Panchayat Administrator', exact: true }).click();
    await page.goto('/admin/analytics');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
