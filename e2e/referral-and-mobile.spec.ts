import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';

const DIR = 'e2e-screenshots';
mkdirSync(DIR, { recursive: true });

// Flux parrainage : un lien /ref/[code] propage le code à l'inscription.
test('le lien de parrainage préremplit le code', async ({ page }) => {
  await page.goto('/ref/AURADEMO');
  await page.waitForURL('**/register**');
  expect(page.url()).toContain('ref=AURADEMO');
  // La bannière « 1 mois offert » s'affiche avec le code.
  await expect(page.getByText(/AURADEMO/)).toBeVisible();
  await page.screenshot({ path: `${DIR}/20-referral-link.png`, fullPage: true });
});

// Mobile : bottom bar visible, zones tactiles suffisantes.
test('navigation mobile (bottom bar)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Spécifique au projet mobile (iPhone 14).');

  const email = `e2e.m.${Date.now()}@example.com`;
  page.on('dialog', (d) => d.accept());

  await page.goto('/register');
  await page.fill('#name', 'Mobile E2E');
  await page.fill('#brandName', 'Mobile Fit');
  await page.fill('#email', email);
  await page.fill('#password', 'Av3nir!Solide');
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 30_000 }), page.click('button[type="submit"]')]);

  await page.fill('input[name="displayName"]', 'Mobile E2E');
  await page.fill('input[name="speciality"]', 'Cardio');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // La bottom bar mobile doit être visible (md:hidden → visible en < md).
  const bottomNav = page.locator('nav[aria-label="Navigation principale"]');
  await expect(bottomNav).toBeVisible();

  // Zones tactiles ≥ 44px.
  const firstItem = bottomNav.locator('a').first();
  const box = await firstItem.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: `${DIR}/21-mobile-dashboard.png`, fullPage: true });
});
