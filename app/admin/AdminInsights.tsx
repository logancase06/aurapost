'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { TrendingUp, Clock, Send, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sendReengagementAction, toggleTicketAction } from './actions';
import type { BusinessMetrics, InactiveCoach, SupportTicketRow } from '@/lib/db/admin';

export default function AdminInsights({
  metrics,
  inactive,
  tickets,
}: {
  metrics: BusinessMetrics;
  inactive: InactiveCoach[];
  tickets: SupportTicketRow[];
}) {
  const [pending, startTransition] = useTransition();
  const maxMrr = Math.max(...metrics.mrrSeries.map((m) => m.mrr), 1);
  const maxHeat = Math.max(...metrics.heatmap, 1);

  function relance(tenantId: string) {
    startTransition(async () => {
      const res = await sendReengagementAction(tenantId);
      if (res.ok) toast.success('Relance envoyée ✦');
      else toast.error(res.error || 'Action impossible');
    });
  }

  function toggleTicket(id: string, next: 'open' | 'closed') {
    startTransition(async () => {
      const res = await toggleTicketAction(id, next);
      if (res.ok) toast.success(next === 'closed' ? 'Ticket fermé' : 'Ticket rouvert');
    });
  }

  const kpis = [
    { label: 'Taux d’approbation', value: `${metrics.approvalRate}%`, icon: CheckCircle2 },
    { label: 'Conversion démo → inscription', value: `${metrics.demoConversion}%`, icon: TrendingUp },
    { label: 'NPS', value: `+${metrics.nps}`, icon: TrendingUp },
  ];

  return (
    <div className="mt-10 space-y-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
              <k.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-black">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* MRR */}
        <Card className="p-6">
          <h3 className="flex items-center gap-2 font-bold">
            <TrendingUp className="h-4 w-4 text-primary" /> Croissance du MRR (simulée)
          </h3>
          <div className="mt-6 flex items-end gap-1.5" style={{ height: 160 }}>
            {metrics.mrrSeries.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: 130 }}>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-primary to-accent"
                    style={{ height: `${(m.mrr / maxMrr) * 100}%` }}
                    title={`${m.mrr} €`}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Heatmap horaire */}
        <Card className="p-6">
          <h3 className="flex items-center gap-2 font-bold">
            <Clock className="h-4 w-4 text-primary" /> Générations par heure
          </h3>
          <div className="mt-6 grid grid-cols-12 gap-1">
            {metrics.heatmap.map((v, h) => (
              <div
                key={h}
                className="aspect-square rounded-sm"
                title={`${h}h — ${v} génération(s)`}
                style={{ background: v === 0 ? 'hsl(var(--secondary))' : `hsl(262 83% 58% / ${0.2 + (v / maxHeat) * 0.8})` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">0h → 23h · plus c’est violet, plus il y a de générations.</p>
        </Card>
      </div>

      {/* Coachs inactifs */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /> Coachs inactifs (14+ jours)
          </h3>
          <Button asChild size="sm" variant="outline">
            <a href="/api/admin/coaches.csv">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
        </div>
        {inactive.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucun coach inactif. 🎉</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {inactive.map((c) => (
              <div key={c.tenantId} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.email} · {c.daysInactive > 900 ? 'jamais actif' : `${c.daysInactive} j`}</p>
                </div>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => relance(c.tenantId)}>
                  <Send className="h-3.5 w-3.5" /> Envoyer relance
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tickets support */}
      <Card className="p-6">
        <h3 className="font-bold">Tickets de support</h3>
        {tickets.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Aucun ticket pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className={cn('rounded-md border border-border p-4', t.status === 'closed' && 'opacity-60')}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{t.subject}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'open' ? 'warning' : 'secondary'}>{t.status === 'open' ? 'Ouvert' : 'Fermé'}</Badge>
                    <button
                      onClick={() => toggleTicket(t.id, t.status === 'open' ? 'closed' : 'open')}
                      className="text-xs font-medium text-primary hover:underline"
                      disabled={pending}
                    >
                      {t.status === 'open' ? 'Fermer' : 'Rouvrir'}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.name} · {t.email}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
