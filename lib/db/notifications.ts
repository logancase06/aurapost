import { nanoid } from 'nanoid';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from './index';
import { notifications } from './schema';
import { logError } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Notifications in-app (cloche du header). Toujours scellées au tenant.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType = 'posts_ready' | 'site_activated' | 'subscription_expiring' | 'referral';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Crée une notification. Fire-and-forget : ne bloque jamais l'action métier. */
export async function createNotification(input: {
  tenantId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  try {
    await db.insert(notifications).values({
      id: nanoid(),
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logError('[createNotification] échec', { type: input.type, error: String(err) });
  }
}

/** Liste les notifications d'un tenant (les plus récentes d'abord). */
export async function listNotifications(tenantId: string, limit = 15): Promise<NotificationRow[]> {
  if (!tenantId) return [];
  try {
    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        href: notifications.href,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return rows;
  } catch (err) {
    logError('[listNotifications] échec', { error: String(err) });
    return [];
  }
}

/** Nombre de notifications non lues. */
export async function unreadCount(tenantId: string): Promise<number> {
  if (!tenantId) return 0;
  try {
    const rows = await db
      .select({ n: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.tenantId, tenantId), isNull(notifications.readAt)));
    return Number(rows[0]?.n ?? 0);
  } catch (err) {
    logError('[unreadCount] échec', { error: String(err) });
    return 0;
  }
}

/** Marque une notification (ou toutes) comme lue(s) pour un tenant. */
export async function markRead(tenantId: string, id?: string): Promise<void> {
  if (!tenantId) return;
  const now = new Date().toISOString();
  try {
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(
        id
          ? and(eq(notifications.tenantId, tenantId), eq(notifications.id, id))
          : and(eq(notifications.tenantId, tenantId), isNull(notifications.readAt))
      );
  } catch (err) {
    logError('[markRead] échec', { error: String(err) });
  }
}
