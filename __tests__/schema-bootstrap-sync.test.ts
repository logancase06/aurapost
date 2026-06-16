// Garde anti-dérive : bootstrap-schema.ts (utilisé par le fallback SQLite mémoire/dev
// et les tests) doit rester synchronisé avec schema.ts. Sans ce garde, ajouter une table
// dans schema.ts sans la reporter dans le bootstrap casse silencieusement le dev/les tests.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schema = readFileSync(join(process.cwd(), 'lib/db/schema.ts'), 'utf8');
const bootstrap = readFileSync(join(process.cwd(), 'lib/db/bootstrap-schema.ts'), 'utf8');

const tables = [...schema.matchAll(/sqliteTable\(\s*'([a-z_]+)'/g)].map((m) => m[1]);

describe('schema.ts ↔ bootstrap-schema.ts', () => {
  it('expose au moins toutes les tables connues', () => {
    expect(tables.length).toBeGreaterThanOrEqual(14);
  });

  it('chaque table de schema.ts a un CREATE TABLE dans le bootstrap', () => {
    const missing = tables.filter((t) => !new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`).test(bootstrap));
    expect(missing).toEqual([]);
  });

  it('les colonnes de suivi de connexion et de conformité sont bien dans le bootstrap', () => {
    for (const col of ['first_login_at', 'last_login_at', 'login_count', 'requires_approval']) {
      expect(bootstrap).toContain(col);
    }
  });
});
