// Z-2.2 — Callback OAuth Zernio après autorisation du coach.
// GET /api/social/callback?connected={platform}&profileId=X&accountId=Y&username=Z
// Zernio appelle cette URL après que le coach a connecté son compte social.

import { type NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { logUnauthorized } from '@/lib/security';
import { SUPPORTED_PLATFORMS, listZernioAccounts, type SocialPlatform } from '@/lib/zernio';
import { upsertConnection } from '@/lib/db/social-connections';
import { logError, logEvent } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Auth — le coach doit toujours être connecté à AuraPost.
  const session = await auth();
  if (!session?.user?.id) {
    logUnauthorized('session manquante', { path: '/api/social/callback' });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const tenantId = await requireTenantId();

  const { searchParams } = req.nextUrl;

  // Zernio renvoie ?connected={platform} ou rien en cas d'annulation.
  const connected = searchParams.get('connected');
  const profileId = searchParams.get('profileId');
  const accountId = searchParams.get('accountId');
  const username = searchParams.get('username');

  // Annulation ou callback invalide
  if (!connected || !profileId || !accountId) {
    return NextResponse.redirect(new URL('/dashboard/social?error=cancelled', req.url));
  }

  // Valider la plateforme retournée
  const platform = connected as SocialPlatform;
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.redirect(new URL('/dashboard/social?error=invalid_platform', req.url));
  }

  // Récupérer les détails du compte (avatar, displayName) via l'API Zernio.
  // On filtre sur l'accountId retourné pour trouver les métadonnées.
  let accountName: string | null = username ?? null;
  let accountAvatar: string | null = null;

  const accountsResult = await listZernioAccounts(profileId);
  if (accountsResult.ok) {
    const match = accountsResult.data.find((a) => a.accountId === accountId);
    if (match) {
      accountName = match.accountName;
      accountAvatar = match.accountAvatar;
    }
  } else {
    // Non bloquant : on persiste quand même avec le username du callback.
    logError('[social/callback] listZernioAccounts échec (non bloquant)', {
      tenantId,
      platform,
      reason: accountsResult.reason,
    });
  }

  // Persiste la connexion (INSERT OR REPLACE via UNIQUE INDEX tenant_id × platform).
  try {
    await upsertConnection({
      id: nanoid(),
      tenantId,
      zernioAccountId: accountId,
      platform,
      accountName,
      accountAvatar,
    });
  } catch (err) {
    logError('[social/callback] upsertConnection échec', { tenantId, platform, error: String(err) });
    return NextResponse.redirect(new URL('/dashboard/social?error=save_failed', req.url));
  }

  logEvent('social.connection_added', tenantId, { platform, accountId });

  return NextResponse.redirect(new URL(`/dashboard/social?success=${platform}`, req.url));
}
