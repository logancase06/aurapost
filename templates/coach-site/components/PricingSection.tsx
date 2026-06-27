import Reveal from '../Reveal';
import { headStyle, type Theme } from '../theme';
import SectionTitle from './SectionTitle';
import type { CoachSiteData, SiteStyle } from '../types';

export default function PricingSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  if (!data.pricing?.length) return null;
  const headFont = headStyle(t);
  const wrap = { maxWidth: 1080, margin: '0 auto', padding: '100px 24px' } as const;

  return (
    <Reveal as="section" style={{ background: style === 'impact' ? `${accent}10` : t.bg, ...wrap }}>
      <SectionTitle style={style} accent={accent} t={t}>Mes tarifs</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 40 }}>
        {data.pricing.map((offer, i) => (
          <div
            key={i}
            style={{
              background: offer.featured ? accent : t.surface,
              border: offer.featured ? 'none' : `1px solid ${t.border}`,
              borderRadius: 16,
              padding: '32px 28px',
              position: 'relative',
              color: offer.featured ? '#fff' : t.ink,
            }}
          >
            {offer.featured && (
              <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: accent, fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 12px', whiteSpace: 'nowrap' }}>
                POPULAIRE
              </span>
            )}
            <h3 style={{ ...headFont, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', margin: '0 0 8px' }}>{offer.name}</h3>
            {offer.duration && (
              <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>{offer.duration}</p>
            )}
            <p style={{ ...headFont, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 16px', color: offer.featured ? '#fff' : accent }}>
              {offer.price}
            </p>
            {offer.description && (
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: offer.featured ? 0.9 : 0.7, margin: 0 }}>{offer.description}</p>
            )}
          </div>
        ))}
      </div>
    </Reveal>
  );
}
