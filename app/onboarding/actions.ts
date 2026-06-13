'use server';

import { db } from '@/lib/db';
import { coachProfiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { CoachProfileSchema } from '@/lib/validation';
import { logActivity } from '@/lib/db/activity';

export type OnboardingState = { error?: string } | null;

/**
 * Enregistre le profil coach et marque l'onboarding comme terminé.
 * Toute écriture passe par requireTenantId() → isolation multi-tenant garantie.
 */
export async function saveCoachProfile(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Non autorisé' };

  const tenantId = await requireTenantId();

  const parsed = CoachProfileSchema.safeParse({
    displayName: formData.get('displayName'),
    speciality: formData.get('speciality'),
    city: formData.get('city') || undefined,
    contentStyle: formData.get('contentStyle') || undefined,
    tone: formData.get('tone') || 'motivant',
    bio: formData.get('bio') || undefined,
    targetAudience: formData.get('targetAudience') || undefined,
    language: formData.get('language') || 'fr',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  }

  const now = new Date().toISOString();
  const data = parsed.data;

  // Un seul profil par tenant en Starter : on remplace l'éventuel profil existant.
  await db.delete(coachProfiles).where(eq(coachProfiles.tenantId, tenantId));

  await db.insert(coachProfiles).values({
    id: nanoid(),
    tenantId,
    userId: session.user.id,
    displayName: data.displayName,
    speciality: data.speciality,
    city: data.city ?? null,
    contentStyle: data.contentStyle ?? null,
    tone: data.tone,
    bio: data.bio ?? null,
    targetAudience: data.targetAudience ?? null,
    language: data.language,
    createdAt: now,
    updatedAt: now,
  });

  await db.update(users).set({ onboardingCompleted: true }).where(eq(users.id, session.user.id));

  await logActivity(tenantId, session.user.id, 'onboarding_completed', null, { speciality: data.speciality });

  return null;
}
