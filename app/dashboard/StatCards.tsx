'use client';

import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/card-3d';
import { AnimatedCounter } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

const STATS = [
  { key: 'total', label: 'Générés ce mois', icon: FileText, tone: 'text-primary' },
  { key: 'approved', label: 'Approuvés', icon: CheckCircle2, tone: 'text-success' },
  { key: 'draft', label: 'En attente', icon: Clock, tone: 'text-warning' },
  { key: 'rejected', label: 'Rejetés', icon: XCircle, tone: 'text-destructive' },
] as const;

// Cards stats avec effet 3D au survol + compteur animé (0 → valeur).
export default function StatCards({ stats }: { stats: Record<'total' | 'approved' | 'draft' | 'rejected', number> }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((s) => (
        <CardContainer key={s.key} className="block">
          <CardBody className="w-full">
            <div className="hover-lift relative w-full overflow-hidden rounded-lg border border-border bg-card p-5">
              <CardItem translateZ={30} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={cn('h-4 w-4', s.tone)} />
              </CardItem>
              <CardItem translateZ={50}>
                <div className={cn('mt-2 text-4xl font-black tracking-tight', s.tone)}>
                  <AnimatedCounter value={stats[s.key]} />
                </div>
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>
      ))}
    </div>
  );
}
