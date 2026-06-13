import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots';
mkdirSync(DIR, { recursive: true });

const email = `coach.demo.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

// Fait défiler toute la page par paliers pour déclencher les animations
// scroll-reveal (whileInView), puis remonte en haut — sinon les sections
// restent à opacity:0 sur une capture fullPage.
const triggerReveals = async (page) => {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.6));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
};

const shot = async (page, name, full = true) => {
  if (full) await triggerReveals(page);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: full });
  console.log('✓', name);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on('dialog', (d) => d.accept());

try {
  // ── Pages publiques ──
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // laisser jouer typewriter / particles / meteors
  await shot(page, '01-landing');

  await page.goto(`${BASE}/pricing`, { waitUntil: 'networkidle' });
  await shot(page, '02-pricing');

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await shot(page, '03-login', false);

  // ── Inscription ──
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Léa Martin');
  await page.fill('#brandName', 'Léa Fitness');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await shot(page, '04-register', false);
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 20000 }), page.click('button[type="submit"]')]);

  // ── Onboarding profil ──
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="displayName"]', 'Coach Léa Fitness');
  await page.fill('input[name="speciality"]', 'Préparation physique CrossFit');
  await page.fill('input[name="city"]', 'Lyon');
  await shot(page, '05-onboarding');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await shot(page, '06-dashboard-empty');

  // ── Génération de contenu ──
  const genBtn = page.locator('text=Créer mes 12 posts');
  if (await genBtn.count()) {
    await genBtn.first().click();
    await page.waitForTimeout(7000);
  }
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '07-dashboard-posts');

  // ── Analytics ──
  await page.goto(`${BASE}/dashboard/analytics`, { waitUntil: 'networkidle' });
  await shot(page, '08-analytics');

  // ── Billing ──
  await page.goto(`${BASE}/dashboard/billing`, { waitUntil: 'networkidle' });
  await shot(page, '09-billing');

  // ── Assistant site ──
  await page.goto(`${BASE}/onboarding/site`, { waitUntil: 'networkidle' });
  await shot(page, '10-site-wizard', false);

  // ── Démo publique ──
  const demo = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await demo.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  await demo.fill('#spec', 'Yoga & mobilité');
  await demo.fill('#city', 'Bordeaux');
  await demo.click('text=Génère mes 3 posts');
  await demo.waitForTimeout(2000);
  await shot(demo, '11-demo');

  // ── 404 ──
  await demo.goto(`${BASE}/cette-page-nexiste-pas`, { waitUntil: 'networkidle' });
  await shot(demo, '12-404', false);

  console.log('\nScreenshots terminés dans /screenshots');
} catch (err) {
  console.error('ERREUR screenshot:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
