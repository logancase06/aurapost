import type { Metadata } from 'next';
import LandingClient from '@/components/landing/LandingClient';
import { resolveHeroVariant } from '@/lib/ab';
import { safeJsonLd } from '@/lib/utils';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export const metadata: Metadata = {
  title: 'AuraPost — Ton contenu. Ton style. Généré en 2 minutes.',
  description:
    'AuraPost écrit tes posts Instagram & LinkedIn de coach sportif et te loue un site vitrine personnalisé, à partir de ton seul profil. Un mois de contenu en 2 minutes.',
  alternates: { canonical: '/' },
};

// JSON-LD : SoftwareApplication + WebSite + Organization (rich results / SEO).
const jsonLdSoftware = {
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

// WebSite — active la SearchBox dans Google (sitelinks search box).
const jsonLdWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AuraPost',
  url: APP_URL,
  description: 'Contenu Instagram & LinkedIn généré par IA pour coachs sportifs.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/explore?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

// Organization — knowledge panel / logo Google.
const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AuraPost',
  url: APP_URL,
  logo: `${APP_URL}/icons/icon-512.png`,
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'contact@aurapost.fr' },
  sameAs: ['https://www.instagram.com/aurapost.fr'],
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ hero?: string }> }) {
  const { hero } = await searchParams;
  const heroCopy = resolveHeroVariant(hero);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdSoftware) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdWebsite) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdOrg) }} />
      <LandingClient heroCopy={heroCopy} />
    </>
  );
}
