'use server';

import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getCalendarSubscriptionUrl } from '@/lib/calendar-token';

/**
 * Retourne l'URL d'abonnement iCal permanente du tenant connecté.
 * Cette URL peut être copiée dans Google Calendar / Apple Calendar / Outlook
 * pour un abonnement continu (elle se rafraîchit automatiquement).
 */
export async function getCalendarSubscriptionUrlAction(): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
  try {
    const tenantId = await requireTenantId();
    const url = getCalendarSubscriptionUrl(tenantId);
    if (!url) return { ok: false, error: 'Service calendrier non configuré.' };
    return { ok: true, url };
  } catch {
    return { ok: false, error: 'Session invalide' };
  }
}
