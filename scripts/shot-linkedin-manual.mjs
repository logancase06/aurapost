import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/onboarding-v2';
mkdirSync(DIR, { recursive: true });

const email = `coach.li.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
try {
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Coach Alex');
  await page.fill('#brandName', 'Alex Performance');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Coach Alex');
  await page.fill('input[placeholder="ex: Préparation physique CrossFit"]', 'Remise en forme & préparation physique');
  await page.fill('input[placeholder="ex: Lyon"]', 'Lyon');
  await page.waitForTimeout(1300);

  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(900);

  // Remplir les nouveaux champs LinkedIn manuels
  await page.fill('#li-headline', 'Coach sportif certifié · Préparation physique & remise en forme · Lyon');
  await page.fill('#li-summary', "J'accompagne des particuliers et sportifs amateurs à Lyon vers leurs objectifs : perte de poids, force, et regagner confiance en soi.");
  await page.waitForTimeout(1500); // autosave debounce
  await page.screenshot({ path: `${DIR}/10-step2-linkedin-manuel.png` });
  console.log('✓ 10-step2-linkedin-manuel');

  // Vérifie qu'aucun champ URL LinkedIn ne subsiste
  const urlInputs = await page.locator('input[placeholder*="linkedin.com"]').count();
  console.log('Champs URL LinkedIn restants (doit être 0):', urlInputs);

  // Recharge pour confirmer la reprise (persistance)
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(700);
  const headlineVal = await page.locator('#li-headline').inputValue();
  console.log('Reprise headline persistée:', headlineVal ? 'OUI' : 'NON');
  await page.screenshot({ path: `${DIR}/11-step2-linkedin-reprise.png` });
  console.log('✓ 11-step2-linkedin-reprise');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_li_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
