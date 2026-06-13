import ContactForm from './ContactForm';

// Template de site coach — composant React AUTONOME et exportable.
// Alimenté soit par les valeurs par défaut (profil), soit par le contenu généré par l'IA
// (hero, services, à propos, témoignages, CTA) + photos réelles uploadées.

export interface CoachServiceItem {
  title: string;
  description: string;
  icon?: string;
}
export interface CoachTestimonialItem {
  name: string;
  quote: string;
}
export interface CoachSiteData {
  subdomain?: string;
  displayName: string;
  speciality: string;
  city?: string | null;
  bio?: string | null;
  themeColor: string;
  contactEmail?: string | null;
  services: CoachServiceItem[];
  testimonials: CoachTestimonialItem[];
  // Contenu généré (optionnel) :
  heroTitle?: string;
  heroSubtitle?: string;
  about?: string;
  cta?: string;
  photoUrl?: string | null;
  seoDescription?: string;
}

export function defaultServices(speciality: string): CoachServiceItem[] {
  return [
    { title: 'Coaching individuel', description: `Un accompagnement sur-mesure en ${speciality.toLowerCase()}, adapté à votre niveau et vos objectifs.` },
    { title: 'Programmes personnalisés', description: 'Des plans d’entraînement et de nutrition construits autour de votre quotidien.' },
    { title: 'Suivi & motivation', description: 'Un suivi régulier pour garder le cap, ajuster et célébrer vos progrès.' },
  ];
}
export function defaultTestimonials(): CoachTestimonialItem[] {
  return [
    { name: 'Marie L.', quote: 'Un accompagnement qui a tout changé. Je n’ai jamais été aussi régulière et motivée.' },
    { name: 'Thomas R.', quote: 'Des séances exigeantes mais bienveillantes. Des résultats visibles en quelques semaines.' },
  ];
}

export default function CoachSite({ data }: { data: CoachSiteData }) {
  const accent = data.themeColor || '#7c3aed';
  const place = data.city ? ` · ${data.city}` : '';
  const heroTitle = data.heroTitle || data.displayName;
  const heroSubtitle = data.heroSubtitle || `${data.speciality}${place}`;
  const about = data.about || data.bio;
  const ctaLabel = data.cta || 'Réserver une séance';

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e1b4b', background: '#fff' }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${accent} 0%, #db2777 100%)`, color: '#fff', padding: '96px 24px', textAlign: 'center' }}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt={data.displayName}
            style={{ width: 132, height: 132, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', border: '4px solid rgba(255,255,255,0.5)' }}
          />
        ) : (
          <div aria-hidden style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800 }}>
            {data.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, letterSpacing: '-1px', maxWidth: 760, marginInline: 'auto' }}>{heroTitle}</h1>
        <p style={{ fontSize: 19, marginTop: 14, opacity: 0.95, maxWidth: 640, marginInline: 'auto' }}>{heroSubtitle}</p>
        <a href="#contact" style={{ display: 'inline-block', marginTop: 32, padding: '14px 36px', background: '#fff', color: accent, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
          {ctaLabel}
        </a>
      </section>

      {about && (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700 }}>À propos</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: '#475569', marginTop: 16 }}>{about}</p>
        </section>
      )}

      {/* Services */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>Mes services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {data.services.map((s, i) => (
            <div key={i} style={{ border: '1px solid #ede9fe', borderRadius: 16, padding: 28, background: '#fff' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>✦</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section style={{ background: '#f5f3ff', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>Ils m’ont fait confiance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {data.testimonials.map((t, i) => (
              <blockquote key={i} style={{ background: '#fff', borderRadius: 16, padding: 28, margin: 0, boxShadow: '0 2px 12px rgba(124,58,237,0.08)' }}>
                <p style={{ fontSize: 16, fontStyle: 'italic', color: '#334155', lineHeight: 1.6 }}>“{t.quote}”</p>
                <footer style={{ marginTop: 16, fontWeight: 700, color: accent }}>— {t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>Me contacter</h2>
        <ContactForm accent={accent} coachName={data.displayName} subdomain={data.subdomain} />
      </section>

      <footer style={{ borderTop: '1px solid #ede9fe', padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        <p style={{ margin: 0 }}>
          {data.displayName} — {data.speciality}
          {data.city ? ` · ${data.city}` : ''}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          Site propulsé par{' '}
          <a href="https://aurapost.fr" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>
            ✦ AuraPost
          </a>
        </p>
      </footer>
    </div>
  );
}
