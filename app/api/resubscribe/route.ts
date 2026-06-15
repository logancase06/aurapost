import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyUnsubscribeToken, setUnsubscribed } from '@/lib/unsubscribe';
import { logEvent, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function invalidPage(): NextResponse {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lien invalide</title></head>
<body style="margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0A0A0F;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:22px;margin:0 0 8px">Lien invalide</h1>
<p style="color:#9CA3AF;font-size:15px;margin:0">Ce lien n'est pas valide. Écris-nous à <a href="mailto:contact@aurapost.fr" style="color:#a855f7">contact@aurapost.fr</a>.</p></div>
</body></html>`;
  return new NextResponse(html, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/**
 * GET /api/resubscribe?tenant=&token= — réabonnement aux emails marketing.
 * Route PUBLIQUE. Même vérification HMAC que /api/unsubscribe. Idempotent.
 */
export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant') ?? '';
  const token = req.nextUrl.searchParams.get('token') ?? '';

  if (!tenant || !verifyUnsubscribeToken(tenant, token)) return invalidPage();

  try {
    await setUnsubscribed(tenant, false);
    logEvent('email.resubscribed', tenant, {});
  } catch (err) {
    logError('[resubscribe] échec mise à jour', { error: String(err) });
    return invalidPage();
  }

  return NextResponse.redirect(new URL('/resubscribed', req.nextUrl.origin));
}
