import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright E2E.
 * - Démarre automatiquement `next dev` sur le port 3100 (réutilise un serveur existant).
 * - Mode mock forcé (AURAPOST_USE_MOCK=1, pas de Turso) → l'app tourne sans clé.
 * - Screenshots à chaque étape dans /e2e-screenshots (géré par les specs).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-results',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    // iPhone 14 = 390×844. On force Chromium (isMobile/hasTouch) pour ne pas dépendre de WebKit.
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AURAPOST_USE_MOCK: '1' },
  },
});
