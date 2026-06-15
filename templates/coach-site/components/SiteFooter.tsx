import { Mail, MessageCircle, MapPin } from 'lucide-react';
import { metaLine } from '../theme';
import type { CoachSiteData } from '../types';

/** Glyphe Instagram inline (l'icône n'existe pas dans cette version de lucide-react). */
function InstagramGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SiteFooter({ data, accent }: { data: CoachSiteData; accent: string }) {
  const meta = metaLine(data);
  const hasStory = !!(data.story || data.about || data.bio);
  const hasTesti = (data.testimonials?.length ?? 0) > 0;
  const email = (data.contactEmail || '').trim();
  const whatsapp = (data.whatsapp || '').trim();
  const waDigits = whatsapp.replace(/\D/g, '');
  const colTitle = { margin: '0 0 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b7280' } as const;
  const linkStyle = { color: '#a1a1aa', textDecoration: 'none', fontSize: 14 } as const;
  const year = new Date().getFullYear();

  return (
    <footer id="footer" style={{ background: '#0a0a0a', color: '#fff', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div className="cs-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
          {/* Identité */}
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{data.displayName}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#a1a1aa' }}>{data.speciality}</p>
            {data.instagramUrl && (
              <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="cs-foot-link" style={{ ...linkStyle, marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <InstagramGlyph size={16} /> Instagram
              </a>
            )}
          </div>

          {/* Navigation */}
          <nav aria-label="Pied de page">
            <p style={colTitle}>Navigation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#accueil" className="cs-foot-link" style={linkStyle}>Accueil</a>
              {hasStory && <a href="#apropos" className="cs-foot-link" style={linkStyle}>Mon approche</a>}
              {hasTesti && <a href="#temoignages" className="cs-foot-link" style={linkStyle}>Témoignages</a>}
              <a href="#contact" className="cs-foot-link" style={linkStyle}>Contact</a>
            </div>
          </nav>

          {/* Contact */}
          <div>
            <p style={colTitle}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {email && (
                <a href={`mailto:${email}`} className="cs-foot-link" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} /> {email}
                </a>
              )}
              {waDigits && (
                <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="cs-foot-link" style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={14} /> Écrire sur WhatsApp
                </a>
              )}
              {data.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#71717a' }}>
                  <MapPin size={14} /> Basé à {data.city}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 48, paddingTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>© {year} {data.displayName} <span style={{ color: accent }}>·</span> Site créé avec AuraPost</p>
          <a href="https://aurapost.fr" target="_blank" rel="noopener noreferrer" className="cs-foot-link" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>✦ AuraPost</a>
        </div>
      </div>
      <style>{`.cs-foot-link{transition:color .15s ease}.cs-foot-link:hover{color:#fff}@media (max-width:768px){.cs-footer-grid{grid-template-columns:1fr!important;gap:32px!important}}`}</style>
    </footer>
  );
}
