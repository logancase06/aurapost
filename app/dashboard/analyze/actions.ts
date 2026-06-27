'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { applyBioToProfile, setLastRecommendation } from '@/lib/db/analyses';
import { getSubdomainForTenant } from '@/lib/db/website';
import { updateTag } from 'next/cache';
import { sanitizeText } from '@/lib/security';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logError } from '@/lib/logger';

async function tenant(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    return await requireTenantId();
  } catch {
    return null;
  }
}

/** Applique la bio proposée au profil coach (et invalide le cache du site public). */
export async function applyBioAction(bio: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().min(1).max(1000).safeParse(bio);
  if (!parsed.success) return { ok: false, error: 'Bio invalide' };
  const tenantId = await tenant();
  if (!tenantId) return { ok: false, error: 'Non autorisé' };
  await applyBioToProfile(tenantId, sanitizeText(parsed.data));
  const sub = await getSubdomainForTenant(tenantId);
  if (sub) updateTag(`site-${sub.toLowerCase()}`);
  revalidatePath('/dashboard/profile');
  return { ok: true };
}

export interface BioVariants {
  instagram: string[];
  linkedin: { headline: string; summary: string }[];
}

/** Génère 3 variantes de bio Instagram optimisées + 2 variantes de headline LinkedIn. */
export async function optimizeBioAction(): Promise<{ ok: boolean; data?: BioVariants; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  const tenantId = await tenant();
  if (!tenantId) return { ok: false, error: 'Non autorisé' };

  const [profile] = await db
    .select({ displayName: coachProfiles.displayName, speciality: coachProfiles.speciality, bio: coachProfiles.bio, targetAudience: coachProfiles.targetAudience, results: coachProfiles.results, tone: coachProfiles.tone, linkedinHeadline: coachProfiles.linkedinHeadline })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);

  if (!profile) return { ok: false, error: 'Profil introuvable' };

  const context = `Coach : ${profile.displayName}\nSpécialité : ${profile.speciality}\nPublic cible : ${profile.targetAudience ?? 'non précisé'}\nRésultats clients : ${profile.results ?? 'non précisés'}\nBio actuelle : ${profile.bio ?? 'aucune'}\nTon : ${profile.tone}`;

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: 'Tu es un expert en personal branding pour coachs sportifs. Réponds UNIQUEMENT avec du JSON valide strict.',
        messages: [{
          role: 'user',
          content: `Génère des bios optimisées pour ce coach :\n\n${context}\n\nRéponds avec ce JSON exact :\n{"instagram":["bio1 (max 150 car)","bio2","bio3"],"linkedin":[{"headline":"titre 1 (max 220 car)","summary":"résumé 1 (max 300 car)"},{"headline":"titre 2","summary":"résumé 2"}]}`,
        }],
      }, { timeout: 25_000 });
      let raw = '';
      for (const b of message.content) { if (b.type === 'text') raw += b.text; }
      const data = JSON.parse(raw.trim()) as BioVariants;
      return { ok: true, data };
    }
    // Mock
    return {
      ok: true,
      data: {
        instagram: [
          `🏋️ Coach ${profile.speciality} | ${profile.targetAudience ?? 'Tous niveaux'} | Résultats concrets ↓`,
          `Transforme ton corps & ton mindset 💪 | ${profile.speciality} | DM pour un bilan offert`,
          `${profile.speciality} coach 🎯 | J'aide ${profile.targetAudience ?? 'mes clients'} à ${profile.results ?? 'atteindre leurs objectifs'}`,
        ],
        linkedin: [
          { headline: `Coach ${profile.speciality} | J'aide ${profile.targetAudience ?? 'les athlètes'} à performer`, summary: `${profile.bio ?? profile.speciality}. Contactez-moi pour un appel découverte.` },
          { headline: `${profile.speciality} Expert | ${profile.results ?? 'Résultats mesurables'}`, summary: `Spécialiste ${profile.speciality} depuis plusieurs années. Mon approche : ${profile.tone}.` },
        ],
      },
    };
  } catch (err) {
    logError('[optimizeBio] erreur', { error: String(err) });
    return { ok: false, error: 'Génération impossible' };
  }
}

export interface HashtagSet {
  name: string;
  description: string;
  tags: string[];
}

/** Génère 3 ensembles de hashtags (large / niche / local) pour un thème donné. */
export async function generateHashtagsAction(theme: string, speciality?: string): Promise<{ ok: boolean; data?: HashtagSet[]; error?: string }> {
  const parsed = z.string().min(2).max(200).safeParse(theme);
  if (!parsed.success) return { ok: false, error: 'Thème invalide' };

  const tenantId = await tenant();
  if (!tenantId) return { ok: false, error: 'Non autorisé' };

  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'Tu es un expert en growth social media pour coachs sportifs. Réponds UNIQUEMENT avec du JSON valide strict.',
        messages: [{
          role: 'user',
          content: `Génère 3 ensembles de hashtags Instagram pour un coach ${speciality ?? 'sportif'} sur le thème : "${parsed.data}"\n\nEnsemble 1 : audience large (>500k posts)\nEnsemble 2 : niche précise (50k–500k posts)\nEnsemble 3 : local/francophone\n\nRéponds avec ce JSON exact :\n[{"name":"Audience large","description":"Portée maximale","tags":["hashtag1","hashtag2"]},{"name":"Niche","description":"Engagement ciblé","tags":["..."]},{"name":"Local","description":"Communauté française","tags":["..."]}]`,
        }],
      }, { timeout: 25_000 });
      let raw = '';
      for (const b of message.content) { if (b.type === 'text') raw += b.text; }
      const data = JSON.parse(raw.trim()) as HashtagSet[];
      return { ok: true, data };
    }
    // Mock
    return {
      ok: true,
      data: [
        { name: 'Audience large', description: 'Portée maximale', tags: ['fitness', 'coaching', 'sport', 'motivation', 'workout', 'health', 'wellness', 'training', 'performance', 'lifestyle'] },
        { name: 'Niche', description: 'Engagement ciblé', tags: [`${theme.toLowerCase().replace(/\s+/g, '')}`, 'coachsportif', 'préparationphysique', 'transformationcorporelle', 'musculation', 'crossfit', 'running', 'nutrition', 'mindset', 'objectifs'] },
        { name: 'Local', description: 'Communauté française', tags: ['coachfrance', 'sportfrancais', 'coachparis', 'bienetre', 'sante', 'forme', 'entrainement', 'objectiffitness', 'communautesport', 'coachingfr'] },
      ],
    };
  } catch (err) {
    logError('[generateHashtags] erreur', { error: String(err) });
    return { ok: false, error: 'Génération impossible' };
  }
}

/** Marque l'action prioritaire comme faite (efface last_recommendation). */
export async function markRecommendationDoneAction(): Promise<{ ok: boolean }> {
  const tenantId = await tenant();
  if (!tenantId) return { ok: false };
  await setLastRecommendation(tenantId, null);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/analyze');
  return { ok: true };
}
