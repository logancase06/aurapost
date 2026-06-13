import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowUpRight, Users } from 'lucide-react';
import { listActiveCoaches } from '@/lib/db/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Les coachs AuraPost',
  description:
    'Découvrez les coachs sportifs qui utilisent AuraPost : leur spécialité, leur ville et leur site vitrine. Rejoignez la communauté.',
  alternates: { canonical: '/coaches' },
  openGraph: { title: 'Les coachs AuraPost', description: 'La galerie publique des coachs AuraPost.', type: 'website' },
};

export default async function CoachesPage() {
  const coaches = await listActiveCoaches();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <header className="mb-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← AuraPost
        </Link>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-tighter sm:text-6xl">Nos coachs</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Ils font confiance à AuraPost pour leur contenu et leur site vitrine. Et vous ?
        </p>
      </header>

      {coaches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-bold">Les premiers coachs arrivent bientôt.</p>
          <p className="mt-1 text-muted-foreground">Soyez l’un des pionniers de la communauté AuraPost.</p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white"
          >
            Créer mon site
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <Link
              key={c.subdomain}
              href={`/site/${c.subdomain}`}
              className="hover-lift group overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative h-40 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, #111118, ${c.themeColor}55)` }}>
                {c.photoUrl ? (
                  <Image src={c.photoUrl} alt={c.displayName} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-black text-white/20">
                    {c.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="flex items-center justify-between text-lg font-black tracking-tight">
                  {c.displayName}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </h2>
                <p className="mt-1 text-sm text-primary">{c.speciality}</p>
                {c.city && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.city}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
