'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GuidedBrief from './GuidedBrief';
import { buildDefaultBrief } from './brief-helpers';
import { getSiteEditorDataAction, applyAIEdit } from './actions';

/**
 * Création de site SANS exemple : le coach décrit en quelques mots ce qu'il veut, guidé
 * par un placeholder contextuel (sa spécialité) et des chips de suggestions. On génère la
 * base depuis son profil (toujours), puis on applique sa description via l'IA si dispo.
 * Jamais bloquant : champ vide/trop court → description par défaut déduite du profil.
 */
export default function DescribeSiteForm({
  aiEnabled,
  specialty,
  tone,
  city,
}: {
  aiEnabled: boolean;
  specialty?: string | null;
  tone?: string | null;
  city?: string | null;
}) {
  const router = useRouter();
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      // 1. Base générée depuis le profil (mode mock si pas de clé IA — fonctionne quand même).
      const res = await fetch('/api/websites/generate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Création impossible.');
        setLoading(false);
        return;
      }

      // 2. Description : la saisie, sinon un défaut déduit du profil (jamais vide → jamais bloquant).
      let instruction = brief.trim();
      if (instruction.length < 10) {
        instruction = buildDefaultBrief({ specialty, tone, city });
        // Suivi (non exposé au coach) : on est parti sur le fallback profil.
        if (typeof console !== 'undefined') console.debug('[site-create] description vide → fallback profil');
      }

      // 3. Affinage IA (best effort, ne bloque jamais la création).
      if (aiEnabled) {
        const ed = await getSiteEditorDataAction();
        if (ed.ok && ed.data) {
          const ai = await applyAIEdit(instruction, ed.data.content);
          if (!ai.ok) toast(ai.error || 'Site créé — affine-le dans l’éditeur.', { icon: 'ℹ️' });
        }
      }

      toast.success('Site créé ✦ Personnalise-le maintenant.');
      router.push('/dashboard/website/editor');
    } catch {
      toast.error('Erreur réseau.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <GuidedBrief value={brief} onChange={setBrief} specialty={specialty} disabled={loading} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={create} disabled={loading} variant="gradient">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Création…' : 'Générer mon site'}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        On crée ton site avec ton profil + ta description — tu pourras tout modifier ensuite dans l’éditeur.
        {!aiEnabled && ' (L’affinage par IA nécessite la clé Anthropic ; la génération depuis ton profil fonctionne déjà.)'}
      </p>
    </div>
  );
}
