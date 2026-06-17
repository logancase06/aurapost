import Image from 'next/image';
import { Check } from 'lucide-react';
import { headStyle, initials, metaLine, ctaLabelFor, ctaHrefFor, splitLastWord, deterministicVariant, type Theme } from '../theme';
import { forcesOf } from './ForcesSection';
import type { CoachSiteData, SiteStyle } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Hero PHOTO-FIRST. La photo du coach est le contenu principal (40–60 % du hero),
// jamais un fond décoratif assombri. Texte réduit à l'essentiel (promesse + 3 preuves
// + 1 CTA). Accent couleur réservé aux éléments actionnables (CTA) + UN mot d'accroche.
// Disposition distincte par style :
//   impact       → sombre, photo dominante à droite (bord net + léger fondu).
//   clarte       → clair, photo et texte côte à côte (split), aéré.
//   authenticite → chaleureux, grande photo en haut + texte sur papier dessous.
// Sans photo : composition typographique/monogramme ÉLÉGANTE (jamais d'initiales géantes).
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const meta = metaLine(data);
  const accroche = data.heroTagline || 'Ton objectif mérite une vraie méthode.';
  const ctaLabel = ctaLabelFor(data);
  const ctaHref = ctaHrefFor(data);
  const hasPhoto = !!data.photoUrl;
  // Variante déterministe par coach (stable, jamais aléatoire) : position du badge Clarté.
  const badgeBottom = deterministicVariant(data.subdomain || data.displayName || '', 14, 30);

  // ── IMPACT : sombre, photo dominante à droite ─────────────────────────────
  if (style === 'impact') {
    const { head, last } = splitLastWord(accroche);
    const microStats = forcesOf(data).filter((f) => f.title.trim()).slice(0, 3);
    return (
      <section id="accueil" className="cs-hero-impact" style={{ position: 'relative', background: '#0A0A0A', color: '#fff', overflow: 'hidden' }}>
        <div className="cs-hero-impact-inner" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1120, margin: '0 auto', padding: '110px 24px' }}>
          <div className="cs-hero-impact-text" style={{ maxWidth: hasPhoto ? '52%' : '100%' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              {data.displayName}{meta ? ` — ${meta}` : ''}
            </p>
            <h1 style={{ ...headFont, margin: '18px 0 0', fontSize: 'clamp(46px, 7vw, 104px)', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase', whiteSpace: 'pre-line' }}>
              {head ? <>{head} </> : null}
              <span style={{ color: accent }}>{last}</span>
            </h1>
            {microStats.length > 0 && (
              <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                {microStats.map((f, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                    <Check size={16} color="#fff" strokeWidth={2.5} /> {f.title}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 36 }}>
              <a href={ctaHref} className="cs-cta-impact" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 56, padding: '0 36px', background: accent, color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4 }}>
                {ctaLabel}
              </a>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '14px 0 0' }}>Réponse sous 24h · Sans engagement</p>
            </div>
          </div>

          {hasPhoto && (
            <>
              {/* Photo dominante. <img> (pas next/image) car positionnée absolute↔static au
                  reflow mobile. fetchPriority high : candidat LCP. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.photoUrl!} alt={`Photo de ${data.displayName}`} className="cs-hero-impact-photo" fetchPriority="high" />
              <div aria-hidden className="cs-hero-impact-fade" />
            </>
          )}
        </div>

        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
        <style>{`
          .cs-hero-impact{min-height:90vh;display:flex;align-items:center}
          .cs-hero-impact-photo{position:absolute;right:0;top:0;height:100%;width:48%;object-fit:cover;object-position:center top;z-index:1}
          .cs-hero-impact-fade{position:absolute;right:48%;top:0;bottom:0;width:18%;z-index:1;pointer-events:none;background:linear-gradient(to right,#0a0a0a,transparent)}
          .cs-cta-impact{transition:filter .15s ease-out,transform .15s ease-out}
          .cs-cta-impact:hover{filter:brightness(1.08);transform:translateY(-2px)}
          @media (max-width:768px){
            .cs-hero-impact{display:block;min-height:auto}
            .cs-hero-impact-inner{padding:92px 24px 0!important}
            .cs-hero-impact-text{max-width:100%!important}
            .cs-hero-impact-photo{position:static;width:100%;height:72vw;margin-top:28px;display:block}
            .cs-hero-impact-fade{display:none!important}
          }
        `}</style>
      </section>
    );
  }

  // ── CLARTÉ : clair, photo et texte côte à côte ────────────────────────────
  if (style === 'clarte') {
    const { head, last } = splitLastWord(accroche);
    const headline = (data.storyQuote || '').trim();
    return (
      <section id="accueil" className="cs-hero-clarte" style={{ position: 'relative', background: t.bg, color: t.ink, overflow: 'hidden' }}>
        <div className="cs-hero-clarte-grid" style={{ maxWidth: 1120, margin: '0 auto', padding: '104px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.muted }}>
              {data.displayName}{meta ? ` — ${meta}` : ''}
            </p>
            <h1 style={{ ...headFont, margin: '16px 0 0', fontSize: 'clamp(34px, 4.6vw, 68px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              {head ? <>{head} </> : null}
              <span style={{ textDecoration: 'underline', textDecorationColor: accent, textDecorationThickness: '4px', textUnderlineOffset: '8px', textDecorationSkipInk: 'none' }}>{last}</span>
            </h1>
            {data.heroSubtitle && (
              <p style={{ margin: '22px 0 0', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', maxWidth: 460, lineHeight: 1.6, color: t.muted }}>
                {data.heroSubtitle}
              </p>
            )}
            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <a href={ctaHref} className="cs-cta" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 28px', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: 12 }}>
                {ctaLabel}
              </a>
              {data.city && <span style={{ fontSize: 13, fontWeight: 600, color: t.muted }}>Coach à {data.city}</span>}
            </div>
          </div>

          <div className="cs-hero-clarte-media" style={{ position: 'relative' }}>
            {hasPhoto ? (
              <div className="cs-hero-clarte-frame" style={{ position: 'relative', maxWidth: 480, marginLeft: 'auto', aspectRatio: '4/5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 70px -24px rgba(0,0,0,0.22)' }}>
                <Image src={data.photoUrl!} alt={data.displayName} fill priority sizes="(max-width: 768px) 100vw, 45vw" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
                {headline && (
                  <span className="cs-hero-clarte-badge" style={{ position: 'absolute', bottom: badgeBottom, left: -18, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 9999, padding: '8px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600, color: t.ink }}>
                    <Check size={14} color={accent} strokeWidth={3} /> {headline.length > 28 ? `${headline.slice(0, 28)}…` : headline}
                  </span>
                )}
              </div>
            ) : (
              // Fallback élégant : carte monogramme (jamais d'initiales géantes).
              <div className="cs-hero-clarte-frame" style={{ maxWidth: 480, marginLeft: 'auto', aspectRatio: '4/5', borderRadius: 20, background: `${accent}0F`, border: `1px solid ${accent}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <span style={{ ...headFont, display: 'flex', width: 92, height: 92, borderRadius: '50%', background: `${accent}1F`, color: accent, alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>{initials(data.displayName)}</span>
                <p style={{ margin: 0, fontWeight: 700, color: t.ink }}>{data.displayName}</p>
                {meta && <p style={{ margin: 0, fontSize: 13, color: t.muted }}>{meta}</p>}
              </div>
            )}
          </div>
        </div>
        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
        <style>{`
          @media (max-width:768px){
            .cs-hero-clarte-grid{grid-template-columns:1fr!important;gap:28px!important;padding:84px 24px 56px!important}
            .cs-hero-clarte-media{order:-1}
            .cs-hero-clarte-frame{max-width:100%!important;aspect-ratio:4/3!important}
            .cs-hero-clarte-badge{display:none!important}
          }
        `}</style>
      </section>
    );
  }

  // ── AUTHENTICITÉ : grande photo en haut (NON assombrie) + texte sur papier ──
  const words = accroche.trim().split(/\s+/);
  let italicIdx = words.findIndex((w, i) => i > 0 && w.replace(/[^\p{L}]/gu, '').length >= 4);
  if (italicIdx === -1) italicIdx = words.length - 1;

  return (
    <section id="accueil" className="cs-hero-auth" style={{ position: 'relative', background: t.bg, color: t.ink }}>
      {hasPhoto && (
        <div className="cs-hero-auth-photo" style={{ position: 'relative', width: '100%', height: 'clamp(340px, 52vh, 560px)' }}>
          <Image src={data.photoUrl!} alt={`Photo de ${data.displayName}`} fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
        </div>
      )}
      <div className="cs-hero-auth-text" style={{ maxWidth: 880, margin: '0 auto', padding: hasPhoto ? '48px 24px 64px' : '96px 24px 72px', textAlign: hasPhoto ? 'left' : 'center' }}>
        <div aria-hidden style={{ width: 48, height: 3, background: accent, margin: hasPhoto ? '0 0 22px' : '0 auto 22px' }} />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.muted }}>
          {data.displayName}{meta ? ` — ${meta}` : ''}
        </p>
        <h1 style={{ ...headFont, margin: '14px 0 0', fontSize: 'clamp(34px, 4.6vw, 68px)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
          {words.map((w, i) =>
            i === italicIdx ? <em key={i} style={{ fontStyle: 'italic', color: accent }}>{w} </em> : <span key={i}>{w} </span>
          )}
        </h1>
        {data.heroSubtitle && (
          <p style={{ margin: hasPhoto ? '20px 0 0' : '20px auto 0', fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', maxWidth: 560, lineHeight: 1.6, color: t.muted }}>
            {data.heroSubtitle}
          </p>
        )}
        <div style={{ marginTop: 30 }}>
          <a href={ctaHref} className="cs-cta-auth" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 50, padding: '0 30px', border: `2px solid ${accent}`, background: 'transparent', color: accent, fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: 8, transition: 'all 200ms ease-out' }}>
            {ctaLabel}
          </a>
        </div>
      </div>
      <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
      <style>{`
        .cs-cta-auth:hover{background:${accent}!important;color:#fff!important}
        @media (max-width:768px){
          .cs-hero-auth-photo{height:clamp(280px,42vh,440px)!important}
          .cs-hero-auth-text{padding:36px 24px 48px!important}
        }
      `}</style>
    </section>
  );
}
