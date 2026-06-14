import { runClaudeCode } from './claude-code';
import { extractJson } from './parse-json';
import { accentForSpeciality, defaultServices, defaultResults } from '@/templates/coach-site/CoachSite';
import { logError } from './logger';

// Génère le contenu d'un site coach v2 (authentique, premium) via Claude Code (mock fallback).

export interface SiteService {
  title: string;
  description: string;
  icon: string; // conservé pour compat
}
export interface SiteTestimonial {
  name: string;
  quote: string;
}
export interface SiteResult {
  result: string;
  name: string;
  city?: string;
}
export interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  story: string;
  story_quote: string;
  services: SiteService[];
  about: string;
  testimonials: SiteTestimonial[];
  results: SiteResult[];
  accent_color: string;
  cta: string;
  seo_description: string;
}

export interface SiteGenInput {
  name: string;
  speciality: string;
  city?: string | null;
  bio?: string | null;
  strengths?: string[];
  testimonial?: string | null;
  tone?: string | null;
  /** 3 derniers posts approuvés du coach — alimentent le ton/style du site. */
  recentPosts?: string[];
}

function buildPrompt(d: SiteGenInput): string {
  const posts = (d.recentPosts ?? []).slice(0, 3).map((p, i) => `Post ${i + 1} : ${p.slice(0, 300)}`).join('\n');
  return `Tu génères le contenu d'un site coach sportif authentique et premium.

Profil : ${d.name}, ${d.speciality}, ${d.city ?? 'ville non précisée'}
Bio : ${d.bio ?? 'non fournie'}
Ton : ${d.tone ?? 'motivant'}
Avis clients / points forts : ${(d.strengths ?? []).join(', ') || d.testimonial || 'non fournis'}
Posts Instagram approuvés :
${posts || '(aucun pour l’instant)'}

Génère en JSON UNIQUEMENT :
- hero_tagline : phrase d'accroche courte (max 8 mots, première personne, percutante)
- story : texte "Mon histoire" (≈150 mots, première personne, authentique, narration, PAS de bullet points)
- story_quote : phrase clé extraite du story (max 15 mots, marquante)
- services : 3 services réels basés sur la spécialité (objets {title court, description concrète ≈20 mots})
- results : 2 témoignages reformulés courts (objets {result, name (prénom), city})
- accent_color : couleur hex adaptée à la spécialité (Hyrox→#FF4D00, Yoga→#7A9E7E, Running→#1A56DB)
- seo_description : meta description (max 155 caractères)

Ton : authentique, direct, sans jargon marketing — comme si le coach l'avait écrit lui-même.
Si le coach écrit "Tu crois que tes jambes lâchent", le site doit avoir ce même ton direct et nerveux.`;
}

function normalize(raw: unknown, d: SiteGenInput): SiteContent | null {
  const o = raw as Record<string, unknown>;

  const services = Array.isArray(o?.services)
    ? o.services.slice(0, 3).map((s) => {
        const it = s as Record<string, unknown>;
        return { title: String(it.title ?? 'Service').trim(), description: String(it.description ?? '').trim(), icon: 'Dumbbell' };
      })
    : [];

  const results = Array.isArray(o?.results)
    ? o.results.slice(0, 2).map((r) => {
        const it = r as Record<string, unknown>;
        return { result: String(it.result ?? it.quote ?? '').trim(), name: String(it.name ?? 'Client').trim(), city: String(it.city ?? '').trim() };
      })
    : [];

  const story = typeof o?.story === 'string' ? o.story.trim() : '';
  if (!story || services.length < 3) return null;

  const accent =
    typeof o?.accent_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(o.accent_color.trim())
      ? o.accent_color.trim()
      : accentForSpeciality(d.speciality);

  return {
    hero_title: String(o?.hero_tagline ?? d.name).trim(),
    hero_subtitle: `${d.speciality}${d.city ? ` · ${d.city}` : ''}`,
    hero_tagline: String(o?.hero_tagline ?? 'Ton objectif mérite une vraie méthode.').trim(),
    story,
    story_quote: String(o?.story_quote ?? '').trim(),
    services,
    about: story,
    testimonials: results.map((r) => ({ name: r.name, quote: r.result })),
    results: results.length >= 2 ? results : defaultResults(d.speciality),
    accent_color: accent,
    cta: 'Réserver une séance',
    seo_description: String(o?.seo_description ?? `${d.name}, coach ${d.speciality}${d.city ? ` à ${d.city}` : ''}.`).slice(0, 160),
  };
}

export async function generateSiteContent(d: SiteGenInput): Promise<SiteContent> {
  const prompt = buildPrompt(d);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const text = await runClaudeCode(prompt);
      const parsed = normalize(extractJson(text), d);
      if (parsed) return parsed;
    } catch (err) {
      logError('[site-content] génération échouée', { attempt, error: String(err) });
    }
  }
  return defaultContent(d);
}

// Template par défaut (fallback ultime si la génération IA échoue).
export function defaultContent(d: SiteGenInput): SiteContent {
  const place = d.city ? ` à ${d.city}` : '';
  const services = defaultServices(d.speciality).map((s) => ({ ...s, icon: 'Dumbbell' }));
  const results = defaultResults(d.speciality);
  const story =
    d.bio ||
    `Coach ${d.speciality.toLowerCase()}${place}, j'accompagne celles et ceux qui veulent des résultats concrets, pas des promesses. ` +
      `Mon approche : de la méthode, de la constance, et un suivi exigeant mais humain. On avance ensemble, à ton rythme, vers ton objectif.`;
  return {
    hero_title: d.name,
    hero_subtitle: `${d.speciality}${d.city ? ` · ${d.city}` : ''}`,
    hero_tagline: 'Ton corps peut. C’est ta tête qu’on entraîne d’abord.',
    story,
    story_quote: 'La méthode bat la motivation. Toujours.',
    services,
    about: story,
    testimonials: results.map((r) => ({ name: r.name, quote: r.result })),
    results,
    accent_color: accentForSpeciality(d.speciality),
    cta: 'Réserver une séance',
    seo_description: `${d.name} — Coach ${d.speciality}${place}. Méthode, suivi, résultats durables.`.slice(0, 160),
  };
}
