import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

function color(s: number): string {
  return s >= 70 ? 'hsl(142 71% 45%)' : s >= 50 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)';
}

/** Carte « Analyse de profil » du dashboard : score actuel ou CTA, + nudge si > 30 j. */
export default function AnalyzeCard({
  instagram,
  staleDays,
}: {
  instagram: { score: number; date: string } | null;
  staleDays: number | null;
}) {
  if (!instagram) {
    return (
      <Card className="mt-6 flex flex-wrap items-center gap-4 border-primary/30 bg-primary/5 p-5">
        <Sparkles className="h-6 w-6 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Analyse ta présence Instagram</p>
          <p className="text-sm text-muted-foreground">Obtiens un score et 3 actions concrètes pour gagner en visibilité.</p>
        </div>
        <Link href="/dashboard/analyze" className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-bold text-white">
          Analyser <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-black" style={{ color: color(instagram.score), background: `${color(instagram.score)}1a` }}>
        {instagram.score}
      </div>
      <div className="flex-1">
        <p className="font-semibold">Score Instagram : {instagram.score}/100</p>
        <p className="text-sm text-muted-foreground">
          {staleDays !== null && staleDays > 30
            ? 'Ton profil a peut-être changé — relance une analyse.'
            : 'Consulte tes recommandations personnalisées.'}
        </p>
      </div>
      <Link href="/dashboard/analyze" className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
        Voir l’analyse <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
