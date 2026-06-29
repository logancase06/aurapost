// Z-2.1 — Initie le flow OAuth Zernio pour connecter un reseau social.
// GET /api/social/connect?platform=linkedin
// Redirige vers l'URL d'autorisation Zernio -> revient sur /api/social/callback.
// Gating : pack_complet uniquement, MAX_SOCIAL_ACCOUNTS comptes actifs max.

import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { logUnauthorized } from '@/lib/security';
import { getPlanLimits, MAX_SOCIAL_ACCOUNTS } from '@/lib/plans';
import {
  isZernioConfigured,
  createZernioProfile,
  getZernioConnectUrl,
  SUPPORTED_PLATFORMS,
  type SocialPlatform,
} from '@/lib/zernio';
import {
  getConnectionsByTenant,
  getTenantZernioProfileId,
  setTenantZernioProfileId,
} from '@/lib/db/social-connections';
import { logError } from '@/lib/logger';

const SOCIAL_ERROR_BASE = '/dashboard/social?error=';

// Toujours utiliser NEXT_PUBLIC_APP_URL comme base : req.url retourne
// l'URL interne Netlify (xxxx.netlify.app), pas le domaine custom.
function abs(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base}${path}`;
}

export async function GET(req: NextRequest) {
  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/social/connect' });
    return NextResponse.redirect(abs('/login'));
  }

  const tenantId = await requireTenantId();

  // Gating plan
  const limits = getPlanLimits(session.user.plan);
  if (!limits.socialPublishEnabled) {
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}plan_required`));
  }

  // Zernio configure ?
  if (!isZernioConfigured()) {
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}not_configured`));
  }

  // Valider le parametre ?platform=
  const platform = req.nextUrl.searchParams.get('platform') as SocialPlatform | null;
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}invalid_platform`));
  }

  // Quota MAX_SOCIAL_ACCOUNTS
  let connections: Awaited<ReturnType<typeof getConnectionsByTenant>> = [];
  try {
    connections = await getConnectionsByTenant(tenantId);
  } catch {
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}db_error`));
  }
  const alreadyConnectedPlatforms = connections.map((c) => c.platform);
  if (!alreadyConnectedPlatforms.includes(platform) && connections.length >= MAX_SOCIAL_ACCOUNTS) {
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}quota_reached`));
  }

  // getOrCreate le Zernio Profile pour ce tenant
  let profileId = await getTenantZernioProfileId(tenantId);
  if (!profileId) {
    const result = await createZernioProfile(session.user.name ?? tenantId);
    if (!result.ok) {
      logError('[social/connect] createZernioProfile echec', { tenantId, reason: result.reason });
      return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}api_error`));
    }
    profileId = result.data.profileId;
    await setTenantZernioProfileId(tenantId, profileId);
  }

  // URL de callback OAuth (AuraPost recoit la reponse Zernio ici)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/social/callback`;

  // Generer l'URL d'autorisation Zernio
  const result = await getZernioConnectUrl(profileId, platform, callbackUrl);
  if (!result.ok) {
    logError('[social/connect] getZernioConnectUrl echec', { tenantId, platform, reason: result.reason });
    return NextResponse.redirect(abs(`${SOCIAL_ERROR_BASE}api_error`));
  }

  return NextResponse.redirect(result.data.authUrl);
}
