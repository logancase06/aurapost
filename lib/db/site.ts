import { z } from 'zod';
import type { SiteContent as GeneratedCopy, SiteGenInput } from '@/lib/site-content';
import { accentForSpeciality, defaultServices, defaultTestimonials, defaultResults } from '@/templates/coach-site/CoachSite';

// ─────────────────────────────────────────────────────────────────────────────
// Modèle de contenu éditable du site vitrine. Stocké dans websites.content (JSON),
// shape unique (généré PUIS édité). getCoachSiteData fusionne ce contenu par-dessus
// une base dérivée du profil (mergeSiteContent) : un champ vide hérite de la base,
// le coach ne perd jamais le contenu auto s'il ne remplit pas tout.
// ─────────────────────────────────────────────────────────────────────────────

export const SiteContentSchema = z.object({
  hero: z.object({
    title: z.string().max(80).optional(),
    subtitle: z.string().max(200).optional(),
    ctaLabel: z.string().max(30).optional(),
    ctaUrl: z.string().max(300).optional(),
    photoUrl: z.string().max(2000).optional(),
  }),
  strengths: z
    .array(z.object({ title: z.string().max(40), description: z.string().max(120), enabled: z.boolean() }))
    .length(3),
  testimonials: z
    .array(z.object({ quote: z.string().max(300), author: z.string().max(50), result: z.string().max(60).optional() }))
    .max(6),
  about: z.object({
    bio: z.string().max(800).optional(),
    headline: z.string().max(100).optional(),
    photoUrl: z.string().max(2000).optional(),
  }),
  contact: z.object({
    email: z.string().email().optional().or(z.literal('')),
    whatsapp: z.string().max(30).optional(),
    instagram: z.string().max(300).optional(),
    calendly: z.string().url().optional().or(z.literal('')),
  }),
  services: z
    .array(z.object({ title: z.string().max(60), description: z.string().max(200), enabled: z.boolean() }))
    .max(4)
    .optional(),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

const emptyStrength = () => ({ title: '', description: '', enabled: true });

/** Contenu vide valide (3 forces désactivées, reste vide). Fallback sûr. */
export function emptySiteContent(): SiteContent {
  return {
    hero: {},
    strengths: [
      { title: '', description: '', enabled: false },
      { title: '', description: '', enabled: false },
      { title: '', description: '', enabled: false },
    ],
    testimonials: [],
    about: {},
    contact: {},
    services: [],
  };
}

/** Parse + valide le JSON stocké. Tolérant : complète les manques, jamais de crash. */
export function parseSiteContent(raw: unknown): SiteContent {
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return emptySiteContent();
    }
  }
  const o = (obj ?? {}) as Record<string, unknown>;
  // Normalise les forces à exactement 3 avant validation (length(3)).
  if (Array.isArray(o.strengths)) {
    const s = o.strengths.slice(0, 3);
    while (s.length < 3) s.push(emptyStrength());
    o.strengths = s;
  } else {
    o.strengths = emptySiteContent().strengths;
  }
  o.testimonials = Array.isArray(o.testimonials) ? o.testimonials : [];
  o.hero = o.hero ?? {};
  o.about = o.about ?? {};
  o.contact = o.contact ?? {};
  const res = SiteContentSchema.safeParse(o);
  return res.success ? res.data : emptySiteContent();
}

const nz = (v: string | undefined | null): string => (v ?? '').trim();
const pick = (over: string | undefined, base: string | undefined): string | undefined => (nz(over) ? over : base);

