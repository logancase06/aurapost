import { NextRequest, NextResponse } from 'next/server';
import { IS_R2_CONFIGURED, uploadCoachPhoto } from '@/lib/r2';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { coachPhotos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { savePhoto } from '@/lib/db/photos';

// PNG 1x1 pixel rouge — valide pour sharp, < 100 octets.
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==',
  'base64'
);

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    IS_R2_CONFIGURED,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'set' : 'MISSING',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? 'MISSING',
  };

  // ── Etape 1 : PRAGMA table_info(coach_photos) ────────────────────────────────
  try {
    const pragma = await db.all<{ name: string; type: string; notnull: number }>(
      sql`PRAGMA table_info(coach_photos)`
    );
    results.coachPhotosColumns = pragma.map((c) => `${c.name} ${c.type}${c.notnull ? ' NOT NULL' : ''}`);
  } catch (err) {
    results.coachPhotosColumns = `PRAGMA error: ${String(err)}`;
  }

  // ── Etape 2 : sharp + uploadCoachPhoto (chemin exact du POST /api/posts/photo) ─
  let uploadRes: Awaited<ReturnType<typeof uploadCoachPhoto>> | null = null;
  try {
    uploadRes = await uploadCoachPhoto('debug-tenant', 'test.png', MINIMAL_PNG);
    results.uploadCoachPhoto = uploadRes.ok ? 'ok' : { ok: false, reason: uploadRes.reason };
  } catch (err) {
    const e = err as { message?: string; stack?: string; code?: string };
    results.uploadCoachPhoto = 'THREW';
    results.uploadCoachPhotoError = {
      message: e?.message ?? String(err),
      code: e?.code ?? null,
      stack: (e?.stack ?? '').split('\n').slice(0, 8).join('\n'),
    };
    return NextResponse.json({ step: 'uploadCoachPhoto', ...results }, { status: 500 });
  }

  if (!uploadRes.ok) {
    return NextResponse.json({ step: 'uploadCoachPhoto', ...results }, { status: 500 });
  }

  // ── Etape 3 : savePhoto (insert DB) ─────────────────────────────────────────
  const debugTenantId = 'debug-tenant-test-cleanup';
  try {
    await savePhoto(debugTenantId, {
      r2Url: uploadRes.url,
      r2Key: uploadRes.key,
      sizeBytes: MINIMAL_PNG.length,
    });
    results.savePhoto = 'ok';
    await db.delete(coachPhotos).where(eq(coachPhotos.tenantId, debugTenantId)).catch(() => {});
  } catch (err) {
    const e = err as { message?: string; stack?: string; code?: string; cause?: unknown };
    results.savePhoto = 'FAILED';
    results.savePhotoError = {
      message: e?.message ?? String(err),
      code: e?.code ?? null,
      cause: e?.cause ? String(e.cause) : null,
      stack: (e?.stack ?? '').split('\n').slice(0, 6).join('\n'),
    };
    return NextResponse.json({ step: 'savePhoto', ...results }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...results });
}
