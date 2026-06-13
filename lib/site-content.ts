import { runClaudeCode } from './claude-code';
import { extractJson } from './parse-json';
import { logError } from './logger';

// Génération du contenu complet d'une landing coach via le SDK Claude Code (mock fallback).

export interface SiteService {
  title: string;
  description: string;
  icon: string; // nom d'icône Lucide
}
export interface SiteTestimonial {
  name: string;
  quote: string;
}
export interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  services: SiteService[];
  about: string;
  testimonials: SiteTestimonial[];
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
}

function buildPrompt(d: SiteGenInput): string {
  return `Tu es un expert en création de sites web pour coachs sportifs.
Voici les données réelles de ce coach :
- Nom : ${d.name}
- Spécialité : ${d.speciality}
- Ville : ${d.city ?? 'non précisée'}
- Bio Instagram : ${d.bio ?? 'non fournie'}
- Points forts clients : ${(d.strengths ?? []).join(', ') || 'non fournis'}
- Témoignage clé : ${d.testimonial ?? 'non fourni'}
- Ton : ${d.tone ?? 'motivant'}

Génère le contenu complet de sa landing page en JSON :
- hero_title : accroche principale (max 8 mots, percutante)
- hero_subtitle : sous-titre (max 20 mots)
- services : array de 3 services avec titre + description + icône Lucide (champ "icon")
- about : texte "À propos" (max 60 mots, à la première personne)
- testimonials : array de 2 témoignages reformulés depuis les avis (champs "name" et "quote")
- cta : phrase d'appel à l'action (max 10 mots)
- seo_description : meta description SEO (max 155 caractères)
Réponds uniquement en JSON structuré.`;
}

const LUCIDE_ICONS = new Set(['Dumbbell', 'HeartPulse', 'Target', 'Flame', 'Trophy', 'Apple', 'Users', 'Timer', 'Activity']);

function normalize(raw: unknown, d: SiteGenInput): SiteContent | null {
  const o = raw as Record<string, unknown>;
  const services = Array.isArray(o?.services)
    ? o.services.slice(0, 3).map((s) => {
        const it = s as Record<string, unknown>;
        const icon = typeof it.icon === 'string' && LUCIDE_ICONS.has(it.icon) ? it.icon : 'Dumbbell';
        return {
          title: String(it.title ?? 'Service'),
          description: String(it.description ?? ''),
          icon,
        };
      })
    : [];
  const testimonials = Array.isArray(o?.testimonials)
    ? o.testimonials.slice(0, 2).map((t) => {
        const it = t as Record<string, unknown>;
        return { name: String(it.name ?? 'Client'), quote: String(it.quote ?? '') };
      })
    : [];

  const hero_title = typeof o?.hero_title === 'string' ? o.hero_title.trim() : '';
  if (!hero_title || services.length < 3) return null;

  return {
    hero_title,
    hero_subtitle: String(o?.hero_subtitle ?? `${d.speciality}${d.city ? ` à ${d.city}` : ''}`),
    services,
    about: String(o?.about ?? d.bio ?? ''),
    testimonials: testimonials.length >= 2 ? testimonials : defaultTestimonials(d),
    cta: String(o?.cta ?? 'Réservez votre première séance'),
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

function defaultTestimonials(d: SiteGenInput): SiteTestimonial[] {
  if (d.testimonial) {
    return [
      { name: 'Client satisfait', quote: d.testimonial },
      { name: 'Marie L.', quote: 'Un accompagnement qui a tout changé pour moi.' },
    ];
  }
  return [
    { name: 'Marie L.', quote: 'Un accompagnement qui a tout changé. Je n’ai jamais été aussi régulière.' },
    { name: 'Thomas R.', quote: 'Des séances exigeantes mais bienveillantes. Des résultats en quelques semaines.' },
  ];
}

// Template par défaut (fallback ultime si la génération IA échoue 3 fois).
export function defaultContent(d: SiteGenInput): SiteContent {
  const place = d.city ? ` à ${d.city}` : '';
  return {
    hero_title: `Atteignez vos objectifs avec ${d.name}`,
    hero_subtitle: `Coach ${d.speciality}${place} — un accompagnement personnalisé pour des résultats durables.`,
    services: [
      { title: 'Coaching individuel', description: `Un suivi sur-mesure en ${d.speciality.toLowerCase()}, adapté à votre niveau.`, icon: 'Dumbbell' },
      { title: 'Programmes personnalisés', description: 'Des plans d’entraînement et de nutrition construits pour votre quotidien.', icon: 'Target' },
      { title: 'Suivi & motivation', description: 'Un suivi régulier pour garder le cap et célébrer vos progrès.', icon: 'HeartPulse' },
    ],
    about: d.bio || `Coach ${d.speciality}${place}, je vous accompagne pas à pas vers vos objectifs avec exigence et bienveillance.`,
    testimonials: defaultTestimonials(d),
    cta: 'Réservez votre première séance',
    seo_description: `${d.name} — Coach ${d.speciality}${place}. Coaching personnalisé, résultats durables.`.slice(0, 160),
  };
}
