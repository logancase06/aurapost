import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/ux-fixes';
mkdirSync(DIR, { recursive: true });
const email = `coach.ux.${Date.now()}@example.com`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
page.on('dialog', (d) => d.accept());
const shot = async (n) => { await page.screenshot({ path: `${DIR}/${n}.png`, fullPage: true }); console.log('✓', n); };

try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Alex UX'); await page.fill('#brandName', 'Alex'); await page.fill('#email', email); await page.fill('#password', 'Av3nir!Solide'); await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle'); await page.waitForTimeout(700);
  // Étape 1 : vérifie chips spécialité + intro
  await shot('01-onboarding-step1');
  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Alex Fitness');
  await page.click('button:has-text("Nutrition")'); // chip remplit la spécialité
  await page.fill('input[placeholder="ex: Lyon"]', 'Lyon');
  await page.waitForTimeout(1300);
  for (let i = 0; i < 3; i++) { await page.click('button:has-text("Suivant")'); await page.waitForTimeout(500); }
  await page.click('button:has-text("Générer mon contenu")');
  await page.waitForURL('**/dashboard**', { timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot('02-dashboard-reorg');

  await page.goto(`${BASE}/dashboard/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot('03-profile-page');
  const spec = await page.locator('input').nth(1).inputValue().catch(() => '');
  console.log('Profil spécialité (depuis chip):', JSON.stringify(spec));

  await page.goto(`${BASE}/dashboard/website`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await shot('04-website-state1');

  // login : vérifie le lien mot de passe oublié
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const forgot = await page.locator('button:has-text("Mot de passe oublié")').count();
  console.log('Lien mot de passe oublié présent:', forgot > 0 ? 'OUI' : 'NON');

  console.log('\nScreenshots UX terminés.');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
