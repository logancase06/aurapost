import ContactForm from './ContactForm';

// ─────────────────────────────────────────────────────────────────────────────
// Template de site coach v2 — direction artistique « athlète pro / consultant premium ».
// Fond blanc cassé, hero sombre, typographie massive, UNE couleur d'accent choisie selon
// la spécialité. Zéro gradient violet/rose, zéro avatar à initiale.
// ─────────────────────────────────────────────────────────────────────────────

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
  contactEmail?: string | null;
  bookingUrl?: string | null;
  services: CoachServiceItem[];
  testimonials: CoachTestimonialItem[];
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

const BG = '#FAFAF8';
const INK = '#0A0A0A';
const FONT = "Inter, -apple-system, system-ui, sans-serif";

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

export default function CoachSite({ data }: { data: CoachSiteData }) {
  const accent = data.accentColor || accentForSpeciality(data.speciality);
  const place = data.city ?? '';
  const meta = [data.speciality, place].filter(Boolean).join(' · ');
  const tagline = data.heroTagline || data.cta || 'Ton objectif mérite une vraie méthode.';
  const story = data.story || data.about || data.bio || '';
  const ctaLabel = 'Réserver une séance';
  const ctaHref = data.bookingUrl || '#contact';
  const results = data.results?.length ? data.results : defaultResults(data.speciality);

  return (
    <div style={{ fontFamily: FONT, color: INK, background: BG }}>
      {/* ── HERO sombre ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: INK, color: '#fff', overflow: 'hidden' }}>
        {data.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: data.photoUrl ? 'rgba(10,10,10,0.6)' : 'transparent' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, backgroundSize: '180px', opacity: 0.06, mixBlendMode: 'overlay' }} />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '120px 24px 96px' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.32em', textTransform: 'uppercase', color: accent }}>
            {meta}
          </p>
          <h1 style={{ margin: '20px 0 0', fontSize: 'clamp(3rem, 12vw, 7.5rem)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            {data.displayName}
          </h1>
          <p style={{ margin: '28px 0 0', fontSize: 'clamp(1.1rem, 2.4vw, 1.6rem)', maxWidth: 620, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
            {tagline}
          </p>
          <a
            href={ctaHref}
            style={{ display: 'inline-block', marginTop: 40, padding: '16px 40px', background: '#fff', color: INK, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em' }}
          >
            {ctaLabel}
          </a>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: accent }} />
      </section>

      {/* ── MON HISTOIRE ──────────────────────────────────────────── */}
      {story && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: data.photoUrl ? 'minmax(0,1fr) minmax(0,1.3fr)' : '1fr', gap: 56, alignItems: 'center' }}>
            {data.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt={data.displayName} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 2 }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: accent }}>Mon histoire</p>
              <p style={{ margin: '20px 0 0', fontSize: 18, lineHeight: 1.7, color: '#2a2a2a', whiteSpace: 'pre-line' }}>{story}</p>
              {data.storyQuote && (
                <p style={{ margin: '32px 0 0', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.3, color: INK, borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
                  {data.storyQuote}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CE QU'ON FAIT ENSEMBLE ────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: '0 0 48px' }}>
          Ce qu’on fait ensemble
        </h2>
        <div style={{ display: 'grid', gap: 0 }}>
          {data.services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24, padding: '32px 0', borderTop: '1px solid #e6e4dd', alignItems: 'baseline' }}>
              <span style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: accent, letterSpacing: '-0.02em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.6rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p style={{ fontSize: 16, color: '#555', margin: '10px 0 0', lineHeight: 1.6, maxWidth: 620 }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CE QUE ÇA CHANGE (résultats) ──────────────────────────── */}
      <section style={{ background: INK, color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: '0 0 48px' }}>
            Ce que ça change
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            {results.map((r, i) => (
              <div key={i} style={{ borderTop: `3px solid ${accent}`, paddingTop: 24 }}>
                <p style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.5rem)', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{r.result}</p>
                <p style={{ margin: '16px 0 0', fontSize: 14, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                  {r.name}
                  {r.city ? ` · ${r.city}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT minimaliste ───────────────────────────────────── */}
      <section id="contact" style={{ maxWidth: 560, margin: '0 auto', padding: '96px 24px' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          On en parle ?
        </h2>
        {data.bookingUrl ? (
          <div style={{ marginTop: 20 }}>
            <a href={data.bookingUrl} style={{ display: 'inline-block', padding: '16px 40px', background: INK, color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              Réserver une séance
            </a>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            <ContactForm accent={accent} coachName={data.displayName} subdomain={data.subdomain} />
          </div>
        )}
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{ background: INK, color: 'rgba(255,255,255,0.6)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textTransform: 'uppercase' }}>
            {data.displayName} <span style={{ color: accent }}>·</span> {meta}
          </p>
          <a href="https://aurapost.fr" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>
            Créé avec ✦ AuraPost
          </a>
        </div>
      </footer>
    </div>
  );
}
