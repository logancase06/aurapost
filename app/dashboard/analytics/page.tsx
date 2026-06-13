import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCoachAnalytics } from '@/lib/db/analytics';
import { Lightbulb } from 'lucide-react';
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

  const a = await getCoachAnalytics(tenantId);
  const maxMonth = Math.max(1, ...a.byMonth.map((m) => m.count));
  const topApproved = [...a.byTheme].sort((x, y) => y.approved - x.approved).slice(0, 6);

  return (
    <DashboardShell active="/dashboard/analytics">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Comprenez ce qui fonctionne le mieux pour votre audience.</p>

      {a.total === 0 ? (
        <Card className="mt-8 border-dashed p-12 text-center">
          <p className="text-lg font-semibold">Pas encore de données</p>
          <p className="mt-1 text-sm text-muted-foreground">Générez et approuvez des posts pour voir vos statistiques.</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-bold">Posts les plus approuvés</h2>
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
              <h2 className="mb-4 text-lg font-bold">Évolution mensuelle</h2>
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
