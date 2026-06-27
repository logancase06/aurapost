// Retry avec backoff exponentiel pour les appels API Anthropic.
//
// Ne retente QUE les erreurs transitoires :
//   - 429 (rate limit / overload)
//   - 500/529 (server error Anthropic)
//   - Erreurs réseau (ECONNRESET, ETIMEDOUT, fetch failed)
//
// Les erreurs client (400, 401, 403) ne sont JAMAIS retentées.

import { logError } from './logger';

const RETRYABLE_STATUS = new Set([429, 500, 529]);
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT']);

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  // SDK Anthropic expose .status sur APIStatusError
  if (typeof e.status === 'number') return RETRYABLE_STATUS.has(e.status);
  // Erreurs réseau (Node fetch / undici)
  const code = String(e.code ?? e.cause ?? '');
  if (RETRYABLE_CODES.has(code)) return true;
  const msg = String(e.message ?? '');
  if (/fetch failed|network|timeout|ECONNRESET|ETIMEDOUT/i.test(msg)) return true;
  return false;
}

/**
 * Appelle `fn()` avec retry exponentiel.
 * - maxAttempts = 3 (1 initial + 2 retries)
 * - Délais : 1 s → 2 s (jitter ±25 %)
 */
export async function withAnthropicRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryable(err)) throw err;
      const baseDelay = 1000 * attempt;
      const jitter = Math.floor(Math.random() * baseDelay * 0.5);
      const delay = baseDelay + jitter;
      logError(`[anthropic-retry] tentative ${attempt}/${maxAttempts} — retry dans ${delay}ms`, {
        label,
        error: String((err as Error)?.message ?? err),
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
