import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import sharp from 'sharp';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/onboarding-v2';
mkdirSync(DIR, { recursive: true });

const email = `coach.onb.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';
const IMG = `${DIR}/_sample.jpg`;

// Photo de test : dégradé orange→noir 900×900.
await sharp({ create: { width: 900, height: 900, channels: 3, background: { r: 255, g: 77, b: 0 } } })
  .composite([{ input: Buffer.from(`<svg width="900" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF4D00"/><stop offset="1" stop-color="#0A0A0A"/></linearGradient></defs><rect width="900" height="900" fill="url(#g)"/><circle cx="450" cy="380" r="120" fill="#ffffff22"/></svg>`), top: 0, left: 0 }])
  .jpeg()
  .toFile(IMG);

const shot = async (page, name) => {
  await page.screenshot({ path: `${DIR}/${name}.png` });
  console.log('✓', name);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
page.on('dialog', (d) => d.accept());

try {
  // Inscription
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Vincent Ferré');
  await page.fill('#brandName', 'Vincent Performance');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // ── Étape 1 : profil de base ──
  await shot(page, '01-step1-profil');
  await page.fill('input[placeholder="ex: Coach Léa Fitness"]', 'Vincent Ferré');
  await page.fill('input[placeholder="ex: Préparation physique CrossFit"]', 'Coach Hyrox');
  await page.fill('input[placeholder="ex: Lyon"]', 'Nice');
  await page.waitForTimeout(1400); // laisse l'autosave se déclencher → "Sauvegardé ✓"
  await shot(page, '02-step1-rempli');

  // Étape 2
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(900);
  await shot(page, '03-step2-presence');

  // Champs manuels (remplir à la main)
  await page.click('summary:has-text("Ou remplis à la main")');
  await page.waitForTimeout(300);
  await page.fill('textarea[placeholder^="Décris ce que tu fais"]', 'Coach Hyrox depuis 6 ans, j’accompagne les sportifs vers leur premier podium.');
  await page.fill('textarea[placeholder^="Qui accompagnes-tu"]', 'Sportifs 30-45 ans visant leur premier Hyrox.');
  await page.fill('textarea[placeholder^="Qu’obtiennent"]', 'Mes clients terminent leur premier Hyrox en moins de 1h15.');
  await page.waitForTimeout(600);
  await shot(page, '04-step2-manuel');

  // Étape 3 : photos
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(800);
  await shot(page, '05-step3-photos-vide');
  await page.locator('input[type="file"]').setInputFiles([IMG]);
  await page.waitForTimeout(2500);
  await shot(page, '06-step3-photos-upload');

  // Étape 4 : génération + aperçu
  await page.click('button:has-text("Suivant")');
  await page.waitForTimeout(1000);
  await shot(page, '07-step4-resume');
  // Attendre l'aperçu post (AJOUT 3)
  for (let i = 0; i < 16; i++) {
    if (await page.locator('text=Aperçu d’un post').count()) {
      const hasPreview = await page.locator('.bg-muted\\/40').count();
      if (hasPreview) break;
    }
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(500);
  await shot(page, '08-step4-apercu-post');

  console.log('\nScreenshots onboarding-v2 terminés.');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
