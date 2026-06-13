import type { Metadata } from 'next';
import LandingClient from '@/components/landing/LandingClient';
import { resolveHeroVariant } from '@/lib/ab';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export const metadata: Metadata = {
  title: 'AuraPost — Ton contenu. Ton style. Généré en 2 minutes.',
  description:
    'AuraPost écrit tes posts Instagram & LinkedIn de coach sportif et te loue un site vitrine personnalisé, à partir de ton seul profil. Un mois de contenu en 2 minutes.',
  alternates: { canonical: '/' },
};

// JSON-LD SoftwareApplication (rich results / SEO).
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AuraPost',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: APP_URL,
  description:
    'AuraPost génère le contenu Instagram & LinkedIn des coachs sportifs et leur loue un site vitrine personnalisé.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Premier mois de contenu offert, sans carte bancaire.',
  },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '87' },
  publisher: { '@type': 'Organization', name: 'AuraPost', url: APP_URL },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ hero?: string }> }) {
  const { hero } = await searchParams;
  const heroCopy = resolveHeroVariant(hero);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient heroCopy={heroCopy} />
    </>
  );
}
