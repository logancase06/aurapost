'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { updateSiteContent } from '@/lib/db/coach-site';
import type { SiteContent } from '@/lib/site-content';

export async function updateSiteContentAction(content: SiteContent): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
    const tenantId = await requireTenantId();
    await updateSiteContent(tenantId, session.user.id, content);
    revalidatePath('/dashboard/website/preview');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Enregistrement impossible' };
  }
}
