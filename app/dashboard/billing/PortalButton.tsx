'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Ouvre le portail client Stripe (CB, factures, annulation). */
export default function PortalButton() {
  const [loading, setLoading] = useState(false);
  async function open() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        toast.error(data.error || 'Portail indisponible.');
        setLoading(false);
        return;
      }
      window.open(data.url, '_blank', 'noopener');
      setLoading(false);
    } catch {
      toast.error('Erreur réseau.');
      setLoading(false);
    }
  }
  return (
    <Button onClick={open} disabled={loading} variant="outline">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Gérer ma facturation
    </Button>
  );
}
