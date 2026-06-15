import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, CircleDashed, Activity, AlertTriangle } from 'lucide-react';
import { getIntegrationStatuses, getIntegrationsSummary } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'État du service',
  description: 'État en temps réel des intégrations AuraPost.',
  robots: { index: false, follow: false },
};

/**
 * Page publique /status — affiche l'état de chaque intégration (live/mock) sans
 * jamais exposer la moindre clé. « mock » = mode démonstration fonctionnel, pas une panne.
 */
export default function StatusPage() {
  const integrations = getIntegrationStatuses();
  const summary = getIntegrationsSummary();
  // Alerte rouge : production tournant sur une base en mémoire (perte de données).
  const prodMock = process.env.NODE_ENV === 'production' && !process.env.TURSO_DATABASE_URL;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      {prodMock && (
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">⚠ Mode dégradé en production</p>
            <p className="text-sm">La base de données n’est pas configurée (TURSO_DATABASE_URL absente). Les données ne sont pas persistées. Action requise immédiatement.</p>
          </div>
        </div>
      )}
      <div className="mb-10 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Activity className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">État du service</h1>
          <p className="text-sm text-muted-foreground">
            {summary.allLive
              ? 'Toutes les intégrations sont en mode production.'
              : `${summary.live}/${summary.total} intégrations en mode production · ${summary.mock} en démonstration.`}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {integrations.map((it) => {
          const live = it.mode === 'live';
          return (
            <li
              key={it.key}
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start gap-3">
                {live ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--success))]" />
                ) : (
                  <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warning))]" />
                )}
                <div>
                  <p className="font-bold">{it.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{it.detail}</p>
                </div>
              </div>
              <span
                className={
                  'shrink-0 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-widest ' +
                  (live
                    ? 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]'
                    : 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]')
                }
              >
                {live ? 'Live' : 'Démo'}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Données rafraîchies à chaque chargement · aucune clé n’est exposée ·{' '}
        <Link href="/" className="text-primary hover:underline">
          Retour à l’accueil
        </Link>
      </p>
    </main>
  );
}
