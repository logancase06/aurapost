import { NextRequest, NextResponse } from 'next/server';
import { IS_R2_CONFIGURED } from '@/lib/r2';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { coachPhotos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { savePhoto } from '@/lib/db/photos';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2Key = `debug/r2-test-${Date.now()}.txt`;
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

  // ── Etape 2 : upload R2 ──────────────────────────────────────────────────────
  let r2Url = '';
  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const bucket = process.env.R2_BUCKET_NAME!;
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: r2Key,
      Body: Buffer.from('test'), ContentType: 'text/plain',
    }));
    r2Url = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${r2Key}`
      : `https://r2/${r2Key}`;
    results.r2Upload = 'ok';
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: r2Key })).catch(() => {});
  } catch (err) {
    const e = err as { message?: string; code?: string; cause?: unknown };
    results.r2Upload = 'FAILED';
    results.r2Error = { message: e?.message, code: e?.code, cause: e?.cause ? String(e.cause) : null };
    return NextResponse.json({ step: 'r2', ...results }, { status: 500 });
  }

  // ── Etape 3 : savePhoto (chemin exact de l'upload prod) ──────────────────────
  const debugPhotoId = nanoid();
  const debugTenantId = 'debug-tenant-test-' + Date.now();
  try {
    await savePhoto(debugTenantId, {
      r2Url: r2Url || 'https://debug.test/photo.jpg',
      r2Key: r2Key,
      sizeBytes: 4,
    });
    results.savePhoto = 'ok';
    // Nettoyage best-effort
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
