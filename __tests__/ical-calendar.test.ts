// Tests pour lib/calendar-token.ts
// Verifie : generation/verification de tokens, isolation multi-tenant, format date iCal.

process.env.NEXTAUTH_SECRET = 'test-secret-for-calendar-unit';
process.env.NEXT_PUBLIC_APP_URL = 'https://aurapost.fr';
delete process.env.CALENDAR_SECRET;

import { generateCalendarToken, verifyCalendarToken, getCalendarSubscriptionUrl } from '@/lib/calendar-token';

describe("calendar-token — generation et verification", () => {
  it("genere un token non vide pour un tenant valide", () => {
    const token = generateCalendarToken('tenant-abc');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it("le meme tenant genere toujours le meme token (deterministe)", () => {
    expect(generateCalendarToken('tenant-xyz')).toBe(generateCalendarToken('tenant-xyz'));
  });

  it("deux tenants differents ont des tokens differents", () => {
    const t1 = generateCalendarToken('tenant-A');
    const t2 = generateCalendarToken('tenant-B');
    expect(t1).not.toBe(t2);
  });

  it("verifyCalendarToken valide le bon token", () => {
    const token = generateCalendarToken('tenant-abc');
    expect(verifyCalendarToken('tenant-abc', token)).toBe(true);
  });

  it("verifyCalendarToken rejette un token destine a un autre tenant (isolation)", () => {
    const tokenA = generateCalendarToken('tenant-A');
    expect(verifyCalendarToken('tenant-B', tokenA)).toBe(false);
  });

  it("verifyCalendarToken rejette un token forge", () => {
    expect(verifyCalendarToken('tenant-abc', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==')).toBe(false);
  });

  it("verifyCalendarToken rejette une chaine vide", () => {
    expect(verifyCalendarToken('tenant-abc', '')).toBe(false);
  });

  it("verifyCalendarToken est resistant aux substitutions base64 (timing-safe)", () => {
    const real = generateCalendarToken('tenant-abc');
    const tampered = (real[0] === 'A' ? 'B' : 'A') + real.slice(1);
    expect(verifyCalendarToken('tenant-abc', tampered)).toBe(false);
  });
});

describe("calendar-token — URL d'abonnement", () => {
  it("construit une URL avec tenant et token en parametres", () => {
    const url = getCalendarSubscriptionUrl('tenant-abc');
    expect(url).toMatch(/^https:\/\/aurapost\.fr\/api\/calendar\/ical\?/);
    expect(url).toContain('tenant=tenant-abc');
    expect(url).toContain('token=');
  });

  it("l'URL contient un token valide pour le tenant", () => {
    const url = getCalendarSubscriptionUrl('tenant-abc');
    const params = new URLSearchParams(url.split('?')[1]);
    const tenantId = params.get('tenant')!;
    const token = params.get('token')!;
    expect(verifyCalendarToken(tenantId, token)).toBe(true);
  });

  it("deux tenants ont des URLs differentes", () => {
    expect(getCalendarSubscriptionUrl('A')).not.toBe(getCalendarSubscriptionUrl('B'));
  });
});

describe("iCal format — DTEND (jour suivant RFC 5545)", () => {
  function nextDay(iso: string): string {
    const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }

  it("le lendemain de 2026-06-25 est 20260626", () => {
    expect(nextDay('2026-06-25')).toBe('20260626');
  });

  it("gere correctement les fins de mois", () => {
    expect(nextDay('2026-01-31')).toBe('20260201');
    expect(nextDay('2026-02-28')).toBe('20260301');
    expect(nextDay('2024-02-29')).toBe('20240301'); // annee bissextile
  });
});
