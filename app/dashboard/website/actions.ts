'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { setSiteStyle } from '@/lib/db/website';

const StyleSchema = z.enum(['impact', 'clarte', 'authenticite']);

/** Enregistre le style visuel choisi pour le site vitrine. */
export async function saveSiteTemplateAction(style: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = StyleSchema.safeParse(style);
  if (!parsed.success) return { ok: false, error: 'Style invalide' };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { ok: false, error: 'Session invalide' };
  }

  const res = await setSiteStyle(tenantId, session.user.id, parsed.data);
  if (!res.ok) return { ok: false, error: res.error === 'no_profile' ? 'Complète d’abord ton profil.' : 'Action impossible' };

  revalidatePath('/dashboard/website');
  return { ok: true };
}
