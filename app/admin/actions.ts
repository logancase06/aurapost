'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { setTenantStatus, setTicketStatus } from '@/lib/db/admin';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sendEmail, welcomeEmail } from '@/lib/email';
import { logActivity } from '@/lib/db/activity';

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

/** Envoie un email de réengagement à un coach inactif (Step 6 / 19). */
export async function sendReengagementAction(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!isAdminSession(session)) return { ok: false, error: 'Accès refusé' };
  try {
    const [owner] = await db
      .select({ email: users.email, name: users.fullName })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .limit(1);
    if (!owner?.email) return { ok: false, error: 'Coach introuvable' };

    await sendEmail(
      { email: owner.email, name: owner.name },
      'On ne vous a pas vu depuis un moment sur AuraPost ✦',
      welcomeEmail(owner.name.split(' ')[0] || 'coach')
    );
    await logActivity(tenantId, session!.user.id, 'admin_reengagement_sent', tenantId, {});
    return { ok: true };
  } catch {
    return { ok: false, error: 'Envoi impossible' };
  }
}

/** Bascule le statut d'un ticket de support (ouvert/fermé). */
export async function toggleTicketAction(ticketId: string, next: 'open' | 'closed'): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!isAdminSession(session)) return { ok: false };
  try {
    await setTicketStatus(session!.user.id, ticketId, next);
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
