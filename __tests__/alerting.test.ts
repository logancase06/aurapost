// Tests pour lib/alerting.ts
// Verifie : pas de crash si email non configure, isolation des appels.

delete process.env.ADMIN_ALERT_EMAIL;
delete process.env.RESEND_API_KEY;

import { notifyAdminFailure, notifyJobsReconciled } from '@/lib/alerting';

describe("notifyAdminFailure", () => {
  it("ne leve pas d'exception si ADMIN_ALERT_EMAIL est absent", async () => {
    await expect(notifyAdminFailure('test-context', { key: 'value' })).resolves.toBeUndefined();
  });

  it("ne leve pas d'exception si ADMIN_ALERT_EMAIL est absent et details vide", async () => {
    await expect(notifyAdminFailure('empty-details', {})).resolves.toBeUndefined();
  });

  it("tronque les details longs sans crasher", async () => {
    const longError = 'x'.repeat(10000);
    await expect(notifyAdminFailure('long-error', { error: longError })).resolves.toBeUndefined();
  });
});

describe("notifyJobsReconciled", () => {
  it("ne leve pas d'exception quand failed=0", async () => {
    await expect(notifyJobsReconciled(0, 0)).resolves.toBeUndefined();
  });

  it("ne leve pas d'exception quand failed>0 et email non configure", async () => {
    await expect(notifyJobsReconciled(3, 2)).resolves.toBeUndefined();
  });
});
