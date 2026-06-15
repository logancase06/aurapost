import { Card } from '@/components/ui/card';
import type { LaunchMetrics as LaunchMetricsData } from '@/lib/db/admin';

/** Métriques de lancement enrichies (serveur — aucune interactivité, pas de 'use client'). */
export default function LaunchMetrics({ data }: { data: LaunchMetricsData }) {
  return (
    <section className="mt-10 space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Métriques de lancement</h2>
        <span className="text-xs text-muted-foreground">maj {new Date(data.generatedAt).toLocaleTimeString('fr-FR')} · cache 5 min</span>
      </div>
      {data.sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {section.items.map((item) => (
              <Card key={item.label} className="p-4">
                <div className="truncate text-2xl font-extrabold sm:text-3xl" title={item.value}>{item.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                {item.hint && <div className="mt-0.5 text-xs text-muted-foreground/70">{item.hint}</div>}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
