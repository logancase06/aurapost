import { Redis } from '@upstash/redis';
import { logError } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Garde distribué de génération (multi-lambda) via Upstash Redis.
//
// La vérité reste la base (hasGeneratedThisMonth), mais ce garde Redis offre un
// court-circuit rapide et partagé entre toutes les instances serverless. Clef
// scellée au mois (`ratelimit:generate:{tenantId}:{YYYY-MM}`) pour s'aligner sur la
// logique calendaire de la base et ne jamais bloquer la génération du mois suivant.
//
// Sans Redis configuré → fallback in-memory (par instance) — non bloquant.
// ─────────────────────────────────────────────────────────────────────────────

const GENERATE_TTL_SECONDS = 32 * 24 * 60 * 60; // ~1 mois

let _redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

const memStore = new Map<string, number>(); // key → expiresAt (ms)

function key(tenantId: string, month: string): string {
  return `ratelimit:generate:${tenantId}:${month}`;
}

/** true si une génération a déjà été enregistrée pour ce tenant ce mois-ci (Redis ou mémoire). */
export async function isGenerationRecorded(tenantId: string, month: string): Promise<boolean> {
  const k = key(tenantId, month);
  const cli = getRedis();
  if (cli) {
    try {
      return (await cli.exists(k)) === 1;
    } catch (err) {
      logError('[rate-limit] exists Redis échoué — fallback mémoire', { error: String(err) });
    }
  }
  const exp = memStore.get(k);
  return !!exp && exp > Date.now();
}

/** Enregistre la génération du mois (best-effort, distribué + mémoire). */
export async function recordGeneration(tenantId: string, month: string): Promise<void> {
  const k = key(tenantId, month);
  const cli = getRedis();
  if (cli) {
    try {
      await cli.set(k, Date.now(), { ex: GENERATE_TTL_SECONDS });
    } catch (err) {
      logError('[rate-limit] set Redis échoué', { error: String(err) });
    }
  }
  memStore.set(k, Date.now() + GENERATE_TTL_SECONDS * 1000);
}
