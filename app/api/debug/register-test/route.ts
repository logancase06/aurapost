import { NextRequest, NextResponse } from 'next/server';
import { createTenantAndOwner, hashPassword } from '@/lib/db/users-actions';
import { db } from '@/lib/db';
import { tenants, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const testEmail = `debug-test-${Date.now()}@aurapost-debug.internal`;
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    const passwordHash = await hashPassword('Debug@12345');
    ({ tenantId, userId } = await createTenantAndOwner({
      email: testEmail,
      passwordHash,
      fullName: 'Debug Test',
      brandName: 'Debug Brand',
      consentGivenAt: new Date().toISOString(),
    }));

    // Nettoyage immédiat
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return NextResponse.json({ ok: true, tenantId, userId });
  } catch (err) {
    // Tentative de nettoyage en cas d'échec partiel
    if (tenantId) {
      await db.delete(tenants).where(eq(tenants.id, tenantId)).catch(() => {});
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    }

    const e = err as Record<string, unknown>;
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? String(err),
        stack: e?.stack ?? null,
        code: e?.code ?? null,
        cause: e?.cause ? String(e.cause) : null,
        raw: String(err),
      },
      { status: 500 }
    );
  }
}
