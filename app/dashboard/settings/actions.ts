'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { logActivity } from '@/lib/db/activity';

/** Met à jour la langue d'interface / de génération du coach. */
export async function updateLanguageAction(language: 'fr' | 'en'): Promise<{ ok: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false };
    const tenantId = await requireTenantId();
    if (language !== 'fr' && language !== 'en') return { ok: false };

    await db
      .update(coachProfiles)
      .set({ language, updatedAt: new Date().toISOString() })
      .where(eq(coachProfiles.tenantId, tenantId));
    await logActivity(tenantId, session.user.id, 'language_updated', null, { language });
    revalidatePath('/dashboard/settings');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
