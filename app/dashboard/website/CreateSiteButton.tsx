'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Crée le site (génération IA depuis le profil) puis ouvre l'éditeur. */
export default function CreateSiteButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch('/api/websites/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Création impossible.');
        setLoading(false);
        return;
      }
      toast.success('Site créé ✦ Personnalise-le maintenant.');
      router.push('/dashboard/website/editor');
    } catch {
      toast.error('Erreur réseau.');
      setLoading(false);
    }
  }

  return (
    <Button onClick={create} disabled={loading} variant="gradient" size="lg">
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
      {loading ? 'Création de ton site…' : 'Créer mon site avec ce style →'}
    </Button>
  );
}
