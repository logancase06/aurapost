import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDemoCoach, getDemoSlugs } from '@/lib/demo-data';
import DemoShowcase from './DemoShowcase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export function generateStaticParams() {
  return getDemoSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const coach = getDemoCoach(slug);
  if (!coach) return { title: 'Démo introuvable' };
  const title = `${coach.displayName} — Aperçu AuraPost`;
  const description = `Découvre le contenu et le site générés par AuraPost pour ${coach.displayName}, ${coach.speciality} à ${coach.cities}.`;
  return {
    title,
    description,
    alternates: { canonical: `/demo/${coach.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APP_URL}/demo/${coach.slug}`,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function DemoSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const coach = getDemoCoach(slug);
  if (!coach) notFound();
  return <DemoShowcase coach={coach} />;
}
