import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCoachSiteData } from '@/lib/db/public';
import CoachSite, { type CoachSiteData } from '@/templates/coach-site/CoachSite';

type SP = Promise<{ preview?: string }>;

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

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
  const isPreview = (await searchParams)?.preview === '1';
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
  const isPreview = (await searchParams)?.preview === '1';
  const data = await getCoachSiteData(subdomain, { requireActive: !isPreview });
  if (!data) notFound();
  return (
    <>
      {!isPreview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(data, subdomain)) }} />
      )}
      <CoachSite data={data} />
    </>
  );
}
