import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDemoCoach, getDemoSlugs } from '@/lib/demo-data';
import DemoShowcase from '../demo/[slug]/DemoShowcase';
import AgencyShowcase from './AgencyShowcase';

export const metadata: Metadata = { title: 'Mode démonstration — AuraPost', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Token attendu : DEMO_TOKEN en env, sinon 'demo' (pratique en local/pitch sans config).
const EXPECTED_TOKEN = process.env.DEMO_TOKEN || 'demo';

/**
 * /demo-live?token=…&mode=coach|agency — vitrine de démonstration protégée par token.
 *   mode=coach  (défaut) → dashboard coach solo (Vincent), lecture seule.
 *   mode=agency → tableau de bord manager « Réseau Vitalité » (distributeurs, conformité,
 *                 adoption) à partir des données seedées. C'est la vue à montrer en pitch réseau.
 */
export default async function DemoLivePage({ searchParams }: { searchParams: Promise<{ token?: string; mode?: string }> }) {
  const { token, mode } = await searchParams;
  if (token !== EXPECTED_TOKEN) notFound();

  const banner = (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-primary to-accent px-4 py-2 text-center text-xs font-semibold text-white">
      Mode démonstration — données d’exemple, lecture seule
    </div>
  );

  if (mode === 'agency') {
    return (
      <>
        {banner}
        <AgencyShowcase />
      </>
    );
  }

  const slug = getDemoSlugs()[0];
  const coach = slug ? getDemoCoach(slug) : null;
  if (!coach) notFound();

  return (
    <>
      {banner}
      <DemoShowcase coach={coach} />
    </>
  );
}
