/**
 * scripts/lighthouse.ts — audit Lighthouse automatisé des pages clés.
 *
 *   npm i -D lighthouse chrome-launcher   (dépendances non incluses par défaut)
 *   npx tsx scripts/lighthouse.ts [baseUrl]
 *
 * Lance Lighthouse (mobile) sur les pages publiques principales et écrit un rapport
 * JSON + un résumé console dans /lighthouse-reports. Échoue si un score < 90.
 *
 * Mock propre : si lighthouse n'est pas installé, le script l'indique et sort en 0
 * (pas de blocage CI) en expliquant comment l'installer.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] ?? process.env.LH_BASE ?? 'http://localhost:3000';
const PAGES = ['/', '/pricing', '/demo/vincent', '/blog', '/login'];
const DIR = 'lighthouse-reports';
const THRESHOLD = 90;

async function loadLighthouse(): Promise<{ lighthouse: unknown; chromeLauncher: unknown } | null> {
  try {
    const lighthouse = (await import('lighthouse' as string)).default;
    const chromeLauncher = await import('chrome-launcher' as string);
    return { lighthouse, chromeLauncher };
  } catch {
    return null;
  }
}

async function main() {
  const mods = await loadLighthouse();
  if (!mods) {
    console.log('lighthouse non installé. Pour activer l’audit :');
    console.log('  npm i -D lighthouse chrome-launcher');
    console.log('Puis : npx tsx scripts/lighthouse.ts');
    return;
  }
  mkdirSync(DIR, { recursive: true });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { lighthouse, chromeLauncher } = mods as any;
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  const opts = { port: chrome.port, output: 'json', logLevel: 'error', formFactor: 'mobile', screenEmulation: { mobile: true } };

  let failed = false;
  const summary: { page: string; perf: number; a11y: number; bp: number; seo: number }[] = [];

  for (const page of PAGES) {
    const url = `${BASE}${page}`;
    try {
      const runnerResult = await lighthouse(url, opts as any);
      const cats = runnerResult.lhr.categories;
      const row = {
        page,
        perf: Math.round(cats.performance.score * 100),
        a11y: Math.round(cats.accessibility.score * 100),
        bp: Math.round(cats['best-practices'].score * 100),
        seo: Math.round(cats.seo.score * 100),
      };
      summary.push(row);
      writeFileSync(join(DIR, `${page.replace(/\//g, '_') || 'home'}.json`), runnerResult.report);
      const min = Math.min(row.perf, row.a11y, row.bp, row.seo);
      if (min < THRESHOLD) failed = true;
      console.log(`${page.padEnd(16)} perf:${row.perf} a11y:${row.a11y} bp:${row.bp} seo:${row.seo}`);
    } catch (err) {
      console.warn(`⚠ ${page} :`, String(err));
      failed = true;
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  await chrome.kill();
  writeFileSync(join(DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nRapports dans /${DIR}. Seuil : ${THRESHOLD}.`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
