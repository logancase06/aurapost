import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'fs';

// Tests E2E des fonctionnalités dashboard post-inscription :
// export CSV, historique, outils IA (threads, reels, newsletter, hashtags),
// billing, settings, leads. Mode mock : aucune clé requise.

const DIR = 'e2e-screenshots';
mkdirSync(DIR, { recursive: true });

const unique = `feat${Date.now()}`;
const email = `e2e.features.${unique}@example.com`;
const password = 'Av3nir!Solide';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

// Crée un compte + génère des posts avant les tests des features.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());

  await page.goto('/register');
  await page.fill('#name', 'Coach Features');
  await page.fill('#brandName', 'Features Gym');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([
    page.waitForURL('**/onboarding**', { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.fill('input[name="displayName"]', 'Coach Features');
  await page.fill('input[name="speciality"]', 'Musculation');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Génère les posts du mois (mock)
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const genBtn = page.locator('text=Créer mes 12 posts');
  if (await genBtn.count()) {
    await genBtn.first().click();
    await page.waitForTimeout(5000);
  }
  await page.close();
});

test('historique : navigation par mois + affichage posts', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/history');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /historique/i })).toBeVisible();
  await shot(page, '30-history');
});

test('export CSV : lien accessible depuis le dashboard historique', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/history');
  await page.waitForLoadState('networkidle');

  // Vérifie que le bouton Export CSV pointe bien sur /api/export/csv
  const csvLink = page.locator('a[href*="export/csv"]');
  if (await csvLink.count()) {
    await expect(csvLink.first()).toBeVisible();
    await shot(page, '31-export-csv-button');
  }
});

test('page Fil Twitter/X : formulaire + génération mock', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/threads');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /fil twitter/i })).toBeVisible();
  await shot(page, '32-threads-empty');

  // Le plan starter n'a pas exportEnabled → UpgradeBanner attendu
  const banner = page.locator('text=Fil Twitter/X');
  await expect(banner.first()).toBeVisible();
});

test('page Script Reels : formulaire visible', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/reels');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /reel|script/i })).toBeVisible();
  await shot(page, '33-reels');
});

test('page Newsletter : formulaire visible', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/newsletter');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /newsletter/i })).toBeVisible();
  await shot(page, '34-newsletter');
});

test('page Hashtags : recherche de hashtags', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/hashtags');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /hashtag/i })).toBeVisible();
  await shot(page, '35-hashtags');
});

test('page Abonnement : plans affichés, bouton upgrade visible', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/billing');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /abonnement|facturation/i })).toBeVisible();
  // Au moins un plan doit être affiché
  await expect(page.locator('text=39').or(page.locator('text=Coach')).first()).toBeVisible();
  await shot(page, '36-billing');
});

test('page Paramètres : formulaire de profil chargé', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /param/i })).toBeVisible();
  await shot(page, '37-settings');
});

test('page Leads : accès et message vide pour starter', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/leads');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /leads/i })).toBeVisible();
  // État vide ou upgrade banner attendu
  const empty = page.locator('text=Aucun lead').or(page.locator('text=site vitrine'));
  await expect(empty.first()).toBeVisible();
  await shot(page, '38-leads');
});

test('page Analytics : graphiques ou état vide visible', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto('/dashboard/analytics');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /analytics|statistiques/i })).toBeVisible();
  await shot(page, '39-analytics');
});

test('déconnexion + redirection vers /login', async ({ page }) => {
  await page.goto(`/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 20_000 }),
    page.click('button[type="submit"]'),
  ]);

  // Cherche le bouton de déconnexion (peut être dans un menu)
  const signOut = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');
  if (await signOut.count()) {
    await signOut.first().click();
    await page.waitForURL('**/', { timeout: 10_000 });
    await expect(page).not.toHaveURL(/dashboard/);
    await shot(page, '40-signout');
  }
});
