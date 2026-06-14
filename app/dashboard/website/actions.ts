'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { setSiteStyle } from '@/lib/db/website';
import { getSiteEditorData, saveEditorSiteContent, publishWebsite as publishWebsiteDb, unpublishWebsite, type SiteEditorData } from '@/lib/db/coach-site';
import { SiteContentSchema } from '@/lib/db/site';
import { uploadCoachPhoto } from '@/lib/r2';
import { validateImage, POST_PHOTO_MIME } from '@/lib/upload';
import { MAX_UPLOAD_BYTES } from '@/lib/security';
import { logError } from '@/lib/logger';

const StyleSchema = z.enum(['impact', 'clarte', 'authenticite']);

async function ctx(): Promise<{ tenantId: string; userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé' };
  try {
    return { tenantId: await requireTenantId(), userId: session.user.id };
  } catch {
    return { error: 'Session invalide' };
  }
}

/** Charge les données de pré-remplissage de l'éditeur (contenu mergé + profil). */
export async function getSiteEditorDataAction(): Promise<{ ok: boolean; data?: SiteEditorData; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const data = await getSiteEditorData(c.tenantId);
  if (!data) return { ok: false, error: 'Complète d’abord ton profil.' };
  return { ok: true, data };
}

/** Enregistre le contenu édité du site (autosave). Validé par SiteContentSchema. */
export async function saveSiteContent(content: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = SiteContentSchema.safeParse(content);
  if (!parsed.success) return { ok: false, error: 'Contenu invalide' };
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const res = await saveEditorSiteContent(c.tenantId, c.userId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error === 'no_site' ? 'Génère d’abord ton site.' : 'Action impossible' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Upload d'une photo de site (réutilise la validation magic-bytes + sharp). */
export async function uploadSitePhoto(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const file = formData.get('photo');
  if (!(file instanceof File)) return { ok: false, error: 'Aucune photo reçue.' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `Photo trop lourde (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} Mo).` };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateImage(buffer, POST_PHOTO_MIME)) return { ok: false, error: 'Format non supporté (JPG, PNG, WebP ou HEIC).' };
    const res = await uploadCoachPhoto(c.tenantId, `site-${file.name || 'photo.jpg'}`, buffer);
    if (!res.ok) return { ok: false, error: 'Échec de l’upload.' };
    return { ok: true, url: res.url };
  } catch (err) {
    logError('[uploadSitePhoto]', { error: String(err) });
    return { ok: false, error: 'Upload impossible' };
  }
}

/** Publie / dépublie le site. */
export async function setSitePublished(published: boolean): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const res = published ? await publishWebsiteDb(c.tenantId, c.userId) : await unpublishWebsite(c.tenantId, c.userId);
  if (!res.ok) return { ok: false, error: 'Action impossible' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

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
