import { Calendar, Mail, MessageCircle, MapPin } from 'lucide-react';
import Reveal from '../Reveal';
import ContactForm from '../ContactForm';
import { headStyle, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

const TONE_TITLE: Record<string, string> = {
  motivant: 'Prêt à commencer ?',
  educatif: 'Parlons de ton projet',
  personnel: 'Échangeons ensemble',
};

export default function ContactSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const sectionH2 = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 10px' } as const;
  const radius = style === 'clarte' ? 12 : style === 'authenticite' ? 8 : 2;
  const title = TONE_TITLE[data.tone ?? ''] ?? 'Prenons contact';

  const booking = (data.bookingUrl || '').trim();
  const whatsapp = (data.whatsapp || '').trim();
  const waDigits = whatsapp.replace(/\D/g, '');
  const email = (data.contactEmail || '').trim();
  const hasAny = !!booking || !!waDigits || !!email;

  const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none', fontWeight: 700, borderRadius: radius } as const;

  return (
    <Reveal as="section" style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px' }}>
      <div id="contact" style={{ textAlign: 'center' }}>
        <h2 style={sectionH2}>{title}</h2>
        <p style={{ margin: 0, fontSize: 15, color: t.muted }}>Je réponds sous 24h · Sans engagement</p>

        {hasAny ? (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {booking && (
              <a href={booking} target="_blank" rel="noopener noreferrer" className="cs-cta" style={{ ...btnBase, minHeight: 52, padding: '0 32px', background: accent, color: '#fff', fontSize: 15 }}>
                <Calendar size={18} /> Réserver un appel
              </a>
            )}
            {waDigits && (
              <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="cs-cta" style={{ ...btnBase, minHeight: 48, padding: '0 28px', background: '#25D366', color: '#fff', fontSize: 15 }}>
                <MessageCircle size={18} /> Écrire sur WhatsApp
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="cs-cta" style={{ ...btnBase, minHeight: 48, padding: '0 28px', border: `2px solid ${accent}`, color: accent, background: 'transparent', fontSize: 15 }}>
                <Mail size={18} /> Envoyer un email
              </a>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <ContactForm accent={accent} coachName={data.displayName} subdomain={data.subdomain} />
          </div>
        )}

        {data.city && (
          <p style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: t.muted }}>
            <MapPin size={15} /> Basé à {data.city} · Disponible en ligne
          </p>
        )}
      </div>
    </Reveal>
  );
}
