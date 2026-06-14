import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import sharp from 'sharp';

const BASE = 'http://localhost:3000';
const DIR = 'screenshots/posts-photos';
mkdirSync(DIR, { recursive: true });

const email = `coach.photos.${Date.now()}@example.com`;
const password = 'Av3nir!Solide';
const IMG = `${DIR}/_sample.jpg`;

// Image de test : dégradé orange→noir 900×900 (simule une vraie photo de coach).
await sharp({
  create: { width: 900, height: 900, channels: 3, background: { r: 255, g: 77, b: 0 } },
})
  .composite([
    {
      input: Buffer.from(
        `<svg width="900" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF4D00"/><stop offset="1" stop-color="#0A0A0A"/></linearGradient></defs><rect width="900" height="900" fill="url(#g)"/><circle cx="450" cy="380" r="120" fill="#ffffff22"/></svg>`
      ),
      top: 0,
      left: 0,
    },
  ])
  .jpeg()
  .toFile(IMG);

const shot = async (page, name) => {
  await page.screenshot({ path: `${DIR}/${name}.png` });
  console.log('✓', name);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on('dialog', (d) => d.accept()); // confirm() de la génération

try {
  // Inscription
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.fill('#name', 'Coach Karim');
  await page.fill('#brandName', 'Karim Performance');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.check('input[type="checkbox"]');
  await Promise.all([page.waitForURL('**/onboarding**', { timeout: 25000 }), page.click('button[type="submit"]')]);

  // Onboarding profil (CrossFit → accent orange)
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="displayName"]', 'Coach Karim');
  await page.fill('input[name="speciality"]', 'Préparation physique CrossFit');
  await page.fill('input[name="city"]', 'Nice');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Génération de posts
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  const genBtn = page.locator('text=Créer mes 12 posts');
  if (await genBtn.count()) {
    await genBtn.first().click();
  }

  // Poll jusqu'à apparition des posts (tunnel ~80s, mock instantané) — max 160s.
  let ready = false;
  for (let i = 0; i < 32; i++) {
    await page.waitForTimeout(5000);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    if (await page.locator('button:has-text("Approuver")').count()) {
      ready = true;
      break;
    }
    console.log(`  …attente génération ${(i + 1) * 5}s`);
  }
  if (!ready) throw new Error('Aucun post généré après 160s');

  // Ouvre le dialog d'approbation sur le 1er post
  const approve = page.locator('button:has-text("Approuver")').first();
  await approve.scrollIntoViewIfNeeded();
  await approve.click();
  const dlg = page.locator('[role="dialog"]');
  await dlg.waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);
  await shot(page, '01-step1-photo');

  // Upload d'une photo (input caché dans le dialog)
  await dlg.locator('input[type="file"]').setInputFiles(IMG);
  await page.waitForTimeout(2500); // upload + resize + dessin du canvas
  const overlayInput = dlg.locator('input[placeholder="Texte sur l\'image (optionnel)"]');
  if (await overlayInput.count()) {
    await overlayInput.fill('Ton premier Hyrox commence ici');
    await page.waitForTimeout(600);
  }
  await shot(page, '02-step1-preview');

  // Étape 2 : aperçu Instagram
  await dlg.locator('button:has-text("Suivant")').click();
  await page.waitForTimeout(1200);
  await shot(page, '03-step2-instagram-mock');

  // Modifier le texte (ouvre l'éditeur de légende)
  await dlg.locator('button:has-text("Modifier le texte")').click();
  await page.waitForTimeout(500);
  await shot(page, '04-step2-edit-caption');

  // Étape 3 : actions
  await dlg.locator('button:has-text("Suivant")').click();
  await page.waitForTimeout(800);
  await shot(page, '05-step3-actions');

  // Programmer (révèle le date picker)
  await dlg.locator('button:has-text("Programmer")').click();
  await page.waitForTimeout(500);
  await shot(page, '06-step3-schedule');

  console.log('\nScreenshots CHANTIER 1 terminés.');
} catch (err) {
  console.error('ERREUR:', err);
  await page.screenshot({ path: `${DIR}/_error.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
