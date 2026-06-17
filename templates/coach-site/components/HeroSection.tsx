import Image from 'next/image';
import { headStyle, initials, metaLine, ctaLabelFor, ctaHrefFor, splitLastWord, type Theme } from '../theme';
import { forcesOf } from './ForcesSection';
import type { CoachSiteData, SiteStyle } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Hero — 3 STRUCTURES réellement distinctes (pas le même squelette reskinné).
// Test « sans couleur » : chaque disposition reste reconnaissable en noir et blanc.
//   impact       → photo PLEIN CADRE + scrim localisé, texte bas-gauche, titre CAPS
//                  court, preuve en ligne compacte, 1 bouton. (la photo = le contraste,
//                  jamais un noir plat)
//   clarte       → CENTRÉ, photo en ARCHE dessous, titre casse normale, AUCUNE liste,
//                  1 bouton doux, espace généreux. (wellness/yoga)
//   authenticite → texte À GAUCHE + portrait À DROITE, paragraphe NARRATIF, CTA en
//                  LIEN inline (pas de bouton), serif. (coach de vie)
// Photo-first conservé ; fallback sans photo = vraie composition, jamais un trou.
// Accent strictement fonctionnel (CTA + un mot d'accroche). Densité texte réduite.
// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const meta = metaLine(data);
  const accroche = data.heroTagline || 'Ton objectif mérite une vraie méthode.';
  const ctaLabel = ctaLabelFor(data);
  const ctaHref = ctaHrefFor(data);
  const hasPhoto = !!data.photoUrl;

  // ── IMPACT : photo plein cadre + scrim localisé ───────────────────────────
  if (style === 'impact') {
    const { head, last } = splitLastWord(accroche);
    const proof = forcesOf(data).filter((f) => f.title.trim()).slice(0, 3).map((f) => f.title);
    return (
      <section
        id="accueil"
        className="cs-hero-impact"
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          alignItems: hasPhoto ? 'flex-end' : 'center',
          overflow: 'hidden',
          color: '#fff',
          background: hasPhoto ? '#0c0c10' : 'linear-gradient(135deg,#1b1b22,#0c0c10)',
        }}
      >
        {hasPhoto && (
          <>
            <Image src={data.photoUrl!} alt={`Photo de ${data.displayName}`} fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, rgba(10,10,12,0.94) 0%, rgba(10,10,12,0.55) 40%, rgba(10,10,12,0.04) 74%)' }} />
          </>
        )}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1120, margin: '0 auto', padding: '120px 24px 76px' }}>
          <div style={{ maxWidth: 640 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', overflowWrap: 'break-word' }}>
              {data.displayName}{meta ? ` — ${meta}` : ''}
            </p>
            <h1 style={{ ...headFont, margin: '16px 0 0', fontSize: 'clamp(44px, 6vw, 88px)', lineHeight: 0.98, letterSpacing: '-0.03em', textTransform: 'uppercase', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
              {head ? <>{head} </> : null}
              <span style={{ color: accent }}>{last}</span>
            </h1>
            {proof.length > 0 && (
              <p style={{ margin: '20px 0 0', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', overflowWrap: 'break-word' }}>
                {proof.join('  ·  ')}
              </p>
            )}
            <div style={{ marginTop: 34 }}>
              <a href={ctaHref} className="cs-cta-impact" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 56, padding: '0 36px', background: accent, color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 4 }}>
                {ctaLabel}
              </a>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '14px 0 0' }}>Réponse sous 24h · Sans engagement</p>
            </div>
          </div>
        </div>
        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
        <style>{`
          .cs-cta-impact{transition:filter .15s ease-out,transform .15s ease-out}
          .cs-cta-impact:hover{filter:brightness(1.08);transform:translateY(-2px)}
          @media (max-width:768px){ .cs-hero-impact{min-height:78vh} }
        `}</style>
      </section>
    );
  }

  // ── CLARTÉ : centré, photo en arche dessous, aucune liste ─────────────────
  if (style === 'clarte') {
    return (
      <section id="accueil" className="cs-hero-clarte" style={{ position: 'relative', background: t.bg, color: t.ink }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '96px 24px 0', textAlign: 'center' }}>
          {meta && (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', color: t.muted, overflowWrap: 'break-word' }}>· {meta} ·</p>
          )}
          <h1 style={{ ...headFont, margin: '18px 0 0', fontSize: 'clamp(32px, 4.4vw, 58px)', lineHeight: 1.12, letterSpacing: '-0.02em', overflowWrap: 'break-word' }}>
            {accroche}
          </h1>
          {data.heroSubtitle && (
            <p style={{ margin: '20px auto 0', maxWidth: 540, fontSize: 'clamp(1.05rem, 2vw, 1.2rem)', lineHeight: 1.65, color: t.muted, overflowWrap: 'break-word' }}>
              {data.heroSubtitle}
            </p>
          )}
          <div style={{ marginTop: 30 }}>
            <a href={ctaHref} className="cs-cta" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 50, padding: '0 30px', background: accent, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', borderRadius: 9999 }}>
              {ctaLabel}
            </a>
          </div>
        </div>
        {/* Photo en arche, centrée, dessous */}
        <div style={{ maxWidth: 540, margin: '48px auto 0', padding: '0 24px' }}>
          {hasPhoto ? (
            <div className="cs-arch" style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '50% 50% 16px 16px / 62% 62% 16px 16px', overflow: 'hidden', boxShadow: '0 36px 80px -32px rgba(0,0,0,0.25)' }}>
              <Image src={data.photoUrl!} alt={data.displayName} fill priority sizes="(max-width: 768px) 92vw, 540px" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
          ) : (
            <div className="cs-arch" style={{ aspectRatio: '4/5', borderRadius: '50% 50% 16px 16px / 62% 62% 16px 16px', background: `${accent}12`, border: `1px solid ${accent}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <span style={{ ...headFont, display: 'flex', width: 96, height: 96, borderRadius: '50%', background: `${accent}22`, color: accent, alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800 }}>{initials(data.displayName)}</span>
              <p style={{ margin: 0, fontWeight: 700, color: t.ink }}>{data.displayName}</p>
            </div>
          )}
        </div>
        <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
      </section>
    );
  }

  // ── AUTHENTICITÉ : texte gauche + portrait droite, narratif, CTA en lien ──
  const words = accroche.trim().split(/\s+/);
  let italicIdx = words.findIndex((w, i) => i > 0 && w.replace(/[^\p{L}]/gu, '').length >= 4);
  if (italicIdx === -1) italicIdx = words.length - 1;
  // Paragraphe narratif tronqué proprement (frontière de mot + ellipse), jamais en plein mot.
  const narrativeRaw = (data.heroSubtitle || data.bio || '').trim();
  const narrative = narrativeRaw.length > 220 ? `${narrativeRaw.slice(0, 220).replace(/\s+\S*$/, '')}…` : narrativeRaw;
  return (
    <section id="accueil" className="cs-hero-auth" style={{ position: 'relative', background: t.bg, color: t.ink }}>
      <div className="cs-hero-auth-grid" style={{ maxWidth: 1080, margin: '0 auto', padding: '92px 24px', display: 'grid', gridTemplateColumns: hasPhoto ? 'minmax(0,1.1fr) minmax(0,0.9fr)' : '1fr', gap: 56, alignItems: 'center' }}>
        <div style={{ maxWidth: hasPhoto ? undefined : 720, marginInline: hasPhoto ? undefined : 'auto', textAlign: hasPhoto ? 'left' : 'center' }}>
          <div aria-hidden style={{ width: 44, height: 3, background: accent, margin: hasPhoto ? '0 0 20px' : '0 auto 20px' }} />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.muted, overflowWrap: 'break-word' }}>
            {data.displayName}{meta ? ` — ${meta}` : ''}
          </p>
          <h1 style={{ ...headFont, margin: '14px 0 0', fontSize: 'clamp(32px, 4vw, 60px)', lineHeight: 1.16, letterSpacing: '-0.01em', overflowWrap: 'break-word' }}>
            {words.map((w, i) => (i === italicIdx ? <em key={i} style={{ fontStyle: 'italic', color: accent }}>{w} </em> : <span key={i}>{w} </span>))}
          </h1>
          {narrative && (
            <p style={{ margin: hasPhoto ? '22px 0 0' : '22px auto 0', maxWidth: 560, fontSize: 'clamp(1.02rem, 1.8vw, 1.2rem)', lineHeight: 1.75, color: t.muted, overflowWrap: 'break-word' }}>
              {narrative}
            </p>
          )}
          <div style={{ marginTop: 26 }}>
            <a href={ctaHref} className="cs-cta-auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, fontWeight: 700, fontSize: 16, textDecoration: 'underline', textUnderlineOffset: 5, textDecorationThickness: 2 }}>
              {ctaLabel} →
            </a>
          </div>
        </div>
        {hasPhoto && (
          <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 70px -28px rgba(0,0,0,0.28)' }}>
            <Image src={data.photoUrl!} alt={data.displayName} fill priority sizes="(max-width: 768px) 100vw, 42vw" style={{ objectFit: 'cover', objectPosition: 'top center' }} />
          </div>
        )}
      </div>
      <div id="hero-sentinel" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, width: 1, height: 1 }} />
      <style>{`
        .cs-cta-auth-link:hover{opacity:.8}
        @media (max-width:768px){ .cs-hero-auth-grid{grid-template-columns:1fr!important;gap:28px!important} .cs-hero-auth-grid>div:last-child{order:-1} }
      `}</style>
    </section>
  );
}
