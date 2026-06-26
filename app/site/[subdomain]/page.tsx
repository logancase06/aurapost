import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { websites } from '@/lib/db/schema';
import { unstable_noStore as noStore } from 'next/cache';
import { getCoachSiteData } from '@/lib/db/public';
import { safeJsonLd } from '@/lib/utils';
import CoachSite, { type CoachSiteData } from '@/templates/coach-site/CoachSite';

type SP = Promise<{ preview?: string }>;

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

// ISR : le site publié est revalidé au plus toutes les heures (l'aperçu reste dynamique).
export const revalidate = 3600;

/** L'aperçu (site non publié) n'est autorisé qu'au propriétaire connecté du site. */
async function canPreview(subdomain: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.tenantId) return false;
  const [w] = await db.select({ tenantId: websites.tenantId }).from(websites).where(eq(websites.subdomain, subdomain.toLowerCase())).limit(1);
  return !!w && w.tenantId === session.user.tenantId;
}

function metaDescription(data: CoachSiteData): string {
  const place = data.city ? ` à ${data.city}` : '';
  const base = data.seoDescription ?? data.bio ?? `${data.displayName}, coach ${data.speciality}${place}.`;
  return base.replace(/\s+/g, ' ').trim().slice(0, 155);
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: SP;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const isPreview = (await searchParams)?.preview === '1' && (await canPreview(subdomain));
  const data = await getCoachSiteData(subdomain, { requireActive: !isPreview });
  if (!data) return { title: 'Site introuvable' };
  const place = data.city ? ` à ${data.city}` : '';
  const title = `${data.displayName} — Coach ${data.speciality}${place}`;
  const description = metaDescription(data);
  const url = `https://${subdomain}.${APP_DOMAIN}`;
  const images = data.photoUrl ? [{ url: data.photoUrl }] : undefined;

  return {
    title,
    description,
    // L'aperçu (preview=1) ne doit JAMAIS être indexé.
    robots: isPreview ? { index: false, follow: false } : undefined,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, images },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, images: images?.map((i) => i.url) },
  };
}

/** Données structurées LocalBusiness (SEO local) — injectées dans le <head>. */
function jsonLd(data: CoachSiteData, subdomain: string) {
  const url = `https://${subdomain}.${APP_DOMAIN}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.displayName,
    description: metaDescription(data),
    ...(data.city ? { address: { '@type': 'PostalAddress', addressLocality: data.city } } : {}),
    url,
    ...(data.photoUrl ? { image: data.photoUrl } : {}),
    ...(data.instagramUrl ? { sameAs: [data.instagramUrl] } : {}),
  };
}

// Page publique du site loué. En production, le routage subdomain (<coach>.aurapost.fr)
// réécrit vers cette route via proxy.ts. En local : /site/<subdomain>.
// ?preview=1 → rend le site même non publié (éditeur), avec noindex.
export default async function PublicSitePage({ params, searchParams }: { params: Promise<{ subdomain: string }>; searchParams: SP }) {
  const { subdomain } = await params;
  // ?preview=1 n'est honoré que pour le propriétaire connecté (sinon site publié only).
  const isPreview = (await searchParams)?.preview === '1' && (await canPreview(subdomain));
  // L'aperçu (brouillon) ne doit JAMAIS être mis en cache → rendu dynamique forcé.
  if (isPreview) noStore();
  const data = await getCoachSiteData(subdomain, { requireActive: !isPreview });
  if (!data) notFound();
  // Script de tracking minimal — chargé en `defer` pour ne pas retarder le LCP.
  // sendBeacon est non-bloquant et n'attend pas la réponse du serveur.
  // Aucun cookie déposé, aucune IP transmise → exemption CNIL 2020-091 audience measurement.
  // Le tracking est ignoré en mode aperçu (isPreview) pour ne pas fausser les stats.
  const trackingScript = !isPreview
    ? `(function(){var s='${subdomain}';var r=document.referrer;try{navigator.sendBeacon('/api/track/site-visit',JSON.stringify({subdomain:s,referrer:r}));}catch(e){}})();`
    : null;

  return (
    <>
      {!isPreview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd(data, subdomain)) }} />
      )}
      {trackingScript && (
        <script defer dangerouslySetInnerHTML={{ __html: trackingScript }} />
      )}
      <CoachSite data={data} />
    </>
  );
}
