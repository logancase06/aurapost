import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { Settings } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import DashboardShell from '../DashboardShell';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'Paramètres' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const [profile] = await db
    .select({ language: coachProfiles.language })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  const language = profile?.language === 'en' ? 'en' : 'fr';

  return (
    <DashboardShell active="/dashboard/settings">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
          <Settings className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Langue, données personnelles et compte.</p>
        </div>
      </div>

      <SettingsClient initialLanguage={language} />
    </DashboardShell>
  );
}
