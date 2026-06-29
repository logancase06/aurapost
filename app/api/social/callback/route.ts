// Z-2.2 — Callback OAuth Zernio apres autorisation du coach.
// GET /api/social/callback?connected={platform}&profileId=X&accountId=Y&username=Z
// Zernio appelle cette URL apres que le coach a connecte son compte social.

import { type NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { logUnauthorized } from '@/lib/security';
import { SUPPORTED_PLATFORMS, listZernioAccounts, type SocialPlatform } from '@/lib/zernio';
import { upsertConnection } from '@/lib/db/social-connections';
import { logError, logEvent } from '@/lib/logger';

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
    logUnauthorized('session manquante', { path: '/api/social/callback' });
    return NextResponse.redirect(abs('/login'));
  }

  const tenantId = await requireTenantId();

  const { searchParams } = req.nextUrl;

  const connected = searchParams.get('connected');
  const profileId = searchParams.get('profileId');
  const accountId = searchParams.get('accountId');
  const username = searchParams.get('username');

  if (!connected || !profileId || !accountId) {
    return NextResponse.redirect(abs('/dashboard/social?error=cancelled'));
  }

  const platform = connected as SocialPlatform;
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.redirect(abs('/dashboard/social?error=invalid_platform'));
  }

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
    logError('[social/callback] listZernioAccounts echec (non bloquant)', {
      tenantId,
      platform,
      reason: accountsResult.reason,
    });
  }

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
    logError('[social/callback] upsertConnection echec', { tenantId, platform, error: String(err) });
    return NextResponse.redirect(abs('/dashboard/social?error=save_failed'));
  }

  logEvent('social.connection_added', tenantId, { platform, accountId });

  return NextResponse.redirect(abs(`/dashboard/social?success=${platform}`));
}
