import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { siteLeads } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { canGenerateSite } from '@/lib/plans';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Mail, UserRound } from 'lucide-react';
import DashboardShell from '../DashboardShell';
import { UpgradeBanner } from '@/components/UpgradeGate';
import LeadActions from './LeadActions';

export const metadata = { title: 'Leads' };

const STATUS_LABEL: Record<string, { label: string; variant: 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  new: { label: 'Nouveau', variant: 'warning' },
  contacted: { label: 'Contacté', variant: 'secondary' },
  converted: { label: 'Converti', variant: 'success' },
  archived: { label: 'Archivé', variant: 'destructive' },
};

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;
  const hasSite = canGenerateSite(session.user.plan);

  let leads: typeof siteLeads.$inferSelect[] = [];
  try {
    leads = await db
      .select()
      .from(siteLeads)
      .where(eq(siteLeads.tenantId, tenantId))
      .orderBy(desc(siteLeads.createdAt))
      .limit(500);
  } catch {
    // Table absente (migration non appliquée) → état vide, pas de crash.
  }

  return (
    <DashboardShell active="/dashboard/leads">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contacts reçus via le formulaire de contact de ton site vitrine.
          </p>
        </div>
        {leads.length > 0 && (
          <Button asChild variant="outline" size="sm">
            <a href="/api/leads/export">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </Button>
        )}
      </div>

      {!hasSite && (
        <UpgradeBanner featureName="Site vitrine + capture de leads" requiredPlan="pack_complet" className="mt-6" />
      )}

      {leads.length === 0 ? (
        <Card className="mt-8 border-dashed p-12 text-center">
          <UserRound className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-lg font-semibold">Aucun lead pour l&apos;instant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les contacts remplis sur ton site vitrine apparaîtront ici automatiquement.
          </p>
          <Button asChild className="mt-4" variant="gradient" size="sm">
            <Link href="/dashboard/website">Voir mon site</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-3">
          {leads.map((lead) => {
            const s = STATUS_LABEL[lead.status] ?? STATUS_LABEL.new;
            const date = new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <Card key={lead.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{lead.name}</span>
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">{date}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                    </div>
                    {lead.message && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{lead.message}</p>
                    )}
                  </div>
                  <LeadActions leadId={lead.id} currentStatus={lead.status} email={lead.email} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
