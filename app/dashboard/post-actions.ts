'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import {
  setPostStatus,
  createVariantForPost,
  schedulePost,
  incrementCopyCount,
  runCaptionPackGeneration,
  getPostById,
  type PostStatus,
} from '@/lib/db/posts';
import { getPhoto, linkPhotoToPost } from '@/lib/db/photos';

async function ctx() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Non autorisé');
  const tenantId = await requireTenantId();
  return { tenantId, userId: session.user.id };
}

export async function approvePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    await setPostStatus(tenantId, userId, postId, 'approved' satisfies PostStatus);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

/**
 * Approbation enrichie depuis le dialog photo : associe (optionnellement) une photo
 * de la bibliothèque au post, le passe en « approuvé », et le programme si une date
 * est fournie. Tout est scellé au tenant (vérif post + photo).
 */
export async function approveWithPhotoAction(
  postId: string,
  opts: { photoId?: string | null; textOverlay?: string | null; scheduleDate?: string | null } = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();

    const post = await getPostById(tenantId, postId);
    if (!post) return { ok: false, error: 'Post introuvable' };

    if (opts.photoId) {
      const photo = await getPhoto(tenantId, opts.photoId);
      if (!photo) return { ok: false, error: 'Photo introuvable' };
      await linkPhotoToPost(postId, opts.photoId, opts.textOverlay ?? undefined);
    }

    await setPostStatus(tenantId, userId, postId, 'approved' satisfies PostStatus);

    if (opts.scheduleDate) {
      const iso = new Date(`${opts.scheduleDate}T09:00:00`).toISOString();
      if (!Number.isNaN(new Date(iso).getTime())) {
        await schedulePost(tenantId, userId, postId, iso);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

export async function rejectPostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    await setPostStatus(tenantId, userId, postId, 'rejected' satisfies PostStatus);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

export async function requestVariantAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const res = await createVariantForPost(tenantId, userId, postId);
    if (!res.ok) return { ok: false, error: 'Génération de variante impossible' };
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

/** Planifie (ou déplanifie si null) un post à une date (YYYY-MM-DD). */
export async function schedulePostAction(
  postId: string,
  date: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const iso = date ? new Date(`${date}T09:00:00`).toISOString() : null;
    if (date && Number.isNaN(new Date(iso!).getTime())) return { ok: false, error: 'Date invalide' };
    await schedulePost(tenantId, userId, postId, iso);
    revalidatePath('/dashboard/calendar');
    revalidatePath(`/dashboard/posts/${postId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Planification impossible' };
  }
}

/** Incrémente le compteur « copié X fois » (appelé à la copie côté client). */
export async function trackCopyAction(postId: string): Promise<{ ok: boolean; count?: number }> {
  try {
    const { tenantId } = await ctx();
    const count = await incrementCopyCount(tenantId, postId);
    return { ok: true, count };
  } catch {
    return { ok: false };
  }
}

/** Génère un pack de 30 légendes courtes (stories Instagram). */
export async function generateCaptionPackAction(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const res = await runCaptionPackGeneration(tenantId, userId);
    if (!res.ok) {
      return { ok: false, error: res.error === 'no_profile' ? 'Complétez votre profil d’abord.' : 'Génération impossible' };
    }
    revalidatePath('/dashboard');
    return { ok: true, count: res.count };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}
