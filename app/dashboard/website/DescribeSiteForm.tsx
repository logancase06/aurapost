'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSiteEditorDataAction, applyAIEdit } from './actions';

const PLACEHOLDER =
  'Ex. : « Je veux quelque chose de sérieux et sobre, qui met en avant mon parcours et mes tarifs (60 €/séance, forfait 5 séances à 270 €). »';

/**
 * Création de site SANS exemple : le coach décrit en quelques mots ce qu'il veut.
 * On génère d'abord la base depuis son profil (toujours), puis si l'IA est dispo et
 * qu'une description est saisie, on l'applique (réécriture ciblée). Dégradation propre
 * si l'IA n'est pas configurée : le site est quand même créé, à affiner dans l'éditeur.
 */
export default function DescribeSiteForm({ aiEnabled }: { aiEnabled: boolean }) {
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

      // 2. Affinage selon la description (best effort, ne bloque jamais la création).
      const instruction = brief.trim();
      if (instruction) {
        if (aiEnabled) {
          const ed = await getSiteEditorDataAction();
          if (ed.ok && ed.data) {
            const ai = await applyAIEdit(instruction, ed.data.content);
            if (!ai.ok) toast(ai.error || 'Site créé — affine-le dans l’éditeur.', { icon: 'ℹ️' });
          }
        } else {
          toast('Site créé depuis ton profil. Reprends ta description dans l’éditeur (IA bientôt active).', { icon: 'ℹ️' });
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
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={4}
        maxLength={500}
        disabled={loading}
        placeholder={PLACEHOLDER}
        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{brief.length}/500 · optionnel</span>
        <Button onClick={create} disabled={loading} variant="gradient">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Création…' : 'Générer mon site'}
        </Button>
      </div>
      {!aiEnabled && (
        <p className="text-[10px] text-muted-foreground">
          La génération depuis ton profil fonctionne déjà. L’affinage par IA selon ta description nécessite la clé Anthropic.
        </p>
      )}
    </div>
  );
}
