'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Camera, Briefcase, Globe, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TypewriterEffect } from '@/components/ui/typewriter-effect';
import { BorderBeam } from '@/components/ui/border-beam';
import { MovingBorderCard } from '@/components/ui/moving-border';
import { ScrollReveal } from '@/components/ui/motion-primitives';
import { BetaBadge } from '@/components/ui/decor';
import { useIsDesktop } from '@/lib/hooks/use-media-query';
import { PLANS, formatPrice } from '@/lib/plans';
import { HERO_VARIANTS, type HeroCopy } from '@/lib/ab';
import { unsplash, FITNESS_PHOTO_IDS } from '@/lib/stock-images';
import TrustWidget from './TrustWidget';
import HeroDashboard from './HeroDashboard';
import InstagramGridBackground from './InstagramGridBackground';

// Effets lourds chargés en dynamic import (bundle initial allégé), désactivés sur mobile.
const Particles = dynamic(() => import('@/components/ui/particles').then((m) => m.Particles), { ssr: false });
const Meteors = dynamic(() => import('@/components/ui/meteors').then((m) => m.Meteors), { ssr: false });
// Sections de conversion — dynamic import (sous la ligne de flottaison).
const HowItWorks = dynamic(() => import('./HowItWorks'));
const BentoFeatures = dynamic(() => import('./BentoFeatures'));
const BeforeAfter = dynamic(() => import('./BeforeAfter'));
const StaggerTestimonials = dynamic(() => import('./StaggerTestimonials'));
const Testimonials = dynamic(() => import('./Testimonials'));
const LiveGenerator = dynamic(() => import('./LiveGenerator'));
const ExitIntent = dynamic(() => import('./ExitIntent'), { ssr: false });

const FEATURES = [
  { icon: Camera, title: '8 posts Instagram', desc: 'Légendes, hashtags et hooks calibrés sur ta spécialité et ton ton.', n: '01', img: unsplash(FITNESS_PHOTO_IDS[1], 600, 400) },
  { icon: Briefcase, title: '4 posts LinkedIn', desc: 'Du contenu d’autorité pour asseoir ta crédibilité de coach.', n: '02', img: unsplash(FITNESS_PHOTO_IDS[11], 600, 400) },
  { icon: Globe, title: 'Ton site, loué', desc: 'Une vitrine sur-mesure sur ton sous-domaine, rédigée par l’IA.', n: '03', img: unsplash(FITNESS_PHOTO_IDS[5], 600, 400) },
];

