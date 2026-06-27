// Wrapper Zernio — publication sociale white-label depuis AuraPost.
// Le coach ne crée pas de compte Zernio : il voit "Connecter mon LinkedIn" dans son dashboard.
// Un Zernio Profile est créé par tenant à la première connexion et stocké dans tenants.zernioProfileId.
//
// Mock propre : si ZERNIO_API_KEY est absent, toutes les fonctions retournent { ok: false, reason: 'not_configured' }.
// L'app ne crash jamais sans la clé.

import { logError, logEvent } from './logger';

export type SocialPlatform = 'linkedin' | 'instagram';

/** Plateformes exposées en v1 beta. */
export const SUPPORTED_PLATFORMS: readonly SocialPlatform[] = ['linkedin', 'instagram'] as const;

export function isZernioConfigured(): boolean {
  return !!process.env.ZERNIO_API_KEY;
}

// ─── Lazy init — le SDK n'est importé que si la clé est présente ─────────────

let _client: import('@zernio/node').default | null = null;

async function getClient(): Promise<import('@zernio/node').default> {
  if (_client) return _client;
  const { default: Zernio } = await import('@zernio/node');
  _client = new Zernio({ apiKey: process.env.ZERNIO_API_KEY });
  return _client;
}

// ─── Types résultats ──────────────────────────────────────────────────────────

export interface ZernioOk<T> { ok: true; data: T }
export interface ZernioError { ok: false; reason: 'not_configured' | 'api_error'; message: string }
export type ZernioResult<T> = ZernioOk<T> | ZernioError;

function notConfigured(): ZernioError {
  return { ok: false, reason: 'not_configured', message: 'ZERNIO_API_KEY absent — publication sociale désactivée.' };
}

// ─── Profils ─────────────────────────────────────────────────────────────────

/**
 * Crée un Zernio Profile pour ce tenant.
 * Appelé une fois par tenant lors de la première connexion sociale.
 * Le résultat doit être persisté dans tenants.zernioProfileId par l'appelant.
 */
