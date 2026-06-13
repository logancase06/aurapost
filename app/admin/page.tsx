import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import {
  getAdminStats, listCoaches, recentSignups,
  getBusinessMetrics, listInactiveCoaches, listSupportTickets,
} from '@/lib/db/admin';
import { formatDate } from '@/lib/utils';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import TenantToggle from './TenantToggle';
import AdminInsights from './AdminInsights';

export const metadata = { title: 'Administration' };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!isAdminSession(session)) redirect('/dashboard');

  const [stats, coaches, signups, metrics, inactive, tickets] = await Promise.all([
    getAdminStats(),
    listCoaches(),
    recentSignups(),
    getBusinessMetrics(),
    listInactiveCoaches(),
    listSupportTickets(),
  ]);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AuraPost
            <Badge variant="outline" className="ml-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </Badge>
          </span>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Mon dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Back-office</h1>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Coachs (tenants)" value={String(stats.tenantCount)} />
          <Stat label="Posts ce mois" value={String(stats.postsThisMonth)} />
          <Stat label="Abonnements actifs" value={String(stats.activeSubscriptions)} />
          <Stat label="Revenu (mock)" value={stats.mockRevenue} />
        </div>

        <AdminInsights metrics={metrics} inactive={inactive} tickets={tickets} />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-bold">Coachs</h2>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.map((c) => (
                    <TableRow key={c.tenantId}>
                      <TableCell>
                        <div className="font-semibold">{c.tenantName}</div>
                        <div className="text-xs text-muted-foreground">{c.ownerEmail}</div>
                        {c.speciality && <div className="text-xs text-primary">{c.speciality}</div>}
                      </TableCell>
                      <TableCell className="capitalize">{c.plan}</TableCell>
                      <TableCell>{c.postCount}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'disabled' ? 'destructive' : 'success'}>
                          {c.status === 'disabled' ? 'Désactivé' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TenantToggle tenantId={c.tenantId} status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {coaches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Aucun coach inscrit.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold">Dernières inscriptions</h2>
            <Card className="p-4">
              <ul className="space-y-3">
                {signups.map((s, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                  </li>
                ))}
                {signups.length === 0 && <li className="text-sm text-muted-foreground">Aucune inscription.</li>}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
