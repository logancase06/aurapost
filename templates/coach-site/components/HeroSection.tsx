import { headStyle, initials, metaLine, ctaLabelFor, ctaHrefFor, GRAIN, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function HeroSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const meta = metaLine(data);
  const accroche = data.heroTagline || 'Ton objectif mérite une vraie méthode.';
  const ctaLabel = ctaLabelFor(data);
  const ctaHref = ctaHrefFor(data);
  const heroBig = style === 'impact' ? 'clamp(2.8rem, 11vw, 6.5rem)' : 'clamp(2.4rem, 7vw, 4.8rem)';

  return (
    <section id="accueil" style={{ position: 'relative', background: t.heroDark ? '#0A0A0A' : t.bg, color: t.heroDark ? '#fff' : t.ink, overflow: 'hidden' }}>
      {data.photoUrl && t.heroDark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: style === 'authenticite' ? 0.5 : 0.38 }} />
      )}
      {data.photoUrl && t.heroDark && <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.62)' }} />}
      {style === 'authenticite' && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, backgroundSize: '180px', opacity: 0.07, mixBlendMode: 'overlay' }} />
      )}

      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '116px 24px 92px', display: 'grid', gridTemplateColumns: style === 'clarte' && data.photoUrl ? 'minmax(0,1.2fr) minmax(0,0.8fr)' : '1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: accent }}>
            {data.displayName}{meta ? ` — ${meta}` : ''}
          </p>
          <h1 style={{ ...headFont, margin: '20px 0 0', fontSize: heroBig, lineHeight: style === 'impact' ? 0.92 : 1.05 }}>
            {accroche}
          </h1>
          {(data.heroSubtitle || data.bio) && (
            <p style={{ margin: '26px 0 0', fontSize: 'clamp(1.05rem, 2.2vw, 1.4rem)', maxWidth: 560, lineHeight: 1.5, color: t.heroDark ? 'rgba(255,255,255,0.82)' : t.muted }}>
              {data.heroSubtitle || data.bio}
            </p>
          )}
          <div style={{ marginTop: 38, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <a href={ctaHref} className="cs-cta" style={{ display: 'inline-block', padding: '16px 38px', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: style === 'clarte' ? 10 : 2 }}>
              {ctaLabel}
            </a>
            {data.city && (
              <span style={{ fontSize: 13, fontWeight: 600, color: t.heroDark ? 'rgba(255,255,255,0.6)' : t.muted, letterSpacing: '0.04em' }}>
                Coach à {data.city}
              </span>
            )}
          </div>
        </div>

        {style === 'clarte' && data.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 16, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.25)' }} />
        )}
        {style === 'clarte' && !data.photoUrl && (
          <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accent}, ${accent}99)`, color: '#fff', ...headFont, fontSize: 'clamp(3rem,10vw,6rem)' }}>
            {initials(data.displayName)}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: accent }} />
    </section>
  );
}
