// Z-2.1 — Initie le flow OAuth Zernio pour connecter un réseau social.
// GET /api/social/connect?platform=linkedin
// Redirige vers l'URL d'autorisation Zernio → revient sur /api/social/callback.
// Gating : pack_complet uniquement, MAX_SOCIAL_ACCOUNTS comptes actifs max.

import type { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
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

export async function GET(req: NextRequest) {
  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/social/connect' });
    redirect('/login');
  }

  const tenantId = await requireTenantId();

  // Gating plan
  const limits = getPlanLimits(session.user.plan);
  if (!limits.socialPublishEnabled) {
    redirect('/dashboard/social?error=plan_required');
  }

  // Zernio configuré ?
  if (!isZernioConfigured()) {
    redirect(`${SOCIAL_ERROR_BASE}not_configured`);
  }

  // Valider le paramètre ?platform=
  const platform = req.nextUrl.searchParams.get('platform') as SocialPlatform | null;
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    redirect(`${SOCIAL_ERROR_BASE}invalid_platform`);
  }

  // Quota MAX_SOCIAL_ACCOUNTS
  const connections = await getConnectionsByTenant(tenantId);
  const alreadyConnectedPlatforms = connections.map((c) => c.platform);
  // Pas de double compte sur la même plateforme (UNIQUE index DB), mais on vérifie la limite globale.
  if (!alreadyConnectedPlatforms.includes(platform) && connections.length >= MAX_SOCIAL_ACCOUNTS) {
    redirect(`${SOCIAL_ERROR_BASE}quota_reached`);
  }

  // getOrCreate le Zernio Profile pour ce tenant
  let profileId = await getTenantZernioProfileId(tenantId);
  if (!profileId) {
    const result = await createZernioProfile(session.user.name ?? tenantId);
    if (!result.ok) {
      logError('[social/connect] createZernioProfile échec', { tenantId, reason: result.reason });
      redirect(`${SOCIAL_ERROR_BASE}api_error`);
    }
    profileId = result.data.profileId;
    await setTenantZernioProfileId(tenantId, profileId);
  }

  // URL de callback OAuth (AuraPost reçoit la réponse Zernio ici)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/social/callback`;

  // Générer l'URL d'autorisation Zernio
  const result = await getZernioConnectUrl(profileId, platform, callbackUrl);
  if (!result.ok) {
    logError('[social/connect] getZernioConnectUrl échec', { tenantId, platform, reason: result.reason });
    redirect(`${SOCIAL_ERROR_BASE}api_error`);
  }

  redirect(result.data.authUrl);
}
