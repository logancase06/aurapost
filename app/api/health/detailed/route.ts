import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { getIntegrationStatuses } from '@/lib/integrations';
import { logError } from '@/lib/logger';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';

/** Comptage tenants réels vs démo (visibilité : le seed:demo ne pollue pas les métriques). */
async function tenantCounts(): Promise<{ real: number; demo: number }> {
  try {
    const [[r], [d]] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(tenants).where(eq(tenants.isDemo, false)),
      db.select({ c: sql<number>`count(*)` }).from(tenants).where(eq(tenants.isDemo, true)),
    ]);
    return { real: Number(r?.c ?? 0), demo: Number(d?.c ?? 0) };
  } catch {
    return { real: 0, demo: 0 };
  }
}

export const dynamic = 'force-dynamic';

interface ProbeResult {
  name: string;
  status: 'ok' | 'degraded' | 'down' | 'skipped';
  latencyMs?: number;
  detail: string;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = Date.now();
  const value = await fn();
  return { ms: Date.now() - start, value };
}

/** Teste la connexion à la base (Turso en prod, SQLite mémoire en mock). */
async function probeDatabase(): Promise<ProbeResult> {
  try {
    const { ms } = await timed(() => db.run(sql`SELECT 1`));
    const configured = !!process.env.TURSO_DATABASE_URL;
    return {
      name: 'database',
      status: configured ? 'ok' : 'degraded',
      latencyMs: ms,
      detail: configured ? 'Turso joignable.' : 'SQLite mémoire (mock) joignable.',
    };
  } catch (err) {
    logError('[health/detailed] db probe failed', { error: String(err) });
    return { name: 'database', status: 'down', detail: 'Connexion base impossible.' };
  }
}

/** Teste Upstash Redis via un ping REST (si configuré). */
async function probeRedis(): Promise<ProbeResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { name: 'redis', status: 'skipped', detail: 'Non configuré — fallback mémoire.' };
  }
  try {
    const { ms, value } = await timed(() =>
      fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    );
    return value.ok
      ? { name: 'redis', status: 'ok', latencyMs: ms, detail: 'PING OK.' }
      : { name: 'redis', status: 'down', latencyMs: ms, detail: `HTTP ${value.status}.` };
  } catch (err) {
    logError('[health/detailed] redis probe failed', { error: String(err) });
    return { name: 'redis', status: 'down', detail: 'Ping Redis impossible.' };
  }
}

/** Teste l'accessibilité de l'endpoint R2 (HEAD sur l'API S3-compatible). */
async function probeR2(): Promise<ProbeResult> {
  const account = process.env.R2_ACCOUNT_ID;
  if (!account || !process.env.R2_BUCKET_NAME) {
    return { name: 'storage', status: 'skipped', detail: 'Non configuré — fallback data URL.' };
  }
  try {
    const { ms, value } = await timed(() =>
      fetch(`https://${account}.r2.cloudflarestorage.com`, { method: 'HEAD', cache: 'no-store' })
    );
    // R2 renvoie 400/403 sur HEAD non signé : cela prouve que l'endpoint répond.
    const reachable = value.status > 0;
    return {
      name: 'storage',
      status: reachable ? 'ok' : 'down',
      latencyMs: ms,
      detail: reachable ? 'Endpoint R2 joignable.' : 'Endpoint R2 injoignable.',
    };
  } catch (err) {
    logError('[health/detailed] r2 probe failed', { error: String(err) });
    return { name: 'storage', status: 'down', detail: 'Endpoint R2 injoignable.' };
  }
}

/**
 * GET /api/health/detailed
 * Teste activement Turso, Redis et R2 et retourne le statut de chaque dépendance.
 * Code HTTP 200 si tout est ok/degraded/skipped, 503 si une dépendance est down.
 */
export async function GET() {
  const [database, redis, storage, tcounts] = await Promise.all([probeDatabase(), probeRedis(), probeR2(), tenantCounts()]);
  const probes = [database, redis, storage];
  const anyDown = probes.some((p) => p.status === 'down');

  const dbMock = !process.env.TURSO_DATABASE_URL;
  const mode = process.env.NODE_ENV === 'production' ? (dbMock ? 'PROD-MOCK' : 'production') : 'development';

  return NextResponse.json(
    {
      service: 'aurapost',
      status: anyDown ? 'degraded' : 'ok',
      mode, // 'production' | 'PROD-MOCK' (alerte rouge : prod sur base mémoire) | 'development'
      version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? process.env.npm_package_version ?? 'dev',
      deployedAt: process.env.BUILD_TIME ?? null,
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      tenants: tcounts, // { real, demo } — démo exclue des métriques business
      probes,
      integrations: getIntegrationStatuses().map(({ key, label, mode, configured }) => ({
        key,
        label,
        mode,
        configured,
      })),
    },
    { status: anyDown ? 503 : 200, headers: { 'Cache-Control': 'no-store' } }
  );
}
