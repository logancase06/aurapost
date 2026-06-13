import type { Metadata } from 'next';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import BadgeEmbed from './BadgeEmbed';

export const metadata: Metadata = {
  title: 'Badge « Certifié AuraPost »',
  description: 'Affiche le badge Certifié AuraPost sur ton site pour montrer que ton contenu est piloté par AuraPost.',
  alternates: { canonical: '/badge' },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export default function BadgePage() {
  const embedHtml = `<a href="${APP_URL}" target="_blank" rel="noopener">\n  <img src="${APP_URL}/badge-aurapost.svg" alt="Certifié AuraPost" width="200" height="48" />\n</a>`;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <BadgeCheck className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Badge Certifié AuraPost</h1>
          <p className="text-sm text-muted-foreground">Montre à tes prospects que ton contenu est au niveau.</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center rounded-lg border border-border bg-card p-12">
        <Image src="/badge-aurapost.svg" alt="Certifié AuraPost" width={200} height={48} unoptimized priority />
      </div>

      <h2 className="mt-10 text-lg font-bold">Ajoute-le à ton site</h2>
      <p className="mt-1 text-sm text-muted-foreground">Copie ce code et colle-le dans le footer de ton site.</p>
      <BadgeEmbed code={embedHtml} />
    </main>
  );
}
