import { Redis } from '@upstash/redis';
import { logError } from './logger';

// Cache deux niveaux (Upstash Redis + in-memory) avec stale-while-revalidate.
// Repris de BlazeCheck. Si Redis est absent, fallback in-memory par processus.

let _redis: Redis | null = null;
let _warnedNoRedis = false;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!_warnedNoRedis && process.env.NODE_ENV !== 'test') {
      _warnedNoRedis = true;
      logError('[cache] Redis non configuré — fallback in-memory actif (non partagé entre instances).', {});
    }
    return null;
  }
  try {
    _redis = new Redis({ url, token });
    return _redis;
  } catch {
    return null;
  }
}

const MEM_CACHE_MAX = 1024;
const memCache = new Map<string, { data: unknown; expiresAt: number }>();

if (typeof setInterval !== 'undefined') {
  const _cacheTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memCache) {
      if (now > v.expiresAt) memCache.delete(k);
    }
  }, 60_000) as ReturnType<typeof setInterval> & { unref?: () => void };
  _cacheTimer.unref?.();
}

const inFlight = new Map<string, Promise<unknown>>();
const revalidating = new Set<string>();

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function memSet(key: string, data: unknown, ttlSeconds: number): void {
  if (memCache.size >= MEM_CACHE_MAX) {
    memCache.delete(memCache.keys().next().value as string);
  }
  memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Cache à deux niveaux avec stale-while-revalidate.
 * Redis stocké avec TTL = `ttl` ; in-memory avec TTL = `ttl × 2` (fenêtre stale).
 */
export async function cachedQuery<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cli = getRedis();

  if (cli) {
    try {
      const cached = await cli.get<T>(key);
      if (cached !== null) {
        memSet(key, cached, ttl * 2);
        return cached;
      }
    } catch (err) {
      logError('[cache] Redis error — fallback mémoire/DB', { key, error: String(err) });
    }
  }

  const mem = memGet<T>(key);
  if (mem !== null) {
    if (cli && !revalidating.has(key)) {
      revalidating.add(key);
      fetcher()
        .then((data) => {
          cli.set(key, data, { ex: ttl }).catch(() => {});
          memSet(key, data, ttl * 2);
        })
        .catch(() => {})
        .finally(() => revalidating.delete(key));
    }
    return mem;
  }

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const data = await fetcher();
      memSet(key, data, ttl * 2);
      if (cli) cli.set(key, data, { ex: ttl }).catch(() => {});
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise as Promise<unknown>);
  return promise;
}

/** Supprime une ou plusieurs clés de cache (Redis + in-memory). */
export async function deleteCache(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  for (const key of keys) memCache.delete(key);
  const cli = getRedis();
  if (!cli) return;
  try {
    await cli.del(...keys);
  } catch (err) {
    logError('[cache] Échec suppression clés', { keys: keys.join(','), error: String(err) });
  }
}
