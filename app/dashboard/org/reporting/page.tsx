import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getOrgForTenant, getOrgReporting } from '@/lib/db/organizations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardShell from '../../DashboardShell';

export const metadata = { title: 'Reporting réseau' };

export default async function OrgReportingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const membership = await getOrgForTenant(tenantId);
  if (!membership || membership.role !== 'owner') redirect('/dashboard/org');

  const r = await getOrgReporting(membership.org.id);

  const kpis = [
    { label: 'Distributeurs', value: String(r.memberCount) },
    { label: 'Actifs cette semaine', value: `${r.activeThisWeek}/${r.memberCount}` },
    { label: 'Posts ce mois', value: String(r.postsThisMonth) },
    { label: 'Taux d’approbation', value: `${r.approvalRate}%` },
    { label: 'Sites publiés', value: `${r.sitesPublished} (${r.publishRate}%)` },
  ];

  return (
    <DashboardShell active="/dashboard/org">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/org" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {membership.org.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Reporting réseau</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/organizations/${membership.org.slug}/report.csv`}><Download className="h-4 w-4" /> Export CSV</a>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-2xl font-extrabold">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>

      {r.memberCount === 0 ? (
        <Card className="mt-8 border-dashed p-12 text-center text-muted-foreground">En attente des premières données distributeurs.</Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold"><TrendingUp className="h-4 w-4 text-success" /> Top 5 distributeurs</h2>
            <ul className="mt-4 divide-y divide-border">
              {r.top.map((m) => (
                <li key={m.tenantId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{m.totalPosts} posts · {m.approvalRate}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-bold"><TrendingDown className="h-4 w-4 text-[hsl(var(--warning))]" /> À relancer</h2>
            <ul className="mt-4 divide-y divide-border">
              {r.bottom.map((m) => (
                <li key={m.tenantId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <Badge variant={m.totalPosts === 0 ? 'destructive' : 'secondary'}>{m.totalPosts} posts</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Données réelles agrégées sur l’ensemble du réseau. Filtre par période : à venir (cf. roadmap).</p>
    </DashboardShell>
  );
}
