import { NextRequest, NextResponse } from 'next/server';
import { IS_R2_CONFIGURED } from '@/lib/r2';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = `debug/r2-test-${Date.now()}.txt`;

  // 1. Etat de la configuration R2
  const config = {
    IS_R2_CONFIGURED,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'set' : 'MISSING',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'set' : 'MISSING',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'set' : 'MISSING',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? 'MISSING',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? '(non defini)',
  };

  if (!IS_R2_CONFIGURED) {
    return NextResponse.json({ ok: false, reason: 'R2 non configure', config });
  }

  // 2. Test upload direct (sans sharp) avec un buffer texte minimal
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
    const body = Buffer.from('test content aurapost');

    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain',
    }));

    // Nettoyage best-effort
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});

    const url = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : '(signe non teste ici)';

    return NextResponse.json({ ok: true, url, config });
  } catch (err) {
    const e = err as { message?: string; stack?: string; code?: string; cause?: unknown; name?: string };
    return NextResponse.json(
      {
        ok: false,
        config,
        error: e?.message ?? String(err),
        name: e?.name ?? null,
        code: e?.code ?? null,
        cause: e?.cause ? String(e.cause) : null,
        stack: e?.stack ?? null,
      },
      { status: 500 }
    );
  }
}
