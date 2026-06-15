'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { createOrganization, getOrgForTenant, upsertBrandKit, addOrgTemplate } from '@/lib/db/organizations';
import { inviteDistributor } from '@/lib/db/org-invite';
import { sanitizeText } from '@/lib/security';

async function ownerCtx(): Promise<{ tenantId: string; orgId: string; orgName: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé' };
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { error: 'Session invalide' };
  }
  const membership = await getOrgForTenant(tenantId);
  if (!membership) return { error: 'Aucune organisation' };
  if (membership.role !== 'owner') return { error: 'Réservé au propriétaire de l’organisation' };
  return { tenantId, orgId: membership.org.id, orgName: membership.org.name };
}

/** Crée une organisation pour le tenant courant (devient owner). */
export async function createOrgAction(name: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().min(2).max(120).safeParse(name);
  if (!parsed.success) return { ok: false, error: 'Nom invalide (2-120 caractères).' };
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    return { ok: false, error: 'Session invalide' };
  }
  await createOrganization(tenantId, sanitizeText(parsed.data));
  revalidatePath('/dashboard/org');
  return { ok: true };
}

const InviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  speciality: z.string().max(160).optional(),
});

/** Invite un distributeur dans l'organisation du propriétaire courant. */
export async function inviteMemberAction(input: unknown): Promise<{ ok: boolean; created?: boolean; error?: string }> {
  const c = await ownerCtx();
  if ('error' in c) return { ok: false, error: c.error };
  const parsed = InviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Email ou champs invalides.' };
  const res = await inviteDistributor(c.orgId, c.orgName, parsed.data);
  if (!res.ok) return { ok: false, error: res.error ?? 'Invitation impossible' };
  revalidatePath('/dashboard/org');
  return { ok: true, created: res.created };
}

const BrandKitSchema = z.object({
  primaryColor: z.string().max(9).optional(),
  secondaryColor: z.string().max(9).optional(),
  toneGuidelines: z.string().max(1000).optional(),
  forbiddenWords: z.string().max(1000).optional(), // saisi en CSV → split
});

/** Enregistre le brand kit de l'organisation. */
export async function saveBrandKitAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const c = await ownerCtx();
  if ('error' in c) return { ok: false, error: c.error };
  const parsed = BrandKitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Données invalides.' };
  const words = (parsed.data.forbiddenWords ?? '')
    .split(/[,\n]/)
    .map((w) => sanitizeText(w).trim())
    .filter(Boolean)
    .slice(0, 50);
  await upsertBrandKit(c.orgId, {
    primaryColor: parsed.data.primaryColor,
    secondaryColor: parsed.data.secondaryColor,
    toneGuidelines: parsed.data.toneGuidelines ? sanitizeText(parsed.data.toneGuidelines) : undefined,
    forbiddenWords: words,
  });
  revalidatePath('/dashboard/org');
  return { ok: true };
}

const TemplateSchema = z.object({
  name: z.string().min(2).max(120),
  content: z.string().min(5).max(4000),
  category: z.string().max(80).optional(),
});

/** Ajoute un template de contenu validé par la marque. */
export async function addTemplateAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const c = await ownerCtx();
  if ('error' in c) return { ok: false, error: c.error };
  const parsed = TemplateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Template invalide.' };
  await addOrgTemplate(c.orgId, {
    name: sanitizeText(parsed.data.name),
    content: sanitizeText(parsed.data.content),
    category: parsed.data.category ? sanitizeText(parsed.data.category) : undefined,
  });
  revalidatePath('/dashboard/org');
  return { ok: true };
}
