import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCoachSiteData } from '@/lib/db/public';
import CoachSite from '@/templates/coach-site/CoachSite';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getCoachSiteData(subdomain);
  if (!data) return { title: 'Site introuvable' };
  const place = data.city ? ` à ${data.city}` : '';
  return {
    title: `${data.displayName} — Coach ${data.speciality}${place}`,
    description: data.seoDescription ?? data.bio ?? `Coaching ${data.speciality}${place}.`,
    openGraph: {
      title: `${data.displayName} — Coach ${data.speciality}${place}`,
      description: data.seoDescription ?? `Coaching ${data.speciality}${place}.`,
    },
  };
}

// Page publique du site loué. En production, le routage subdomain (<coach>.aurapost.fr)
// réécrit vers cette route via proxy.ts. En local : /site/<subdomain>.
export default async function PublicSitePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const data = await getCoachSiteData(subdomain);
  if (!data) notFound();
  return <CoachSite data={data} />;
}