/** Fusionne : la surcharge non vide gagne, sinon on hérite de la base (généré). */
export function mergeSiteContent(base: SiteContent, over: SiteContent): SiteContent {
  const strengths = base.strengths.map((b, i) => {
    const o = over.strengths[i];
    if (!o) return b;
    const hasContent = nz(o.title) || nz(o.description);
    return {
      title: pick(o.title, b.title) ?? '',
      description: pick(o.description, b.description) ?? '',
      // enabled de la surcharge fait foi dès que la carte a du contenu (override explicite).
      enabled: hasContent ? o.enabled : b.enabled,
    };
  });

  const testimonials = over.testimonials.length ? over.testimonials : base.testimonials;
  const services = (over.services?.length ? over.services : base.services) ?? [];

  return {
    hero: {
      title: pick(over.hero.title, base.hero.title),
      subtitle: pick(over.hero.subtitle, base.hero.subtitle),
      ctaLabel: pick(over.hero.ctaLabel, base.hero.ctaLabel),
      ctaUrl: pick(over.hero.ctaUrl, base.hero.ctaUrl),
      photoUrl: pick(over.hero.photoUrl, base.hero.photoUrl),
    },
    strengths,
    testimonials,
    about: {
      bio: pick(over.about.bio, base.about.bio),
      headline: pick(over.about.headline, base.about.headline),
      photoUrl: pick(over.about.photoUrl, base.about.photoUrl),
    },
    contact: {
      email: pick(over.contact.email, base.contact.email),
      whatsapp: pick(over.contact.whatsapp, base.contact.whatsapp),
      instagram: pick(over.contact.instagram, base.contact.instagram),
      calendly: pick(over.contact.calendly, base.contact.calendly),
    },
    services,
  };
}

export interface BaselineInput {
  displayName: string;
  speciality: string;
  city?: string | null;
  bio?: string | null;
  headline?: string | null; // linkedin_headline
  strengths?: string[] | null;
  email?: string | null;
  instagramUrl?: string | null;
  photoUrl?: string | null;
}

/** Base dérivée du profil (sans IA) — fallback ultime pour les champs vides. */
export function buildGeneratedSiteContent(p: BaselineInput): SiteContent {
  const services = defaultServices(p.speciality).map((s) => ({ title: s.title, description: s.description, enabled: true }));
  const strengthTitles = (p.strengths?.length ? p.strengths : services.map((s) => s.title)).slice(0, 3);
  const strengths = [0, 1, 2].map((i) => ({
    title: strengthTitles[i] ?? '',
    description: '',
    enabled: Boolean(strengthTitles[i]),
  }));
  return {
    hero: {
      title: 'Ton objectif mérite une vraie méthode.',
      subtitle: p.bio ?? `Coach ${p.speciality}${p.city ? ` à ${p.city}` : ''}.`,
      ctaLabel: 'Prendre RDV',
      ctaUrl: '',
      photoUrl: p.photoUrl ?? '',
    },
    strengths,
    testimonials: defaultTestimonials().map((t) => ({ quote: t.quote, author: t.name })),
    about: { bio: p.bio ?? '', headline: p.headline ?? '', photoUrl: p.photoUrl ?? '' },
    contact: { email: p.email ?? '', whatsapp: '', instagram: p.instagramUrl ?? '', calendly: '' },
    services,
  };
}

/** Mappe la sortie IA (shape historique) vers le SiteContent éditable. */
export function fromGeneratedCopy(copy: GeneratedCopy, input: SiteGenInput, opts?: { instagramUrl?: string | null }): SiteContent {
  const titles = (input.strengths?.length ? input.strengths : copy.services.map((s) => s.title)).slice(0, 3);
  const strengths = [0, 1, 2].map((i) => ({ title: titles[i] ?? '', description: '', enabled: Boolean(titles[i]) }));
  const testimonials = (copy.results?.length ? copy.results : []).map((r) => ({
    quote: r.result,
    author: r.name,
    result: r.city || undefined,
  }));
  return {
    hero: { title: copy.hero_tagline || copy.hero_title, subtitle: copy.hero_subtitle, ctaLabel: copy.cta, ctaUrl: '', photoUrl: '' },
    strengths,
    testimonials: testimonials.length ? testimonials : copy.testimonials.map((t) => ({ quote: t.quote, author: t.name })),
    about: { bio: copy.story || copy.about, headline: copy.story_quote, photoUrl: '' },
    contact: { email: '', whatsapp: '', instagram: opts?.instagramUrl ?? '', calendly: '' },
    services: copy.services.map((s) => ({ title: s.title, description: s.description, enabled: true })),
  };
}

/** Accent du site (selon la spécialité) — réexport pratique pour le renderer/SEO. */
export function siteAccent(speciality: string): string {
  return accentForSpeciality(speciality);
}

export type { GeneratedCopy };
export { defaultResults };
