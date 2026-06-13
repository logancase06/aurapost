import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'fs';

// Flux complet : inscription → onboarding → génération → approbation → site → publication.
// Mode mock (AURAPOST_USE_MOCK=1, SQLite mémoire) : aucun secret requis.

const DIR = 'e2e-screenshots';
mkdirSync(DIR, { recursive: true });

const unique = Date.now();
const email = `e2e.coach.${unique}@example.com`;
const password = 'Av3nir!Solide';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

test.describe.configure({ mode: 'serial' });

test('parcours coach complet', async ({ page }) => {
  page.on('dialog', (d) => d.accept());

  // 1. Landing
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await shot(page, '01-landing');

  // 2. Inscription
  await page.goto('/register');
  await page.fill('#name', 'Coach E2E');
  await page.fill('#brandName', 'E2E Fitness');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await shot(page, '02-register');
  await Promise.all([
    page.waitForURL('**/onboarding**', { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 3. Onboarding profil
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="displayName"]', 'Coach E2E');
  await page.fill('input[name="speciality"]', 'Préparation physique');
  const city = page.locator('input[name="city"]');
  if (await city.count()) await city.fill('Toulouse');
  await shot(page, '03-onboarding');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // 4. Dashboard + génération
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await shot(page, '04-dashboard-empty');

  const genBtn = page.locator('text=Créer mes 12 posts');
  if (await genBtn.count()) {
    await genBtn.first().click();
    await page.waitForTimeout(6000);
  }
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await shot(page, '05-dashboard-posts');

  // 5. Approbation d'un post
  const approve = page.locator('button:has-text("Approuver")');
  if (await approve.count()) {
    await approve.first().click();
    await page.waitForTimeout(1500);
    await shot(page, '06-post-approved');
  }

  // 6. Calendrier éditorial
  await page.goto('/dashboard/calendar');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /calendrier/i })).toBeVisible();
  await shot(page, '07-calendar');

  // 7. Site : assistant de génération
  await page.goto('/onboarding/site');
  await page.waitForLoadState('networkidle');
  await shot(page, '08-site-wizard');

  // 8. Aperçu du site (route publique mock)
  await page.goto('/dashboard/website');
  await page.waitForLoadState('networkidle');
  await shot(page, '09-website');

  // 9. Parrainage
  await page.goto('/dashboard/referral');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /parrainage/i })).toBeVisible();
  await shot(page, '10-referral');
});

test('pages publiques SEO', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await shot(page, '11-blog');

  await page.goto('/status');
  await expect(page.getByRole('heading', { name: /état du service/i })).toBeVisible();
  await shot(page, '12-status');
});
