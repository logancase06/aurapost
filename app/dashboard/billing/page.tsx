import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSubscription, mockPaymentHistory } from '@/lib/db/subscription';
import { PLANS, getPlan, formatPrice } from '@/lib/plans';
import { stripe } from '@/lib/stripe';
import { Check, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import DashboardShell from '../DashboardShell';
import UpgradeButton from './UpgradeButton';

export const metadata = { title: 'Abonnement' };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const sub = await getSubscription(tenantId);
  const currentPlanId = session.user.plan ?? 'starter';
  const currentPlan = getPlan(currentPlanId);
  const stripeConfigured = !!stripe;
  const history = stripeConfigured ? [] : mockPaymentHistory();

  return (
    <DashboardShell active="/dashboard/billing">
      <h1 className="text-2xl font-bold">Abonnement</h1>

      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-muted-foreground">Plan actuel</p>
          <p className="mt-1 text-xl font-bold">{currentPlan?.name ?? 'Gratuit (Starter)'}</p>
        </div>
        {sub?.status && sub.status !== 'incomplete' && <Badge variant="success">{sub.status}</Badge>}
      </Card>

      {!stripeConfigured && (
        <Alert variant="info" className="mt-4">
          <Info />
          <AlertDescription>
            Le paiement n’est pas encore activé (Stripe non configuré). Les plans et l’historique ci-dessous sont en mode démonstration.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan, i) => {
          const featured = i === 1;
          const isCurrent = currentPlanId === plan.id;
          return (
            <Card key={plan.id} className={featured ? 'relative border-primary/60 p-6 shadow-lg shadow-primary/10' : 'p-6'}>
              {featured && (
                <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-primary to-accent text-white">Recommandé</Badge>
              )}
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 text-2xl font-extrabold text-primary">{formatPrice(plan)}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <UpgradeButton plan={plan.id} current={isCurrent} featured={featured} />
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-12 text-lg font-bold">Historique des paiements</h2>
      <Card className="mt-4 overflow-hidden">
        {history.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="capitalize">{h.date}</TableCell>
                  <TableCell>{h.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{h.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </DashboardShell>
  );
}
