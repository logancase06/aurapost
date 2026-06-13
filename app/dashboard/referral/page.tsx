import { redirect } from 'next/navigation';
import { Gift, Users, CalendarCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getReferralStats } from '@/lib/db/referrals';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardShell from '../DashboardShell';
import ReferralLinkCard from './ReferralLinkCard';

export const metadata = { title: 'Parrainage' };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function ReferralPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const stats = await getReferralStats(tenantId, session.user.id);
  const url = `${APP_URL}/ref/${stats.code}`;

  const cards = [
    { icon: Users, label: 'Filleuls', value: stats.referralsCount, color: 'text-primary' },
    { icon: CalendarCheck, label: 'Mois gagnés', value: stats.monthsEarned, color: 'text-[hsl(var(--success))]' },
  ];

  return (
    <DashboardShell active="/dashboard/referral">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Gift className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Parrainage</h1>
          <p className="text-sm text-muted-foreground">
            Invitez un coach. Vous gagnez <strong>1 mois gratuit</strong> chacun à son inscription.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ReferralLinkCard url={url} code={stats.code} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-4 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
              <c.icon className={`h-6 w-6 ${c.color}`} />
            </span>
            <div>
              <p className="text-3xl font-black">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-bold">Vos filleuls</h2>
      <Card className="mt-4 divide-y divide-border">
        {stats.referees.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Aucun filleul pour l’instant. Partagez votre lien pour commencer à gagner des mois gratuits ✦
          </p>
        ) : (
          stats.referees.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4">
              <span className="truncate text-sm">{r.email ?? 'Coach invité'}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                <Badge variant={r.status === 'credited' ? 'success' : 'secondary'}>
                  {r.status === 'credited' ? 'Crédité' : 'En attente'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </Card>
    </DashboardShell>
  );
}
