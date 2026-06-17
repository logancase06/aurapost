'use server';

import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { setSiteStyle, getSubdomainForTenant } from '@/lib/db/website';
import { getSiteEditorData, saveEditorSiteContent, publishWebsite as publishWebsiteDb, unpublishWebsite, type SiteEditorData } from '@/lib/db/coach-site';
import { SiteContentSchema, parseSiteContent, mergeSiteContent, type SiteContent } from '@/lib/db/site';
import { uploadCoachPhoto } from '@/lib/r2';
import { validateImage, POST_PHOTO_MIME } from '@/lib/upload';
import { MAX_UPLOAD_BYTES } from '@/lib/security';
import { logError, logEvent } from '@/lib/logger';
import { canGenerateSite } from '@/lib/plans';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { extractJson } from '@/lib/parse-json';
import { callModel, aiTextAvailable } from '@/lib/content-generator';

const StyleSchema = z.enum(['impact', 'clarte', 'authenticite']);

/**
 * Invalide le cache du site public du tenant (tag `site-<sub>`) → changement visible immédiatement.
 * `updateTag` (Next 16) : invalidation immédiate read-your-own-writes, valable uniquement depuis
 * une Server Action (le cas ici). Purge le tag posé par `unstable_cache` dans lib/db/public.ts.
 */
async function revalidateSite(tenantId: string): Promise<void> {
  const sub = await getSubdomainForTenant(tenantId);
  if (sub) updateTag(`site-${sub.toLowerCase()}`);
}

async function ctx(): Promise<{ tenantId: string; userId: string; plan: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé' };
  try {
    return { tenantId: await requireTenantId(), userId: session.user.id, plan: session.user.plan ?? 'starter' };
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
  if (!canGenerateSite(c.plan)) return { ok: false, error: 'upgrade_required' };
  const res = await saveEditorSiteContent(c.tenantId, c.userId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error === 'no_site' ? 'Génère d’abord ton site.' : 'Action impossible' };
  revalidatePath('/dashboard/website');
  await revalidateSite(c.tenantId);
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
  if (!canGenerateSite(c.plan)) return { ok: false, error: 'upgrade_required' };
  const res = published ? await publishWebsiteDb(c.tenantId, c.userId) : await unpublishWebsite(c.tenantId, c.userId);
  if (!res.ok) return { ok: false, error: 'Action impossible' };
  logEvent(published ? 'site.published' : 'site.unpublished', c.tenantId, {});
  revalidatePath('/dashboard/website');
  await revalidateSite(c.tenantId);
  return { ok: true };
}

// ── Édition IA en langage naturel ────────────────────────────────────────────

const AIEditSchema = z.object({
  instruction: z.string().min(1).max(500),
  currentContent: SiteContentSchema,
});

const AI_EDIT_SYSTEM = `Tu es un expert en copywriting pour coachs sportifs et professionnels du bien-être.
Tu reçois le contenu actuel d'un site vitrine (JSON) et une instruction de modification en langage naturel du coach.
Tu renvoies UNIQUEMENT le contenu modifié en JSON valide, sans explication, sans markdown, sans balises de code.
Règles strictes :
- Ne jamais inventer de statistiques, résultats ou chiffres non présents dans le contenu actuel
- Modifications ciblées : ne changer QUE ce qui est demandé, conserver le reste à l'identique
- Respecter le style du coach (ton, langue)
- hero.title : maximum 80 caractères
- hero.subtitle : maximum 200 caractères
- strengths[].title : maximum 40 caractères
- strengths[].description : maximum 120 caractères
- Répondre UNIQUEMENT avec le JSON, rien d'autre`;

function buildAIEditUser(
  profile: { name: string; speciality: string; city: string | null; tone: string },
  template: string,
  currentContent: SiteContent,
  instruction: string
): string {
  return `Profil du coach :
Nom : ${profile.name}
Spécialité : ${profile.speciality}
Ville : ${profile.city ?? 'non précisée'}
Ton : ${profile.tone}
Style du site : ${template}

Contenu actuel du site :
${JSON.stringify(currentContent, null, 2)}

Instruction du coach : "${instruction}"

Renvoie le contenu modifié en JSON valide.`;
}

export interface AIEditResult {
  ok: boolean;
  content?: SiteContent;
  error?: string;
}

/**
 * Modifie le contenu du site via une instruction en langage naturel.
 * Ne modifie JAMAIS le contenu si l'appel IA échoue (renvoie une erreur, l'éditeur
 * conserve son état). Rate-limité à 20 appels/heure/tenant.
 */
export async function applyAIEdit(instruction: string, currentContent: unknown): Promise<AIEditResult> {
  const parsed = AIEditSchema.safeParse({ instruction, currentContent });
  if (!parsed.success) return { ok: false, error: 'Instruction ou contenu invalide' };

  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  if (!canGenerateSite(c.plan)) return { ok: false, error: 'upgrade_required' };

  if (!aiTextAvailable()) {
    return { ok: false, error: 'L’édition IA n’est pas disponible en ce moment.' };
  }

  const rl = await checkAuthRateLimit(`aiedit:${c.tenantId}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: `Trop de modifications. Réessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` };
  }

  const editor = await getSiteEditorData(c.tenantId);
  if (!editor) return { ok: false, error: 'Génère d’abord ton site.' };

  const user = buildAIEditUser(editor.profile, editor.style, parsed.data.currentContent, parsed.data.instruction);

  let raw: string;
  try {
    raw = await callModel(AI_EDIT_SYSTEM, user, 1200);
  } catch (err) {
    logError('[applyAIEdit] appel modèle échoué', { error: String(err) });
    logEvent('ai_edit.failed', c.tenantId, { reason: 'api_error' });
    return { ok: false, error: 'L’IA est indisponible — réessaie dans quelques minutes' };
  }

  // Parse + coercition tolérante → contenu valide ; merge sur l'actuel (les champs
  // omis par l'IA héritent du contenu courant, jamais de perte de données).
  let aiContent: SiteContent;
  try {
    aiContent = parseSiteContent(extractJson(raw));
  } catch {
    logEvent('ai_edit.failed', c.tenantId, { reason: 'invalid_json' });
    return { ok: false, error: 'Réponse IA invalide — réessaie' };
  }

  const merged = mergeSiteContent(parsed.data.currentContent, aiContent);
  const res = await saveEditorSiteContent(c.tenantId, c.userId, merged);
  if (!res.ok) return { ok: false, error: 'Sauvegarde impossible' };

  revalidatePath('/dashboard/website');
  await revalidateSite(c.tenantId);
  logEvent('ai_edit.applied', c.tenantId, {});
  return { ok: true, content: merged };
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
  await revalidateSite(tenantId);
  return { ok: true };
}
