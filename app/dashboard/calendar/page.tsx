import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listScheduledRange, listSchedulablePosts } from '@/lib/db/posts';
import DashboardShell from '../DashboardShell';
import CalendarClient, { type CalPost } from './CalendarClient';

export const metadata = { title: 'Calendrier éditorial' };

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const { m } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(m ?? '') ? (m as string) : monthKey(new Date());
  const [y, mon] = month.split('-').map(Number);

  const startISO = new Date(y, mon - 1, 1).toISOString();
  const endISO = new Date(y, mon, 1).toISOString();

  const [scheduled, reservoir] = await Promise.all([
    listScheduledRange(tenantId, startISO, endISO),
    listSchedulablePosts(tenantId),
  ]);

  const toCal = (p: { id: string; title: string | null; theme: string | null; network: string; scheduledFor: string | null }): CalPost => ({
    id: p.id,
    title: p.title ?? p.theme ?? 'Post',
    network: p.network,
    scheduledFor: p.scheduledFor,
  });

  const monthLabel = new Date(y, mon - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <DashboardShell active="/dashboard/calendar">
      <CalendarClient
        month={month}
        prevMonth={shiftMonth(month, -1)}
        nextMonth={shiftMonth(month, 1)}
        monthLabel={monthLabel}
        initialScheduled={scheduled.map(toCal)}
        reservoir={reservoir.map(toCal)}
      />
    </DashboardShell>
  );
}
