'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { setTenantStatus } from '@/lib/db/admin';

export async function toggleTenantStatusAction(
  tenantId: string,
  next: 'active' | 'disabled'
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!isAdminSession(session)) return { ok: false, error: 'Accès refusé' };
  try {
    await setTenantStatus(session!.user.id, tenantId, next);
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}
