// Tests unitaires pour lib/db/payment-grace.ts (downgradeOverduePayments).
// La DB Turso n'est pas disponible en CI — on mock les imports drizzle/db/email.

jest.mock('@/lib/db', () => ({ db: {} }));
jest.mock('@/lib/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));
jest.mock('@/lib/email', () => ({ sendCancellationEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('@/lib/alerting', () => ({ notifyAdminFailure: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/db/subscription', () => ({ upsertSubscription: jest.fn().mockResolvedValue(undefined) }));

import { GRACE_PERIOD_DAYS } from '@/lib/constants';

const mockTenants = [
  { id: 'tenant_overdue_1', plan: 'content_only', paymentFailedAt: new Date(Date.now() - (GRACE_PERIOD_DAYS + 1) * 86400000).toISOString() },
  { id: 'tenant_overdue_2', plan: 'pack_complet', paymentFailedAt: new Date(Date.now() - (GRACE_PERIOD_DAYS + 3) * 86400000).toISOString() },
];
const mockUser = { email: 'coach@test.fr', name: 'Test Coach' };

describe('downgradeOverduePayments', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('retourne 0/0 quand aucun tenant en retard', async () => {
    const { db } = await import('@/lib/db');
    (db as any).select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });
    (db as any).update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    });

    const { downgradeOverduePayments } = await import('@/lib/db/payment-grace');
    const result = await downgradeOverduePayments();
    expect(result).toEqual({ processed: 0, errors: 0 });
  });

  it('downgrade et compte les tenants en retard', async () => {
    const { db } = await import('@/lib/db');
    // Premier appel select = overdue tenants, deuxieme = owner
    let selectCallCount = 0;
    (db as any).select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) return Promise.resolve(mockTenants);
          return { limit: jest.fn().mockResolvedValue([mockUser]) };
        }),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }),
    });
    (db as any).update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    });

    const { downgradeOverduePayments } = await import('@/lib/db/payment-grace');
    const result = await downgradeOverduePayments();
    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);

    const { upsertSubscription } = await import('@/lib/db/subscription');
    expect(upsertSubscription).toHaveBeenCalledTimes(2);
    expect(upsertSubscription).toHaveBeenCalledWith({ tenantId: 'tenant_overdue_1', plan: 'starter', status: 'canceled' });
    expect(upsertSubscription).toHaveBeenCalledWith({ tenantId: 'tenant_overdue_2', plan: 'starter', status: 'canceled' });
  });

  it('la periode de grace est bien GRACE_PERIOD_DAYS jours', () => {
    expect(GRACE_PERIOD_DAYS).toBe(7);
  });

  it('compte les erreurs individuelles sans arreter le traitement', async () => {
    const { db } = await import('@/lib/db');
    let selectCallCount = 0;
    (db as any).select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(() => {
          selectCallCount++;
          if (selectCallCount === 1) return Promise.resolve(mockTenants);
          return { limit: jest.fn().mockResolvedValue([mockUser]) };
        }),
        limit: jest.fn().mockResolvedValue([mockUser]),
      }),
    });
    (db as any).update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    });

    const { upsertSubscription } = await import('@/lib/db/subscription');
    (upsertSubscription as jest.Mock)
      .mockResolvedValueOnce(undefined)        // 1er tenant ok
      .mockRejectedValueOnce(new Error('DB error')); // 2eme tenant en erreur

    const { downgradeOverduePayments } = await import('@/lib/db/payment-grace');
    const result = await downgradeOverduePayments();
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(1);

    const { notifyAdminFailure } = await import('@/lib/alerting');
    expect(notifyAdminFailure).toHaveBeenCalled();
  });
});
