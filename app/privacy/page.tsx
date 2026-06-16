import type { Metadata } from 'next';
import LegalLayout, { type LegalSection } from '../legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment AuraPost collecte, utilise et protège vos données personnelles (RGPD).',
  alternates: { canonical: '/privacy' },
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'Responsable du traitement',
    paragraphs: [
      'AuraPost (« nous ») est responsable du traitement des données personnelles collectées via le service accessible à l’adresse aurapost.fr. Pour toute question relative à vos données, contactez-nous à contact@aurapost.fr.',
    ],
  },
  {
    heading: 'Données que nous collectons',
    paragraphs: ['Nous collectons uniquement les données nécessaires au fonctionnement du service :'],
    bullets: [
      'Données de compte : nom, adresse email, nom de votre activité.',
      'Données de profil coach : spécialité, ville, ton de voix, bio, audience cible.',
      'Contenu généré : posts, légendes, contenu de site vitrine.',
      'Données techniques : logs d’activité, adresse IP (rate limiting), cookies fonctionnels.',
      'Données de paiement : gérées par Stripe ; nous ne stockons jamais vos coordonnées bancaires.',
    ],
  },
  {
    heading: 'Finalités et bases légales',
    paragraphs: [
      'Vos données sont traitées pour : exécuter le contrat (générer votre contenu, héberger votre site), sur la base de votre consentement (mesure d’audience, marketing), et au titre de notre intérêt légitime (sécurité, prévention de la fraude). La mesure d’audience et le marketing ne sont activés qu’avec votre accord explicite via la bannière cookies.',
    ],
  },
  {
    heading: 'Sous-traitants & hébergement',
    paragraphs: [
      'Nous faisons appel à des prestataires conformes au RGPD, encadrés par des accords de traitement (DPA) et, pour les transferts hors UE, par les Clauses Contractuelles Types :',
    ],
    bullets: [
      'Turso (base de données, USA) — hébergement des données applicatives.',
      'Cloudflare R2 (stockage des photos, UE/USA).',
      'Resend (emails transactionnels, USA).',
      'Anthropic / Claude (génération de contenu, USA) — vos saisies de profil servent à générer le contenu.',
      'Stripe (paiements, USA). Upstash (rate-limiting, UE/USA). Netlify (hébergement applicatif, USA).',
    ],
    footer:
      'La liste complète des sous-traitants, les pays d’hébergement et les liens vers chaque DPA sont détaillés sur la page dédiée : aurapost.fr/legal/sous-traitants.',
  },
  {
    heading: 'Durée de conservation',
    paragraphs: [
      'Vos données de compte sont conservées tant que votre compte est actif. Les logs d’activité sont automatiquement supprimés après 90 jours. À la suppression de votre compte, l’ensemble de vos données est définitivement effacé.',
    ],
  },
  {
    heading: 'Vos droits',
    paragraphs: [
      'Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de portabilité et d’opposition. Depuis votre tableau de bord (Paramètres → Données), vous pouvez à tout moment exporter l’intégralité de vos données au format JSON ou supprimer définitivement votre compte. Vous pouvez également introduire une réclamation auprès de la CNIL.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'Nous utilisons des cookies strictement fonctionnels (session, sécurité) et, avec votre consentement, des cookies de mesure d’audience et de marketing. Vous gérez vos préférences via la bannière cookies, à tout moment.',
    ],
  },
  {
    heading: 'Sécurité',
    paragraphs: [
      'Les mots de passe sont hachés (bcrypt), les communications chiffrées (HTTPS), l’accès aux données strictement isolé par compte (architecture multi-tenant). Nous appliquons des en-têtes de sécurité stricts (CSP, HSTS) et un rate limiting sur les accès sensibles.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      updatedAt="14 juin 2026"
      intro="Chez AuraPost, la confiance est essentielle. Cette page explique en toute transparence quelles données nous collectons, pourquoi, et comment vous gardez le contrôle."
      sections={SECTIONS}
    />
  );
}
