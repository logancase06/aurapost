import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';
import { ARTICLES, getArticle, readingTimeMinutes } from '@/lib/blog';
import { safeJsonLd } from '@/lib/utils';
import ShareButtons from './ShareButtons';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aurapost.fr';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Article introuvable' };
  const url = `${APP_URL}/blog/${article.slug}`;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url,
      publishedTime: article.publishedAt,
      authors: [article.author],
      images: [{ url: `/blog/${article.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: article.title, description: article.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const minutes = readingTimeMinutes(article);
  const url = `${APP_URL}/blog/${article.slug}`;

  // JSON-LD Article (SEO / rich results).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { '@type': 'Organization', name: article.author },
    publisher: { '@type': 'Organization', name: 'AuraPost', url: APP_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: `${url}/opengraph-image`,
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Tous les articles
      </Link>

      <article className="mt-6">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-primary">
          <span>{article.category}</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> {minutes} min de lecture
          </span>
          <span className="text-muted-foreground">·</span>
          <time dateTime={article.publishedAt} className="text-muted-foreground">
            {new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
        </div>

        <h1 className="mt-4 text-4xl font-black uppercase leading-[1.05] tracking-tighter sm:text-5xl">{article.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>

        <div className="mt-8 space-y-8">
          {article.sections.map((s, i) => (
            <section key={i}>
              {s.heading && <h2 className="mb-3 text-2xl font-black tracking-tight">{s.heading}</h2>}
              {s.paragraphs.map((p, j) => (
                <p key={j} className="mb-3 leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-2 space-y-2">
                  {s.bullets.map((b, k) => (
                    <li key={k} className="flex items-start gap-2 text-foreground/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <ShareButtons url={url} title={article.title} />
      </article>

      <div className="mt-12 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-8 text-center">
        <h3 className="text-2xl font-black uppercase tracking-tight">Passez de la théorie à la pratique</h3>
        <p className="mt-2 text-muted-foreground">Générez un mois de contenu calibré sur votre spécialité, en 2 minutes.</p>
        <Link
          href="/register"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white"
        >
          Créer mes 12 posts
        </Link>
      </div>
    </main>
  );
}