export default function LandingClient({ heroCopy = HERO_VARIANTS.a }: { heroCopy?: HeroCopy }) {
  const isDesktop = useIsDesktop();

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2 text-lg font-black tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent transition-transform duration-150 group-hover:rotate-12 group-hover:scale-110">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AuraPost
            <BetaBadge />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/demo">Démo</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <ShimmerButton onClick={() => (window.location.href = '/register')} className="h-9 px-4 text-xs">
              Commencer
            </ShimmerButton>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden py-16">
        <InstagramGridBackground />
        <span className="section-number pointer-events-none absolute -right-4 top-6 select-none md:right-6">N°1</span>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Colonne texte */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Contenu social piloté par IA
            </div>

            <h1 className="landing-display text-6xl font-black uppercase leading-[0.92] tracking-tighter sm:text-7xl md:text-8xl">
              {heroCopy.line1}
              <br />
              <span className="text-primary">{heroCopy.line2}</span>
            </h1>

            <div className="mt-6 flex justify-center lg:justify-start">
              <TypewriterEffect
                className="text-xl font-bold sm:text-2xl"
                words={[
                  ...heroCopy.subtitle.text.split(' ').map((text) => ({ text })),
                  { text: heroCopy.subtitle.highlight, className: 'text-primary' },
                ]}
              />
            </div>

            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground lg:mx-0">
              AuraPost écrit tes posts Instagram &amp; LinkedIn de coach sportif et te loue un site vitrine — à partir de ton seul profil.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <ShimmerButton onClick={() => (window.location.href = '/register')} className="h-12 px-8 text-base">
                Créer mes 12 posts <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <Link href="/demo">Voir la démo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Sans carte bancaire · Un mois de contenu d’un coup</p>
            <div className="mt-6 flex justify-center lg:justify-start">
              <TrustWidget />
            </div>

            {/* Dashboard anime mobile — sous le texte, < lg uniquement */}
            <div className="mt-10 lg:hidden">
              <HeroDashboard />
            </div>
          </div>

          {/* Colonne mockup produit (MacBook) — desktop ≥ lg */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* Features — section diagonale */}
      <section className="clip-diagonal-top relative bg-card/40 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.1}>
                <div className="hover-lift group relative overflow-hidden rounded-lg border border-border bg-card">
                  <BorderBeam delay={i * 2} />
                  {/* Image de contexte (coach / posts / site) */}
                  <div className="relative h-40 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <span className="absolute right-3 top-2 text-6xl font-black text-white/10">{f.n}</span>
                    <div className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/90 backdrop-blur">
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="p-7 pt-5">
                    <h3 className="text-xl font-black uppercase tracking-tight">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <HowItWorks />

      {/* Aperçu complet des fonctionnalités (bento grid 21st.dev) */}
      <BentoFeatures />

      {/* Mini-générateur live (la section qui convertit) */}
      <LiveGenerator />

      {/* Avant / Après */}
      <BeforeAfter />

      {/* Témoignages statiques SEO-friendly (grille stagger 21st.dev) */}
      <StaggerTestimonials />

      {/* Témoignages défilants (marquee visuel) */}
      <Testimonials />

      {/* Pricing */}
      <section className="relative overflow-hidden py-28">
        {isDesktop && <Meteors number={14} />}
        <div className="mx-auto max-w-4xl px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Choisis ton arme</h2>
            <p className="mt-3 text-muted-foreground">Deux offres. Zéro friction. 14 jours gratuits, sans carte.</p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {PLANS.map((plan, i) => {
              const featured = i === 1;
              const inner = (
                <div className="flex h-full flex-col p-8">
                  {featured && (
                    <span className="mb-3 inline-flex w-fit rounded-md bg-gradient-to-r from-primary to-accent px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
                      Recommandé
                    </span>
                  )}
                  <h3 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-black">
                    {formatPrice(plan)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ mois</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {feat}
                      </li>
                    ))}
                  </ul>
                  {featured ? (
                    <ShimmerButton onClick={() => (window.location.href = '/register')} className="mt-8 w-full">
                      Démarrer maintenant
                    </ShimmerButton>
                  ) : (
                    <Button asChild variant="outline" className="mt-8 w-full">
                      <Link href="/register">Commencer</Link>
                    </Button>
                  )}
                </div>
              );
              return (
                <ScrollReveal key={plan.id} delay={i * 0.1}>
                  {featured ? (
                    <MovingBorderCard containerClassName="h-full" className="h-full">
                      {inner}
                    </MovingBorderCard>
                  ) : (
                    <div className="hover-lift h-full rounded-lg border border-border bg-card">{inner}</div>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — section diagonale */}
      <section className="clip-diagonal-top relative overflow-hidden bg-gradient-to-br from-primary to-accent py-24">
        {isDesktop && <Meteors number={10} className="bg-white before:from-white" />}
        <ScrollReveal className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">Arrête de procrastiner sur tes posts.</h2>
          <p className="mt-3 text-white/80">Essaie gratuitement pendant 14 jours. Sans carte bancaire.</p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="hover-lift bg-white text-primary hover:bg-white/90">
              <Link href="/register">
                Créer mon compte <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* Bandeau discret B2B — agences & réseaux. */}
      <div className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-sm text-muted-foreground">
          Vous êtes une agence ou un réseau de distributeurs ?{' '}
          <Link href="/agency-demo" className="font-semibold text-primary hover:underline">Découvrez AuraPost for Teams →</Link>
        </div>
      </div>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2 font-black uppercase tracking-tight text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> AuraPost
          </span>
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/pricing" className="hover:text-foreground">Tarifs</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <Link href="/coaches" className="hover:text-foreground">Coachs</Link>
            <Link href="/wall-of-love" className="hover:text-foreground">Avis</Link>
            <Link href="/vs/agence" className="hover:text-foreground">vs Agence</Link>
            <Link href="/vs/chatgpt" className="hover:text-foreground">vs ChatGPT</Link>
            <Link href="/affiliates" className="hover:text-foreground">Affiliés</Link>
            <Link href="/help" className="hover:text-foreground">Aide</Link>
            <Link href="/changelog" className="hover:text-foreground">Nouveautés</Link>
            <Link href="/status" className="hover:text-foreground">Statut</Link>
            <Link href="/privacy" className="hover:text-foreground">Confidentialité</Link>
            <Link href="/legal/sous-traitants" className="hover:text-foreground">Sous-traitants</Link>
            <Link href="/terms" className="hover:text-foreground">CGU</Link>
            <span>© {new Date().getFullYear()} AuraPost</span>
          </span>
        </div>
      </footer>

      <ExitIntent />
    </main>
  );
}
