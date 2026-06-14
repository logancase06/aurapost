// Rate limiter pour les routes d'auth — Upstash Redis si dispo, sinon fallback in-memory.
// L'in-memory se réinitialise à chaque déploiement ; Redis persiste entre cold starts.

interface Bucket {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, Bucket>();

// Purge périodique des buckets expirés (évite la fuite mémoire si Redis est down).
const _purgeTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memStore) {
    if (bucket.resetAt < now) memStore.delete(key);
  }
}, 60_000) as ReturnType<typeof setInterval> & { unref?: () => void };
_purgeTimer.unref?.();

async function redisIncr(key: string, windowMs: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // INCR puis PEXPIRE NX (expiry posée uniquement à la création de la clé).
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, windowMs, 'NX'],
      ]),
    });
    const data = (await res.json()) as [{ result: number }, unknown];
    return data[0]?.result ?? null;
  } catch {
    return null;
  }
}

/**
 * Vérifie le rate limit pour une clé (IP, email, userId…).
 * @returns `{ allowed: true }` sous le seuil, sinon `{ allowed: false, retryAfterSec }`.
 */
export async function checkAuthRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  // En développement local, on ne limite pas l'auth (sinon impossible de tester
  // l'inscription/connexion en boucle). Le rate limit reste actif en production.
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, retryAfterSec: 0 };
  }

  const count = await redisIncr(`rl:auth:${key}`, windowMs);
  if (count !== null) {
    if (count > maxAttempts) return { allowed: false, retryAfterSec: Math.ceil(windowMs / 1000) };
    return { allowed: true, retryAfterSec: 0 };
  }

  // Fallback in-memory
  const now = Date.now();
  const bucket = memStore.get(key);
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= maxAttempts) {
      return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    bucket.count++;
  } else {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
  }
  return { allowed: true, retryAfterSec: 0 };
}

// Mots de passe trop communs à rejeter.
const COMMON_PASSWORDS = [
  'password',
  'password1',
  'password123',
  '123456',
  '123456789',
  '12345678',
  'azerty',
  'qwerty',
  'qwerty123',
  'admin',
  'admin123',
  'aurapost',
  'abc123',
  'iloveyou',
  'letmein',
  'welcome',
];

export function validatePassword(password: string): string | null {
  if (password.length > 128) return 'Mot de passe trop long (maximum 128 caractères)';
  if (password.length < 8) return 'Minimum 8 caractères';
  if (!/[A-Z]/.test(password)) return 'Au moins une lettre majuscule requise';
  if (!/[0-9]/.test(password)) return 'Au moins un chiffre requis';
  if (!/[!@#$%^&*()]/.test(password)) return 'Au moins un caractère spécial requis (!@#$%^&*())';
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.some((p) => lower.includes(p))) return 'Mot de passe trop simple ou trop courant';
  return null;
}
