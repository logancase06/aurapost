'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Sparkles, Camera, Briefcase, Check, TrendingUp, Eye, Users, FileText,
  ArrowRight, Lock, Globe, Star, MapPin,
} from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/motion-primitives';
import { ScrollReveal } from '@/components/ui/motion-primitives';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { BorderBeam } from '@/components/ui/border-beam';
import { Spotlight } from '@/components/ui/spotlight';
import { useIsDesktop } from '@/lib/hooks/use-media-query';
import type { DemoCoach, DemoPost } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

const NETS = [
  { key: 'instagram', label: 'Instagram', icon: Camera },
  { key: 'linkedin', label: 'LinkedIn', icon: Briefcase },
] as const;

function PostPreview({ post }: { post: DemoPost }) {
  const Icon = post.network === 'linkedin' ? Briefcase : Camera;
  return (
    <div className="hover-lift relative flex flex-col overflow-hidden rounded-lg border border-border bg-card p-5">
      {post.status === 'draft' && <BorderBeam duration={7} />}
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-xs font-bold capitalize">
          <Icon className="h-3 w-3" /> {post.network}
        </span>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-xs font-bold uppercase',
            post.status === 'approved'
              ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
              : 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]'
          )}
        >
          {post.status === 'approved' ? 'Approuvé' : 'À relire'}
        </span>
      </div>
      <h3 className="font-bold">{post.title}</h3>
      <p className="mt-0.5 text-xs font-medium text-primary/80">Thème : {post.theme}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{post.content}</p>
      {post.hashtags.length > 0 && (
        <p className="mt-3 text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
      )}
      <p className="mt-2 text-sm font-medium text-foreground/80">👉 {post.callToAction}</p>
    </div>
  );
}

export default function DemoShowcase({ coach }: { coach: DemoCoach }) {
  const isDesktop = useIsDesktop();
  const [net, setNet] = useState<'instagram' | 'linkedin'>('instagram');
  const posts = coach.posts.filter((p) => p.network === net);

  const stats = [
    { icon: FileText, label: 'Posts générés', value: coach.stats.posts, color: 'text-primary' },
    { icon: Check, label: 'Approuvés', value: coach.stats.approved, color: 'text-[hsl(var(--success))]' },
    { icon: Users, label: 'Abonnés gagnés', value: coach.stats.followersGain, color: 'text-accent', suffix: '+' },
    { icon: Eye, label: 'Visites du site', value: coach.stats.siteVisits, color: 'text-primary' },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      {/* Bandeau démo */}
      <div className="sticky top-0 z-40 border-b border-primary/30 bg-primary/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-bold text-primary">
            <Sparkles className="h-4 w-4" /> Démonstration AuraPost
          </span>
          <span className="hidden text-muted-foreground sm:inline">Aperçu personnalisé · lecture seule</span>
          <Link href="/register" className="rounded-md bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-bold text-white">
            Créer mon compte
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden py-16">
        {isDesktop && <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#7C3AED" />}
        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Voici ton futur AuraPost</p>
          <h1 className="mt-2 text-5xl font-black uppercase leading-[0.95] tracking-tighter sm:text-6xl md:text-7xl">
            {coach.displayName}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">{coach.speciality}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {coach.cities}
            </span>
          </p>
          <p className="mt-4 max-w-2xl text-muted-foreground">{coach.bio}</p>
        </div>
      </section>

      {/* Stats animées */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="hover-lift rounded-lg border border-border bg-card p-5">
              <s.icon className={cn('h-6 w-6', s.color)} />
              <p className="mt-3 text-4xl font-black tabular-nums">
                <AnimatedCounter value={s.value} />
                {s.suffix ?? ''}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Posts (lecture seule) */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Son contenu du mois</h2>
            <p className="text-sm text-muted-foreground">12 posts générés et calibrés sur son profil — relus en 20 minutes.</p>
          </div>
          <div className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
            {NETS.map((n) => (
              <button
                key={n.key}
                onClick={() => setNet(n.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors duration-150',
                  net === n.key ? 'bg-gradient-to-r from-primary to-accent text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostPreview key={p.id} post={p} />
          ))}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Aperçu en lecture seule — crée ton compte pour générer et modifier le tien.
        </p>
      </section>

      {/* Site loué */}
      <section className="clip-diagonal-top relative mt-20 bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <h2 className="text-3xl font-black uppercase tracking-tight">Son site vitrine, loué clé en main</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <Globe className="mr-1 inline h-4 w-4" />
              {coach.subdomain}.aurapost.fr — généré par l’IA à partir de son profil.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {coach.services.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.1}>
                <div className="hover-lift h-full rounded-lg border border-border bg-card p-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Service {i + 1}</span>
                  <h3 className="mt-2 text-xl font-black tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {coach.testimonials.map((t) => (
              <div key={t.name} className="rounded-lg border border-border bg-background p-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                  ))}
                </div>
                <p className="mt-2 text-sm text-foreground/90">“{t.quote}”</p>
                <p className="mt-3 text-sm font-bold">
                  {t.name} <span className="font-normal text-muted-foreground">· {t.city}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics mini */}
      <section className="mx-auto mt-20 max-w-6xl px-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Sa performance estimée</h2>
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <div className="flex items-end gap-2 sm:gap-4">
            {[35, 52, 48, 70, 66, 88, 95].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end" style={{ height: 160 }}>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-primary to-accent"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">S{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" /> Croissance régulière de l’engagement sur 7 semaines de publication.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="clip-diagonal-top relative mt-20 overflow-hidden bg-gradient-to-br from-primary to-accent py-24">
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">
            {coach.displayName.split(' ')[0]}, c’est ton tour.
          </h2>
          <p className="mt-3 text-white/85">Ce que tu viens de voir, tu l’as en 2 minutes, calibré sur ton vrai profil. Gratuit.</p>
          <div className="mt-8 flex justify-center">
            <ShimmerButton onClick={() => (window.location.href = '/register')} className="h-12 px-8 text-base">
              Créer mon compte gratuit <ArrowRight className="h-4 w-4" />
            </ShimmerButton>
          </div>
          <p className="mt-4 text-sm text-white/70">Sans carte bancaire · Un mois de contenu d’un coup</p>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-black uppercase tracking-tight text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> AuraPost
          </span>
          <Link href="/" className="hover:text-foreground">
            Découvrir AuraPost →
          </Link>
        </div>
      </footer>
    </main>
  );
}
