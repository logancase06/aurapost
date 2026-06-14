import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/completion';
mkdirSync(DIR, { recursive: true });

const email = `coach.completion.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Coach Karim');
  await page.fill('#brandName', 'Karim Performance');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);

  await page.waitForLoadState('networkidle');
  await page.fill('input[name="displayName"]', 'Coach Karim');
  await page.fill('input[name="speciality"]', 'Préparation physique CrossFit');
  await page.fill('input[name="city"]', 'Nice');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/dashboard-completion.png` });
  console.log('✓ dashboard-completion');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
