/**
 * scripts/load-test.ts — test de charge basique : 10 utilisateurs simultanés.
 *
 *   npx tsx scripts/load-test.ts [url]   (défaut: http://localhost:3000/api/health)
 *
 * Cible /api/health par défaut (pas d'effet de bord). Pour /api/generate, l'auth est
 * requise : passe un cookie de session via la variable d'env COOKIE.
 * Mesure latence p50/p95/p99 et débit. Ne nécessite aucune dépendance externe.
 */
const TARGET = process.argv[2] ?? process.env.LOAD_URL ?? 'http://localhost:3000/api/health';
const USERS = Number(process.env.LOAD_USERS ?? '10');
const REQUESTS_PER_USER = Number(process.env.LOAD_REQS ?? '20');
const METHOD = (process.env.LOAD_METHOD ?? 'GET').toUpperCase();
const COOKIE = process.env.COOKIE ?? '';

interface Sample {
  ms: number;
  status: number;
  ok: boolean;
}

async function oneRequest(): Promise<Sample> {
  const start = performance.now();
  try {
    const res = await fetch(TARGET, {
      method: METHOD,
      headers: COOKIE ? { cookie: COOKIE } : undefined,
    });
    // Vide le corps pour libérer la connexion.
    await res.arrayBuffer().catch(() => {});
    return { ms: performance.now() - start, status: res.status, ok: res.ok };
  } catch {
    return { ms: performance.now() - start, status: 0, ok: false };
  }
}

async function user(): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let i = 0; i < REQUESTS_PER_USER; i++) samples.push(await oneRequest());
  return samples;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  console.log(`Test de charge → ${METHOD} ${TARGET}`);
  console.log(`${USERS} utilisateurs × ${REQUESTS_PER_USER} requêtes = ${USERS * REQUESTS_PER_USER} requêtes\n`);

  const wallStart = performance.now();
  const results = (await Promise.all(Array.from({ length: USERS }, () => user()))).flat();
  const wallMs = performance.now() - wallStart;

  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const ok = results.filter((r) => r.ok).length;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);

  console.log(`Requêtes : ${results.length} · OK : ${ok} · Erreurs : ${results.length - ok}`);
  console.log(`Durée totale : ${(wallMs / 1000).toFixed(2)} s · Débit : ${(results.length / (wallMs / 1000)).toFixed(1)} req/s`);
  console.log('\nLatence (ms) :');
  console.log(`  moy : ${avg.toFixed(1)}`);
  console.log(`  p50 : ${percentile(latencies, 50).toFixed(1)}`);
  console.log(`  p95 : ${percentile(latencies, 95).toFixed(1)}`);
  console.log(`  p99 : ${percentile(latencies, 99).toFixed(1)}`);
  console.log(`  max : ${(latencies[latencies.length - 1] ?? 0).toFixed(1)}`);

  if (results.length - ok > results.length * 0.05) {
    console.log('\n⚠ Taux d’erreur > 5 % — vérifier le rate limiting ou la capacité.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
