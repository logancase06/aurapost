import { db } from './index';
import { websites, coachProfiles } from './schema';
import { and, eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils';
import { logActivity } from './activity';

export interface WebsiteRow {
  id: string;
  tenantId: string;
  subdomain: string;
  customDomain: string | null;
  template: string;
  status: 'active' | 'inactive';
  themeColor: string | null;
  headline: string | null;
  publishedAt: string | null;
}

const COLS = {
  id: websites.id,
  tenantId: websites.tenantId,
  subdomain: websites.subdomain,
  customDomain: websites.customDomain,
  template: websites.template,
  status: websites.status,
  themeColor: websites.themeColor,
  headline: websites.headline,
  publishedAt: websites.publishedAt,
};

function map(r: Record<string, unknown>): WebsiteRow {
  return {
    id: r.id as string,
    tenantId: r.tenantId as string,
    subdomain: r.subdomain as string,
    customDomain: (r.customDomain as string) ?? null,
    template: (r.template as string) ?? 'aura',
    status: (r.status as 'active' | 'inactive') ?? 'inactive',
    themeColor: (r.themeColor as string) ?? '#7c3aed',
    headline: (r.headline as string) ?? null,
    publishedAt: (r.publishedAt as string) ?? null,
  };
}

export async function getWebsiteForTenant(tenantId: string): Promise<WebsiteRow | null> {
  const [row] = await db.select(COLS).from(websites).where(eq(websites.tenantId, tenantId)).limit(1);
  return row ? map(row) : null;
}

export async function getWebsiteBySubdomain(subdomain: string): Promise<WebsiteRow | null> {
  const [row] = await db
    .select(COLS)
    .from(websites)
    .where(eq(websites.subdomain, subdomain.toLowerCase()))
    .limit(1);
  return row ? map(row) : null;
}

/** Calcule un sous-domaine unique à partir du nom public, en évitant les collisions. */
async function computeUniqueSubdomain(tenantId: string, displayName: string): Promise<string> {
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

export type CreateWebsiteResult =
  | { ok: true; subdomain: string; created: boolean }
  | { ok: false; error: 'no_profile' };

/**
 * Crée (ou réactive) le site loué du tenant à partir de son profil coach.
 * Sous-domaine = prenom-nom calculé depuis le nom public.
 */
export async function createOrActivateWebsite(tenantId: string, userId: string): Promise<CreateWebsiteResult> {
  const [profile] = await db
    .select({ displayName: coachProfiles.displayName })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  if (!profile) return { ok: false, error: 'no_profile' };

  const now = new Date().toISOString();
  const existing = await getWebsiteForTenant(tenantId);

  if (existing) {
    await db
      .update(websites)
      .set({ status: 'active', publishedAt: now, updatedAt: now })
      .where(eq(websites.id, existing.id));
    await logActivity(tenantId, userId, 'website_activated', existing.id, { subdomain: existing.subdomain });
    return { ok: true, subdomain: existing.subdomain, created: false };
  }

  const subdomain = await computeUniqueSubdomain(tenantId, profile.displayName);
  const id = nanoid();
  await db.insert(websites).values({
    id,
    tenantId,
    subdomain,
    template: 'aura',
    status: 'active',
    themeColor: '#7c3aed',
    headline: profile.displayName,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity(tenantId, userId, 'website_created', id, { subdomain });
  return { ok: true, subdomain, created: true };
}

/**
 * Définit le style visuel du site ('impact'|'clarte'|'authenticite'). Crée la ligne
 * site (inactive, sans contenu) si elle n'existe pas encore — le choix de style peut
 * précéder la génération.
 */
export async function setSiteStyle(
  tenantId: string,
  userId: string,
  style: string
): Promise<{ ok: boolean; error?: 'no_profile' }> {
  const now = new Date().toISOString();
  const existing = await getWebsiteForTenant(tenantId);
  if (existing) {
    await db.update(websites).set({ template: style, updatedAt: now }).where(eq(websites.id, existing.id));
    await logActivity(tenantId, userId, 'site_style_changed', existing.id, { style });
    return { ok: true };
  }

  const [profile] = await db
    .select({ displayName: coachProfiles.displayName })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  if (!profile) return { ok: false, error: 'no_profile' };

  const subdomain = await computeUniqueSubdomain(tenantId, profile.displayName);
  const id = nanoid();
  await db.insert(websites).values({
    id,
    tenantId,
    subdomain,
    template: style,
    status: 'inactive',
    themeColor: '#7c3aed',
    headline: profile.displayName,
    createdAt: now,
    updatedAt: now,
  });
  await logActivity(tenantId, userId, 'site_style_changed', id, { style, created: true });
  return { ok: true };
}

export async function setWebsiteStatus(
  tenantId: string,
  userId: string,
  status: 'active' | 'inactive'
): Promise<{ ok: boolean }> {
  const existing = await getWebsiteForTenant(tenantId);
  if (!existing) return { ok: false };
  await db
    .update(websites)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(websites.id, existing.id));
  await logActivity(tenantId, userId, status === 'active' ? 'website_activated' : 'website_deactivated', existing.id);
  return { ok: true };
}
