import ContactForm from './ContactForm';
import Reveal from './Reveal';
import { inter, bebas, jakarta, lato, playfair } from './fonts';

// ─────────────────────────────────────────────────────────────────────────────
// Template de site coach — 3 styles distincts pilotés par `data.style` :
//   impact        → hero sombre, typographie massive (Bebas), vibe athlète/prépa
//   clarte        → épuré, beaucoup de blanc, sans-serif moderne (Jakarta), bienêtre
//   authenticite  → hero photo + grain, serif (Playfair), palette chaude, storytelling
// Une seule couleur d'accent (selon la spécialité du coach). Styles inline → portable.
// ─────────────────────────────────────────────────────────────────────────────

export type SiteStyle = 'impact' | 'clarte' | 'authenticite';

export interface CoachServiceItem {
  title: string;
  description: string;
  icon?: string;
}
export interface CoachTestimonialItem {
  name: string;
  quote: string;
}
export interface CoachResultItem {
  result: string;
  name: string;
  city?: string;
}
export interface CoachSiteData {
  subdomain?: string;
  displayName: string;
  speciality: string;
  city?: string | null;
  bio?: string | null;
  themeColor: string;
  style?: SiteStyle;
  contactEmail?: string | null;
  bookingUrl?: string | null;
  instagramUrl?: string | null;
  whatsapp?: string | null;
  services: CoachServiceItem[];
  testimonials: CoachTestimonialItem[];
  strengths?: string[];
  forces?: { title: string; description?: string }[];
  // Contenu généré (optionnel) :
  heroTitle?: string;
  heroSubtitle?: string;
  heroTagline?: string;
  about?: string;
  story?: string;
  storyQuote?: string;
  results?: CoachResultItem[];
  accentColor?: string | null;
  cta?: string;
  photoUrl?: string | null;
  seoDescription?: string;
}

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

const GRAIN =
  "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