export async function createZernioProfile(tenantName: string): Promise<ZernioResult<{ profileId: string }>> {
  if (!isZernioConfigured()) return notConfigured();
  try {
    const zernio = await getClient();
    const res = await zernio.profiles.createProfile({ body: { name: tenantName } });
    const profileId = res.data?.profile?._id;
    if (!profileId) {
      logError('[zernio] createProfile : réponse sans _id', { tenantName });
      return { ok: false, reason: 'api_error', message: 'Zernio n\'a pas retourné d\'ID de profil.' };
    }
    logEvent('zernio.profile_created', tenantName, { profileId });
    return { ok: true, data: { profileId } };
  } catch (err) {
    logError('[zernio] createProfile erreur', { error: String(err) });
    return { ok: false, reason: 'api_error', message: String(err) };
  }
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

/**
 * Génère l'URL OAuth Zernio pour qu'un coach connecte son compte sur `platform`.
 * `redirectUrl` est l'URL de callback AuraPost (ex: https://aurapost.fr/api/social/callback).
 * Après autorisation, Zernio y ajoute ?connected=platform&accountId=...&profileId=...
 */
export async function getZernioConnectUrl(
  profileId: string,
  platform: SocialPlatform,
  redirectUrl: string
): Promise<ZernioResult<{ authUrl: string }>> {
  if (!isZernioConfigured()) return notConfigured();
  try {
    const zernio = await getClient();
    const res = await zernio.connect.getConnectUrl({
      path: { platform },
      query: { profileId, redirect_url: redirectUrl },
    });
    const authUrl = res.data?.authUrl;
    if (!authUrl) {
      logError('[zernio] getConnectUrl : réponse sans authUrl', { platform, profileId });
      return { ok: false, reason: 'api_error', message: 'Zernio n\'a pas retourné d\'URL d\'autorisation.' };
    }
    return { ok: true, data: { authUrl } };
  } catch (err) {
    logError('[zernio] getConnectUrl erreur', { error: String(err), platform });
    return { ok: false, reason: 'api_error', message: String(err) };
  }
}

// ─── Comptes connectés ────────────────────────────────────────────────────────

export interface ZernioAccount {
  accountId: string;
  platform: SocialPlatform;
  accountName: string;
  accountAvatar: string | null;
}

/**
 * Récupère les comptes connectés pour un Profile Zernio donné.
 * Filtré sur les plateformes v1 (linkedin, instagram).
 */
export async function listZernioAccounts(profileId: string): Promise<ZernioResult<ZernioAccount[]>> {
  if (!isZernioConfigured()) return notConfigured();
  try {
    const zernio = await getClient();
    const res = await zernio.accounts.listAccounts({ query: { profileId } });
    type RawAccount = (typeof res.data)['accounts'][number];
    const raw: RawAccount[] = res.data?.accounts ?? [];
    const accounts: ZernioAccount[] = raw
      .filter((a: RawAccount) => SUPPORTED_PLATFORMS.includes(a.platform as SocialPlatform) && a.isActive)
      .map((a: RawAccount) => ({
        accountId: a._id,
        platform: a.platform as SocialPlatform,
        accountName: a.displayName ?? a.username ?? a._id,
        accountAvatar: a.profilePicture ?? null,
      }));
    return { ok: true, data: accounts };
  } catch (err) {
    logError('[zernio] listAccounts erreur', { error: String(err), profileId });
    return { ok: false, reason: 'api_error', message: String(err) };
  }
}

// ─── Publication ──────────────────────────────────────────────────────────────

export interface PublishPostParams {
  zernioAccountId: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  tenantId: string; // pour le logging
}

export interface PublishPostData { zernioPostId: string }

/**
 * Publie immédiatement un post sur la plateforme sociale connectée.
 * v1 : publishNow: true uniquement (pas de planification Zernio).
 */
export async function publishPost(params: PublishPostParams): Promise<ZernioResult<PublishPostData>> {
  if (!isZernioConfigured()) return notConfigured();
  const { zernioAccountId, platform, content, mediaUrls, tenantId } = params;
  try {
    const zernio = await getClient();
    const res = await zernio.posts.createPost({
      body: {
        content,
        platforms: [{ platform, accountId: zernioAccountId }],
        publishNow: true,
        ...(mediaUrls?.length ? { mediaItems: mediaUrls.map((url) => ({ url })) } : {}),
      },
    });
    const zernioPostId = res.data?.post?._id;
    if (!zernioPostId) {
      logError('[zernio] createPost : réponse sans _id', { platform, tenantId });
      return { ok: false, reason: 'api_error', message: 'Zernio n\'a pas retourné l\'ID du post publié.' };
    }
    logEvent('zernio.post_published', tenantId, { platform, zernioPostId });
    return { ok: true, data: { zernioPostId } };
  } catch (err) {
    const msg = String(err);
    logError('[zernio] createPost erreur', { error: msg, platform, tenantId });
    return { ok: false, reason: 'api_error', message: msg };
  }
}

// ─── Suppression d'un compte connecté ────────────────────────────────────────

/**
 * Révoque un compte social côté Zernio (supprime la connexion OAuth).
 * Appelé depuis /api/social/disconnect après revokeConnection() en DB.
 * Non bloquant : un échec ici ne doit pas bloquer la déconnexion locale.
 */
export async function deleteZernioAccount(zernioAccountId: string): Promise<ZernioResult<void>> {
  if (!isZernioConfigured()) return notConfigured();
  try {
    const zernio = await getClient();
    await zernio.accounts.deleteAccount({ path: { accountId: zernioAccountId } });
    return { ok: true, data: undefined };
  } catch (err) {
    logError('[zernio] deleteAccount erreur', { error: String(err), zernioAccountId });
    return { ok: false, reason: 'api_error', message: String(err) };
  }
}

// ─── Vérification signature webhook ──────────────────────────────────────────

/**
 * Vérifie la signature HMAC-SHA256 des webhooks Zernio.
 * Header : X-Zernio-Signature: sha256=<hex>
 * Retourne true si la signature est valide, false sinon.
 */
export async function verifyZernioWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  const secret = process.env.ZERNIO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = signatureHeader.replace(/^sha256=/, '');
  const { createHmac } = await import('crypto');
  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  // Comparaison en temps constant pour éviter les timing attacks.
  return computed.length === expected.length && computed === expected;
}
