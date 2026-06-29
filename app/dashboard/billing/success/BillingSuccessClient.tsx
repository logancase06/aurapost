'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, ArrowRight, Sparkles, Zap, Globe, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FEATURES: Record<string, { name: string; items: string[] }> = {
  content_only: {
    name: 'Coach',
    items: [
      '12 posts / mois calibres sur ta specialite',
      'Instagram + LinkedIn generes par IA',
      'Variantes illimitees + pack legendes',
      'Export en 1 clic',
      'Analyse de profil',
    ],
  },
  pack_complet: {
    name: 'Coach+Site',
    items: [
      '12 posts / mois Instagram + LinkedIn',
      'Site vitrine genere par IA',
      'Planning de reservations',
      'Edition IA des images (20/mois)',
      'Publication directe sur les reseaux',
      'Support prioritaire',
    ],
  },
};

const ICONS = [Sparkles, Zap, Globe, Star, CheckCircle2];

export default function BillingSuccessClient({ plan }: { plan: string }) {
  const router = useRouter();
  const { update } = useSession();
  const feat = FEATURES[plan] ?? FEATURES.content_only;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation d'entree
    const t1 = setTimeout(() => setVisible(true), 80);

    // Rafraichit la session apres 3s pour laisser le webhook Stripe mettre a jour tenants.plan
    const t2 = setTimeout(() => update(), 3_000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [update]);

  return (
    <div
      className={`flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* Icone */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 ring-8 ring-success/10">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      {/* Titre */}
      <h1 className="mt-6 text-3xl font-black tracking-tight">Bienvenue dans le plan {feat.name} !</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Ton abonnement est actif. Voici ce que tu as maintenant.
      </p>

      {/* Features */}
      <Card className="mt-8 w-full max-w-md p-6">
        <ul className="space-y-3">
          {feat.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Note essai */}
      <p className="mt-5 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground">
        14 jours gratuits &mdash; aucun prelevement avant la fin de l'essai
      </p>

      {/* CTA */}
      <Button
        size="lg"
        variant="gradient"
        className="mt-8 gap-2"
        onClick={() => router.push('/dashboard')}
      >
        Commencer maintenant <ArrowRight className="h-4 w-4" />
      </Button>

      <button
        onClick={() => router.push('/dashboard/billing')}
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Voir mon abonnement
      </button>
    </div>
  );
}
