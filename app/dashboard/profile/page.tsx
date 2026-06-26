import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listPhotos } from '@/lib/db/photos';
import { countEditedThisMonth } from '@/lib/db/edited-photos';
import { getPlanLimits } from '@/lib/plans';
import { parseAnalysis, InstagramAnalysisSchema, ReviewsAnalysisSchema } from '@/lib/validation';
import DashboardShell from '../DashboardShell';
import ProfileEditor, { type InitialProfile } from './ProfileEditor';

export const metadata = { title: 'Mon profil' };
// Server Actions de ré-analyse IG/avis peuvent appeler Claude → timeout confortable.
export const maxDuration = 60;

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const [prof] = await db
    .select({
      displayName: coachProfiles.displayName,
      speciality: coachProfiles.speciality,
      city: coachProfiles.city,
      tone: coachProfiles.tone,
      language: coachProfiles.language,
      bio: coachProfiles.bio,
      targetAudience: coachProfiles.targetAudience,
      results: coachProfiles.results,
      instagramUrl: coachProfiles.instagramUrl,
      instagramAnalysis: coachProfiles.instagramAnalysis,
      linkedinHeadline: coachProfiles.linkedinHeadline,
      linkedinSummary: coachProfiles.linkedinSummary,
      reviewsText: coachProfiles.reviewsText,
      reviewsAnalysis: coachProfiles.reviewsAnalysis,
    })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);

  // Profil pas encore créé → on renvoie vers l'onboarding.
  if (!prof) redirect('/onboarding');

  const photos = await listPhotos(tenantId, 20);
  const aiEditsMax = getPlanLimits(session.user.plan).aiEditsMax;
  const aiEditsUsed = aiEditsMax > 0 ? await countEditedThisMonth(tenantId) : 0;
  const ig = parseAnalysis(prof.instagramAnalysis, InstagramAnalysisSchema);
  const rv = parseAnalysis(prof.reviewsAnalysis, ReviewsAnalysisSchema);

  const initial: InitialProfile = {
    displayName: prof.displayName ?? '',
    speciality: prof.speciality ?? '',
    city: prof.city ?? '',
    tone: prof.tone ?? 'motivant',
    language: (prof.language as 'fr' | 'en') ?? 'fr',
    bio: prof.bio ?? '',
    targetAudience: prof.targetAudience ?? '',
    results: prof.results ?? '',
    instagramUrl: prof.instagramUrl ?? '',
    igTone: ig?.ton_dominant ?? null,
    linkedinHeadline: prof.linkedinHeadline ?? '',
    linkedinSummary: prof.linkedinSummary ?? '',
    reviewsText: prof.reviewsText ?? '',
    reviewStrengths: rv?.strengths ?? [],
    photos,
    aiEditsMax,
    aiEditsUsed,
  };

  return (
    <DashboardShell active="/dashboard/profile">
      <ProfileEditor initial={initial} />
    </DashboardShell>
  );
}
