import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShieldCheck, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getOrgBySlug, getBrandKit } from '@/lib/db/organizations';
import { mergeForbidden } from '@/lib/compliance';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  return { title: org ? `Politique de contenu — ${org.name}` : 'Politique de contenu' };
}

export default async function CompliancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const kit = await getBrandKit(org.id);
  const forbidden = mergeForbidden(kit?.forbiddenWords);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-widest">Conformité contenu</span></div>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{org.name}</h1>
      <p className="mt-2 text-muted-foreground">
        Règles de contenu appliquées automatiquement à chaque génération des distributeurs du réseau.
      </p>

      <Card className="mt-8 p-6">
        <h2 className="font-bold">Ton de marque</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {org.brandTone || kit?.toneGuidelines || 'Ton professionnel, bienveillant et conforme à l’image du réseau.'}
        </p>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="flex items-center gap-2 font-bold"><Ban className="h-4 w-4 text-destructive" /> Termes interdits</h2>
        <p className="mt-1 text-xs text-muted-foreground">Bloqués à la génération (inclut la liste légale anti-allégations de revenus).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {forbidden.map((w) => (
            <span key={w} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">{w}</span>
          ))}
        </div>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Chaque post généré est vérifié contre ces règles. Les contenus conformes affichent le badge « Conforme marque ✓ ».
      </p>
    </main>
  );
}
