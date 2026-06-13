import { db } from './index';
import { users, tenants } from './schema';
import { eq } from 'drizzle-orm';

// Le plan vit sur le tenant : on joint users ⨝ tenants pour exposer plan + planExpiresAt
// au JWT, sans inclure le passwordHash dans les sélections inutiles.

const AUTH_COLS = {
  id: users.id,
  email: users.email,
  passwordHash: users.passwordHash,
  fullName: users.fullName,
  role: users.role,
  tenantId: users.tenantId,
  emailVerifiedAt: users.emailVerifiedAt,
  plan: tenants.plan,
  planExpiresAt: tenants.planExpiresAt,
};

export async function findUserByEmail(email: string) {
  const result = await db
    .select(AUTH_COLS)
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await db
    .select(AUTH_COLS)
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}
