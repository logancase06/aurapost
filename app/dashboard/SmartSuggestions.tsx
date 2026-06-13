import { Lightbulb, TrendingUp } from 'lucide-react';
import type { SuggestionsResult } from '@/lib/db/suggestions';

/**
 * Carte « Suggestions intelligentes » : 3 thèmes à creuser, dérivés des posts
 * les plus approuvés. Rendue uniquement quand `available` est vrai (≥ 1 mois de recul).
 */
export default function SmartSuggestions({ data }: { data: SuggestionsResult }) {
  if (!data.available) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black uppercase tracking-tight">Suggestions pour le mois prochain</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        D’après vos posts les plus approuvés, voici 3 thèmes à creuser.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {data.suggestions.map((s, i) => (
          <div key={s.theme} className="relative rounded-md border border-border bg-card p-4">
            <span className="absolute right-3 top-2 text-4xl font-black text-white/[0.04]">{i + 1}</span>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> {s.theme}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.angle}</p>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              {s.approvedCount} post{s.approvedCount > 1 ? 's' : ''} approuvé{s.approvedCount > 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
