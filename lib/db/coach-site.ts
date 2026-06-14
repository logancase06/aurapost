import { db } from './index';
import { coachProfiles, websites, generatedPosts } from './schema';
import { and, eq, ne, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils';
import { logActivity } from './activity';
import { generateSiteContent, type SiteContent, type SiteGenInput } from '@/lib/site-content';
import type { InstagramData } from '@/lib/instagram';
import type { ReviewsAnalysis } from '@/lib/reviews';

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface SiteWizardState {
  displayName: string;
  speciality: string;
  city: string | null;
  bio: string | null;
  results: string | null;
  instagramUrl: string | null;
  instagramData: InstagramData | null;
  reviewsText: string | null;
  reviewsAnalysis: ReviewsAnalysis | null;
  photos: string[];
}

export async function getSiteWizardState(tenantId: string): Promise<SiteWizardState | null> {
  const [row] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      bio: coachProfiles.bio,
      results: coachProfiles.results,
      instagramUrl: coachProfiles.instagramUrl,
      instagramData: coachProfiles.instagramData,
      reviewsText: coachProfiles.reviewsText,
      reviewsAnalysis: coachProfiles.reviewsAnalysis,
      photos: coachProfiles.photos,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  if (!row) return null;
  return {
    displayName: row.displayName,
    speciality: row.speciality,
    city: row.city,
    bio: row.bio,
    results: row.results,
    instagramUrl: row.instagramUrl,
    instagramData: parseJson<InstagramData>(row.instagramData),
    reviewsText: row.reviewsText,
    reviewsAnalysis: parseJson<ReviewsAnalysis>(row.reviewsAnalysis),
    photos: parseJson<string[]>(row.photos) ?? [],
  };
}

const touch = () => ({ updatedAt: new Date().toISOString() });

export async function saveInstagram(tenantId: string, url: string, data: InstagramData | null) {
  await db
    .update(coachProfiles)
    .set({ instagramUrl: url, instagramData: data ? JSON.stringify(data) : null, ...touch() })
    .where(eq(coachProfiles.tenantId, tenantId));
}

export async function saveReviews(tenantId: string, text: string, analysis: ReviewsAnalysis | null) {
  await db
    .update(coachProfiles)
    .set({ reviewsText: text, reviewsAnalysis: analysis ? JSON.stringify(analysis) : null, ...touch() })
    .where(eq(coachProfiles.tenantId, tenantId));
}

export async function savePhotos(tenantId: string, photos: string[]) {
  await db.update(coachProfiles).set({ photos: JSON.stringify(photos), ...touch() }).where(eq(coachProfiles.tenantId, tenantId));
}

/** Sauvegarde générique des champs basiques (autosave manuel du wizard). */
export async function savePartial(tenantId: string, fields: { instagramUrl?: string; reviewsText?: string }) {
  await db.update(coachProfiles).set({ ...fields, ...touch() }).where(eq(coachProfiles.tenantId, tenantId));
}

async function uniqueSubdomain(tenantId: string, displayName: string): Promise<string> {
  const base = slugify(displayName) || `coach-${tenantId.slice(0, 6)}`;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const [clash] = await db
      .select({ id: websites.id })
      .from(websites)
      .where(and(eq(websites.subdomain, candidate), ne(websites.tenantId, tenantId)))
      .limit(1);
    if (!clash) return candidate;
  }
  return `${base}-${nanoid(4).toLowerCase()}`;
}

export interface GeneratedSite {
  subdomain: string;
  content: SiteContent;
  photos: string[];
  themeColor: string;
}

/** Génère le contenu via l'IA puis le stocke (statut inactif = brouillon, publié séparément). */
export async function generateAndStoreSite(
  tenantId: string,
  userId: string
): Promise<{ ok: true; site: GeneratedSite } | { ok: false; error: 'no_profile' }> {
  const state = await getSiteWizardState(tenantId);
  if (!state) return { ok: false, error: 'no_profile' };

  // 3 derniers posts approuvés → alimentent le ton/style réel du coach dans le site.
  const recent = await db
    .select({ content: generatedPosts.content })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, tenantId), eq(generatedPosts.status, 'approved')))
    .orderBy(desc(generatedPosts.createdAt))
    .limit(3);

  const input: SiteGenInput = {
    name: state.displayName,
    speciality: state.speciality,
    city: state.city,
    bio: state.instagramData?.bio || state.bio,
    strengths: state.reviewsAnalysis?.strengths,
    testimonial: state.reviewsAnalysis?.testimonial,
    tone: state.reviewsAnalysis?.tone,
    results: state.results,
    recentPosts: recent.map((r) => r.content).filter(Boolean),
  };

  const content = await generateSiteContent(input);
  const now = new Date().toISOString();
  const existing = await db.select({ id: websites.id, subdomain: websites.subdomain, status: websites.status }).from(websites).where(eq(websites.tenantId, tenantId)).limit(1);

  let subdomain: string;
  if (existing[0]) {
    subdomain = existing[0].subdomain;
    await db
      .update(websites)
      .set({ content: JSON.stringify(content), seoDescription: content.seo_description, headline: content.hero_title, updatedAt: now })
      .where(eq(websites.id, existing[0].id));
  } else {
    subdomain = await uniqueSubdomain(tenantId, state.displayName);
    await db.insert(websites).values({
      id: nanoid(),
      tenantId,
      subdomain,
      template: 'aura',
      status: 'inactive',
      themeColor: '#7c3aed',
      headline: content.hero_title,
      content: JSON.stringify(content),
      seoDescription: content.seo_description,
      createdAt: now,
      updatedAt: now,
    });
  }

  await logActivity(tenantId, userId, 'site_generated', null, { subdomain });
  return { ok: true, site: { subdomain, content, photos: state.photos, themeColor: '#7c3aed' } };
}

export async function getStoredSite(tenantId: string): Promise<GeneratedSite | null> {
  const [row] = await db
    .select({ subdomain: websites.subdomain, content: websites.content, themeColor: websites.themeColor })
    .from(websites)
    .where(eq(websites.tenantId, tenantId))
    .limit(1);
  if (!row?.content) return null;
  const content = parseJson<SiteContent>(row.content);
  if (!content) return null;
  const state = await getSiteWizardState(tenantId);
  return { subdomain: row.subdomain, content, photos: state?.photos ?? [], themeColor: row.themeColor ?? '#7c3aed' };
}

export async function updateSiteContent(tenantId: string, userId: string, content: SiteContent) {
  await db
    .update(websites)
    .set({ content: JSON.stringify(content), seoDescription: content.seo_description, headline: content.hero_title, ...touch() })
    .where(eq(websites.tenantId, tenantId));
  await logActivity(tenantId, userId, 'site_edited', null, {});
}

export async function publishWebsite(tenantId: string, userId: string): Promise<{ ok: boolean; subdomain?: string }> {
  const [row] = await db.select({ id: websites.id, subdomain: websites.subdomain }).from(websites).where(eq(websites.tenantId, tenantId)).limit(1);
  if (!row) return { ok: false };
  await db.update(websites).set({ status: 'active', publishedAt: new Date().toISOString(), ...touch() }).where(eq(websites.id, row.id));
  await logActivity(tenantId, userId, 'website_published', row.id, { subdomain: row.subdomain });
  return { ok: true, subdomain: row.subdomain };
}
