import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Calculator, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Tarifs agence & réseau — AuraPost for Teams',
  description: 'Tarifs AuraPost for Teams par taille de réseau + calculateur de ROI : ce que vous économisez vs une agence traditionnelle.',
  alternates: { canonical: '/agency-pricing' },
};

const PLANS = [
  { name: 'Starter', limit: 'jusqu’à 50 distributeurs', price: '997 €', period: '/ mois', features: ['Comptes distributeurs illimités jusqu’à 50', 'Brand kit imposé', 'Templates validés', 'Reporting global', 'Import CSV'], featured: false },
  { name: 'Growth', limit: 'jusqu’à 200 distributeurs', price: '2 997 €', period: '/ mois', features: ['Tout Starter', 'Onboarding agence dédié', 'Conformité MLM avancée', 'Support prioritaire', 'Export reporting'], featured: true },
  { name: 'Enterprise', limit: '500+ distributeurs', price: 'Sur devis', period: '', features: ['Tout Growth', 'Marque blanche', 'Intégrations sur-mesure', 'Accompagnement dédié', 'SLA'], featured: false },
];

// Coût agence traditionnelle par distributeur/mois (référence marché).
const AGENCY_PER_DISTRIB = 800;
const DEFAULT_DISTRIB = 200;

/** Coût AuraPost mensuel estimé selon la taille du réseau. */
function aurapostMonthly(n: number): number {
  if (n <= 50) return 997;
  if (n <= 200) return 2997;
  return Math.round(n * 6); // au-delà : ~6 €/distributeur/mois (indicatif)
}

function euro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default async function AgencyPricingPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const sp = await searchParams;
  const distributors = Math.max(1, Math.min(5000, Number(sp.d) || DEFAULT_DISTRIB));

  const agencyMonthly = distributors * AGENCY_PER_DISTRIB;
  const auraMonthly = aurapostMonthly(distributors);
  const monthlySavings = Math.max(0, agencyMonthly - auraMonthly);
  const annualSavings = monthlySavings * 12;
  const perDistrib = auraMonthly / distributors;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <Link href="/agency-demo" className="text-sm text-muted-foreground hover:text-foreground">← AuraPost for Teams</Link>
      <h1 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-5xl">Tarifs réseau</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Un prix par taille de réseau. Comparé à une agence à {euro(AGENCY_PER_DISTRIB)}/distributeur/mois,
        AuraPost revient à quelques euros par distributeur.
      </p>

      {/* Plans */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={p.featured ? 'relative border-primary/60 p-6 shadow-lg shadow-primary/10' : 'p-6'}>
            {p.featured && <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-primary to-accent text-white">Recommandé</Badge>}
            <h2 className="text-xl font-black uppercase tracking-tight">{p.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{p.limit}</p>
            <p className="mt-3 text-3xl font-black">{p.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{p.period}</span></p>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>
              ))}
            </ul>
            <Link href="/agency-contact" className="mt-6 flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2.5 font-bold text-white">
              Demander un devis <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        ))}
      </div>

      {/* ROI calculator — SSR via formulaire GET (fonctionne sans JavaScript). */}
      <Card className="mt-16 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tight"><Calculator className="h-5 w-5 text-primary" /> Calculateur de ROI</h2>
        <p className="mt-2 text-sm text-muted-foreground">Estimez vos économies vs une agence traditionnelle.</p>

        <form method="GET" className="mt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label htmlFor="d" className="text-xs font-semibold">Nombre de distributeurs</label>
            <input
              id="d"
              name="d"
              type="range"
              min={10}
              max={1000}
              step={10}
              defaultValue={distributors}
              className="block w-64 accent-primary"
            />
          </div>
          <input
            name="d"
            type="number"
            min={1}
            max={5000}
            defaultValue={distributors}
            className="h-10 w-28 rounded-md border border-input bg-background/50 px-3 text-sm"
            aria-label="Nombre de distributeurs"
          />
          <button type="submit" className="h-10 rounded-md bg-primary px-5 text-sm font-bold text-white">Calculer</button>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Coût agence traditionnelle" value={`${euro(agencyMonthly)}/mois`} muted />
          <Stat label="Coût AuraPost" value={`${euro(auraMonthly)}/mois`} hint={`≈ ${euro(perDistrib)}/distributeur`} />
          <Stat label="Économie annuelle" value={euro(annualSavings)} highlight />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Estimation indicative pour {distributors} distributeurs. Référence agence : {euro(AGENCY_PER_DISTRIB)}/distributeur/mois.
        </p>
      </Card>
    </main>
  );
}

function Stat({ label, value, hint, muted, highlight }: { label: string; value: string; hint?: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
      <div className={`text-2xl font-extrabold ${highlight ? 'text-primary' : muted ? 'text-muted-foreground' : ''}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}
