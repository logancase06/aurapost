import { getPlan, planIdForPrice, PLANS } from '@/lib/plans';
import { isPro, hasWebsiteAccess, isPlanExpired } from '@/lib/plan-guard';

describe('plans', () => {
  it('expose les deux plans', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['content_only', 'pack_complet']);
  });
  it('getPlan résout par id', () => {
    expect(getPlan('pack_complet')?.name).toBe('Pack Complet');
    expect(getPlan('inconnu')).toBeNull();
  });
  it('planIdForPrice retourne null sans price configuré', () => {
    expect(planIdForPrice(null)).toBeNull();
    expect(planIdForPrice('price_unknown')).toBeNull();
  });
});

describe('plan-guard', () => {
  it('isPro vrai pour tout plan non-starter', () => {
    expect(isPro('starter')).toBe(false);
    expect(isPro('content_only')).toBe(true);
    expect(isPro('pack_complet')).toBe(true);
  });
  it('hasWebsiteAccess réservé au pack complet', () => {
    expect(hasWebsiteAccess('content_only')).toBe(false);
    expect(hasWebsiteAccess('pack_complet')).toBe(true);
  });
  it('isPlanExpired gère null et dates', () => {
    expect(isPlanExpired(null)).toBe(false);
    expect(isPlanExpired('2000-01-01T00:00:00Z')).toBe(true);
    expect(isPlanExpired('2999-01-01T00:00:00Z')).toBe(false);
  });
});
