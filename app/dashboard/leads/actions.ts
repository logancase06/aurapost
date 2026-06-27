'use server';

import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import { siteLeads } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { logError } from '@/lib/logger';

const VALID_STATUSES = ['new', 'contacted', 'converted', 'archived'];

export async function updateLeadStatusAction(leadId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
    const tenantId = await requireTenantId();
    if (!VALID_STATUSES.includes(status)) return { ok: false, error: 'Statut invalide' };

    await db
      .update(siteLeads)
      .set({ status })
      .where(and(eq(siteLeads.id, leadId), eq(siteLeads.tenantId, tenantId)));

    return { ok: true };
  } catch (err) {
    logError('[lead-status]', { error: String(err) });
    return { ok: false, error: 'Erreur interne' };
  }
}
