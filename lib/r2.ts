import { logError } from './logger';

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

// Re-encode systématiquement l'image en JPEG via sharp. Si sharp échoue (binaire natif
// absent, image corrompue/malveillante), on LÈVE : pas de fallback "stockage brut" qui
// laisserait passer un fichier non ré-encodé (sécurité).
async function resize(buffer: Buffer): Promise<{ data: Buffer; contentType: string }> {
  const sharpMod = await import('sharp');
  const sharp = sharpMod.default;
  const out = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
  return { data: out, contentType: 'image/jpeg' };
}

function s3Client() {
  return import('@aws-sdk/client-s3').then(({ S3Client }) => ({
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    }),
    bucket: process.env.R2_BUCKET_NAME!,
  }));
}

export async function uploadCoachPhoto(
  tenantId: string,
  originalName: string,
  buffer: Buffer
): Promise<{ ok: true; url: string; key: string | null } | { ok: false; reason: string }> {
  let data: Buffer;
  let ct: string;
  try {
    const r = await resize(buffer);
    data = r.data;
    ct = r.contentType;
  } catch (err) {
    // sharp indisponible ou image illisible → on REFUSE plutôt que stocker du brut.
    logError('[r2] re-encodage (sharp) échoué — upload refusé', { error: String(err) });
    return { ok: false, reason: 'resize_failed' };
  }
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-40) || 'photo.jpg';
  const key = `coaches/${tenantId}/photos/${Date.now()}-${safeName}`;

  // ── Mode mock : pas de R2 → data URL (base64) ───────────────────────────────
  if (!IS_R2_CONFIGURED) {
    return { ok: true, url: `data:${ct};base64,${data.toString('base64')}`, key: null };
  }

  try {
    const { PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { client, bucket } = await s3Client();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: ct }));

    // URL publique si bucket public, sinon URL signée 1 an.
    if (process.env.R2_PUBLIC_URL) {
      return { ok: true, url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`, key };
    }
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: SIGNED_URL_TTL });
    return { ok: true, url, key };
  } catch (err) {
    logError('[r2] upload échoué', { error: String(err) });
    return { ok: false, reason: 'upload_failed' };
  }
}

/** Upload d'une image éditée par IA (résultat d'editImage, déjà en Buffer). */
export async function uploadEditedPhoto(
  tenantId: string,
  sourcePhotoId: string,
  buffer: Buffer
): Promise<{ ok: true; url: string; key: string | null } | { ok: false; reason: string }> {
  let data: Buffer;
  let ct: string;
  try {
    const r = await resize(buffer);
    data = r.data;
    ct = r.contentType;
  } catch (err) {
    logError('[r2] re-encodage édition (sharp) échoué', { error: String(err) });
    return { ok: false, reason: 'resize_failed' };
  }
  const key = `coaches/${tenantId}/edited/${Date.now()}-${sourcePhotoId.slice(-8)}.jpg`;

  if (!IS_R2_CONFIGURED) {
    return { ok: true, url: `data:${ct};base64,${data.toString('base64')}`, key: null };
  }

  try {
    const { PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { client, bucket } = await s3Client();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: ct }));
    if (process.env.R2_PUBLIC_URL) {
      return { ok: true, url: `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`, key };
    }
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: SIGNED_URL_TTL });
    return { ok: true, url, key };
  } catch (err) {
    logError('[r2] upload édition échoué', { error: String(err) });
    return { ok: false, reason: 'upload_failed' };
  }
}

/** Supprime un objet R2 (best-effort). Ne lève jamais — l'orphelin est moins grave. */
export async function deleteR2Object(key: string | null): Promise<void> {
  if (!key || !IS_R2_CONFIGURED) return;
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const { client, bucket } = await s3Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    logError('[r2] suppression échouée (orphelin laissé)', { key, error: String(err) });
  }
}
