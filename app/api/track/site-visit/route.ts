import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteVisits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { websites } from '@/lib/db/schema';

/**
 * POST /api/track/site-visit
 *
 * Récepteur de ping de visite pour les sites vitrines des coachs.
 *
 * RGPD / CNIL 2020-091 art. 5 — exemption audience measurement :
 *  - Aucune IP stockée
 *  - Aucun cookie déposé ou lu
 *  - Aucun identifiant persistant lié à une personne physique
 *  - Referrer tronqué au domaine seul (pas de chemin, pas de paramètres)
 *  - Country = code ISO-2 issu de l'en-tête CF-IPCountry (Cloudflare) — dérivé côté serveur
 *  - Device = catégorie déduite du User-Agent (mobile / tablet / desktop), pas l'UA brut
 *  Finalité unique : mesure d'audience propriétaire, pas de croisement inter-sites.
 *  Responsabilité juridique finale = responsable de traitement (humain / DPO).
 *
 * Performance : endpoint ciblé par sendBeacon → réponse 204 immédiate.
 * Le traitement est asynchrone (await sans bloquer la réponse n'est pas nécessaire
 * car on est dans une Edge/Node route handler — le process ne s'arrête pas).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subdomain = (body.subdomain || '').trim().toLowerCase().slice(0, 64);
    if (!subdomain) return new NextResponse(null, { status: 204 });

    // Résolution tenantId depuis le subdomain (nécessaire pour isoler les stats).
    const rows = await db
      .select({ tenantId: websites.tenantId })
      .from(websites)
      .where(eq(websites.subdomain, subdomain))
      .limit(1);
    const tenantId = rows[0]?.tenantId;
    if (!tenantId) return new NextResponse(null, { status: 204 });

    // Referrer : on ne garde que le domaine (hostname), jamais le chemin ni les params.
    const rawRef = (body.referrer || '').trim();
    let referrer: string | null = null;
    if (rawRef) {
      try {
        referrer = new URL(rawRef.startsWith('http') ? rawRef : `https://${rawRef}`).hostname.slice(0, 128);
      } catch {
        // URL invalide — on ignore
      }
    }

    // Country : issu de CF-IPCountry (Cloudflare Workers, null sinon).
    const country = (req.headers.get('cf-ipcountry') || body.country || '').slice(0, 2).toUpperCase() || null;

    // Device : catégorisation grossière depuis le User-Agent (pas l'UA brut stocké).
    const ua = req.headers.get('user-agent') || '';
    const device: string | null = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
      ? /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile'
      : ua ? 'desktop' : null;

    await db.insert(siteVisits).values({
      tenantId,
      subdomain,
      visitedAt: new Date(),
      referrer,
      country,
      device,
    });
  } catch {
    // Erreur silencieuse : le tracking ne doit jamais casser la navigation du visiteur.
  }

  return new NextResponse(null, { status: 204 });
}
