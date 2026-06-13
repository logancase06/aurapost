import { logError, logInfo } from './logger';

// Upload de photos coach vers Cloudflare R2 (S3-compatible), côté serveur uniquement.
// Resize automatique (max 1200px, JPEG qualité 85) via sharp si disponible.
// Mock propre : si R2 n'est pas configuré, on renvoie une data URL (base64) — l'aperçu
// fonctionne sans aucune clé.

export const IS_R2_CONFIGURED = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 an

async function resize(buffer: Buffer, contentType: string): Promise<{ data: Buffer; contentType: string }> {
  try {
    const sharpMod = await import('sharp');
    const sharp = sharpMod.default;
    const out = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    return { data: out, contentType: 'image/jpeg' };
  } catch (err) {
    logInfo('[r2] sharp indisponible — image stockée sans redimensionnement', { error: String(err) });
    return { data: buffer, contentType };
  }
}

export async function uploadCoachPhoto(
  tenantId: string,
  originalName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  const { data, contentType: ct } = await resize(buffer, contentType);
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-40) || 'photo.jpg';
  const key = `coaches/${tenantId}/photos/${Date.now()}-${safeName}`;

  // ── Mode mock : pas de R2 → data URL (base64) ───────────────────────────────
  if (!IS_R2_CONFIGURED) {
    return { ok: true, url: `data:${ct};base64,${data.toString('base64')}` };
  }

  try {
    const { S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const bucket = process.env.R2_BUCKET_NAME!;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: ct }));

    // URL publique si bucket public, sinon URL signée 1 an.
    if (process.env.R2_PUBLIC_URL) {
      return { ok: true, url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` };
    }
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: SIGNED_URL_TTL });
    return { ok: true, url };
  } catch (err) {
    logError('[r2] upload échoué', { error: String(err) });
    return { ok: false, reason: 'upload_failed' };
  }
}
