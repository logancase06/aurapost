'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ANNUAL_DISCOUNT } from '@/lib/plans';
import type { PlanId } from '@/lib/plans';

export default function UpgradeButton({ plan, current, featured }: { plan: PlanId; current: boolean; featured?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [annual, setAnnual] = useState(true);

  async function upgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, annual }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mocked) {
        toast(data.message || 'Paiement bientôt disponible.', { icon: 'ℹ️' });
        return;
      }
      toast.error(data.error || 'Action impossible.');
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  if (current) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        <Check className="h-4 w-4" /> Plan actuel
      </Button>
    );
  }

  const discount = Math.round(ANNUAL_DISCOUNT * 100);

  return (
    <div className="space-y-2">
      {/* Toggle mensuel / annuel */}
      <div className="flex items-center justify-center rounded-full border border-border bg-secondary p-0.5 text-xs font-semibold">
        <button
          onClick={() => setAnnual(false)}
          className={cn('flex-1 rounded-full px-3 py-1 transition-colors', !annual ? 'bg-card shadow text-foreground' : 'text-muted-foreground')}
        >
          Mensuel
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={cn('flex-1 rounded-full px-3 py-1 transition-colors', annual ? 'bg-card shadow text-foreground' : 'text-muted-foreground')}
        >
          Annuel <span className="text-success">-{discount}%</span>
        </button>
      </div>
      <Button onClick={upgrade} disabled={loading} variant={featured ? 'gradient' : 'outline'} className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Choisir ce plan
      </Button>
    </div>
  );
}
