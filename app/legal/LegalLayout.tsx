import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** Paragraphe de bas de section (ex. renvoi vers une page dédiée). */
  footer?: string;
}

/** Mise en page partagée des pages légales (privacy, terms). */
export default function LegalLayout({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <Link href="/" className="flex items-center gap-2 text-sm font-black">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </span>
        AuraPost
      </Link>

      <h1 className="mt-8 text-4xl font-black uppercase tracking-tighter">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      <p className="mt-6 leading-relaxed text-foreground/90">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-black tracking-tight">
              {i + 1}. {s.heading}
            </h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="mt-2 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-3 space-y-1.5">
                {s.bullets.map((b, k) => (
                  <li key={k} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {b}
                  </li>
                ))}
              </ul>
            )}
            {s.footer && <p className="mt-3 text-sm text-muted-foreground">{s.footer}</p>}
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        Une question ? Écris-nous à{' '}
        <a href="mailto:contact@aurapost.fr" className="text-primary hover:underline">
          contact@aurapost.fr
        </a>
        .
      </p>
    </main>
  );
}
