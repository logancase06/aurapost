import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCoachAnalytics, getSiteVisitStats } from '@/lib/db/analytics';
import { Lightbulb, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardShell from '../DashboardShell';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const [a, v] = await Promise.all([
    getCoachAnalytics(tenantId),
    getSiteVisitStats(tenantId),
  ]);
  const maxMonth = Math.max(1, ...a.byMonth.map((m) => m.count));
  const maxDay = Math.max(1, ...v.byDay.map((d) => d.count));
  const topApproved = [...a.byTheme].sort((x, y) => y.approved - x.approved).slice(0, 6);

  return (
    <DashboardShell active="/dashboard/analytics">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Comprenez ce qui fonctionne le mieux pour votre audience.</p>

      {/* ── Section site vitrine ─────────────────────────────────────── */}
      <h2 className="mt-8 text-lg font-semibold">Visites du site vitrine</h2>
      {v.totalVisits === 0 ? (
        <Card className="mt-3 border-dashed p-8 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune visite enregistrée pour l'instant. Les données apparaîtront dès que votre site reçoit des visiteurs.</p>
        </Card>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Kpi label="Visites totales" value={`${v.totalVisits}`} />
            <Kpi label="30 derniers jours" value={`${v.last30Days}`} highlight />
            <Kpi label="Sources de trafic" value={`${v.topReferrers.length}`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Courbe 30 jours */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Visites — 30 derniers jours</h3>
              <ul className="space-y-2">
                {v.byDay.slice(-14).map((d) => (
                  <li key={d.day}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">{d.day.slice(5)}</span>
                      <span>{d.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(d.count / maxDay) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-6">
              {/* Devices */}
              {v.byDevice.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-3 font-semibold">Appareils</h3>
                  <ul className="space-y-2">
                    {v.byDevice.map((d) => (
                      <li key={d.device} className="flex items-center gap-2 text-sm">
                        {d.device === 'mobile' ? <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" /> : d.device === 'tablet' ? <Tablet className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className="flex-1 capitalize">{d.device}</span>
                        <Badge variant="secondary">{d.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Top referrers */}
              {v.topReferrers.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-3 font-semibold">Sources de trafic</h3>
                  <ul className="space-y-2">
                    {v.topReferrers.slice(0, 5).map((r) => (
                      <li key={r.referrer} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{r.referrer || 'Accès direct'}</span>
                        <Badge variant="secondary">{r.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Section posts ────────────────────────────────────────────── */}
      <h2 className="mt-10 text-lg font-semibold">Performance des posts</h2>
      {a.total === 0 ? (
        <Card className="mt-3 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Générez et approuvez des posts pour voir vos statistiques.</p>
        </Card>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Posts générés" value={`${a.total}`} />
            <Kpi label="Taux d'approbation" value={`${a.approvalRate}%`} highlight />
            <Kpi label="Approuvés" value={`${a.approved}`} />
            <Kpi label="Rejetés" value={`${a.rejected}`} />
          </div>

          {a.suggestion && (
            <Alert variant="info" className="mt-6">
              <Lightbulb />
              <AlertDescription>{a.suggestion}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-base font-semibold">Posts les plus approuvés</h3>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Thème</TableHead>
                    <TableHead>Générés</TableHead>
                    <TableHead>Approuvés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topApproved.map((t) => (
                    <TableRow key={t.theme}>
                      <TableCell className="font-medium">{t.theme}</TableCell>
                      <TableCell>{t.count}</TableCell>
                      <TableCell>
                        <Badge variant="success">{t.approved}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-base font-semibold">Évolution mensuelle</h3>
              <ul className="space-y-3">
                {a.byMonth.map((m) => (
                  <li key={m.month}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{m.month}</span>
                      <span className="text-muted-foreground">{m.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(m.count / maxMonth) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5 p-5' : 'p-5'}>
      <div className="text-3xl font-extrabold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Card>
  );
}
