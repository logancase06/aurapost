import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Deux offres claires pour automatiser ton contenu Instagram & LinkedIn de coach sportif. Sans engagement, satisfait ou remboursé 30 jours.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return <PricingClient />;
}
