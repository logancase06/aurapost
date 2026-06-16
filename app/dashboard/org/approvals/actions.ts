'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getOrgForTenant } from '@/lib/db/organizations';
import { approvePost, rejectPost } from '@/lib/db/approvals';
import { sendPostDecisionEmail } from '@/lib/email';
import { sanitizeText } from '@/lib/security';

async function ownerCtx(): Promise<{ orgId: string; userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé' };
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { error: 'Session invalide' };
  }
  const m = await getOrgForTenant(tenantId);
  if (!m || m.role !== 'owner') return { error: 'Réservé au propriétaire de l’organisation' };
  return { orgId: m.org.id, userId: session.user.id };
}

export async function approvePostAction(postId: string, comment?: string): Promise<{ ok: boolean; error?: string }> {
  const c = await ownerCtx();
  if ('error' in c) return { ok: false, error: c.error };
  if (!z.string().min(1).max(64).safeParse(postId).success) return { ok: false, error: 'Post invalide' };
  const res = await approvePost(c.orgId, c.userId, postId, comment ? sanitizeText(comment).slice(0, 500) : undefined);
  if (!res.ok) return { ok: false, error: res.error };
  if (res.notify) {
    const n = res.notify;
    after(() => sendPostDecisionEmail({ email: n.email, name: n.name.split(' ')[0] || 'coach' }, true, comment));
  }
  revalidatePath('/dashboard/org/approvals');
  return { ok: true };
}

export async function rejectPostAction(postId: string, comment: string): Promise<{ ok: boolean; error?: string }> {
  const c = await ownerCtx();
  if ('error' in c) return { ok: false, error: c.error };
  const parsed = z.object({ postId: z.string().min(1).max(64), comment: z.string().min(1).max(500) }).safeParse({ postId, comment });
  if (!parsed.success) return { ok: false, error: 'Un commentaire est requis pour rejeter.' };
  const clean = sanitizeText(parsed.data.comment).slice(0, 500);
  const res = await rejectPost(c.orgId, c.userId, postId, clean);
  if (!res.ok) return { ok: false, error: res.error };
  if (res.notify) {
    const n = res.notify;
    after(() => sendPostDecisionEmail({ email: n.email, name: n.name.split(' ')[0] || 'coach' }, false, clean));
  }
  revalidatePath('/dashboard/org/approvals');
  return { ok: true };
}
