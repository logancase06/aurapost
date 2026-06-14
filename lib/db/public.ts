import { db } from './index';
import { websites, coachProfiles, coachPhotos, generatedPosts, users as usersTable } from './schema';
import { and, eq, desc } from 'drizzle-orm';
import { styleForTone, type CoachSiteData, type SiteStyle } from '@/templates/coach-site/CoachSite';
import { buildGeneratedSiteContent, mergeSiteContent, parseSiteContent } from './site';

const SITE_STYLES: SiteStyle[] = ['impact', 'clarte', 'authenticite'];

/** Normalise un identifiant/URL Instagram en URL absolue, ou null. */
function instagramUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (/^https?:\/\//.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, '')}`;
}

/** Données publiques du site loué (route /site/[subdomain]). Exploite le contenu IA si présent. */
export async function getCoachSiteData(subdomain: string, opts?: { requireActive?: boolean }): Promise<CoachSiteData | null> {
  const [site] = await db
    .select({
      tenantId: websites.tenantId,
      themeColor: websites.themeColor,
      status: websites.status,
      subdomain: websites.subdomain,
      template: websites.template,
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
      tone: coachProfiles.tone,
      photos: coachProfiles.photos,
      instagramUrl: coachProfiles.instagramUrl,
      reviewsAnalysis: coachProfiles.reviewsAnalysis,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, site.tenantId))
    .limit(1);
  if (!profile) return null;

  // Photo hero : bibliothèque coach_photos (récente) en priorité, sinon photos legacy.
  let photoUrl = parseTags(profile.photos)[0] ?? null;
  if (!photoUrl) {
    const [p] = await db
      .select({ url: coachPhotos.r2Url })
      .from(coachPhotos)
      .where(eq(coachPhotos.tenantId, site.tenantId))
      .orderBy(desc(coachPhotos.createdAt))
      .limit(1);
    photoUrl = p?.url ?? null;
  }

  const [contact] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.tenantId, site.tenantId))
    .limit(1);

  // Contenu = base dérivée du profil + overrides édités (merge : non-vide gagne).
  const baseline = buildGeneratedSiteContent({
    displayName: profile.displayName,
    speciality: profile.speciality,
    city: profile.city,
    bio: profile.bio,
    strengths: parseStrengths(profile.reviewsAnalysis),
    email: contact?.email ?? null,
    instagramUrl: profile.instagramUrl,
    photoUrl,
  });
  const stored = site.content ? parseSiteContent(site.content) : null;
  const c = stored ? mergeSiteContent(baseline, stored) : baseline;

  // Style : valeur explicite (choix coach) sinon recommandé selon le ton.
  const style: SiteStyle = SITE_STYLES.includes(site.template as SiteStyle)
    ? (site.template as SiteStyle)
    : styleForTone(profile.tone);

  const forces = c.strengths.filter((s) => s.enabled && s.title.trim()).map((s) => ({ title: s.title, description: s.description }));
  const services = (c.services ?? []).filter((s) => s.enabled && s.title.trim()).map((s) => ({ title: s.title, description: s.description }));
  // Section "résultats" = témoignages portant un résultat concret (sinon masquée).
  const results = c.testimonials.filter((t) => (t.result ?? '').trim()).map((t) => ({ result: t.result as string, name: t.author, city: '' }));
  const bookingUrl = (c.contact.calendly || c.hero.ctaUrl || '').trim() || null;

  return {
    subdomain: site.subdomain,
    displayName: profile.displayName,
    speciality: profile.speciality,
    city: profile.city,
    bio: profile.bio,
    themeColor: site.themeColor ?? '#7c3aed',
    style,
    accentColor: null,
    photoUrl: (c.hero.photoUrl || c.about.photoUrl || photoUrl) || null,
    contactEmail: (c.contact.email || '').trim() || null,
    whatsapp: (c.contact.whatsapp || '').trim() || null,
    instagramUrl: instagramUrl(c.contact.instagram) ?? profile.instagramUrl,
    bookingUrl,
    cta: c.hero.ctaLabel,
    heroTagline: c.hero.title,
    heroSubtitle: c.hero.subtitle,
    story: c.about.bio,
    storyQuote: c.about.headline,
    forces,
    services,
    testimonials: c.testimonials.map((t) => ({ name: t.author, quote: t.quote })),
    results: results.length ? results : undefined,
    seoDescription: site.seoDescription ?? undefined,
  };
}

function parseStrengths(json: string | null): string[] | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as { strengths?: unknown };
    if (!Array.isArray(o.strengths)) return null;
    const list = o.strengths.map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
    return list.length ? list : null;
  } catch {
    return null;
  }
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
