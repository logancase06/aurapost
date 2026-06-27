// Helpers DB pour les connexions sociales Zernio et l'historique de publication.
// Toutes les mutations passent par requireTenantId() côté API — pas de vérification ici.

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '.';
import { socialConnections, socialPublications, tenants } from './schema';
import type { SocialPlatform } from '../zernio';

// ─── Zernio Profile ID sur tenants ───────────────────────────────────────────

/** Récupère l'ID Zernio Profile du tenant, ou null si non encore créé. */
export async function getTenantZernioProfileId(tenantId: string): Promise<string | null> {
  const [row] = await db
    .select({ zernioProfileId: tenants.zernioProfileId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return row?.zernioProfileId ?? null;
}

/** Persiste l'ID Zernio Profile sur le tenant (appelé après createZernioProfile). */
export async function setTenantZernioProfileId(tenantId: string, profileId: string): Promise<void> {
  await db.update(tenants).set({ zernioProfileId: profileId }).where(eq(tenants.id, tenantId));
}

// ─── Connexions sociales ─────────────────────────────────────────────────────

export interface SocialConnectionRow {
  id: string;
  tenantId: string;
  zernioAccountId: string;
  platform: SocialPlatform;
  accountName: string | null;
  accountAvatar: string | null;
  status: string;
  connectedAt: string;
  lastUsedAt: string | null;
}

/** Liste les connexions actives d'un tenant. */
export async function getConnectionsByTenant(tenantId: string): Promise<SocialConnectionRow[]> {
  const rows = await db
    .select()
    .from(socialConnections)
    .where(and(eq(socialConnections.tenantId, tenantId), eq(socialConnections.status, 'active')));
  return rows as SocialConnectionRow[];
}

/** Récupère une connexion par ID (pour les mutations post-auth). */
export async function getConnectionById(connectionId: string, tenantId: string): Promise<SocialConnectionRow | null> {
  const [row] = await db
    .select()
    .from(socialConnections)
    .where(and(eq(socialConnections.id, connectionId), eq(socialConnections.tenantId, tenantId)))
    .limit(1);
  return (row as SocialConnectionRow) ?? null;
}

/**
 * Crée ou remplace la connexion pour (tenantId, platform).
 * UNIQUE INDEX sur (tenant_id, platform) → on utilise INSERT OR REPLACE pour l'idempotence.
 * Appelé depuis le callback OAuth après récupération de l'accountId Zernio.
 */
export async function upsertConnection(params: {
  id: string;
  tenantId: string;
  zernioAccountId: string;
  platform: SocialPlatform;
  accountName: string | null;
  accountAvatar: string | null;
}): Promise<void> {
  await db
    .insert(socialConnections)
    .values({
      id: params.id,
      tenantId: params.tenantId,
      zernioAccountId: params.zernioAccountId,
      platform: params.platform,
      accountName: params.accountName,
      accountAvatar: params.accountAvatar,
      status: 'active',
      connectedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [socialConnections.tenantId, socialConnections.platform],
      set: {
        zernioAccountId: params.zernioAccountId,
        accountName: params.accountName,
        accountAvatar: params.accountAvatar,
        status: 'active',
        connectedAt: new Date().toISOString(),
        lastUsedAt: null,
      },
    });
}

/**
 * Révoque une connexion (soft-delete : status → 'revoked').
 * La déconnexion côté Zernio est gérée séparément (zernio.accounts.deleteAccount).
 */
export async function revokeConnection(connectionId: string, tenantId: string): Promise<void> {
  await db
    .update(socialConnections)
    .set({ status: 'revoked' })
    .where(and(eq(socialConnections.id, connectionId), eq(socialConnections.tenantId, tenantId)));
}

// ─── Publications ─────────────────────────────────────────────────────────────

/** Crée un enregistrement de publication (statut initial 'pending'). */
export async function createPublication(params: {
  id: string;
  postId: string;
  tenantId: string;
  connectionId: string;
  zernioPostId?: string;
}): Promise<void> {
  await db.insert(socialPublications).values({
    id: params.id,
    postId: params.postId,
    tenantId: params.tenantId,
    connectionId: params.connectionId,
    zernioPostId: params.zernioPostId ?? null,
    status: params.zernioPostId ? 'published' : 'pending',
    publishedAt: params.zernioPostId ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  });
}

/** Met à jour lastUsedAt après une publication réussie. */
export async function touchConnectionLastUsed(connectionId: string): Promise<void> {
  await db
    .update(socialConnections)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(socialConnections.id, connectionId));
}

/**
 * Met à jour le statut d'une publication via son zernioPostId.
 * Appelé par le webhook Zernio (post.published / post.failed).
 */
export async function updatePublicationStatus(
  zernioPostId: string,
  status: 'published' | 'failed',
  errorMessage?: string
): Promise<void> {
  await db
    .update(socialPublications)
    .set({
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      errorMessage: errorMessage ?? null,
    })
    .where(eq(socialPublications.zernioPostId, zernioPostId));
}

/** Récupère les publications d'un post (pour afficher "publié sur LinkedIn ✓"). */
export async function getPublicationsByPost(postId: string, tenantId: string) {
  return db
    .select()
    .from(socialPublications)
    .where(and(eq(socialPublications.postId, postId), eq(socialPublications.tenantId, tenantId)));
}

/** Connexion sérialisée — safe à passer à un Client Component. */
export interface SerializedConnection {
  id: string;
  platform: string;
  accountName: string | null;
  accountAvatar: string | null;
}

/** Statut de publication par post × connexion — pour les badges de statut dans les cartes. */
export interface PublicationSummary {
  postId: string;
  connectionId: string;
  platform: string;
  status: string; // 'pending' | 'published' | 'failed'
}

/**
 * Récupère les statuts de publication pour une liste de posts en une seule requête.
 * Utilisé dans le dashboard pour afficher les badges ✅/❌/⏳ sans N+1.
 */
export async function getPublicationsBatch(tenantId: string, postIds: string[]): Promise<PublicationSummary[]> {
  if (postIds.length === 0) return [];
  const rows = await db
    .select({
      postId: socialPublications.postId,
      connectionId: socialPublications.connectionId,
      platform: socialConnections.platform,
      status: socialPublications.status,
    })
    .from(socialPublications)
    .innerJoin(socialConnections, eq(socialPublications.connectionId, socialConnections.id))
    .where(and(eq(socialPublications.tenantId, tenantId), inArray(socialPublications.postId, postIds)));
  return rows as PublicationSummary[];
}
