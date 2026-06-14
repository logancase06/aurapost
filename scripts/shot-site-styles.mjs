import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/site-v3';
mkdirSync(DIR, { recursive: true });

const email = `coach.site.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
page.on('dialog', (d) => d.accept());

const shot = async (name) => { await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true }); console.log('✓', name); };

try {
  // Inscription + onboarding minimal
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Sarah Coaching');
  await page.fill('#brandName', 'Sarah Studio');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Sarah Lemoine');
  await page.fill('input[placeholder="ex: Préparation physique CrossFit"]', 'Yoga & mobilité');
  await page.fill('input[placeholder="ex: Lyon"]', 'Bordeaux');
  await page.waitForTimeout(1300);
  for (let i = 0; i < 3; i++) { await page.click('button:has-text("Suivant")'); await page.waitForTimeout(600); }
  await page.click('button:has-text("Générer mon contenu")');
  await page.waitForURL('**/dashboard**', { timeout: 60000 });

  // Page site
  await page.goto(`${BASE}/dashboard/website`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot('00-chooser');

  // Activer le site
  await page.click('button:has-text("Générer et activer mon site")');
  await page.waitForTimeout(2500);

  // Récupère le subdomain depuis le lien "Aperçu local"
  const href = await page.locator('a:has-text("Aperçu local")').first().getAttribute('href');
  const sub = href?.split('/site/')[1]?.replace(/\/$/, '');
  console.log('subdomain =', sub);
  if (!sub) throw new Error('subdomain introuvable');

  for (const style of [{ id: 'Impact', f: 'impact' }, { id: 'Clarté', f: 'clarte' }, { id: 'Authenticité', f: 'authenticite' }]) {
    await page.goto(`${BASE}/dashboard/website`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.click(`button:has-text("${style.id}")`);
    await page.waitForTimeout(1800);
    await page.goto(`${BASE}/site/${sub}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await shot(`site-${style.f}-desktop`);
    // mobile 375
    await page.setViewportSize({ width: 375, height: 820 });
    await page.waitForTimeout(400);
    await shot(`site-${style.f}-mobile`);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  console.log('\nScreenshots site-v3 terminés.');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
