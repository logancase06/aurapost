import { db } from './index';
import { websites, coachProfiles, generatedPosts, users as usersTable } from './schema';
import { and, eq, desc } from 'drizzle-orm';
import {
  defaultServices,
  defaultTestimonials,
  type CoachSiteData,
} from '@/templates/coach-site/CoachSite';

interface StoredSiteContent {
  hero_title?: string;
  hero_subtitle?: string;
  hero_tagline?: string;
  story?: string;
  story_quote?: string;
  about?: string;
  cta?: string;
  accent_color?: string;
  seo_description?: string;
  services?: { title: string; description: string; icon?: string }[];
  testimonials?: { name: string; quote: string }[];
  results?: { result: string; name: string; city?: string }[];
}

/** Données publiques du site loué (route /site/[subdomain]). Exploite le contenu IA si présent. */
export async function getCoachSiteData(subdomain: string, opts?: { requireActive?: boolean }): Promise<CoachSiteData | null> {
  const [site] = await db
    .select({
      tenantId: websites.tenantId,
      themeColor: websites.themeColor,
      status: websites.status,
      subdomain: websites.subdomain,
      content: websites.content,
      seoDescription: websites.seoDescription,
    })
    .from(websites)
    .where(eq(websites.subdomain, subdomain.toLowerCase()))
    .limit(1);
  if (!site) return null;
  if ((opts?.requireActive ?? true) && site.status !== 'active') return null;

  const [profile] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      bio: coachProfiles.bio,
      photos: coachProfiles.photos,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, site.tenantId))
    .limit(1);
  if (!profile) return null;

  const photos = parseTags(profile.photos);
  let content: StoredSiteContent | null = null;
  if (site.content) {
    try {
      content = JSON.parse(site.content) as StoredSiteContent;
    } catch {
      content = null;
    }
  }

  return {
    subdomain: site.subdomain,
    displayName: profile.displayName,
    speciality: profile.speciality,
    city: profile.city,
    bio: profile.bio,
    themeColor: site.themeColor ?? '#7c3aed',
    accentColor: content?.accent_color ?? null,
    photoUrl: photos[0] ?? null,
    heroTitle: content?.hero_title,
    heroSubtitle: content?.hero_subtitle,
    heroTagline: content?.hero_tagline,
    about: content?.about,
    story: content?.story,
    storyQuote: content?.story_quote,
    cta: content?.cta,
    seoDescription: site.seoDescription ?? content?.seo_description,
    services:
      content?.services && content.services.length >= 1
        ? content.services.map((s) => ({ title: s.title, description: s.description, icon: s.icon }))
        : defaultServices(profile.speciality),
    testimonials:
      content?.testimonials && content.testimonials.length >= 1
        ? content.testimonials.map((t) => ({ name: t.name, quote: t.quote }))
        : defaultTestimonials(),
    results:
      content?.results && content.results.length >= 1
        ? content.results.map((r) => ({ result: r.result, name: r.name, city: r.city }))
        : undefined,
  };
}

export interface PublicCoach {
  subdomain: string;
  displayName: string;
  speciality: string;
  city: string | null;
  themeColor: string;
  photoUrl: string | null;
}

/** Liste les coachs dont le site est ACTIF (galerie publique /coaches — preuve sociale). */
export async function listActiveCoaches(limit = 60): Promise<PublicCoach[]> {
  const rows = await db
    .select({
      subdomain: websites.subdomain,
      themeColor: websites.themeColor,
      tenantId: websites.tenantId,
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      photos: coachProfiles.photos,
    })
    .from(websites)
    .innerJoin(coachProfiles, eq(coachProfiles.tenantId, websites.tenantId))
    .where(eq(websites.status, 'active'))
    .orderBy(desc(websites.publishedAt))
    .limit(limit);

  return rows.map((r) => ({
    subdomain: r.subdomain,
    displayName: r.displayName,
    speciality: r.speciality,
    city: r.city,
    themeColor: r.themeColor ?? '#7c3aed',
    photoUrl: parseTags(r.photos)[0] ?? null,
  }));
}

/** Email du propriétaire d'un site (pour le formulaire de contact public). */
export async function getCoachContactEmail(subdomain: string): Promise<{ email: string; name: string } | null> {
  const [site] = await db.select({ tenantId: websites.tenantId }).from(websites).where(eq(websites.subdomain, subdomain.toLowerCase())).limit(1);
  if (!site) return null;
  const [u] = await db
    .select({ email: usersTable.email, name: usersTable.fullName })
    .from(usersTable)
    .where(eq(usersTable.tenantId, site.tenantId))
    .limit(1);
  return u ? { email: u.email, name: u.name } : null;
}

export interface CoachPortalData {
  displayName: string;
  speciality: string;
  city: string | null;
  bio: string | null;
  siteUrl: string | null;
  approvedPosts: { id: string; network: string; title: string | null; content: string; hashtags: string[] }[];
}

/** Portail public lecture seule (route /coach/[slug]) — posts approuvés + lien site. */
export async function getCoachPortal(slug: string): Promise<CoachPortalData | null> {
  const [site] = await db
    .select({ tenantId: websites.tenantId, subdomain: websites.subdomain, status: websites.status })
    .from(websites)
    .where(eq(websites.subdomain, slug.toLowerCase()))
    .limit(1);
  if (!site) return null;

  const [profile] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      bio: coachProfiles.bio,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, site.tenantId))
    .limit(1);
  if (!profile) return null;

  const posts = await db
    .select({
      id: generatedPosts.id,
      network: generatedPosts.network,
      title: generatedPosts.title,
      content: generatedPosts.content,
      hashtags: generatedPosts.hashtags,
    })
    .from(generatedPosts)
    .where(and(eq(generatedPosts.tenantId, site.tenantId), eq(generatedPosts.status, 'approved')))
    .orderBy(desc(generatedPosts.createdAt))
    .limit(24);

  const appDomain = process.env.APP_DOMAIN ?? 'aurapost.fr';

  return {
    displayName: profile.displayName,
    speciality: profile.speciality,
    city: profile.city,
    bio: profile.bio,
    siteUrl: site.status === 'active' ? `https://${site.subdomain}.${appDomain}` : null,
    approvedPosts: posts.map((p) => ({
      id: p.id,
      network: p.network,
      title: p.title,
      content: p.content,
      hashtags: parseTags(p.hashtags),
    })),
  };
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
