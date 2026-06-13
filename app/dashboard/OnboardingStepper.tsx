import Link from 'next/link';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { OnboardingProgress } from '@/lib/db/onboarding';

const STEPS = [
  { key: 'profile', label: 'Profil', href: '/onboarding' },
  { key: 'generation', label: 'Génération', href: '/dashboard' },
  { key: 'site', label: 'Site', href: '/dashboard/website' },
  { key: 'subscription', label: 'Abonnement', href: '/dashboard/billing' },
] as const;

export default function OnboardingStepper({ progress }: { progress: OnboardingProgress }) {
  if (progress.complete) return null;
  const pct = Math.round((progress.completedCount / progress.total) * 100);

  return (
    <Card className="mt-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Finalisez votre installation</h2>
        <span className="text-xs font-medium text-primary">
          {progress.completedCount}/{progress.total} étapes
        </span>
      </div>

      <Progress value={pct} className="mt-3" />

      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STEPS.map((step, i) => {
          const done = progress[step.key];
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 transition-all duration-200',
                  done ? 'border-success/30 bg-success/10' : 'border-border hover:border-primary/40'
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    done ? 'bg-success text-white' : 'bg-primary/15 text-primary'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn('text-sm font-medium', done ? 'text-success' : 'text-muted-foreground')}>{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
