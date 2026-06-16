'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Building2, Palette, Users, FileCheck2, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrgAction, saveBrandKitAction, addTemplateAction } from '@/app/dashboard/org/actions';

const area = 'flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const STEPS = ['Organisation', 'Brand kit', 'Distributeurs', 'Templates'];

export default function AgencyOnboarding({ hasOrg, orgName, orgSlug }: { hasOrg: boolean; orgName: string | null; orgSlug: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Si l'org existe déjà, on démarre à l'étape 2 (brand kit).
  const [step, setStep] = useState(hasOrg ? 1 : 0);

  // Étape 1 — organisation
  const [name, setName] = useState(orgName ?? '');
  function createOrg() {
    start(async () => {
      const res = await createOrgAction(name);
      if (res.ok) {
        toast.success('Organisation créée');
        router.refresh();
        setStep(1);
      } else toast.error(res.error || 'Action impossible');
    });
  }

  // Étape 2 — brand kit
  const [bk, setBk] = useState({ primaryColor: '#7c3aed', secondaryColor: '#a855f7', toneGuidelines: '', forbiddenWords: 'revenus, gagner de l’argent, liberté financière, devenir riche' });
  function saveBrand() {
    start(async () => {
      const res = await saveBrandKitAction(bk);
      if (res.ok) { toast.success('Brand kit enregistré'); setStep(2); }
      else toast.error(res.error || 'Action impossible');
    });
  }

  // Étape 3 — import CSV distributeurs
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<{ created: number; linked: number; errors: number } | null>(null);
  function importCsv() {
    if (!orgSlug) { toast.error('Créez d’abord l’organisation.'); return; }
    start(async () => {
      try {
        const res = await fetch(`/api/organizations/${orgSlug}/import-members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setReport({ created: data.created, linked: data.linked, errors: data.errors?.length ?? 0 });
          toast.success(`${data.created} comptes créés`);
        } else toast.error(data.error || 'Import impossible');
      } catch {
        toast.error('Erreur réseau');
      }
    });
  }

  // Étape 4 — template
  const [tpl, setTpl] = useState({ name: '', category: '', content: '' });
  function addTpl(finish: boolean) {
    start(async () => {
      if (tpl.name && tpl.content) {
        const res = await addTemplateAction(tpl);
        if (!res.ok) { toast.error(res.error || 'Action impossible'); return; }
        toast.success('Template ajouté');
        setTpl({ name: '', category: '', content: '' });
      }
      if (finish) router.push('/dashboard/org');
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-tighter">Onboarding agence</h1>
      <p className="mt-1 text-sm text-muted-foreground">Configurez votre réseau en 4 étapes.</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
            <span className={`hidden text-xs sm:inline ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s}</span>
          </div>
        ))}
      </div>

      <Card className="mt-6 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-bold"><Building2 className="h-4 w-4 text-primary" /> Votre organisation</h2>
            <div className="space-y-1.5"><Label className="text-xs">Nom du réseau / de l’agence</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Herbalife France" /></div>
            <Button onClick={createOrg} disabled={pending || name.trim().length < 2} variant="gradient">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Créer &amp; continuer</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-bold"><Palette className="h-4 w-4 text-primary" /> Brand kit</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">Couleur principale</Label><Input type="color" value={bk.primaryColor} onChange={(e) => setBk({ ...bk, primaryColor: e.target.value })} className="h-10 w-20 p-1" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Couleur secondaire</Label><Input type="color" value={bk.secondaryColor} onChange={(e) => setBk({ ...bk, secondaryColor: e.target.value })} className="h-10 w-20 p-1" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Consignes de ton</Label><textarea rows={2} className={area} value={bk.toneGuidelines} onChange={(e) => setBk({ ...bk, toneGuidelines: e.target.value })} placeholder="Ex : motivant, bienveillant, jamais agressif." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Mots interdits (conformité)</Label><textarea rows={2} className={area} value={bk.forbiddenWords} onChange={(e) => setBk({ ...bk, forbiddenWords: e.target.value })} /></div>
            <Button onClick={saveBrand} disabled={pending} variant="gradient">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer &amp; continuer</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-primary" /> Importer vos distributeurs</h2>
            <p className="text-xs text-muted-foreground">Une ligne par distributeur : <code>email, prénom, nom, ville, spécialité</code>. En-tête optionnel.</p>
            <textarea rows={6} className={area} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'marie@email.com, Marie, Lefebvre, Lyon, Nutrition\nkarim@email.com, Karim, Saïdi, Marseille, Bien-être'} />
            <div className="flex items-center gap-3">
              <Button onClick={importCsv} disabled={pending || !csv.trim()} variant="gradient">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Importer</Button>
              <Button onClick={() => setStep(3)} variant="ghost">Passer →</Button>
            </div>
            {report && (
              <p className="flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> {report.created} comptes créés, {report.linked} rattachés{report.errors ? `, ${report.errors} erreurs` : ''}.</p>
            )}
            {report && <Button onClick={() => setStep(3)} variant="outline">Continuer →</Button>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 font-bold"><FileCheck2 className="h-4 w-4 text-primary" /> Un template validé (optionnel)</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">Nom</Label><Input value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} placeholder="Témoignage produit" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Catégorie</Label><Input value={tpl.category} onChange={(e) => setTpl({ ...tpl, category: e.target.value })} placeholder="Preuve sociale" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Contenu / consigne</Label><textarea rows={3} className={area} value={tpl.content} onChange={(e) => setTpl({ ...tpl, content: e.target.value })} placeholder="Structure validée : accroche, bénéfice, témoignage, CTA." /></div>
            <div className="flex items-center gap-3">
              <Button onClick={() => addTpl(false)} disabled={pending} variant="outline">Ajouter</Button>
              <Button onClick={() => addTpl(true)} disabled={pending} variant="gradient">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Terminer →</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
