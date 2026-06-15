import { Check } from 'lucide-react';
import { headStyle, initials, metaLine, ctaLabelFor, ctaHrefFor, splitLastWord, GRAIN, type Theme } from '../theme';
import { forcesOf } from './ForcesSection';
import type { CoachSiteData, SiteStyle } from '../types';

export default function HeroSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const meta = metaLine(data);
  const accroche = data.heroTagline || 'Ton objectif mérite une vraie méthode.';
  const ctaLabel = ctaLabelFor(data);
  const ctaHref = ctaHrefFor(data);

  // ── Style IMPACT : typographie maximale, photo diagonale, CTA dynamique ──────
  if (style === 'impact') {
    const { head, last } = splitLastWord(accroche);
    const microStats = forcesOf(data).filter((f) => f.title.trim()).slice(0, 3);
    return (
      <section id="accueil" className="cs-hero-impact" style={{ position: 'relative', background: '#0A0A0A', color: '#fff', overflow: 'hidden' }}>
        <div className="cs-hero-impact-inner" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1080, margin: '0 auto', padding: '120px 24px' }}>
          <div className="cs-hero-impact-text" style={{ maxWidth: data.photoUrl ? '56%' : '100%' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: accent }}>
              {data.displayName}{meta ? ` — ${meta}` : ''}
            </p>
            <h1 style={{ ...headFont, margin: '20px 0 0', fontSize: 'clamp(52px, 8vw, 120px)', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase', whiteSpace: 'pre-line' }}>
              {head ? <>{head} </> : null}
              <span style={{ color: accent }}>{last}</span>
            </h1>
            {data.heroSubtitle && (
              <p style={{ margin: '20px 0 0', fontSize: 'clamp(13px, 1.4vw, 17px)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, lineHeight: 1.6 }}>
                {data.heroSubtitle}
              </p>
            )}
            {microStats.length > 0 && (
              <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {microStats.map((f, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, opacity: 0.7 }}>
                    <Check size={15} color={accent} strokeWidth={3} /> {f.title}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 38 }}>
              <a href={ctaHref} className="cs-cta-impact cs-cta-pulse" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 56, padding: '0 36px', background: accent, color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 0 }}>
                {ctaLabel}
              </a>
              <p style={{ fontSize: 13, opacity: 0.5, margin: '12px 0 0' }}>Réponse sous 24h · Sans engagement</p>
            </div>
          </div>

          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={`Photo de ${data.displayName}`} className="cs-hero-impact-photo" />
          ) : (
            <span aria-hidden className="cs-hero-impact-initials" style={{ ...headFont, color: accent }}>{initials(data.displayName)}</span>
          )}
          {data.photoUrl && <div aria-hidden className="cs-hero-impact-fade" />}
        </div>

        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: accent, zIndex: 2 }} />

        <style>{`
          .cs-hero-impact{min-height:100vh;display:flex;align-items:center}
          .cs-hero-impact-photo{position:absolute;right:0;top:0;height:100%;width:44%;object-fit:cover;object-position:center top;clip-path:polygon(12% 0,100% 0,100% 100%,0 100%);z-index:1}
          .cs-hero-impact-fade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to right,#0a0a0a 35%,rgba(10,10,10,0.6) 60%,transparent 80%)}
          .cs-hero-impact-initials{position:absolute;right:24px;bottom:0;font-size:clamp(140px,22vw,320px);line-height:1;opacity:.05;letter-spacing:-.05em;z-index:1;user-select:none;pointer-events:none}
          .cs-cta-impact{transition:all .15s ease-out}
          .cs-cta-impact:hover{filter:brightness(1.1);transform:translateY(-2px);box-shadow:0 10px 24px ${accent}66}
          @keyframes cs-pulse-impact{0%,100%{box-shadow:0 0 0 0 ${accent}00}50%{box-shadow:0 0 0 10px ${accent}26}}
          .cs-cta-pulse{animation:cs-pulse-impact 3s ease-in-out infinite}
          @media (prefers-reduced-motion: reduce){.cs-cta-pulse{animation:none}}
          @media (max-width:768px){
            .cs-hero-impact{display:block;min-height:auto}
            .cs-hero-impact-inner{padding:96px 24px 0!important}
            .cs-hero-impact-text{max-width:100%!important}
            .cs-hero-impact-photo{position:static;width:100%;height:55vw;clip-path:none;margin-top:28px;display:block}
            .cs-hero-impact-fade{display:none!important}
            .cs-hero-impact-initials{display:none}
          }
        `}</style>
      </section>
    );
  }

  // ── Styles CLARTÉ & AUTHENTICITÉ (rendu actuel — redesign en G.2) ────────────
  const heroBig = 'clamp(2.4rem, 7vw, 4.8rem)';
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
          <h1 style={{ ...headFont, margin: '20px 0 0', fontSize: heroBig, lineHeight: 1.05 }}>{accroche}</h1>
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
      <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
    </section>
  );
}
