'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { canGenerateSite } from '@/lib/plans';
import { setSiteStyle } from '@/lib/db/website';
import { generateAndStoreSite } from '@/lib/db/coach-site';
import { findDemoSite } from '@/lib/explore/sites';
import { logEvent } from '@/lib/logger';

const DemoIdSchema = z.string().min(1).max(60);

export interface UseDemoStyleResult {
  ok: boolean;
  redirectTo?: string;
  error?: string;
}

/**
 * « Utiliser ce style » : applique le style d'un site démo au site du coach,
 * génère le contenu depuis son profil (si suffisamment rempli) puis renvoie
 * l'URL de l'éditeur. Le tenant est dérivé de la session (jamais du client).
 */
export async function useDemoStyle(demoId: string): Promise<UseDemoStyleResult> {
  const parsed = DemoIdSchema.safeParse(demoId);
  if (!parsed.success) return { ok: false, error: 'Démo inconnue' };

  const demo = findDemoSite(parsed.data);
  if (!demo) return { ok: false, error: 'Démo inconnue' };

  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  if (!canGenerateSite(session.user.plan)) return { ok: false, error: 'Le site vitrine est inclus dans le Pack Complet.' };

  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { ok: false, error: 'Session invalide' };
  }

  // 1. Applique le style choisi (crée la ligne site si besoin).
  const styled = await setSiteStyle(tenantId, session.user.id, demo.style);
  if (!styled.ok) return { ok: false, error: 'Complète d’abord ton profil (nom + spécialité).' };

  // 2. Génère le contenu depuis le profil — best effort : un profil incomplet ne
  //    bloque pas (le style est appliqué, le coach personnalisera dans l'éditeur).
  const gen = await generateAndStoreSite(tenantId, session.user.id);
  if (!gen.ok) {
    return { ok: false, error: 'Complète d’abord ton profil (nom + spécialité).' };
  }

  logEvent('explore.use_style', tenantId, { demo: demo.id, style: demo.style });
  revalidatePath('/dashboard/website');
  return { ok: true, redirectTo: `/dashboard/website/editor?from=explore&demo=${demo.id}` };
}
