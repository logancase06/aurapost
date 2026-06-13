import type { Metadata } from 'next';
import LegalLayout, { type LegalSection } from '../legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description: 'Les conditions générales d’utilisation du service AuraPost.',
  alternates: { canonical: '/terms' },
};

const SECTIONS: LegalSection[] = [
  {
    heading: 'Objet',
    paragraphs: [
      'Les présentes conditions générales d’utilisation (CGU) régissent l’accès et l’utilisation d’AuraPost, service de génération de contenu social et de site vitrine destiné aux coachs sportifs. En créant un compte, vous acceptez ces conditions.',
    ],
  },
  {
    heading: 'Description du service',
    paragraphs: [
      'AuraPost génère, à partir de votre profil, des publications Instagram et LinkedIn ainsi qu’un site vitrine hébergé sur un sous-domaine. Le contenu généré est une proposition que vous restez libre de relire, modifier, approuver ou rejeter avant toute publication.',
    ],
  },
  {
    heading: 'Compte et accès',
    paragraphs: [
      'Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. Vous vous engagez à fournir des informations exactes et à maintenir votre profil à jour.',
    ],
  },
  {
    heading: 'Utilisation acceptable',
    paragraphs: ['Vous vous engagez à ne pas utiliser AuraPost pour :'],
    bullets: [
      'Diffuser des contenus illégaux, diffamatoires, haineux ou trompeurs.',
      'Usurper l’identité d’un tiers ou enfreindre des droits de propriété intellectuelle.',
      'Tenter de contourner les mesures de sécurité ou de surcharger le service.',
    ],
  },
  {
    heading: 'Contenu et propriété',
    paragraphs: [
      'Vous conservez la pleine propriété du contenu que vous publiez. Vous êtes seul responsable du contenu que vous décidez de diffuser. AuraPost ne saurait être tenu responsable de l’usage que vous faites du contenu généré, qui doit toujours être relu avant publication.',
    ],
  },
  {
    heading: 'Abonnement, paiement et résiliation',
    paragraphs: [
      'Les abonnements sont sans engagement et facturés via Stripe. Vous pouvez mettre votre abonnement en pause ou le résilier à tout moment depuis votre tableau de bord. Une garantie satisfait ou remboursé de 30 jours s’applique à votre premier paiement.',
    ],
  },
  {
    heading: 'Disponibilité',
    paragraphs: [
      'Nous nous efforçons d’assurer une disponibilité maximale du service. Des interruptions peuvent toutefois survenir pour maintenance ou pour des causes indépendantes de notre volonté. AuraPost est fourni « en l’état », sans garantie de résultat commercial.',
    ],
  },
  {
    heading: 'Limitation de responsabilité',
    paragraphs: [
      'Dans les limites permises par la loi, la responsabilité d’AuraPost est limitée au montant payé au titre de l’abonnement sur les 12 derniers mois. AuraPost ne saurait être tenu responsable des dommages indirects.',
    ],
  },
  {
    heading: 'Droit applicable',
    paragraphs: [
      'Les présentes CGU sont régies par le droit français. Tout litige relève des tribunaux compétents, après tentative de résolution amiable.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Conditions d’utilisation"
      updatedAt="14 juin 2026"
      intro="Bienvenue sur AuraPost. Ces conditions définissent les règles d’utilisation du service. Nous les avons voulues claires et lisibles."
      sections={SECTIONS}
    />
  );
}
