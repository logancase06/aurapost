import { getPlan, planIdForPrice, PLANS, getPlanLimits } from '@/lib/plans';
import { isPro, hasWebsiteAccess, isPlanExpired } from '@/lib/plan-guard';

describe('plans', () => {
  it('expose les deux plans payants', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['content_only', 'pack_complet']);
  });
  it('prix 39 € / 79 €', () => {
    expect(getPlan('content_only')?.amount).toBe(3900);
    expect(getPlan('pack_complet')?.amount).toBe(7900);
  });
  it('offre gratuite : 4 posts Instagram + watermark, pas de site ni export', () => {
    const free = getPlanLimits('starter');
    expect(free.postsPerMonth).toBe(4);
    expect(free.instagramOnly).toBe(true);
    expect(free.watermark).toBe(true);
    expect(free.sitesEnabled).toBe(false);
    expect(free.exportEnabled).toBe(false);
  });
  it('plans payants : 12 posts, export, sans watermark', () => {
    expect(getPlanLimits('content_only').postsPerMonth).toBe(12);
    expect(getPlanLimits('content_only').watermark).toBe(false);
    expect(getPlanLimits('pack_complet').sitesEnabled).toBe(true);
  });
  it('getPlan résout par id', () => {
    expect(getPlan('pack_complet')?.name).toBe('Coach+Site');
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
