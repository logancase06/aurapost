'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebsiteActions({ exists }: { exists: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    try {
      const res = await fetch('/api/websites/create', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Activation impossible.');
        return;
      }
      toast.success('Votre site est en ligne 🌐');
      router.refresh();
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={activate} disabled={loading} variant="gradient" size="lg">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
      {exists ? 'Republier mon site' : 'Générer et activer mon site'}
    </Button>
  );
}
