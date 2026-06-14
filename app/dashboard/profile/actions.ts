'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { deletePhoto } from '@/lib/db/photos';

/** Supprime une photo de la bibliothèque du coach (scellé au tenant). */
export async function deletePhotoAction(photoId: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().min(1).max(64).safeParse(photoId);
  if (!parsed.success) return { ok: false, error: 'Identifiant invalide' };
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { ok: false, error: 'Session invalide' };
  }
  const ok = await deletePhoto(tenantId, parsed.data);
  if (!ok) return { ok: false, error: 'Photo introuvable' };
  revalidatePath('/dashboard/profile');
  return { ok: true };
}
