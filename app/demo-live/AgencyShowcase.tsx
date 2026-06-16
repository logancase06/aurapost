import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Palette } from 'lucide-react';
import { getOrgBySlug, listOrgMembersWithStats, getOrgReporting, getBrandKit, type MemberState } from '@/lib/db/organizations';
import { listPendingApprovals } from '@/lib/db/approvals';
import { findForbidden, mergeForbidden } from '@/lib/compliance';

const STATE: Record<MemberState, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  active: { label: 'Actif', variant: 'success' },
  inactive: { label: 'Inactif', variant: 'warning' },
  never: { label: 'Jamais connecté', variant: 'destructive' },
};

/** Vitrine read-only du dashboard manager « Réseau Vitalité » pour la démo agence. */
export default async function AgencyShowcase() {
  const org = await getOrgBySlug('reseau-vitalite');
  if (!org) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Démo agence non disponible</h1>
        <p className="mt-2 text-muted-foreground">Lancez <code>npm run seed:demo</code> pour créer l’organisation de démonstration.</p>
      </main>
    );
  }

  const [members, reporting, brandKit, pending] = await Promise.all([
    listOrgMembersWithStats(org.id),
    getOrgReporting(org.id),
    getBrandKit(org.id),
    listPendingApprovals(org.id),
  ]);
  const forbidden = mergeForbidden(brandKit?.forbiddenWords);

  const kpis = [
    { label: 'Distributeurs', value: String(reporting.memberCount) },
    { label: 'Actifs (7j)', value: `${reporting.activeThisWeek}/${reporting.memberCount}` },
    { label: 'Jamais connectés', value: String(reporting.neverConnected) },
    { label: 'Posts ce mois', value: String(reporting.postsThisMonth) },
    { label: 'En attente', value: String(pending.length) },
    { label: 'Taux d’approbation', value: `${reporting.approvalRate}%` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-widest">Tableau de bord réseau</span></div>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{org.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vue manager — pilotage des distributeurs, conformité et adoption.</p>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-2xl font-extrabold">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Distributeurs */}
      <h2 className="mt-10 text-lg font-bold">Distributeurs</h2>
      <Card className="mt-3 divide-y divide-border">
        {members.map((m) => (
          <div key={m.tenantId} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}{m.city ? ` · ${m.city}` : ''}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{m.totalPosts} posts</span>
              <span>{m.approvalRate}% approuvés</span>
              <Badge variant={STATE[m.state].variant}>{STATE[m.state].label}</Badge>
            </div>
          </div>
        ))}
      </Card>

      {/* File de validation */}
      <h2 className="mt-10 flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> En attente de validation ({pending.length})</h2>
      <div className="mt-3 space-y-3">
        {pending.map((p) => {
          const breaches = findForbidden(p.content, forbidden);
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{p.distributor} · {p.network}</span>
                {breaches.length > 0 && <Badge variant="destructive"><AlertTriangle className="h-3 w-3" /> Allégation : {breaches[0]}</Badge>}
              </div>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.content}</p>
            </Card>
          );
        })}
        {pending.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Aucun post en attente.</Card>}
      </div>

      {/* Brand kit */}
      <h2 className="mt-10 flex items-center gap-2 text-lg font-bold"><Palette className="h-5 w-5 text-primary" /> Brand kit imposé</h2>
      <Card className="mt-3 p-5">
        <div className="flex items-center gap-3">
          {[brandKit?.primaryColor, brandKit?.secondaryColor].filter(Boolean).map((c) => (
            <span key={c} className="h-8 w-8 rounded-md border border-border" style={{ background: c as string }} title={c as string} />
          ))}
          <span className="text-sm text-muted-foreground">{org.brandTone}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Mots interdits (bloqués à la génération) :</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {forbidden.slice(0, 12).map((w) => (
            <span key={w} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">{w}</span>
          ))}
        </div>
      </Card>
    </main>
  );
}
