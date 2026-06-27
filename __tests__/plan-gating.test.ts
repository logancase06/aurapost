// Tests de gating par plan — vérifie que les limites sont correctement appliquées
// pour chaque plan (starter, content_only, pack_complet).

import {
  getPlanLimits,
  isPlanActive,
  canGenerateSite,
  canExportPost,
} from '@/lib/plans';

describe('getPlanLimits — couverture complete des champs de gating', () => {
  describe('starter (gratuit)', () => {
    const l = getPlanLimits('starter');

    it('4 posts/mois, instagram uniquement', () => {
      expect(l.postsPerMonth).toBe(4);
      expect(l.instagramOnly).toBe(true);
    });
    it("pas de site, pas d'export, watermark obligatoire", () => {
      expect(l.sitesEnabled).toBe(false);
      expect(l.exportEnabled).toBe(false);
      expect(l.watermark).toBe(true);
    });
    it("pas de variantes ni d'edition IA ni de publication sociale", () => {
      expect(l.variantesMax).toBe(0);
      expect(l.aiEditsMax).toBe(0);
      expect(l.socialPublishEnabled).toBe(false);
    });
    it('photos : max 1', () => {
      expect(l.photosMax).toBe(1);
    });
    it('profil limité à la section base', () => {
      expect(l.profileSections).toEqual(['base']);
    });
  });

  describe('content_only (Coach 39€)', () => {
    const l = getPlanLimits('content_only');

    it('12 posts/mois, instagram + linkedin', () => {
      expect(l.postsPerMonth).toBe(12);
      expect(l.instagramOnly).toBe(false);
    });
    it('export activé, pas de watermark', () => {
      expect(l.exportEnabled).toBe(true);
      expect(l.watermark).toBe(false);
    });
    it("pas de site, pas d'edition IA, pas de publication sociale", () => {
      expect(l.sitesEnabled).toBe(false);
      expect(l.aiEditsMax).toBe(0);
      expect(l.socialPublishEnabled).toBe(false);
    });
    it('photos : max 10', () => {
      expect(l.photosMax).toBe(10);
    });
    it('toutes les sections de profil débloquées', () => {
      expect(l.profileSections).toContain('base');
      expect(l.profileSections).toContain('presence');
      expect(l.profileSections).toContain('photos');
      expect(l.profileSections).toContain('results');
    });
  });

  describe('pack_complet (Coach+Site 79€)', () => {
    const l = getPlanLimits('pack_complet');

    it('site activé', () => {
      expect(l.sitesEnabled).toBe(true);
    });
    it('20 éditions IA/mois', () => {
      expect(l.aiEditsMax).toBe(20);
    });
    it('publication sociale activée', () => {
      expect(l.socialPublishEnabled).toBe(true);
    });
    it('export sans watermark', () => {
      expect(l.exportEnabled).toBe(true);
      expect(l.watermark).toBe(false);
    });
  });

  it('plan inconnu → fallback sur starter', () => {
    const l = getPlanLimits('plan_inexistant');
    expect(l.postsPerMonth).toBe(4);
    expect(l.exportEnabled).toBe(false);
  });

  it('plan null → fallback sur starter', () => {
    expect(getPlanLimits(null).postsPerMonth).toBe(4);
  });
});

describe('isPlanActive', () => {
  it('starter toujours actif, même sans date', () => {
    expect(isPlanActive('starter', null)).toBe(true);
    expect(isPlanActive('starter', undefined)).toBe(true);
  });

  it("plan payant actif si pas de date d'expiration", () => {
    expect(isPlanActive('content_only', null)).toBe(true);
    expect(isPlanActive('pack_complet', undefined)).toBe(true);
  });

  it('plan payant actif si date future', () => {
    expect(isPlanActive('content_only', '2999-12-31T23:59:59Z')).toBe(true);
  });

  it('plan payant inactif si date passée', () => {
    expect(isPlanActive('content_only', '2000-01-01T00:00:00Z')).toBe(false);
    expect(isPlanActive('pack_complet', '2020-06-15T00:00:00Z')).toBe(false);
  });
});

describe('fonctions de commodite', () => {
  it('canGenerateSite — vrai uniquement pour pack_complet', () => {
    expect(canGenerateSite('starter')).toBe(false);
    expect(canGenerateSite('content_only')).toBe(false);
    expect(canGenerateSite('pack_complet')).toBe(true);
  });

  it('canExportPost — faux pour starter, vrai pour les plans payants', () => {
    expect(canExportPost('starter')).toBe(false);
    expect(canExportPost('content_only')).toBe(true);
    expect(canExportPost('pack_complet')).toBe(true);
  });
});
