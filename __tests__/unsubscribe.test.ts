process.env.UNSUBSCRIBE_SECRET = 'test-secret-for-jest-only';

import { eq } from 'drizzle-orm';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  isUnsubscribed,
  setUnsubscribed,
} from '@/lib/unsubscribe';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';

describe('unsubscribe — token HMAC', () => {
  it('génère un token vérifiable (round-trip)', () => {
    const token = generateUnsubscribeToken('tenant-abc');
    expect(token).toBeTruthy();
    expect(verifyUnsubscribeToken('tenant-abc', token)).toBe(true);
  });

  it('rejette un token falsifié, vide, ou d’un autre tenant', () => {
    const token = generateUnsubscribeToken('tenant-abc');
    expect(verifyUnsubscribeToken('tenant-xyz', token)).toBe(false);
    expect(verifyUnsubscribeToken('tenant-abc', `${token}tamper`)).toBe(false);
    expect(verifyUnsubscribeToken('tenant-abc', '')).toBe(false);
  });
});

describe('unsubscribe — flux DB (désabonner / réabonner)', () => {
  const id = 'tenant-unsub-jest';

  beforeAll(async () => {
    const now = new Date().toISOString();
    await db.insert(tenants).values({ id, name: 'Test', ownerId: 'owner-1', createdAt: now, updatedAt: now });
  });

  afterAll(async () => {
    await db.delete(tenants).where(eq(tenants.id, id));
  });

  it('désabonne, est idempotent, puis réabonne', async () => {
    expect(await isUnsubscribed(id)).toBe(false);

    await setUnsubscribed(id, true);
    expect(await isUnsubscribed(id)).toBe(true);

    // Idempotent : désabonner 2× reste désabonné.
    await setUnsubscribed(id, true);
    expect(await isUnsubscribed(id)).toBe(true);

    await setUnsubscribed(id, false);
    expect(await isUnsubscribed(id)).toBe(false);
  });
});
