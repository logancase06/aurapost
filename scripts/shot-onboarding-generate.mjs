import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/onboarding-v2';
mkdirSync(DIR, { recursive: true });

const email = `coach.gen.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
page.on('dialog', (d) => d.accept());

try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Vincent Ferré');
  await page.fill('#brandName', 'Vincent Performance');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Vincent Ferré');
  await page.fill('input[placeholder="ex: Préparation physique CrossFit"]', 'Coach Hyrox');
  await page.fill('input[placeholder="ex: Lyon"]', 'Nice');
  await page.waitForTimeout(1300);

  // Saute directement aux étapes suivantes jusqu'au step 4
  for (let i = 0; i < 3; i++) {
    await page.click('button:has-text("Suivant")');
    await page.waitForTimeout(700);
  }

  // Génère
  await page.click('button:has-text("Générer mon contenu")');
  // Attend l'arrivée sur le dashboard
  await page.waitForURL('**/dashboard**', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const approveCount = await page.locator('button:has-text("Approuver")').count();
  console.log('Posts approuvables sur le dashboard:', approveCount);
  await page.screenshot({ path: `${DIR}/09-dashboard-apres-generation.png` });
  console.log('✓ 09-dashboard-apres-generation');
  if (approveCount === 0) {
    // Peut-être génération asynchrone : on attend un peu et on recharge.
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);
      await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
      if (await page.locator('button:has-text("Approuver")').count()) {
        console.log('Posts apparus après attente.');
        await page.screenshot({ path: `${DIR}/09-dashboard-apres-generation.png` });
        break;
      }
    }
  }
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_gen_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
