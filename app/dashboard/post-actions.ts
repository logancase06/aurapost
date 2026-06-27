'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import {
  setPostStatus,
  batchSetPostStatus,
  createVariantForPost,
  schedulePost,
  incrementCopyCount,
  runCaptionPackGeneration,
  getPostById,
  getVariantesCount,
  type PostStatus,
} from '@/lib/db/posts';
import { db } from '@/lib/db';
import { generatedPosts } from '@/lib/db/schema';
import { getPhoto, linkPhotoToPost } from '@/lib/db/photos';
import { getPlanLimits, canExportPost } from '@/lib/plans';
import { logEvent, logError } from '@/lib/logger';
import { nanoid } from 'nanoid';
import { currentMonth } from '@/lib/utils';

async function ctx() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Non autorisé');
  const tenantId = await requireTenantId();
  return { tenantId, userId: session.user.id, plan: session.user.plan ?? 'starter' };
}

export async function approvePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    await setPostStatus(tenantId, userId, postId, 'approved' satisfies PostStatus);
    logEvent('post.approved', tenantId, { postId });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

/**
 * Approbation enrichie depuis le dialog photo : associe (optionnellement) une photo
 * de la bibliothèque au post, le passe en « approuvé », et le programme si une date
 * est fournie. Tout est scellé au tenant (vérif post + photo).
 */
