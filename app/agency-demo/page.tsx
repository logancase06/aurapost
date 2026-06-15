import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, CheckCircle2, Clock, Send, Palette, FileCheck2, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AgencyLeadForm from '@/components/agency/AgencyLeadForm';

export const metadata: Metadata = {
  title: 'AuraPost for Teams — le contenu de vos distributeurs, automatisé',
  description:
    'Pour les réseaux, franchises et agences : générez le contenu Instagram & LinkedIn de tous vos distributeurs, dans votre charte, avec un reporting global.',
  alternates: { canonical: '/agency-demo' },
  openGraph: { title: 'AuraPost for Teams', description: 'Le contenu social de votre réseau, automatisé.', type: 'website' },
};

// Données d'EXEMPLE pour le mockup (clairement étiquetées — jamais présentées comme réelles).
const DEMO_DISTRIBUTORS = [
  { name: 'Marie Lefebvre', city: 'Lyon', status: 'published', posts: 12 },
  { name: 'Karim Saïdi', city: 'Marseille', status: 'generated', posts: 12 },
  { name: 'Élodie Bertin', city: 'Nantes', status: 'generated', posts: 8 },
  { name: 'Hugo Mercier', city: 'Lille', status: 'pending', posts: 0 },
  { name: 'Aïcha Koné', city: 'Toulouse', status: 'published', posts: 12 },
] as const;

const STATUS_LABEL: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  published: { label: 'Publié', variant: 'success' },
  generated: { label: 'Généré', variant: 'warning' },
  pending: { label: 'En attente', variant: 'secondary' },
};

export default function AgencyDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← AuraPost</Link>
          <Badge variant="outline" className="mt-6"><Building2 className="h-3 w-3" /> AuraPost for Teams</Badge>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-6xl">
            Le contenu de vos distributeurs, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">automatisé</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Réseaux, franchises, MLM : générez chaque mois le contenu Instagram &amp; LinkedIn de
            tous vos distributeurs — dans votre charte, conforme à votre marque, avec un reporting global.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#demande" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white">
              Demander une démo
            </a>
            <Link href="/agency-pricing" className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-semibold hover:bg-card">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Mockup dashboard agence */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight">Votre tableau de bord réseau</h2>
          <Badge variant="secondary">Aperçu — données d’exemple</Badge>
        </div>

        {/* Métriques agrégées (exemple) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Posts générés ce mois', value: '127' },
            { label: 'Taux d’approbation', value: '89 %' },
            { label: 'Distributeurs actifs', value: '4 / 5' },
            { label: 'Sites publiés', value: '2' },
          ].map((m) => (
            <Card key={m.label} className="p-4">
              <div className="text-3xl font-extrabold">{m.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
            </Card>
          ))}
        </div>

        {/* Liste distributeurs (exemple) */}
        <Card className="mt-6 overflow-hidden">
          <div className="divide-y divide-border">
            {DEMO_DISTRIBUTORS.map((d) => {
              const s = STATUS_LABEL[d.status];
              return (
                <div key={d.name} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {d.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.city} · {d.posts} posts</p>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Brand kit (exemple) */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-bold"><Palette className="h-4 w-4 text-primary" /> Brand kit imposé</h3>
            <p className="mt-2 text-sm text-muted-foreground">Logo, palette et ton hérités par chaque distributeur.</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent font-black text-white">M</div>
              <div className="flex gap-2">
                {['#7C3AED', '#A855F7', '#22C55E', '#0A0A0F'].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-md border border-border" style={{ background: c }} title={c} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Ton : motivant &amp; bienveillant · Mots interdits : « revenus », « liberté financière »</p>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-bold"><FileCheck2 className="h-4 w-4 text-primary" /> Templates validés marque</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {['Témoignage produit', 'Routine bien-être du jour', 'Invitation atelier découverte'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {t} <Badge variant="secondary" className="ml-auto">Conforme ✓</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-black uppercase tracking-tight">Comment ça marche pour votre réseau</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Palette, title: '1. Vous définissez la marque', desc: 'Logo, couleurs, ton, mots interdits, templates validés. Une seule fois, pour tout le réseau.' },
              { icon: Users, title: '2. On crée les comptes', desc: 'Import CSV de vos distributeurs → un espace prêt pour chacun, en un clic.' },
              { icon: Send, title: '3. Le contenu coule', desc: 'Chaque distributeur reçoit 12 posts/mois dans la charte. Vous suivez tout depuis le reporting global.' },
            ].map((s) => (
              <Card key={s.title} className="p-6">
                <s.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demande de démo */}
      <section id="demande" className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight">Demander une démo</h2>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> 20 minutes · adaptée à votre réseau · sous 24h
          </p>
        </div>
        <AgencyLeadForm />
      </section>
    </main>
  );
}
