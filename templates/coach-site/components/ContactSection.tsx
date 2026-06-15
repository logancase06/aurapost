import Reveal from '../Reveal';
import ContactForm from '../ContactForm';
import { headStyle, ctaLabelFor, type Theme } from '../theme';
import type { CoachSiteData, SiteStyle } from '../types';

export default function ContactSection({ data, style, accent, t }: { data: CoachSiteData; style: SiteStyle; accent: string; t: Theme }) {
  const headFont = headStyle(t);
  const sectionH2 = { ...headFont, fontSize: 'clamp(1.9rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 12px' } as const;
  const ctaLabel = ctaLabelFor(data);

  return (
    <Reveal as="section" style={{ maxWidth: 560, margin: '0 auto', padding: '100px 24px' }}>
      <div id="contact">
        <h2 style={sectionH2}>On en parle ?</h2>
        {data.bookingUrl ? (
          <a href={data.bookingUrl} className="cs-cta" style={{ display: 'inline-block', marginTop: 16, padding: '16px 40px', background: accent, color: '#fff', fontWeight: 700, textDecoration: 'none', borderRadius: style === 'clarte' ? 10 : 2 }}>
            {ctaLabel}
          </a>
        ) : (
          <div style={{ marginTop: 24 }}>
            <ContactForm accent={accent} coachName={data.displayName} subdomain={data.subdomain} />
          </div>
        )}
      </div>
    </Reveal>
  );
}
