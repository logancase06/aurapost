import { createClient as createHttpClient } from '@libsql/client/http';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Client } from '@libsql/client';
import { MEMORY_BOOTSTRAP_SQL } from './bootstrap-schema';

// ─────────────────────────────────────────────────────────────────────────────
// Couche d'accès DB — deux modes :
//
//  • PRODUCTION : TURSO_DATABASE_URL défini → client Turso via HTTP (@libsql/client/http).
//  • MOCK / DEV : pas de TURSO_DATABASE_URL → SQLite EN MÉMOIRE, schéma auto-créé.
//    Permet de faire tourner toute l'app sans aucune clé (le build reste vert, les pages
//    fonctionnent). Les données ne persistent que le temps du process (reset au redémarrage).
//
// Initialisation paresseuse : le client n'est créé qu'à la première requête, jamais à
// l'import → le build Next.js (collect page data / prerender) n'exige aucun secret.
// ─────────────────────────────────────────────────────────────────────────────

export const IS_DB_MOCK = !process.env.TURSO_DATABASE_URL;

let _db: LibSQLDatabase | null = null;

// Méthodes du client libsql utilisées par Drizzle — proxifiées en mode mémoire pour
// attendre la création asynchrone du client + bootstrap du schéma.
const CLIENT_METHODS = new Set(['execute', 'batch', 'executeMultiple', 'sync', 'transaction', 'close']);

// Cible nommée pour le Proxy : Drizzle inspecte `client.constructor.name` (isConfig) —
// un objet littéral aurait `constructor.name === 'Object'` et serait pris pour une config.
class LibsqlMemoryClient {}

function createMemoryClient(): Client {
  // Création + bootstrap asynchrones, mémorisés dans une promesse résolue une seule fois.
  const ready: Promise<Client> = (async () => {
    const { createClient } = await import('@libsql/client');
    const c = createClient({ url: ':memory:' });
    await c.executeMultiple(MEMORY_BOOTSTRAP_SQL);
    return c;
  })();

  return new Proxy(new LibsqlMemoryClient() as unknown as Client, {
    get(target, prop) {
      if (prop === 'closed') return false;
      if (typeof prop === 'string' && CLIENT_METHODS.has(prop)) {
        return (...args: unknown[]) =>
          ready.then((c) => (c as unknown as Record<string, (...a: unknown[]) => unknown>)[prop](...args));
      }
      return Reflect.get(target, prop);
    },
  });
}

function buildClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    // Turso via HTTP — libsql:// converti en https:// (requis par @libsql/client/http).
    return createHttpClient({
      url: url.replace('libsql://', 'https://'),
      authToken: process.env.TURSO_AUTH_TOKEN ?? '',
    });
  }
  return createMemoryClient();
}

// Cache process-global : en dev (HMR Turbopack) et entre graphes de modules séparés
// (page action vs route API), tous partagent la MÊME base — indispensable pour que le
// fallback SQLite en mémoire soit cohérent d'une requête à l'autre.
const globalForDb = globalThis as unknown as { __aurapostDb?: LibSQLDatabase };

function getDb(): LibSQLDatabase {
  if (globalForDb.__aurapostDb) return globalForDb.__aurapostDb;
  if (!_db) _db = drizzle(buildClient());
  globalForDb.__aurapostDb = _db;
  return _db;
}

// Proxy transparent : `db` se comporte comme l'instance Drizzle mais déclenche
// l'initialisation paresseuse au premier accès de propriété.
export const db = new Proxy({} as LibSQLDatabase, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
