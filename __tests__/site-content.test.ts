import { parseSiteContent, mergeSiteContent, emptySiteContent, type SiteContent } from '@/lib/db/site';
import { safeJsonLd } from '@/lib/utils';

describe('parseSiteContent (tolérant)', () => {
  it('renvoie un contenu vide valide sur JSON invalide', () => {
    const c = parseSiteContent('pas du json {{{');
    expect(c.strengths).toHaveLength(3);
    expect(c.testimonials).toEqual([]);
  });

  it('normalise toujours les forces à exactement 3', () => {
    const c = parseSiteContent({ hero: {}, strengths: [{ title: 'A', description: '', enabled: true }], testimonials: [], about: {}, contact: {} });
    expect(c.strengths).toHaveLength(3);
    expect(c.strengths[0].title).toBe('A');
  });

  it('préserve les champs valides (round-trip hero.title)', () => {
    const c = parseSiteContent({ hero: { title: 'Mon titre' }, strengths: [], testimonials: [], about: {}, contact: {} });
    expect(c.hero.title).toBe('Mon titre');
  });
});

describe('mergeSiteContent (la surcharge non vide gagne, sinon hérite)', () => {
  const base: SiteContent = {
    ...emptySiteContent(),
    hero: { title: 'BASE', subtitle: 'sous-titre base' },
    strengths: [
      { title: 'F1', description: 'd1', enabled: true },
      { title: 'F2', description: 'd2', enabled: true },
      { title: 'F3', description: 'd3', enabled: true },
    ],
    testimonials: [{ quote: 'super', author: 'Marie' }],
    about: { bio: 'bio base' },
    contact: { email: 'base@coach.fr' },
  };

  it('la valeur surchargée non vide remplace la base', () => {
    const over: SiteContent = { ...emptySiteContent(), hero: { title: 'OVER' } };
    const m = mergeSiteContent(base, over);
    expect(m.hero.title).toBe('OVER');
  });

  it('un champ vide hérite de la base (pas de perte de données)', () => {
    const over: SiteContent = { ...emptySiteContent(), hero: { title: 'OVER' } };
    const m = mergeSiteContent(base, over);
    expect(m.hero.subtitle).toBe('sous-titre base');
    expect(m.about.bio).toBe('bio base');
    expect(m.contact.email).toBe('base@coach.fr');
  });

  it('témoignages : la base est conservée si la surcharge est vide', () => {
    const over: SiteContent = { ...emptySiteContent(), testimonials: [] };
    const m = mergeSiteContent(base, over);
    expect(m.testimonials).toEqual(base.testimonials);
  });
});

describe('safeJsonLd (anti-évasion <script>)', () => {
  it('échappe </script> pour empêcher la sortie de balise', () => {
    const out = safeJsonLd({ bio: '</script><img src=x onerror=alert(1)>' });
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<img');
    expect(out).toContain('\\u003c');
  });

  it('reste du JSON valide et fidèle après échappement', () => {
    const obj = { name: 'A & B', note: '<b>x</b>' };
    expect(JSON.parse(safeJsonLd(obj))).toEqual(obj);
  });
});
