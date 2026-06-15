import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getOrgForTenant } from '@/lib/db/organizations';
import AgencyOnboarding from './AgencyOnboarding';

export const metadata = { title: 'Onboarding agence — AuraPost for Teams' };

export default async function AgencyOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/agency/onboarding');
  let tenantId: string;
  try {
    tenantId = await requireTenantId();
  } catch {
    redirect('/login');
  }
  const membership = await getOrgForTenant(tenantId);
  const isOwner = membership?.role === 'owner';

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <AgencyOnboarding
        hasOrg={!!membership && isOwner}
        orgName={membership?.org.name ?? null}
        orgSlug={membership?.org.slug ?? null}
      />
    </main>
  );
}
