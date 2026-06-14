import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/site-v3';
mkdirSync(DIR, { recursive: true });

const email = `coach.editor.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
page.on('dialog', (d) => d.accept());
const shot = async (n) => { await page.screenshot({ path: `${DIR}/${n}.png` }); console.log('✓', n); };

try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Marc Coaching');
  await page.fill('#brandName', 'Marc Studio');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Marc Hyrox');
  await page.fill('input[placeholder="ex: Préparation physique CrossFit"]', 'Préparation Hyrox');
  await page.fill('input[placeholder="ex: Lyon"]', 'Nice');
  await page.waitForTimeout(1300);
  for (let i = 0; i < 3; i++) { await page.click('button:has-text("Suivant")'); await page.waitForTimeout(600); }
  await page.click('button:has-text("Générer mon contenu")');
  await page.waitForURL('**/dashboard**', { timeout: 60000 });

  // Choix d'un style → crée la ligne site (sans génération IA lente).
  await page.goto(`${BASE}/dashboard/website`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('button:has-text("Impact")');
  await page.waitForTimeout(1800);
  await shot('10-dashboard-chooser-set');

  // Éditeur (fonctionne depuis la base profil même sans contenu IA généré).
  await page.goto(`${BASE}/dashboard/website/editor`, { waitUntil: 'networkidle' });
  await page.waitForLoadState('networkidle');
  // Attend que l'iframe d'aperçu ait rendu son contenu (H1 du site).
  await page.frameLocator('iframe').locator('h1').first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await shot('11-editor-initial');

  // Édite le titre hero (input maxlength=80) → autosave → l'aperçu se rafraîchit
  const heroTitle = page.locator('input[maxlength="80"]').first();
  await heroTitle.fill('Deviens la meilleure version de toi.');
  // Attend que l'aperçu reflète l'édition (H1 mis à jour dans l'iframe).
  await page.frameLocator('iframe').locator('h1', { hasText: /meilleure version/i }).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  await shot('12-editor-edited');

  // Vérifie sur le site public en aperçu
  const subFromLink = await page.locator('a:has-text("Voir le site")').first().getAttribute('href');
  const sub = subFromLink?.split('/site/')[1]?.split('?')[0];
  console.log('subdomain', sub);
  await page.goto(`${BASE}/site/${sub}?preview=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const h1 = await page.locator('h1').first().innerText();
  console.log('H1 publié =', JSON.stringify(h1));
  console.log(h1.includes('meilleure version') ? 'ÉDITION REFLÉTÉE ✓' : 'ÉDITION NON reflétée ✗');

  console.log('\nScreenshots éditeur terminés.');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_editor_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