interface Theme {
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

function themeFor(style: SiteStyle): Theme {
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

/** Initiales SVG élégantes (placeholder hero quand aucune photo). */
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'C';
}

export default function CoachSite({ data }: { data: CoachSiteData }) {
  const style: SiteStyle = data.style ?? 'impact';
  const t = themeFor(style);
  const accent = data.accentColor || accentForSpeciality(data.speciality);
  const place = data.city ?? '';
  const meta = [data.speciality, place].filter(Boolean).join(' · ');
  const accroche = data.heroTagline || 'Ton objectif mérite une vraie méthode.';
  const story = data.story || data.about || data.bio || '';
  const ctaLabel = data.cta || 'Prendre RDV';
  const ctaHref =
    data.bookingUrl ||
    (data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}` : '') ||
    (data.contactEmail ? `mailto:${data.contactEmail}` : '') ||
    '#contact';
  const results = data.results?.length ? data.results : [];
  const forces: { title: string; description?: string }[] = (
    data.forces?.length
      ? data.forces
      : data.strengths?.length
        ? data.strengths.map((title) => ({ title, description: undefined }))
        : data.services.map((s) => ({ title: s.title, description: s.description }))
  ).slice(0, 3);
  const isLight = !t.heroDark;

  const headFont = { fontFamily: t.fontHead, fontWeight: t.headWeight, letterSpacing: t.headTracking, textTransform: t.headTransform };
  const heroBig = style === 'impact' ? 'clamp(2.8rem, 11vw, 6.5rem)' : 'clamp(2.4rem, 7vw, 4.8rem)';
  const sectionH2: React.CSSProperties = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 48px' };
  const sectionPad = '100px 24px';
  const wrap: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: sectionPad };

  return (
    <div style={{ fontFamily: t.fontBody, color: t.ink, background: t.bg }}>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: t.heroDark ? '#0A0A0A' : t.bg, color: t.heroDark ? '#fff' : t.ink, overflow: 'hidden' }}>
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
              {place && (
                <span style={{ fontSize: 13, fontWeight: 600, color: t.heroDark ? 'rgba(255,255,255,0.6)' : t.muted, letterSpacing: '0.04em' }}>
                  Coach à {place}
                </span>
              )}
            </div>
          </div>

          {/* Photo à droite pour le style Clarté (clair) */}
          {style === 'clarte' && data.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 16, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.25)' }} />
          )}
          {/* Placeholder initiales si aucune photo */}
          {style === 'clarte' && !data.photoUrl && (
            <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accent}, ${accent}99)`, color: '#fff', ...headFont, fontSize: 'clamp(3rem,10vw,6rem)' }}>
              {initials(data.displayName)}
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: accent }} />
      </section>

      {/* ── FORCES (preuve sociale immédiate) ─────────────────────── */}
      {forces.length > 0 && (
        <Reveal as="section" style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {forces.map((f, i) => (
              <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: style === 'impact' ? 2 : 14, padding: 28 }}>
                <span style={{ ...headFont, fontSize: '1.6rem', color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{ margin: '10px 0 0', fontSize: 17, fontWeight: 700, color: t.ink }}>{f.title}</p>
                {f.description && <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55, color: t.muted }}>{f.description}</p>}
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ── MON HISTOIRE ──────────────────────────────────────────── */}
      {story && (
        <Reveal as="section" style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: data.photoUrl ? 'minmax(0,0.9fr) minmax(0,1.4fr)' : '1fr', gap: 56, alignItems: 'center' }}>
            {data.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: style === 'impact' ? 2 : 14 }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: accent }}>Mon histoire</p>
              <p style={{ margin: '18px 0 0', fontSize: 18, lineHeight: 1.7, color: t.muted, whiteSpace: 'pre-line' }}>{story}</p>
              {data.storyQuote && (
                <p style={{ ...headFont, textTransform: 'none', margin: '30px 0 0', fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', fontStyle: style === 'authenticite' ? 'italic' : 'normal', lineHeight: 1.3, color: t.ink, borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
                  {data.storyQuote}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── CE QU'ON FAIT ENSEMBLE ────────────────────────────────── */}
      {data.services.length > 0 && (
      <Reveal as="section" style={wrap}>
        <h2 style={sectionH2}>Ce qu’on fait ensemble</h2>
        <div>
          {data.services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 22, padding: '30px 0', borderTop: `1px solid ${t.border}`, alignItems: 'baseline' }}>
              <span style={{ ...headFont, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: accent }}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 style={{ fontSize: 'clamp(1.15rem, 2.4vw, 1.5rem)', fontWeight: 800, margin: 0, color: t.ink }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: t.muted, margin: '10px 0 0', lineHeight: 1.6, maxWidth: 620 }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      )}

      {/* ── CE QUE ÇA CHANGE (résultats) — masqué si aucun ────────── */}
      {results.length > 0 && (
        <section style={{ background: isLight ? t.ink : '#111111', color: '#fff' }}>
          <Reveal style={{ maxWidth: 1080, margin: '0 auto', padding: sectionPad }}>
            <h2 style={{ ...sectionH2, color: '#fff' }}>Ce que ça change</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
              {results.map((r, i) => (
                <div key={i} style={{ borderTop: `3px solid ${accent}`, paddingTop: 24 }}>
                  <p style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.5rem)', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{r.result}</p>
                  <p style={{ margin: '16px 0 0', fontSize: 14, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                    {r.name}{r.city ? ` · ${r.city}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ── TÉMOIGNAGES (masqué si aucun) ─────────────────────────── */}
      {data.testimonials?.length > 0 && (
        <Reveal as="section" style={wrap}>
          <h2 style={sectionH2}>Ils en parlent</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {data.testimonials.map((q, i) => (
              <figure key={i} style={{ margin: 0, background: t.surface, border: `1px solid ${t.border}`, borderRadius: style === 'impact' ? 2 : 14, padding: 28 }}>
                <blockquote style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: t.ink }}>“{q.quote}”</blockquote>
                <figcaption style={{ marginTop: 16, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: accent, textTransform: 'uppercase' }}>{q.name}</figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      )}

      {/* ── CONTACT ───────────────────────────────────────────────── */}
      <Reveal as="section" style={{ maxWidth: 560, margin: '0 auto', padding: sectionPad }}>
        <h2 style={{ ...sectionH2, margin: '0 0 12px' }}>On en parle ?</h2>
        {data.bookingUrl ? (
          <a href={data.bookingUrl} className="cs-cta" style={{ display: 'inline-block', marginTop: 16, padding: '16px 40px', background: accent, color: '#fff', fontWeight: 700, textDecoration: 'none', borderRadius: style === 'clarte' ? 10 : 2 }}>
            {ctaLabel}
          </a>
        ) : (
          <div style={{ marginTop: 24 }}>
            <ContactForm accent={accent} coachName={data.displayName} subdomain={data.subdomain} />
          </div>
        )}
      </Reveal>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{ background: '#0A0A0A', color: 'rgba(255,255,255,0.6)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, color: '#fff' }}>
            {data.displayName} <span style={{ color: accent }}>·</span> {meta}
          </p>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            {data.instagramUrl && (
              <a href={data.instagramUrl} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 13 }}>Instagram</a>
            )}
            <a href="https://aurapost.fr" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Créé avec ✦ AuraPost</a>
          </div>
        </div>
      </footer>

      {/* Hover CTA (scale + ombre) — injecté une fois, sans lib. */}
      <style>{`.cs-cta{transition:transform .18s ease, box-shadow .18s ease}.cs-cta:hover{transform:scale(1.02);box-shadow:0 14px 34px -12px ${accent}99}`}</style>
    </div>
  );
}
