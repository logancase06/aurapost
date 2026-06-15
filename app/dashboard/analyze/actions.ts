'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { applyBioToProfile, setLastRecommendation } from '@/lib/db/analyses';
import { getSubdomainForTenant } from '@/lib/db/website';
import { updateTag } from 'next/cache';
import { sanitizeText } from '@/lib/security';

async function tenant(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    return await requireTenantId();
  } catch {
    return null;
  }
}

/** Applique la bio proposée au profil coach (et invalide le cache du site public). */
export async function applyBioAction(bio: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().min(1).max(1000).safeParse(bio);
  if (!parsed.success) return { ok: false, error: 'Bio invalide' };
  const tenantId = await tenant();
  if (!tenantId) return { ok: false, error: 'Non autorisé' };
  await applyBioToProfile(tenantId, sanitizeText(parsed.data));
  const sub = await getSubdomainForTenant(tenantId);
  if (sub) updateTag(`site-${sub.toLowerCase()}`);
  revalidatePath('/dashboard/profile');
  return { ok: true };
}

/** Marque l'action prioritaire comme faite (efface last_recommendation). */
export async function markRecommendationDoneAction(): Promise<{ ok: boolean }> {
  const tenantId = await tenant();
  if (!tenantId) return { ok: false };
  await setLastRecommendation(tenantId, null);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/analyze');
  return { ok: true };
}
