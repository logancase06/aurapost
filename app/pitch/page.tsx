import type { Metadata } from 'next';
import PitchDeck from './PitchDeck';

export const metadata: Metadata = {
  title: 'Pitch — AuraPost for Teams',
  description: 'Présentation AuraPost for Teams pour les réseaux et agences.',
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return <PitchDeck />;
}
