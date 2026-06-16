import Image from 'next/image';
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
            // next/image NON utilisé ici volontairement : la photo Impact est positionnée
            // absolute (desktop) ↔ static (mobile) avec un clip-path diagonal ; `Image fill`
            // exige un ancêtre positionné à chaque breakpoint et l'image s'échapperait au
            // reflow mobile. Photo déjà ré-encodée 1200px/JPEG côté upload → gain marginal.
            // `fetchPriority="high"` : c'est le candidat LCP du style Impact (faute de
            // `priority` next/image), on demande au navigateur de la charger en priorité.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={`Photo de ${data.displayName}`} className="cs-hero-impact-photo" fetchPriority="high" />
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

  // ── Style CLARTÉ : titre souligné, photo « polaroid », clair et aéré ─────────
  if (style === 'clarte') {
    const { head, last } = splitLastWord(accroche);
    const headline = (data.storyQuote || '').trim();
    return (
      <section id="accueil" className="cs-hero-clarte" style={{ position: 'relative', background: t.bg, color: t.ink, overflow: 'hidden' }}>
        <div className="cs-hero-clarte-grid" style={{ maxWidth: 1080, margin: '0 auto', padding: '120px 24px', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent }}>
              {data.displayName}{meta ? ` — ${meta}` : ''}
            </p>
            <h1 style={{ ...headFont, margin: '18px 0 0', fontSize: 'clamp(38px, 5vw, 78px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              {head ? <>{head} </> : null}
              <span style={{ textDecoration: 'underline', textDecorationColor: accent, textDecorationThickness: '4px', textUnderlineOffset: '8px', textDecorationSkipInk: 'none' }}>{last}</span>
            </h1>
            {(data.heroSubtitle || data.bio) && (
              <p style={{ margin: '24px 0 0', fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)', maxWidth: 520, lineHeight: 1.6, color: t.muted }}>
                {data.heroSubtitle || data.bio}
              </p>
            )}
            <div style={{ marginTop: 34, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <a href={ctaHref} className="cs-cta" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 28px', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: 12 }}>
                {ctaLabel}
              </a>
              {data.city && <span style={{ fontSize: 13, fontWeight: 600, color: t.muted, letterSpacing: '0.04em' }}>Coach à {data.city}</span>}
            </div>
          </div>

          <div className="cs-hero-clarte-media" style={{ position: 'relative' }}>
            {data.photoUrl ? (
              <div className="cs-hero-clarte-frame" style={{ position: 'relative', maxWidth: 460, marginLeft: 'auto', aspectRatio: '4/5', border: '8px solid #fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.14)' }}>
                <Image src={data.photoUrl} alt={data.displayName} fill priority sizes="(max-width: 768px) 100vw, 40vw" style={{ objectFit: 'cover' }} />
                {headline && (
                  <span className="cs-hero-clarte-badge" style={{ position: 'absolute', bottom: 16, left: -20, background: '#fff', borderRadius: 9999, padding: '8px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600, color: t.ink }}>
                    ✓ {headline.length > 30 ? `${headline.slice(0, 30)}…` : headline}
                  </span>
                )}
              </div>
            ) : (
              <svg viewBox="0 0 460 520" width="100%" style={{ maxWidth: 460, marginLeft: 'auto', display: 'block' }} aria-hidden>
                <rect x="40" y="40" width="380" height="440" rx="24" fill={accent} opacity="0.05" />
                <circle cx="150" cy="190" r="110" fill={accent} opacity="0.12" />
                <circle cx="320" cy="330" r="80" fill={accent} opacity="0.18" />
                <rect x="250" y="120" width="120" height="120" rx="20" fill={accent} opacity="0.1" />
                <circle cx="360" cy="170" r="28" fill={accent} opacity="0.25" />
              </svg>
            )}
          </div>
        </div>
        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
        <style>{`
          @media (max-width:768px){
            .cs-hero-clarte-grid{grid-template-columns:1fr!important;gap:28px!important;padding:88px 24px 56px!important}
            .cs-hero-clarte-media{order:-1}
            .cs-hero-clarte-frame{max-width:100%!important;border:none!important;border-radius:16px!important;aspect-ratio:auto!important;height:280px!important}
            .cs-hero-clarte-badge{display:none!important}
          }
        `}</style>
      </section>
    );
  }

  // ── Style AUTHENTICITÉ : photo plein cadre + overlay, titre serif + mot italique ─
  const words = accroche.trim().split(/\s+/);
  let italicIdx = words.findIndex((w, i) => i > 0 && w.replace(/[^\p{L}]/gu, '').length >= 4);
  if (italicIdx === -1) italicIdx = words.length - 1;
  const onPhoto = !!data.photoUrl;
  const titleColor = onPhoto ? '#fff' : t.ink;

  return (
    <section id="accueil" className="cs-hero-auth" style={{ position: 'relative', overflow: 'hidden', background: onPhoto ? '#0A0A0A' : t.bg }}>
      {onPhoto ? (
        <>
          <div className="cs-hero-auth-photo" style={{ position: 'relative', width: '100%', height: 'clamp(380px, 58vh, 680px)' }}>
            <Image src={data.photoUrl!} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
          </div>
          <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, backgroundSize: '180px', opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 45%, transparent 72%)' }} />
          <div className="cs-hero-auth-text" style={{ position: 'absolute', left: 48, right: 48, bottom: 48 }}>
            <HeroAuthContent words={words} italicIdx={italicIdx} headFont={headFont} titleColor={titleColor} accent={accent} data={data} meta={meta} ctaHref={ctaHref} ctaLabel={ctaLabel} onPhoto />
          </div>
        </>
      ) : (
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${accent}14 1.4px, transparent 1.4px)`, backgroundSize: '20px 20px', opacity: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <HeroAuthContent words={words} italicIdx={italicIdx} headFont={headFont} titleColor={titleColor} accent={accent} data={data} meta={meta} ctaHref={ctaHref} ctaLabel={ctaLabel} onPhoto={false} />
          </div>
        </div>
      )}
      <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
      <style>{`
        .cs-cta-auth:hover{background:${accent}!important;color:#fff!important}
        @media (max-width:768px){
          .cs-hero-auth-photo{height:clamp(300px,50vh,500px)!important}
          .cs-hero-auth-text{left:24px!important;right:24px!important;bottom:28px!important}
        }
      `}</style>
    </section>
  );
}

/** Contenu textuel du hero Authenticité (réutilisé avec/sans photo). */
function HeroAuthContent({
  words, italicIdx, headFont, titleColor, accent, data, meta, ctaHref, ctaLabel, onPhoto,
}: {
  words: string[]; italicIdx: number; headFont: React.CSSProperties; titleColor: string; accent: string;
  data: CoachSiteData; meta: string; ctaHref: string; ctaLabel: string; onPhoto: boolean;
}) {
  const subColor = onPhoto ? 'rgba(255,255,255,0.85)' : '#78716C';
  return (
    <>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: onPhoto ? '#fff' : accent }}>
        {data.displayName}{meta ? ` — ${meta}` : ''}
      </p>
      <h1 style={{ ...headFont, margin: '14px 0 0', fontSize: 'clamp(34px, 4.5vw, 70px)', lineHeight: 1.15, letterSpacing: '-0.01em', color: titleColor }}>
        {words.map((w, i) =>
          i === italicIdx ? (
            <em key={i} style={{ fontStyle: 'italic', color: accent }}>{w} </em>
          ) : (
            <span key={i}>{w} </span>
          )
        )}
      </h1>
      {(data.heroSubtitle || data.bio) && (
        <p style={{ margin: '20px 0 0', fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)', maxWidth: 560, lineHeight: 1.6, color: subColor }}>
          {data.heroSubtitle || data.bio}
        </p>
      )}
      <div style={{ marginTop: 30 }}>
        <a href={ctaHref} className="cs-cta-auth" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 50, padding: '0 28px', border: `2px solid ${accent}`, background: 'transparent', color: onPhoto ? '#fff' : accent, fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: 8, transition: 'all 200ms ease-out' }}>
          {ctaLabel}
        </a>
      </div>
    </>
  );
}
