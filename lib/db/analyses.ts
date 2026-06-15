import { db } from './index';
import { profileAnalyses, coachProfiles } from './schema';
import { and, eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Platform } from '@/lib/analyze/types';

export interface StoredAnalysis {
  id: string;
  platform: Platform;
  profileUrl: string | null;
  scoreGlobal: number | null;
  analysis: unknown; // JSON parsé
  createdAt: string;
}

const KEEP_PER_PLATFORM = 3;

/** Enregistre une analyse et purge au-delà des 3 dernières pour la plateforme. */
export async function saveAnalysis(
  tenantId: string,
  platform: Platform,
  scoreGlobal: number,
  analysis: unknown,
  profileUrl?: string | null
): Promise<void> {
  await db.insert(profileAnalyses).values({
    id: nanoid(),
    tenantId,
    platform,
    profileUrl: profileUrl ?? null,
    scoreGlobal,
    analysisJson: JSON.stringify(analysis),
    createdAt: new Date().toISOString(),
  });

  // Purge : ne conserver que les KEEP_PER_PLATFORM plus récentes.
  const rows = await db
    .select({ id: profileAnalyses.id })
    .from(profileAnalyses)
    .where(and(eq(profileAnalyses.tenantId, tenantId), eq(profileAnalyses.platform, platform)))
    .orderBy(desc(profileAnalyses.createdAt));
  for (const old of rows.slice(KEEP_PER_PLATFORM)) {
    await db.delete(profileAnalyses).where(eq(profileAnalyses.id, old.id));
  }
}

function parse(row: typeof profileAnalyses.$inferSelect): StoredAnalysis {
  let analysis: unknown = null;
  try {
    analysis = JSON.parse(row.analysisJson);
  } catch {
    analysis = null;
  }
  return { id: row.id, platform: row.platform as Platform, profileUrl: row.profileUrl, scoreGlobal: row.scoreGlobal, analysis, createdAt: row.createdAt };
}

/** Les `limit` dernières analyses d'une plateforme (récent → ancien). */
export async function getRecentAnalyses(tenantId: string, platform: Platform, limit = 3): Promise<StoredAnalysis[]> {
  const rows = await db
    .select()
    .from(profileAnalyses)
    .where(and(eq(profileAnalyses.tenantId, tenantId), eq(profileAnalyses.platform, platform)))
    .orderBy(desc(profileAnalyses.createdAt))
    .limit(limit);
  return rows.map(parse);
}

/** Dernière analyse d'une plateforme (ou null). */
export async function getLatestAnalysis(tenantId: string, platform: Platform): Promise<StoredAnalysis | null> {
  const [row] = await getRecentAnalyses(tenantId, platform, 1);
  return row ?? null;
}

/** Dernières analyses des deux plateformes (pour le dashboard / la sidebar). */
export async function getAnalysisSummary(tenantId: string): Promise<{ instagram: StoredAnalysis | null; linkedin: StoredAnalysis | null }> {
  const [instagram, linkedin] = await Promise.all([getLatestAnalysis(tenantId, 'instagram'), getLatestAnalysis(tenantId, 'linkedin')]);
  return { instagram, linkedin };
}

/** Contexte profil (nom/spécialité/ville/bio) pour enrichir l'analyse. */
export async function getAnalyzeContext(tenantId: string): Promise<{ displayName: string | null; speciality: string | null; city: string | null; bio: string | null; instagramUrl: string | null } | null> {
  const [row] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      bio: coachProfiles.bio,
      instagramUrl: coachProfiles.instagramUrl,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

/** Met à jour l'action prioritaire en cours + (option) la bio du profil. */
export async function setLastRecommendation(tenantId: string, recommendation: string | null): Promise<void> {
  await db.update(coachProfiles).set({ lastRecommendation: recommendation, updatedAt: new Date().toISOString() }).where(eq(coachProfiles.tenantId, tenantId));
}

export async function applyBioToProfile(tenantId: string, bio: string): Promise<void> {
  await db.update(coachProfiles).set({ bio: bio.slice(0, 1000), updatedAt: new Date().toISOString() }).where(eq(coachProfiles.tenantId, tenantId));
}
