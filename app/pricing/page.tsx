import Link from 'next/link';
import type { Metadata } from 'next';
import { PLANS, formatPrice } from '@/lib/plans';
import { Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Les offres AuraPost pour automatiser votre contenu social de coach sportif.',
};

export default function PricingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AuraPost
          </Link>
          <Button asChild size="sm" variant="gradient">
            <Link href="/register">Commencer</Link>
          </Button>
        </div>
      </header>

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <div className="aura-glow absolute inset-0" aria-hidden />
        <div className="relative text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Tarifs</h1>
          <p className="mt-3 text-muted-foreground">Prix définitifs bientôt annoncés. Démarrez gratuitement dès aujourd&apos;hui.</p>
        </div>

        <div className="relative mt-12 grid gap-6 sm:grid-cols-2">
          {PLANS.map((plan, i) => {
            const featured = i === 1;
            return (
              <Card key={plan.id} className={featured ? 'relative border-primary/60 bg-card p-8 shadow-lg shadow-primary/10' : 'bg-card/60 p-8'}>
                {featured && (
                  <Badge className="absolute -top-3 left-8 bg-gradient-to-r from-primary to-accent text-white">Recommandé</Badge>
                )}
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-2 text-3xl font-extrabold">{formatPrice(plan)}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={featured ? 'gradient' : 'outline'}>
                  <Link href="/register">Commencer</Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
