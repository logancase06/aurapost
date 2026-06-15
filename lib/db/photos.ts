import { nanoid } from 'nanoid';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './index';
import { coachPhotos, postPhotos } from './schema';
import { logError } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Bibliothèque photos du coach + liaison post ↔ photo. Toujours scellé au tenant.
// ─────────────────────────────────────────────────────────────────────────────

export interface PhotoRow {
  id: string;
  r2Url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

export async function savePhoto(
  tenantId: string,
  input: { r2Url: string; r2Key?: string | null; thumbnailUrl?: string | null; width?: number; height?: number; sizeBytes?: number }
): Promise<PhotoRow> {
  const id = nanoid();
  const createdAt = new Date().toISOString();
  await db.insert(coachPhotos).values({
    id,
    tenantId,
    r2Key: input.r2Key ?? null,
    r2Url: input.r2Url,
    thumbnailUrl: input.thumbnailUrl ?? input.r2Url,
    width: input.width ?? null,
    height: input.height ?? null,
    sizeBytes: input.sizeBytes ?? null,
    createdAt,
  });
  return {
    id,
    r2Url: input.r2Url,
    thumbnailUrl: input.thumbnailUrl ?? input.r2Url,
    width: input.width ?? null,
    height: input.height ?? null,
    sizeBytes: input.sizeBytes ?? null,
    createdAt,
  };
}

export async function listPhotos(tenantId: string, limit = 30): Promise<PhotoRow[]> {
  if (!tenantId) return [];
  try {
    return await db
      .select({
        id: coachPhotos.id,
        r2Url: coachPhotos.r2Url,
        thumbnailUrl: coachPhotos.thumbnailUrl,
        width: coachPhotos.width,
        height: coachPhotos.height,
        sizeBytes: coachPhotos.sizeBytes,
        createdAt: coachPhotos.createdAt,
      })
      .from(coachPhotos)
      .where(eq(coachPhotos.tenantId, tenantId))
      .orderBy(desc(coachPhotos.createdAt))
      .limit(limit);
  } catch (err) {
    logError('[photos] listPhotos échoué', { error: String(err) });
    return [];
  }
}

export async function getPhoto(tenantId: string, photoId: string): Promise<PhotoRow | null> {
  const [row] = await db
    .select({
      id: coachPhotos.id,
      r2Url: coachPhotos.r2Url,
      thumbnailUrl: coachPhotos.thumbnailUrl,
      width: coachPhotos.width,
      height: coachPhotos.height,
      sizeBytes: coachPhotos.sizeBytes,
      createdAt: coachPhotos.createdAt,
    })
    .from(coachPhotos)
    .where(and(eq(coachPhotos.tenantId, tenantId), eq(coachPhotos.id, photoId)))
    .limit(1);
  return row ?? null;
}

/** Associe (ou ré-associe) une photo à un post, avec texte superposé optionnel. */
export async function linkPhotoToPost(postId: string, photoId: string, textOverlay?: string): Promise<void> {
  await db.delete(postPhotos).where(eq(postPhotos.postId, postId));
  await db.insert(postPhotos).values({
    id: nanoid(),
    postId,
    photoId,
    finalR2Key: null,
    textOverlay: textOverlay ?? null,
    createdAt: new Date().toISOString(),
  });
}

/** Supprime une photo de la bibliothèque coach (scellé au tenant) + son objet R2 + ses liens. */
export async function deletePhoto(tenantId: string, photoId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: coachPhotos.id, r2Key: coachPhotos.r2Key })
    .from(coachPhotos)
    .where(and(eq(coachPhotos.tenantId, tenantId), eq(coachPhotos.id, photoId)))
    .limit(1);
  if (!row) return false;
  // Suppression R2 best-effort AVANT la DB (un orphelin DB serait pire qu'un orphelin R2).
  const { deleteR2Object } = await import('@/lib/r2');
  await deleteR2Object(row.r2Key);
  await db.delete(postPhotos).where(eq(postPhotos.photoId, photoId));
  await db.delete(coachPhotos).where(and(eq(coachPhotos.tenantId, tenantId), eq(coachPhotos.id, photoId)));
  return true;
}

/** Photo associée à un post (URL), si présente. */
export async function getPostPhotoUrl(tenantId: string, postId: string): Promise<string | null> {
  const [link] = await db.select({ photoId: postPhotos.photoId }).from(postPhotos).where(eq(postPhotos.postId, postId)).limit(1);
  if (!link) return null;
  const photo = await getPhoto(tenantId, link.photoId);
  return photo?.r2Url ?? null;
}
