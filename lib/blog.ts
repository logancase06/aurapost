// ─────────────────────────────────────────────────────────────────────────────
// Contenu éditorial du blog AuraPost. Articles statiques (réalistes), rendus en
// HTML simple via un mini-parser. Sert le SEO (sitemap, JSON-LD, og:image).
// ─────────────────────────────────────────────────────────────────────────────

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string; // ISO date
  category: string;
  cover: string; // accent de couleur pour l'og:image
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'coach-sportif-nice-triple-clients-instagram',
    title: 'Comment un coach sportif à Nice a triplé ses clients grâce à Instagram',
    excerpt:
      'En six mois, sans budget publicitaire, Karim est passé de 4 à 12 clients récurrents. Son secret : un contenu régulier, calibré et publié sans y penser.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-04-08',
    category: 'Étude de cas',
    cover: '#7C3AED',
    sections: [
      {
        paragraphs: [
          'Karim coache la préparation physique à Nice depuis cinq ans. Excellent sur le terrain, invisible en ligne : un compte Instagram à l’abandon, trois posts en deux ans, zéro régularité. Le bouche-à-oreille plafonnait. En février, il décide de prendre le contenu au sérieux — sans pour autant y passer ses soirées.',
        ],
      },
      {
        heading: 'Le problème n’était pas le talent, mais la constance',
        paragraphs: [
          'La plupart des coachs savent quoi dire. Ce qui manque, c’est le temps et la discipline de publier chaque semaine. Or l’algorithme récompense la régularité, pas la perfection. Un post moyen publié 3 fois par semaine bat un post parfait publié une fois par trimestre.',
          'Karim a commencé par bloquer un créneau : générer un mois de contenu d’un coup, le relire en 20 minutes, puis le programmer. Fini la page blanche du dimanche soir.',
        ],
      },
      {
        heading: 'Ce qui a changé concrètement',
        paragraphs: ['Trois leviers ont fait la différence :'],
        bullets: [
          'Un rythme tenu : 8 posts Instagram + 4 LinkedIn chaque mois, sans exception.',
          'Des accroches travaillées : chaque post commence par une promesse claire ou une question.',
          'Un appel à l’action systématique : « envoie-moi un message pour un bilan offert ».',
        ],
      },
      {
        heading: 'Les résultats en chiffres',
        paragraphs: [
          'En six mois, son compte est passé de 600 à 2 400 abonnés locaux qualifiés. Surtout, il a converti : de 4 clients récurrents à 12, soit un chiffre d’affaires multiplié par trois. Le contenu ne remplace pas le coaching — il ouvre la porte.',
        ],
      },
      {
        heading: 'La leçon à retenir',
        paragraphs: [
          'Vous n’avez pas besoin d’être influenceur. Vous avez besoin d’être présent, utile et régulier. C’est exactement ce qu’AuraPost automatise : un mois de contenu calibré sur votre spécialité, généré en deux minutes, prêt à publier.',
        ],
      },
    ],
  },
  {
    slug: '5-erreurs-de-contenu-des-coachs',
    title: 'Les 5 erreurs de contenu que font 90 % des coachs',
    excerpt:
      'Publier sans régularité, parler de soi, oublier l’appel à l’action… Voici les cinq erreurs qui plombent votre visibilité — et comment les corriger dès cette semaine.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-04-22',
    category: 'Stratégie',
    cover: '#A855F7',
    sections: [
      {
        paragraphs: [
          'Après avoir analysé des centaines de comptes de coachs sportifs, un constat revient : ce ne sont pas les meilleurs entraîneurs qui gagnent en ligne, mais ceux qui évitent quelques erreurs basiques. Les voici.',
        ],
      },
      {
        heading: '1. Publier quand l’inspiration vient',
        paragraphs: [
          'L’inspiration est une mauvaise stratégie de production. Sans calendrier, vous publiez par à-coups, et l’algorithme vous oublie. La solution : produire en lot et programmer à l’avance.',
        ],
      },
      {
        heading: '2. Parler de soi au lieu de parler au client',
        paragraphs: [
          '« J’ai fait telle formation, j’ai tel diplôme » n’intéresse personne tant que le lecteur ne sait pas ce que ça change POUR LUI. Reformulez chaque post du point de vue du client et de son problème.',
        ],
      },
      {
        heading: '3. Oublier l’appel à l’action',
        paragraphs: [
          'Un post sans CTA est une opportunité perdue. Dites toujours quoi faire ensuite : commenter, enregistrer, envoyer un message. Un seul CTA par post, clair et unique.',
        ],
      },
      {
        heading: '4. Négliger les trois premières secondes',
        paragraphs: [
          'On décide de lire (ou non) un post en moins de trois secondes. Soignez l’accroche : une question, un chiffre, une promesse, une tension. Le reste ne sera jamais lu si l’accroche échoue.',
        ],
      },
      {
        heading: '5. Vouloir être sur tous les réseaux à la fois',
        paragraphs: [
          'Mieux vaut être excellent sur deux réseaux que médiocre sur cinq. Pour un coach, Instagram (proximité) et LinkedIn (autorité) suffisent largement. Concentrez vos efforts.',
        ],
      },
      {
        heading: 'En résumé',
        paragraphs: [
          'Régularité, angle client, CTA, accroche, focus. Cinq principes simples, rarement appliqués. AuraPost les intègre par défaut dans chaque post généré.',
        ],
      },
    ],
  },
  {
    slug: 'publier-3-fois-par-semaine-change-tout',
    title: 'Pourquoi publier 3 fois par semaine change tout',
    excerpt:
      'La fréquence n’est pas un détail : c’est le facteur numéro un de croissance organique. Voici pourquoi trois publications hebdomadaires font basculer un compte.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-05-06',
    category: 'Croissance',
    cover: '#6D28D9',
    sections: [
      {
        paragraphs: [
          'Si vous ne deviez optimiser qu’une seule variable de votre présence en ligne, ce serait la fréquence. Pas la qualité du montage, pas le matériel : la régularité. Voici pourquoi.',
        ],
      },
      {
        heading: 'L’algorithme teste, puis amplifie',
        paragraphs: [
          'Chaque publication est montrée à un petit échantillon. Si l’engagement est bon, la portée s’élargit. Plus vous publiez, plus vous donnez d’occasions à l’algorithme de vous tester — et de vous récompenser.',
        ],
      },
      {
        heading: 'La répétition construit la confiance',
        paragraphs: [
          'Un prospect a rarement besoin d’un seul post pour vous contacter. Il a besoin de vous voir 5, 10, 15 fois. Trois publications par semaine accélèrent cette familiarité qui précède l’achat.',
        ],
        bullets: [
          'Semaine 1 : il découvre votre compte.',
          'Semaine 3 : il reconnaît votre style.',
          'Semaine 6 : il vous envoie un message.',
        ],
      },
      {
        heading: 'Le vrai obstacle : la production',
        paragraphs: [
          'Trois posts par semaine, c’est douze par mois. Peu de coachs tiennent ce rythme manuellement plus de quelques semaines. C’est précisément le rôle d’un outil de génération : transformer une corvée hebdomadaire en une relecture mensuelle de vingt minutes.',
        ],
      },
      {
        heading: 'Passez à l’action',
        paragraphs: [
          'Choisissez vos jours (par exemple lundi, mercredi, vendredi), générez votre mois de contenu, programmez-le, et tenez le rythme. La croissance organique récompense ceux qui restent.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

/** Temps de lecture estimé (200 mots/min). */
export function readingTimeMinutes(article: Article): number {
  const words = article.sections
    .flatMap((s) => [s.heading ?? '', ...s.paragraphs, ...(s.bullets ?? [])])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
