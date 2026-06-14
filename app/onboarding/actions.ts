'use server';

import { db } from '@/lib/db';
import { coachProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { sanitizeText } from '@/lib/security';
import { logActivity } from '@/lib/db/activity';
import { logError, logInfo } from '@/lib/logger';
import { isInstagramUrl, scrapeInstagram, analyzeInstagram, type InstagramAnalysis } from '@/lib/instagram';
import { analyzeReviews, type ReviewsAnalysis } from '@/lib/reviews';
import { generateSingleDemoPost, type PostDraft } from '@/lib/content-generator';
import { getProfileInput } from '@/lib/db/posts';

export type OnboardingState = { error?: string } | null;

const TONE_CANON: Record<string, string> = {
  motivant: 'motivant',
  inspirant: 'motivant',
  educatif: 'educatif',
  humoristique: 'personnel',
  personnel: 'personnel',
};

async function ctx(): Promise<{ tenantId: string; userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé — reconnecte-toi.' };
  try {
    return { tenantId: await requireTenantId(), userId: session.user.id };
  } catch {
    return { error: 'Session invalide — déconnecte-toi et recrée un compte.' };
  }
}

/** Crée la ligne profil si absente (nécessite nom + spécialité), sinon ne fait rien. */
async function ensureProfile(tenantId: string, userId: string, displayName?: string, speciality?: string): Promise<boolean> {
  const [existing] = await db.select({ id: coachProfiles.id }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)).limit(1);
  if (existing) return true;
  if (!displayName || !speciality) return false;
  const now = new Date().toISOString();
  await db.insert(coachProfiles).values({
    id: nanoid(),
    tenantId,
    userId,
    displayName: sanitizeText(displayName).slice(0, 120),
    speciality: sanitizeText(speciality).slice(0, 160),
    tone: 'motivant',
    language: 'fr',
    createdAt: now,
    updatedAt: now,
  });
  return true;
}

export interface ProfileDraft {
  displayName: string;
  speciality: string;
  city?: string;
  contentStyle?: string;
  tone?: string;
  bio?: string;
  targetAudience?: string;
  results?: string;
  linkedinHeadline?: string;
  linkedinSummary?: string;
  language?: string;
}

/**
 * Sauvegarde incrémentale du profil (autosave debounce côté client). Upsert :
 * crée la ligne au 1er appel (nom + spécialité requis), met à jour ensuite.
 */
export async function saveProfileDraft(input: ProfileDraft): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };

  const displayName = sanitizeText(input.displayName || '').slice(0, 120);
  const speciality = sanitizeText(input.speciality || '').slice(0, 160);
  if (!displayName || !speciality) return { ok: false, error: 'Nom et spécialité requis.' };

  await ensureProfile(c.tenantId, c.userId, displayName, speciality);

  const tone = ['motivant', 'educatif', 'personnel'].includes(input.tone ?? '') ? input.tone! : undefined;
  await db
    .update(coachProfiles)
    .set({
      displayName,
      speciality,
      city: input.city != null ? sanitizeText(input.city).slice(0, 120) || null : undefined,
      contentStyle: input.contentStyle != null ? sanitizeText(input.contentStyle).slice(0, 80) || null : undefined,
      tone,
      bio: input.bio != null ? sanitizeText(input.bio).slice(0, 1000) || null : undefined,
      targetAudience: input.targetAudience != null ? sanitizeText(input.targetAudience).slice(0, 200) || null : undefined,
      results: input.results != null ? sanitizeText(input.results).slice(0, 500) || null : undefined,
      linkedinHeadline: input.linkedinHeadline != null ? sanitizeText(input.linkedinHeadline).slice(0, 220) || null : undefined,
      linkedinSummary: input.linkedinSummary != null ? sanitizeText(input.linkedinSummary).slice(0, 2000) || null : undefined,
      language: input.language === 'en' || input.language === 'fr' ? input.language : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(coachProfiles.tenantId, c.tenantId));

  return { ok: true };
}

const IG_REASONS: Record<string, string> = {
  invalid_url: 'URL Instagram invalide.',
  blocked: 'Instagram a bloqué la lecture. Remplis à la main, c’est tout aussi efficace.',
  private_or_blocked: 'Compte privé ou illisible. Remplis à la main ci-dessous.',
  error: 'Lecture impossible. Remplis à la main ci-dessous.',
};

