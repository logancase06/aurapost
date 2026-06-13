import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles, websites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStoredSite } from '@/lib/db/coach-site';
import PreviewClient from './PreviewClient';

export const metadata = { title: 'Aperçu de mon site' };

export default async function PreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const site = await getStoredSite(tenantId);
  if (!site) redirect('/onboarding/site');

  const [profile] = await db
    .select({ displayName: coachProfiles.displayName, speciality: coachProfiles.speciality, city: coachProfiles.city })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  const [web] = await db.select({ status: websites.status }).from(websites).where(eq(websites.tenantId, tenantId)).limit(1);

  return (
    <PreviewClient
      subdomain={site.subdomain}
      status={web?.status ?? 'inactive'}
      displayName={profile?.displayName ?? 'Coach'}
      speciality={profile?.speciality ?? ''}
      city={profile?.city ?? null}
      photos={site.photos}
      themeColor={site.themeColor}
      content={site.content}
    />
  );
}
