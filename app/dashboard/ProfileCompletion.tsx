import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CompletionResult } from '@/lib/completion';

// Badge de richesse du profil : plus il est complet, meilleur est le contenu généré.
// Affiché dans le dashboard ET réutilisable dans l'onboarding (résumé final).
export default function ProfileCompletion({
  data,
  href = '/onboarding',
  className,
}: {
  data: CompletionResult;
  /** Lien d'action pour compléter (onboarding par défaut). */
  href?: string;
  className?: string;
}) {
  const complete = data.score >= 100;
  const missing = data.items.filter((it) => !it.done);

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" />
          {complete ? 'Profil complété à 100% ✦' : `Profil complété à ${data.score}%`}
        </h2>
        {!complete && (
          <Link href={href} className="shrink-0 text-xs font-semibold text-primary hover:underline">
            Compléter →
          </Link>
        )}
      </div>

      <Progress value={data.score} className="mt-3" />

      {complete ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Ton profil est riche — on génère le meilleur contenu possible dans ta voix.
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Pour un meilleur contenu, ajoute :</p>
          <ul className="mt-2 space-y-1.5">
            {missing.map((it) => (
              <li key={it.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border" />
                  {it.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-primary">+{it.points}%</span>
              </li>
            ))}
          </ul>
          {data.items.some((it) => it.done) && (
            <ul className="mt-3 space-y-1 border-t border-border pt-3">
              {data.items
                .filter((it) => it.done)
                .map((it) => (
                  <li key={it.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success" />
                    {it.label}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
