import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSiteWizardState } from '@/lib/db/coach-site';
import SiteWizard from './SiteWizard';

export const metadata = { title: 'Générer mon site' };

export default async function OnboardingSitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const state = await getSiteWizardState(tenantId);
  if (!state) redirect('/onboarding');

  return (
    <SiteWizard
      initial={{
        instagramUrl: state.instagramUrl ?? '',
        instagramData: state.instagramData,
        reviewsText: state.reviewsText ?? '',
        reviewsAnalysis: state.reviewsAnalysis,
        photos: state.photos,
      }}
    />
  );
}
