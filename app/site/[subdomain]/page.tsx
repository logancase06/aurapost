import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCoachSiteData } from '@/lib/db/public';
import CoachSite from '@/templates/coach-site/CoachSite';

type SP = Promise<{ preview?: string }>;

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
  return {
    title: `${data.displayName} — Coach ${data.speciality}${place}`,
    description: data.seoDescription ?? data.bio ?? `Coaching ${data.speciality}${place}.`,
    // L'aperçu (preview=1) ne doit JAMAIS être indexé.
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${data.displayName} — Coach ${data.speciality}${place}`,
      description: data.seoDescription ?? `Coaching ${data.speciality}${place}.`,
    },
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
  return <CoachSite data={data} />;
}