export interface InstagramImport {
  ok: boolean;
  error?: string;
  followers?: string | null;
  analysis?: InstagramAnalysis;
}

/** Analyse Instagram : scrape public + analyse Claude, persistée sur le profil. */
export async function importInstagramAction(url: string): Promise<InstagramImport> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  if (!isInstagramUrl(url)) return { ok: false, error: IG_REASONS.invalid_url };

  const scrape = await scrapeInstagram(url);
  if (!scrape.ok) return { ok: false, error: IG_REASONS[scrape.reason] ?? IG_REASONS.error };

  const analysis = await analyzeInstagram(scrape.data);

  // Sans ligne profil (nom + spécialité manquants), on ne peut RIEN persister :
  // ne pas prétendre au succès, sinon l'analyse est perdue au rechargement.
  const ok = await ensureProfile(c.tenantId, c.userId);
  if (!ok) return { ok: false, error: 'Renseigne d’abord ton nom et ta spécialité.' };

  await db
    .update(coachProfiles)
    .set({
      instagramUrl: url.trim().slice(0, 300),
      instagramData: JSON.stringify(scrape.data),
      instagramAnalysis: JSON.stringify(analysis),
      tone: TONE_CANON[analysis.ton_dominant] ?? undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(coachProfiles.tenantId, c.tenantId));

  return { ok: true, followers: scrape.data.followers, analysis };
}

// LinkedIn : saisie 100 % manuelle (headline + résumé) via saveProfileDraft.
// Aucun scraping (les CGU LinkedIn l'interdisent) → pas d'action d'import dédiée.

export interface ReviewsImport {
  ok: boolean;
  error?: string;
  analysis?: ReviewsAnalysis;
}

/** Analyse des avis collés : extrait points forts + témoignage, persistés. */
export async function analyzeReviewsAction(text: string): Promise<ReviewsImport> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const clean = sanitizeText(text || '').trim();
  if (clean.length < 20) return { ok: false, error: 'Colle au moins quelques lignes d’avis.' };

  const analysis = await analyzeReviews(clean);

  // Pas de ligne profil → rien à persister : on le signale au lieu de mentir.
  const ok = await ensureProfile(c.tenantId, c.userId);
  if (!ok) return { ok: false, error: 'Renseigne d’abord ton nom et ta spécialité.' };

  await db
    .update(coachProfiles)
    .set({ reviewsText: clean.slice(0, 4000), reviewsAnalysis: JSON.stringify(analysis), updatedAt: new Date().toISOString() })
    .where(eq(coachProfiles.tenantId, c.tenantId));

  return { ok: true, analysis };
}

/** AJOUT 3 — génère 1 post exemple instantané, à partir du VRAI profil enrichi
 *  (ton, voix Instagram, forces clients), pour un aperçu représentatif dès l'étape 2. */
export async function generateExampleAction(): Promise<{ ok: boolean; error?: string; post?: PostDraft }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };
  const profile = await getProfileInput(c.tenantId);
  if (!profile) return { ok: false, error: 'Renseigne d’abord ton profil.' };
  try {
    const post = await generateSingleDemoPost(profile);
    return { ok: true, post };
  } catch (err) {
    logError('[onboarding] exemple post échoué', { error: String(err) });
    return { ok: false, error: 'Aperçu indisponible — tu peux continuer.' };
  }
}

/** Termine l'onboarding (le profil est déjà persisté par les steps). */
export async function finishOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if ('error' in c) return { ok: false, error: c.error };

  const [prof] = await db.select({ speciality: coachProfiles.speciality }).from(coachProfiles).where(eq(coachProfiles.tenantId, c.tenantId)).limit(1);
  if (!prof) return { ok: false, error: 'Complète au moins ton nom et ta spécialité.' };

  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, c.userId));
  await logActivity(c.tenantId, c.userId, 'onboarding_completed', null, { speciality: prof.speciality });
  logInfo('[onboarding] terminé', { tenantId: c.tenantId, userId: c.userId });
  return { ok: true };
}
