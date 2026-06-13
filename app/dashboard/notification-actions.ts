'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { markRead } from '@/lib/db/notifications';

/** Marque une notification (ou toutes si id omis) comme lue pour le tenant courant. */
export async function markNotificationsReadAction(id?: string): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };
    const tenantId = await requireTenantId();
    await markRead(tenantId, id);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
