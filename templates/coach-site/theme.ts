import type React from 'react';
import { inter, bebas, jakarta, lato, playfair } from './fonts';
import type { SiteStyle, CoachServiceItem, CoachTestimonialItem, CoachResultItem, CoachSiteData } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Thème + helpers purs du site vitrine (sans React DOM). Importé par l'assembleur
// et par tous les composants de section → pas de cycle.
// ─────────────────────────────────────────────────────────────────────────────

/** Couleur d'accent unique choisie selon la spécialité du coach. */
export function accentForSpeciality(speciality: string): string {
  const s = (speciality || '').toLowerCase();
  if (/hyrox|cross|wod|conditioning|metcon/.test(s)) return '#FF4D00'; // orange
  if (/yoga|pilates|mobilit|souplesse|stretch/.test(s)) return '#7A9E7E'; // vert sauge
  if (/run|course|trail|marathon|cardio|endurance/.test(s)) return '#1A56DB'; // bleu
  if (/box|mma|combat|krav/.test(s)) return '#D7263D'; // rouge
  if (/muscu|force|halt|powerlift|body/.test(s)) return '#E8590C'; // orange foncé
  if (/nutri|dietet/.test(s)) return '#0F8B5F'; // vert
  return '#FF4D00';
}

/** Style recommandé selon le ton du coach (présélection). */
export function styleForTone(tone: string | null | undefined): SiteStyle {
  if (tone === 'educatif') return 'clarte';
  if (tone === 'personnel') return 'authenticite';
  return 'impact';
}

export function defaultServices(speciality: string): CoachServiceItem[] {
  const s = speciality.toLowerCase();
  if (/hyrox|cross|conditioning/.test(s)) {
    return [
      { title: 'Préparation Hyrox', description: 'Programmation course + stations, pacing et mental de compétition pour ton prochain chrono.' },
      { title: 'Force & Conditioning', description: 'Développe la puissance et l’endurance qui font la différence le jour J.' },
      { title: 'Suivi PPL', description: 'Push/Pull/Legs structuré, progression mesurée semaine après semaine, sans blessure.' },
    ];
  }
  return [
    { title: 'Coaching individuel', description: `Un accompagnement sur-mesure en ${s}, calibré sur ton niveau et tes objectifs.` },
    { title: 'Programmation', description: 'Des plans d’entraînement construits autour de ton quotidien et de ta progression.' },
    { title: 'Suivi & cap', description: 'Un suivi régulier pour garder le rythme, ajuster, et célébrer chaque palier.' },
  ];
}
export function defaultTestimonials(): CoachTestimonialItem[] {
  return [
    { name: 'Marie L.', quote: 'Un accompagnement qui a tout changé. Je n’ai jamais été aussi régulière et motivée.' },
    { name: 'Thomas R.', quote: 'Des séances exigeantes mais bienveillantes. Des résultats visibles en quelques semaines.' },
  ];
}
export function defaultResults(speciality: string): CoachResultItem[] {
  if (/hyrox|cross|conditioning/.test(speciality.toLowerCase())) {
    return [
      { result: 'J’ai terminé mon premier Hyrox en 1h12.', name: 'Marie', city: 'Nice' },
      { result: 'En 4 mois : +8 kg de muscle et un dos qui ne me fait plus mal.', name: 'Marc', city: 'Cagnes-sur-Mer' },
    ];
  }
  return [
    { result: 'Première vraie régularité depuis des années — et ça se voit.', name: 'Julie', city: '' },
    { result: 'Plus de force, plus d’énergie, et surtout plus de confiance.', name: 'Karim', city: '' },
  ];
}

export const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

export interface Theme {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  fontBody: string;
  fontHead: string;
  headWeight: number;
  headTransform: 'uppercase' | 'none';
  headTracking: string;
  heroDark: boolean;
}

export function themeFor(style: SiteStyle): Theme {
  if (style === 'clarte') {
    return {
      bg: '#FAFAFA', surface: '#FFFFFF', ink: '#111827', muted: '#6B7280', border: '#E5E7EB',
      fontBody: inter.style.fontFamily, fontHead: jakarta.style.fontFamily,
      headWeight: 800, headTransform: 'none', headTracking: '-0.02em', heroDark: false,
    };
  }
  if (style === 'authenticite') {
    return {
      bg: '#FAF7F2', surface: '#FFFFFF', ink: '#1C1917', muted: '#78716C', border: '#E7E1D8',
      fontBody: lato.style.fontFamily, fontHead: playfair.style.fontFamily,
      headWeight: 700, headTransform: 'none', headTracking: '-0.01em', heroDark: true,
    };
  }
  return {
    bg: '#0A0A0A', surface: '#111111', ink: '#FFFFFF', muted: '#8A8A8A', border: '#222222',
    fontBody: inter.style.fontFamily, fontHead: bebas.style.fontFamily,
    headWeight: 400, headTransform: 'uppercase', headTracking: '0.01em', heroDark: true,
  };
}

/** Style typographique des titres pour un thème donné. */
export function headStyle(t: Theme): React.CSSProperties {
  return { fontFamily: t.fontHead, fontWeight: t.headWeight, letterSpacing: t.headTracking, textTransform: t.headTransform };
}

/** Initiales élégantes (placeholder hero quand aucune photo). */
export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'C';
}

/** « Premier · Ville » — méta affichée sous le nom. */
export function metaLine(data: CoachSiteData): string {
  return [data.speciality, data.city ?? ''].filter(Boolean).join(' · ');
}

/** Libellé CTA déduit des moyens de contact (si le coach n'a pas défini le sien). */
export function ctaLabelFor(data: CoachSiteData): string {
  if (data.cta?.trim()) return data.cta.trim();
  if (data.bookingUrl) return 'Réserver ma séance';
  if (data.whatsapp) return 'Écrire sur WhatsApp';
  if (data.contactEmail) return "M'envoyer un email";
  return 'Découvrir mon approche';
}

/** Lien cible du CTA principal (booking > whatsapp > email > ancre contact). */
export function ctaHrefFor(data: CoachSiteData): string {
  return (
    data.bookingUrl ||
    (data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}` : '') ||
    (data.contactEmail ? `mailto:${data.contactEmail}` : '') ||
    '#contact'
  );
}

/** Sépare le dernier mot d'un titre (rendu en accent / souligné selon le style). */
export function splitLastWord(title: string): { head: string; last: string } {
  const t = (title || '').trim();
  const m = t.match(/^([\s\S]*\S)\s+(\S+)$/);
  return m ? { head: m[1], last: m[2] } : { head: '', last: t };
}
