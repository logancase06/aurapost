'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, UserPlus, Palette, FileCheck2, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { inviteMemberAction, saveBrandKitAction, addTemplateAction, relanceInactiveAction, toggleApprovalAction } from './actions';
import { ShieldCheck } from 'lucide-react';
import type { OrgMemberStats, BrandKit, OrgTemplate } from '@/lib/db/organizations';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
function isInactive(lastActivity: string | null): boolean {
  return !lastActivity || Date.now() - new Date(lastActivity).getTime() > WEEK_MS;
}

interface Props {
  orgName: string;
  members: OrgMemberStats[];
  brandKit: BrandKit | null;
  templates: OrgTemplate[];
  requiresApproval: boolean;
  pendingApprovals: number;
}

const area = 'flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function OrgManager({ orgName, members, brandKit, templates, requiresApproval, pendingApprovals }: Props) {
  const [pending, start] = useTransition();
  const [approval, setApproval] = useState(requiresApproval);

  // Invite
  const [inv, setInv] = useState({ email: '', firstName: '', city: '', speciality: '' });
  function invite() {
    start(async () => {
      const res = await inviteMemberAction(inv);
      if (res.ok) {
        toast.success(res.created ? 'Distributeur invité ✦' : 'Distributeur rattaché');
        setInv({ email: '', firstName: '', city: '', speciality: '' });
      } else toast.error(res.error || 'Action impossible');
    });
  }

  // Brand kit
  const [bk, setBk] = useState({
    primaryColor: brandKit?.primaryColor ?? '#7c3aed',
    secondaryColor: brandKit?.secondaryColor ?? '#a855f7',
    toneGuidelines: brandKit?.toneGuidelines ?? '',
    forbiddenWords: (brandKit?.forbiddenWords ?? []).join(', '),
  });
  function saveBrand() {
    start(async () => {
      const res = await saveBrandKitAction(bk);
      if (res.ok) toast.success('Brand kit enregistré ✦');
      else toast.error(res.error || 'Action impossible');
    });
  }

  // Template
  const [tpl, setTpl] = useState({ name: '', category: '', content: '' });
  function addTpl() {
    start(async () => {
      const res = await addTemplateAction(tpl);
      if (res.ok) {
        toast.success('Template ajouté ✦');
        setTpl({ name: '', category: '', content: '' });
      } else toast.error(res.error || 'Action impossible');
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{orgName}</h1>
          <p className="text-sm text-muted-foreground">{members.length} distributeur(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/org/approvals">
              <ShieldCheck className="h-4 w-4" /> Validation
              {pendingApprovals > 0 && <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{pendingApprovals}</span>}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/org/reporting"><BarChart3 className="h-4 w-4" /> Reporting global</Link>
          </Button>
        </div>
      </div>

      {/* Conformité : validation obligatoire des posts */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-primary" /> Validation des posts</p>
          <p className="mt-1 text-sm text-muted-foreground">Si activé, chaque post d’un distributeur passe par votre validation avant publication.</p>
        </div>
        <Button
          variant={approval ? 'gradient' : 'outline'}
          size="sm"
          disabled={pending}
          onClick={() => start(async () => {
            const next = !approval;
            const res = await toggleApprovalAction(next);
            if (res.ok) { setApproval(next); toast.success(next ? 'Validation activée' : 'Validation désactivée'); }
            else toast.error(res.error || 'Action impossible');
          })}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {approval ? 'Activée' : 'Désactivée'}
        </Button>
      </Card>

      {/* Membres */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="font-bold">Distributeurs</span>
          {members.some((m) => isInactive(m.lastActivity)) && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => start(async () => {
                const res = await relanceInactiveAction();
                if (res.ok) toast.success(`${res.sent ?? 0} relance(s) envoyée(s)`);
                else toast.error(res.error || 'Action impossible');
              })}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Relancer les inactifs
            </Button>
          )}
        </div>
        {members.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aucun distributeur. Invitez-en un ci-dessous.</p>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.tenantId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}{m.city ? ` · ${m.city}` : ''}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{m.postsThisMonth} posts/mois</span>
                  <span>{m.approvalRate}% approuvés</span>
                  {isInactive(m.lastActivity) && <Badge variant="destructive">Inactif 7j+</Badge>}
                  <Badge variant={m.siteActive ? 'success' : 'secondary'}>{m.siteActive ? 'Site publié' : 'Pas de site'}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inviter */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold"><UserPlus className="h-4 w-4 text-primary" /> Inviter un distributeur</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs">Email *</Label><Input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="distributeur@email.com" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Prénom</Label><Input value={inv.firstName} onChange={(e) => setInv({ ...inv, firstName: e.target.value })} placeholder="Marie" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Ville</Label><Input value={inv.city} onChange={(e) => setInv({ ...inv, city: e.target.value })} placeholder="Lyon" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Spécialité</Label><Input value={inv.speciality} onChange={(e) => setInv({ ...inv, speciality: e.target.value })} placeholder="Bien-être & nutrition" /></div>
        </div>
        <Button onClick={invite} disabled={pending || !inv.email} className="mt-4" variant="gradient">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer l’invitation
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Un magic link « espace prêt » est envoyé. Import CSV en masse : <Link href="/agency/onboarding" className="text-primary hover:underline">onboarding agence</Link>.</p>
      </Card>

      {/* Brand kit */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold"><Palette className="h-4 w-4 text-primary" /> Brand kit (imposé aux distributeurs)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs">Couleur principale</Label><Input type="color" value={bk.primaryColor} onChange={(e) => setBk({ ...bk, primaryColor: e.target.value })} className="h-10 w-20 p-1" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Couleur secondaire</Label><Input type="color" value={bk.secondaryColor} onChange={(e) => setBk({ ...bk, secondaryColor: e.target.value })} className="h-10 w-20 p-1" /></div>
        </div>
        <div className="mt-3 space-y-1.5"><Label className="text-xs">Consignes de ton</Label><textarea rows={2} className={area} value={bk.toneGuidelines} onChange={(e) => setBk({ ...bk, toneGuidelines: e.target.value })} placeholder="Ex : motivant, bienveillant, jamais agressif." /></div>
        <div className="mt-3 space-y-1.5"><Label className="text-xs">Mots interdits (séparés par des virgules)</Label><textarea rows={2} className={area} value={bk.forbiddenWords} onChange={(e) => setBk({ ...bk, forbiddenWords: e.target.value })} placeholder="revenus, gagner de l’argent, liberté financière" /></div>
        <Button onClick={saveBrand} disabled={pending} className="mt-4" variant="outline">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer le brand kit
        </Button>
      </Card>

      {/* Templates validés */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold"><FileCheck2 className="h-4 w-4 text-primary" /> Templates validés</h2>
        {templates.length > 0 && (
          <ul className="mt-3 space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                {t.isLocked ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                <span className="font-medium">{t.name}</span>
                {t.category && <Badge variant="secondary">{t.category}</Badge>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs">Nom du template</Label><Input value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} placeholder="Témoignage produit" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Catégorie</Label><Input value={tpl.category} onChange={(e) => setTpl({ ...tpl, category: e.target.value })} placeholder="Preuve sociale" /></div>
        </div>
        <div className="mt-3 space-y-1.5"><Label className="text-xs">Contenu / consigne</Label><textarea rows={3} className={area} value={tpl.content} onChange={(e) => setTpl({ ...tpl, content: e.target.value })} placeholder="Structure validée : accroche, bénéfice produit, témoignage client, CTA atelier." /></div>
        <Button onClick={addTpl} disabled={pending || !tpl.name || !tpl.content} className="mt-4" variant="outline">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter le template
        </Button>
      </Card>
    </div>
  );
}
