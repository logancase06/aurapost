import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { scrapeInstagram, isInstagramUrl } from '@/lib/instagram';
import { saveInstagram } from '@/lib/db/coach-site';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { logError } from '@/lib/logger';

// Scraping Instagram public — côté serveur uniquement. Rate limit 1/heure/tenant.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = await requireTenantId();

    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!isInstagramUrl(url)) {
      return NextResponse.json({ error: 'URL Instagram invalide.' }, { status: 400 });
    }

    const rl = await checkAuthRateLimit(`igscrape:${tenantId}`, 1, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Un seul scraping par heure. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} min.` }, { status: 429 });
    }

    const result = await scrapeInstagram(url);
    if (!result.ok) {
      // Fallback propre : on conserve l'URL et on demande la saisie manuelle.
      await saveInstagram(tenantId, url, null);
      return NextResponse.json(
        {
          ok: false,
          fallback: true,
          reason: result.reason,
          message:
            'Impossible de récupérer automatiquement votre Instagram (compte privé ou bloqué). Complétez vos infos manuellement ci-dessous.',
        },
        { status: 200 }
      );
    }

    await saveInstagram(tenantId, url, result.data);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    logError('[onboarding/site/instagram]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