export async function approveWithPhotoAction(
  postId: string,
  opts: { photoId?: string | null; textOverlay?: string | null; scheduleDate?: string | null } = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId, plan } = await ctx();
    // L'export (image + photo) est réservé aux plans payants.
    if (!canExportPost(plan)) return { ok: false, error: 'upgrade_required' };

    const post = await getPostById(tenantId, postId);
    if (!post) return { ok: false, error: 'Post introuvable' };

    if (opts.photoId) {
      const photo = await getPhoto(tenantId, opts.photoId);
      if (!photo) return { ok: false, error: 'Photo introuvable' };
      await linkPhotoToPost(postId, opts.photoId, opts.textOverlay ?? undefined);
    }

    await setPostStatus(tenantId, userId, postId, 'approved' satisfies PostStatus);

    if (opts.scheduleDate) {
      const iso = new Date(`${opts.scheduleDate}T09:00:00`).toISOString();
      if (!Number.isNaN(new Date(iso).getTime())) {
        await schedulePost(tenantId, userId, postId, iso);
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/calendar');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

export async function rejectPostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    await setPostStatus(tenantId, userId, postId, 'rejected' satisfies PostStatus);
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

export async function requestVariantAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId, plan } = await ctx();
    // Limite mensuelle de variantes selon le plan (anti-abus + incitation upgrade).
    const max = getPlanLimits(plan).variantesMax;
    const used = await getVariantesCount(tenantId);
    if (used >= max) return { ok: false, error: `Limite de ${max} variantes atteinte ce mois-ci.` };
    const res = await createVariantForPost(tenantId, userId, postId);
    if (!res.ok) return { ok: false, error: 'Génération de variante impossible' };
    logEvent('post.variant_created', tenantId, { postId, used: used + 1, max });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

/** Planifie (ou déplanifie si null) un post à une date (YYYY-MM-DD). */
export async function schedulePostAction(
  postId: string,
  date: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const iso = date ? new Date(`${date}T09:00:00`).toISOString() : null;
    if (date && Number.isNaN(new Date(iso!).getTime())) return { ok: false, error: 'Date invalide' };
    await schedulePost(tenantId, userId, postId, iso);
    revalidatePath('/dashboard/calendar');
    revalidatePath(`/dashboard/posts/${postId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Planification impossible' };
  }
}

/** Incrémente le compteur « copié X fois » (appelé à la copie côté client). */
export async function trackCopyAction(postId: string): Promise<{ ok: boolean; count?: number }> {
  try {
    const { tenantId } = await ctx();
    const count = await incrementCopyCount(tenantId, postId);
    return { ok: true, count };
  } catch {
    return { ok: false };
  }
}

export async function batchApproveAction(postIds: string[]): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const res = await batchSetPostStatus(tenantId, userId, postIds, 'approved');
    logEvent('post.batch_approved', tenantId, { count: res.count });
    revalidatePath('/dashboard');
    return { ok: true, count: res.count };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

export async function batchRejectAction(postIds: string[]): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const res = await batchSetPostStatus(tenantId, userId, postIds, 'rejected');
    logEvent('post.batch_rejected', tenantId, { count: res.count });
    revalidatePath('/dashboard');
    return { ok: true, count: res.count };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}

const LANG_NAMES: Record<string, string> = { en: 'anglais', es: 'espagnol', pt: 'portugais', de: 'allemand' };

/** Traduit un post dans la langue cible via Claude, sauvegarde comme variante. */
export async function translatePostAction(
  postId: string,
  targetLang: 'en' | 'es' | 'pt' | 'de'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId, plan } = await ctx();
    if (!canExportPost(plan)) return { ok: false, error: 'upgrade_required' };

    const post = await getPostById(tenantId, postId);
    if (!post) return { ok: false, error: 'Post introuvable' };

    const langName = LANG_NAMES[targetLang] ?? targetLang;
    const hashtagsRaw = post.hashtags.join(' ');

    let translated: { content: string; hashtags: string[] };

    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'Tu es un expert en traduction de contenu social media. Réponds UNIQUEMENT avec du JSON valide strict, aucun texte autour.',
        messages: [{
          role: 'user',
          content: `Traduis ce post ${post.network === 'linkedin' ? 'LinkedIn' : 'Instagram'} en ${langName}. Adapte la formulation au style natif de la langue (pas une traduction mot-à-mot). Adapte les hashtags en ${langName} (garde les hashtags pertinents, remplace les hashtags spécifiques au français par leurs équivalents locaux).

Post original :
"""
${post.content}
"""

Hashtags originaux : ${hashtagsRaw}

Réponds avec ce JSON exact :
{"content":"...","hashtags":["..."]}`,
        }],
      }, { timeout: 25_000 });
      let raw = '';
      for (const b of message.content) { if (b.type === 'text') raw += b.text; }
      const parsed = JSON.parse(raw.trim()) as { content: string; hashtags: string[] };
      translated = parsed;
    } else {
      // Mock : préfixe [EN] pour signaler la traduction
      translated = {
        content: `[${targetLang.toUpperCase()}] ${post.content}`,
        hashtags: post.hashtags,
      };
    }

    const id = nanoid();
    const now = new Date().toISOString();
    await db.insert(generatedPosts).values({
      id,
      tenantId,
      network: post.network,
      status: 'draft',
      title: post.title ? `[${targetLang.toUpperCase()}] ${post.title}` : null,
      theme: post.theme,
      content: translated.content,
      hashtags: JSON.stringify(translated.hashtags),
      callToAction: post.callToAction,
      month: post.month || currentMonth(),
      variantOfId: postId,
      generatedBy: userId,
      generatedMode: process.env.ANTHROPIC_API_KEY ? 'api' : 'mock',
      createdAt: now,
      updatedAt: now,
    });

    logEvent('post.translated', tenantId, { postId, targetLang });
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (err) {
    logError('[translatePost] erreur', { error: String(err) });
    return { ok: false, error: 'Traduction impossible' };
  }
}

/** Recycle un post existant en générant une réécriture avec un angle différent. */
export async function recyclePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { tenantId, userId, plan } = await ctx();
    if (!canExportPost(plan)) return { ok: false, error: 'upgrade_required' };

    const post = await getPostById(tenantId, postId);
    if (!post) return { ok: false, error: 'Post introuvable' };

    let newContent: { title: string; content: string; hashtags: string[]; callToAction: string };

    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'Tu es un expert en copywriting pour coachs sportifs. Réponds UNIQUEMENT avec du JSON valide strict.',
        messages: [{
          role: 'user',
          content: `Réécris ce post ${post.network === 'linkedin' ? 'LinkedIn' : 'Instagram'} avec un angle complètement différent. Garde le même sujet/thème mais change l'accroche, la structure et le ton. L'objectif est de recycler le contenu sans paraître répétitif.

Post original :
"""
${post.title ? `Titre : ${post.title}\n` : ''}${post.content}
"""

Réponds avec ce JSON exact :
{"title":"...","content":"...","hashtags":["..."],"callToAction":"..."}`,
        }],
      }, { timeout: 25_000 });
      let raw = '';
      for (const b of message.content) { if (b.type === 'text') raw += b.text; }
      newContent = JSON.parse(raw.trim());
    } else {
      newContent = {
        title: `♻️ ${post.title ?? 'Recyclage'}`,
        content: `[Recyclé] ${post.content}`,
        hashtags: post.hashtags,
        callToAction: post.callToAction ?? '',
      };
    }

    const id = nanoid();
    const now = new Date().toISOString();
    await db.insert(generatedPosts).values({
      id,
      tenantId,
      network: post.network,
      status: 'draft',
      title: newContent.title,
      theme: post.theme,
      content: newContent.content,
      hashtags: JSON.stringify(newContent.hashtags),
      callToAction: newContent.callToAction,
      month: currentMonth(),
      variantOfId: postId,
      generatedBy: userId,
      generatedMode: process.env.ANTHROPIC_API_KEY ? 'api' : 'mock',
      createdAt: now,
      updatedAt: now,
    });

    logEvent('post.recycled', tenantId, { postId });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/history');
    return { ok: true };
  } catch (err) {
    logError('[recyclePost] erreur', { error: String(err) });
    return { ok: false, error: 'Recyclage impossible' };
  }
}

/** Génère un pack de 30 légendes courtes (stories Instagram). */
export async function generateCaptionPackAction(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const { tenantId, userId } = await ctx();
    const res = await runCaptionPackGeneration(tenantId, userId);
    if (!res.ok) {
      return { ok: false, error: res.error === 'no_profile' ? 'Complétez votre profil d’abord.' : 'Génération impossible' };
    }
    revalidatePath('/dashboard');
    return { ok: true, count: res.count };
  } catch {
    return { ok: false, error: 'Action impossible' };
  }
}
