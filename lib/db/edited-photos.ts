import { nanoid } from 'nanoid';
import { and, eq, gte, count } from 'drizzle-orm';
import { db } from './index';
import { editedPhotos, imageEditJobs } from './schema';
import { logError } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Photos éditées par IA — toujours scellées au tenant, jamais écrasées.
// ─────────────────────────────────────────────────────────────────────────────

export interface EditedPhotoRow {
  id: string;
  sourcePhotoId: string;
  r2Url: string;
  prompt: string;
  model: string;
  status: string;
  validatedAt: string | null;
  createdAt: string;
}

export async function saveEditedPhoto(
  tenantId: string,
  input: {
    sourcePhotoId: string;
    r2Url: string;
    r2Key: string | null;
    prompt: string;
    model: string;
  }
): Promise<EditedPhotoRow> {
  const id = nanoid();
  const createdAt = new Date().toISOString();
  await db.insert(editedPhotos).values({
    id,
    tenantId,
    sourcePhotoId: input.sourcePhotoId,
    r2Key: input.r2Key,
    r2Url: input.r2Url,
    prompt: input.prompt,
    model: input.model,
    status: 'done',
    validatedAt: null,
    createdAt,
  });
  return { id, sourcePhotoId: input.sourcePhotoId, r2Url: input.r2Url, prompt: input.prompt, model: input.model, status: 'done', validatedAt: null, createdAt };
}

export async function validateEditedPhoto(tenantId: string, editedPhotoId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: editedPhotos.id })
    .from(editedPhotos)
    .where(and(eq(editedPhotos.tenantId, tenantId), eq(editedPhotos.id, editedPhotoId)))
    .limit(1);
  if (!row) return false;
  await db
    .update(editedPhotos)
    .set({ validatedAt: new Date().toISOString() })
    .where(eq(editedPhotos.id, editedPhotoId));
  return true;
}

export async function listEditedPhotos(tenantId: string, limit = 20): Promise<EditedPhotoRow[]> {
  if (!tenantId) return [];
  try {
    return await db
      .select({
        id: editedPhotos.id,
        sourcePhotoId: editedPhotos.sourcePhotoId,
        r2Url: editedPhotos.r2Url,
        prompt: editedPhotos.prompt,
        model: editedPhotos.model,
        status: editedPhotos.status,
        validatedAt: editedPhotos.validatedAt,
        createdAt: editedPhotos.createdAt,
      })
      .from(editedPhotos)
      .where(eq(editedPhotos.tenantId, tenantId))
      .orderBy(editedPhotos.createdAt)
      .limit(limit);
  } catch (err) {
    logError('[edited-photos] listEditedPhotos échoué', { error: String(err) });
    return [];
  }
}

/** Compte les éditions faites ce mois-ci pour le contrôle de quota. */
export async function countEditedThisMonth(tenantId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ total: count() })
    .from(editedPhotos)
    .where(
      and(
        eq(editedPhotos.tenantId, tenantId),
        gte(editedPhotos.createdAt, startOfMonth.toISOString())
      )
    );
  return row?.total ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Jobs d'édition automatique (mode post-génération)
// ─────────────────────────────────────────────────────────────────────────────

export async function createImageEditJob(tenantId: string, generationJobId: string | null, photosRequested: number): Promise<string> {
  const id = nanoid();
  await db.insert(imageEditJobs).values({
    id,
    tenantId,
    generationJobId,
    status: 'pending',
    photosRequested,
    photosDone: 0,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getImageEditJob(jobId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(imageEditJobs)
    .where(and(eq(imageEditJobs.id, jobId), eq(imageEditJobs.tenantId, tenantId)))
    .limit(1);
  return row ?? null;
}
