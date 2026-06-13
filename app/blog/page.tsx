import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { ARTICLES, readingTimeMinutes } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog — Conseils contenu pour coachs sportifs',
  description:
    'Stratégies de contenu, croissance Instagram et LinkedIn, études de cas : le blog AuraPost pour les coachs sportifs qui veulent être visibles.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog AuraPost — Conseils contenu pour coachs sportifs',
    description: 'Stratégies de contenu et croissance pour coachs sportifs.',
    type: 'website',
  },
};

export default function BlogIndex() {
  const sorted = [...ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16">
      <header className="mb-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← AuraPost
        </Link>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-tighter sm:text-6xl">Le blog</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Stratégies de contenu, croissance organique et études de cas pour coachs sportifs.
        </p>
      </header>

      <div className="space-y-5">
        {sorted.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="hover-lift group block overflow-hidden rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
              <span>{a.category}</span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" /> {readingTimeMinutes(a)} min
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight group-hover:text-primary">{a.title}</h2>
            <p className="mt-2 text-muted-foreground">{a.excerpt}</p>
            <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Lire l’article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
