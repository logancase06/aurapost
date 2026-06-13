import { db } from './index';
import { users, tenants } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { logError } from '@/lib/logger';

export interface CreateTenantOwnerData {
  email: string;
  passwordHash: string;
  fullName: string;
  brandName: string;
  consentGivenAt: string;
}

/**
 * Crée un tenant et son utilisateur fondateur (rôle `owner`) dans la foulée.
 * AuraPost : chaque coach est un tenant isolé. Retourne les IDs créés.
 *
 * Note : Turso/libSQL HTTP ne supporte pas les transactions interactives ;
 * on insère le tenant puis le user. En cas d'échec du second insert, on nettoie
 * le tenant orphelin (best-effort).
 */
export async function createTenantAndOwner(
  data: CreateTenantOwnerData
): Promise<{ tenantId: string; userId: string }> {
  const userId = nanoid(12);
  const tenantId = nanoid(12);
  const now = new Date().toISOString();
  const email = data.email.toLowerCase().trim();

  await db.insert(tenants).values({
    id: tenantId,
    name: data.brandName.trim(),
    ownerId: userId,
    plan: 'starter',
    createdAt: now,
    updatedAt: now,
  });

  try {
    await db.insert(users).values({
      id: userId,
      tenantId,
      email,
      passwordHash: data.passwordHash,
      fullName: data.fullName.trim(),
      role: 'owner',
      consentGivenAt: data.consentGivenAt,
      onboardingCompleted: false,
      createdAt: now,
    });
  } catch (err) {
    // Nettoyage du tenant orphelin si l'insertion user échoue (ex: email déjà pris).
    db.delete(tenants)
      .where(eq(tenants.id, tenantId))
      .catch((e) => logError('[createTenantAndOwner] nettoyage tenant orphelin échoué', { error: String(e) }));
    throw err;
  }

  return { tenantId, userId };
}

/** Marque l'email d'un utilisateur comme vérifié. */
export async function markEmailVerified(email: string): Promise<void> {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date().toISOString() })
    .where(eq(users.email, email.toLowerCase()));
}

/** Hash bcrypt coût 12 — point unique de vérité pour le coût. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
