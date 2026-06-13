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
  type PostStatus,
} from '@/lib/db/posts';

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
