'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SiteQuestionnaire from './SiteQuestionnaire';
import { buildSiteDescriptionFromQuestionnaire, buildDefaultBrief, focusFromAnswers, type QuestionnaireAnswers } from './brief-helpers';
import { getSiteEditorDataAction, applyAIEdit } from './actions';
import { applyDemoStyle } from './explore/actions';

/**
 * Point d'entrée unique de création : ouvre le questionnaire (Mandat 2) puis lance la
 * génération. Deux chemins convergent ici :
 *   - création directe (bouton « Créer mon site ») → génération depuis le profil ;
 *   - depuis l'explorateur (?create=<demoId>) → applique d'abord le style du template.
 * Dans les deux cas : questionnaire AVANT génération, puis affinage IA de la description,
 * puis redirection vers l'éditeur (avec focus photos/offres selon Q1/Q2).
 */
export default function CreateSiteEntry({
  aiEnabled,
  specialty,
  tone,
  city,
  autoOpenDemoId,
}: {
  aiEnabled: boolean;
  specialty?: string | null;
  tone?: string | null;
  city?: string | null;
  autoOpenDemoId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const demoIdRef = useRef<string | undefined>(autoOpenDemoId);

  // Arrivée depuis l'explorateur (« Utiliser ce style ») → ouvre le questionnaire avec ce style.
  useEffect(() => {
    if (autoOpenDemoId) {
      demoIdRef.current = autoOpenDemoId;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- "open on URL param" pattern; intentional one-time trigger
      setOpen(true);
    }
  }, [autoOpenDemoId]);

  async function onCreate(answers: QuestionnaireAnswers) {
    setLoading(true);
    try {
      // 1. Base : style du template choisi (explorateur) sinon génération depuis le profil.
      const demoId = demoIdRef.current;
      let ok = false;
      if (demoId) {
        const r = await applyDemoStyle(demoId);
        ok = r.ok;
        if (!ok) toast.error(r.error || 'Création impossible.');
      } else {
        const res = await fetch('/api/websites/generate', { method: 'POST' });
        ok = res.ok;
        if (!ok) {
          const d = await res.json().catch(() => ({}));
          toast.error(d.error || 'Création impossible.');
        }
      }
      if (!ok) {
        setLoading(false);
        return;
      }

      // 2. Description : réponses assemblées, fallback profil si trop courte (jamais bloquant).
      let description = buildSiteDescriptionFromQuestionnaire(answers);
      if (description.length < 10) description = buildDefaultBrief({ specialty, tone, city });

      // 3. Affinage IA (best effort — ne bloque jamais).
      if (aiEnabled) {
        const ed = await getSiteEditorDataAction();
        if (ed.ok && ed.data) {
          const ai = await applyAIEdit(description, ed.data.content);
          if (!ai.ok) toast(ai.error || 'Site créé — affine-le dans l’éditeur.', { icon: 'ℹ️' });
        }
      }

      // 4. Éditeur, avec ouverture ciblée (photos / offres) selon Q1/Q2.
      const focus = focusFromAnswers(answers);
      toast.success('Site créé ✦ Personnalise-le maintenant.');
      router.push(`/dashboard/website/editor${focus ? `?focus=${focus}` : ''}`);
    } catch {
      toast.error('Erreur réseau.');
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="gradient"
        onClick={() => {
          demoIdRef.current = undefined; // création directe → pas de style imposé
          setOpen(true);
        }}
      >
        <Pencil className="h-4 w-4" /> Créer mon site →
      </Button>
      <SiteQuestionnaire
        open={open}
        onClose={() => !loading && setOpen(false)}
        profileTone={tone}
        specialty={specialty}
        loading={loading}
        onCreate={onCreate}
      />
    </>
  );
}
