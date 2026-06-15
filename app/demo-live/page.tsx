import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDemoCoach, getDemoSlugs } from '@/lib/demo-data';
import DemoShowcase from '../demo/[slug]/DemoShowcase';

export const metadata: Metadata = { title: 'Mode démonstration — AuraPost', robots: { index: false, follow: false } };

// Token attendu : DEMO_TOKEN en env, sinon 'demo' (pratique en local/pitch sans config).
const EXPECTED_TOKEN = process.env.DEMO_TOKEN || 'demo';

/**
 * /demo-live?token=… — vitrine de démonstration protégée par token, pour les pitchs.
 * Charge le compte de démo (Vincent) en lecture seule (aucune action destructive possible :
 * la vitrine est statique). Bannière « Mode démonstration » en tête.
 */
export default async function DemoLivePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (token !== EXPECTED_TOKEN) notFound();

  const slug = getDemoSlugs()[0];
  const coach = slug ? getDemoCoach(slug) : null;
  if (!coach) notFound();

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary to-accent px-4 py-2 text-center text-xs font-semibold text-white">
        ● Mode démonstration — données d’exemple, lecture seule
      </div>
      <DemoShowcase coach={coach} />
    </>
  );
}
