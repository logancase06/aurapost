process.env.AURAPOST_USE_MOCK = '1';

import {
  generateMockContent,
  generateMonthlyContent,
  generateDemoPosts,
  type CoachProfileInput,
} from '@/lib/content-generator';

const profile: CoachProfileInput = {
  displayName: 'Coach Test',
  speciality: 'Préparation physique CrossFit',
  city: 'Lyon',
  tone: 'motivant',
  language: 'fr',
};

describe('content generator (mock)', () => {
  it('génère exactement 8 Instagram + 4 LinkedIn', () => {
    const posts = generateMockContent(profile);
    expect(posts).toHaveLength(12);
    expect(posts.filter((p) => p.network === 'instagram')).toHaveLength(8);
    expect(posts.filter((p) => p.network === 'linkedin')).toHaveLength(4);
  });

  it('chaque post a un contenu, un titre et des hashtags', () => {
    for (const p of generateMockContent(profile)) {
      expect(p.content.length).toBeGreaterThan(10);
      expect(p.title.length).toBeGreaterThan(0);
      expect(Array.isArray(p.hashtags)).toBe(true);
      expect(p.hashtags.length).toBeGreaterThan(0);
    }
  });

  it('generateMonthlyContent bascule sur le mock et retourne 12 posts', async () => {
    const posts = await generateMonthlyContent(profile);
    expect(posts).toHaveLength(12);
  });

  it('generateDemoPosts retourne 3 posts (2 IG + 1 LinkedIn)', () => {
    const demo = generateDemoPosts('Yoga', 'educatif');
    expect(demo).toHaveLength(3);
    expect(demo.filter((p) => p.network === 'instagram')).toHaveLength(2);
    expect(demo.filter((p) => p.network === 'linkedin')).toHaveLength(1);
  });
});
