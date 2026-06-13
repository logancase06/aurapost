import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, BookOpen } from 'lucide-react';
import SupportForm from './SupportForm';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Une question, un souci ? L’équipe AuraPost te répond.',
};

export default function SupportPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <LifeBuoy className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">Une question, un bug, une idée ? Écris-nous.</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card/60 p-4 text-sm">
        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Beaucoup de réponses se trouvent déjà dans le{' '}
          <Link href="/help" className="font-semibold text-primary hover:underline">
            centre d’aide
          </Link>
          .
        </span>
      </div>

      <div className="mt-6">
        <SupportForm />
      </div>
    </main>
  );
}
