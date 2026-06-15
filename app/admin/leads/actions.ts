'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { updateAgencyLead, type AgencyLeadStatus } from '@/lib/db/agency';
import { sanitizeText } from '@/lib/security';

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminSession(session);
}

const StatusSchema = z.enum(['new', 'contacted', 'demo', 'won', 'lost']);

export async function setLeadStatusAction(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: 'Non autorisé' };
  const parsed = StatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: 'Statut invalide' };
  await updateAgencyLead(id, { status: parsed.data as AgencyLeadStatus });
  revalidatePath('/admin/leads');
  return { ok: true };
}

export async function saveLeadNotesAction(id: string, notes: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: 'Non autorisé' };
  await updateAgencyLead(id, { notes: sanitizeText(notes).slice(0, 2000) });
  revalidatePath('/admin/leads');
  return { ok: true };
}
