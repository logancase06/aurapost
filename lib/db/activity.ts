import { db } from './index';
import { activityLogs } from './schema';
import { nanoid } from 'nanoid';
import { logError } from '@/lib/logger';

/**
 * Journalise une action dans activity_logs. Fire-and-forget côté appelant :
 * une erreur de log ne doit jamais bloquer l'action métier.
 */
export async function logActivity(
  tenantId: string | null,
  userId: string | null,
  action: string,
  targetId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      id: nanoid(),
      tenantId,
      userId,
      action,
      targetId: targetId ?? null,
      details: details ? JSON.stringify(details) : null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logError('[logActivity] échec insertion', { action, error: String(err) });
  }
}
