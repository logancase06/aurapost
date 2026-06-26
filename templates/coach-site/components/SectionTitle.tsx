import type React from 'react';
import { headStyle, splitLastWord, type Theme } from '../theme';
import type { SiteStyle } from '../types';
import { assertStyleUnreachable } from '../types';

// Titre de section dont le TRAITEMENT typographique varie par style (B.3) — chaque style
// rejoue la signature de son hero sur le dernier mot, plutôt qu'un H2 uniforme :
//   impact       → CAPITALES, dernier mot en accent plein (punch, comme le hero).
//   clarte       → dernier mot souligné à l'accent (comme le hero clarté).
//   authenticite → dernier mot en italique accent (comme le mot italique du hero auth).
// Purement typographique : aucune incidence sur les grilles/layout des sections.
export default function SectionTitle({
  children,
  style,
  accent,
  t,
  color,
}: {
  children: string;
  style: SiteStyle;
  accent: string;
  t: Theme;
  color?: string;
}) {
  const { head, last } = splitLastWord(children);
  const base: React.CSSProperties = {
    ...headStyle(t),
    fontSize: 'clamp(1.9rem, 5vw, 3rem)',
    lineHeight: 1.1,
    margin: '0 0 48px',
    color: color ?? t.ink,
    overflowWrap: 'break-word',
  };

  if (style === 'clarte') {
    return (
      <h2 style={base}>
        {head ? `${head} ` : ''}
        <span style={{ textDecoration: 'underline', textDecorationColor: accent, textDecorationThickness: '3px', textUnderlineOffset: '6px', textDecorationSkipInk: 'none' }}>{last}</span>
      </h2>
    );
  }
  if (style === 'authenticite') {
    return (
      <h2 style={base}>
        {head ? `${head} ` : ''}
        <em style={{ fontStyle: 'italic', color: accent }}>{last}</em>
      </h2>
    );
  }
  // impact (headStyle applique déjà uppercase)
  if (style === 'impact') {
    return (
      <h2 style={base}>
        {head ? `${head} ` : ''}
        <span style={{ color: accent }}>{last}</span>
      </h2>
    );
  }
  return assertStyleUnreachable(style);
}
