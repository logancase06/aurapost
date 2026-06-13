import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCoachPortal } from '@/lib/db/public';
import { Sparkles, Globe, Camera, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCoachPortal(slug);
  if (!data) return { title: 'Coach introuvable' };
  return {
    title: `${data.displayName} — ${data.speciality}`,
    description: data.bio ?? `Découvrez l'activité de ${data.displayName}.`,
  };
}

export default async function CoachPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCoachPortal(slug);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border">
        <div className="aura-glow absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-3xl font-extrabold text-white">
            {data.displayName.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold">{data.displayName}</h1>
          <p className="mt-2 text-muted-foreground">
            {data.speciality}
            {data.city ? ` · ${data.city}` : ''}
          </p>
          {data.siteUrl && (
            <Button asChild variant="gradient" className="mt-6">
              <a href={data.siteUrl} target="_blank" rel="noreferrer">
                <Globe className="h-4 w-4" /> Visiter mon site
              </a>
            </Button>
          )}
        </div>
      </section>

      {data.bio && (
        <section className="mx-auto max-w-2xl px-6 py-10 text-center">
          <p className="text-lg leading-relaxed text-muted-foreground">{data.bio}</p>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold">Mes dernières publications</h2>
        {data.approvedPosts.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucune publication pour le moment.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {data.approvedPosts.map((p) => {
              const Icon = p.network === 'linkedin' ? Briefcase : Camera;
              return (
                <Card key={p.id} className="p-5">
                  <Badge variant={p.network === 'linkedin' ? 'secondary' : 'default'}>
                    <Icon className="h-3 w-3" /> {p.network}
                  </Badge>
                  {p.title && <h3 className="mt-3 font-bold">{p.title}</h3>}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.content}</p>
                  {p.hashtags.length > 0 && <p className="mt-3 text-sm text-primary">{p.hashtags.map((h) => `#${h}`).join(' ')}</p>}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Propulsé par AuraPost
        </span>
      </footer>
    </main>
  );
}
