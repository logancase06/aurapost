import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import NewsletterClient from './NewsletterClient';

export const metadata = { title: 'Newsletter — AuraPost' };
export const maxDuration = 60;

export default async function NewsletterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;
  let hasProfile = false;
  try {
    const [p] = await db.select({ id: coachProfiles.id }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)).limit(1);
    hasProfile = !!p;
  } catch {}
  return <NewsletterClient hasProfile={hasProfile} />;
}
