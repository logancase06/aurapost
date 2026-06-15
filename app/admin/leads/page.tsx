import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';
import { listAgencyLeads } from '@/lib/db/agency';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LeadsTable from './LeadsTable';

export const metadata = { title: 'Prospects agence' };

export default async function AdminLeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!isAdminSession(session)) redirect('/dashboard');

  const leads = await listAgencyLeads();
  const counts = leads.reduce<Record<string, number>>((acc, l) => ((acc[l.status] = (acc[l.status] ?? 0) + 1), acc), {});

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-4xl px-6 py-8">
      <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back-office
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><Building2 className="h-6 w-6 text-primary" /> Prospects agence</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">{leads.length} au total</Badge>
        {counts.new ? <Badge variant="warning">{counts.new} nouveaux</Badge> : null}
        {counts.won ? <Badge variant="success">{counts.won} signés</Badge> : null}
      </div>
      <div className="mt-8">
        <LeadsTable leads={leads} />
      </div>
    </main>
  );
}
