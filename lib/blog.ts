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
  {
    slug: 'coach-sportif-nice-instagram',
    title: 'Coach sportif à Nice : publier sur Instagram sans y passer 3h par semaine',
    excerpt:
      'Entre les séances, le suivi et l’administratif, créer du contenu passe en dernier. Voici une méthode concrète pour un coach niçois : rester visible sur Instagram en moins de 30 minutes par mois.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-05-20',
    category: 'Guide local',
    cover: '#FF4D00',
    sections: [
      {
        paragraphs: [
          'La Côte d’Azur est l’un des marchés du coaching sportif les plus concurrentiels de France : Promenade des Anglais bondée de runners, salles pleines, box de cross-training à chaque coin de rue. À Nice, se démarquer ne se joue plus seulement sur le terrain — ça se joue sur Instagram. Le problème : entre deux clients, vous n’avez pas trois heures par semaine à consacrer à la création de contenu.',
        ],
      },
      {
        heading: 'Pourquoi Instagram est décisif pour un coach à Nice',
        paragraphs: [
          'Votre clientèle est locale et mobile : touristes sportifs l’été, actifs et expatriés toute l’année. Ces gens cherchent un coach sur Instagram avant de demander une recommandation. Un compte vivant, géolocalisé et régulier capte cette demande au moment exact où elle se forme.',
          'La géolocalisation compte : un hashtag comme #coachsportifnice ou une mention de la Prom’ ou du Mont Boron ancre votre contenu dans un territoire et vous rend trouvable par les bonnes personnes.',
        ],
      },
      {
        heading: 'La vraie contrainte : le temps, pas les idées',
        paragraphs: [
          'La plupart des coachs savent quoi dire. Ce qui manque, c’est le temps de transformer ce savoir en posts réguliers. Trois heures par semaine pour écrire, trouver les hashtags et programmer, c’est intenable sur la durée. Résultat : on publie deux semaines, puis on abandonne.',
          'La solution n’est pas de publier moins, mais de produire autrement : générer un mois entier en une fois, puis programmer.',
        ],
      },
      {
        heading: 'La méthode en 30 minutes par mois',
        paragraphs: ['Concrètement, voici le rythme qui tient dans la durée :'],
        bullets: [
          'Bloquez 30 minutes en début de mois : générez vos 12 posts d’un coup, calibrés sur votre spécialité et votre ville.',
          'Relisez et ajustez : gardez votre ton, supprimez ce qui ne vous ressemble pas.',
          'Programmez sur le mois (par exemple lundi, mercredi, vendredi).',
          'Ajoutez 2 ou 3 stories spontanées dans la semaine pour la proximité — ça, ça reste manuel et c’est très bien.',
        ],
      },
      {
        heading: 'Statistiques Instagram fitness 2025',
        paragraphs: [
          'Les comptes fitness qui publient au moins 3 fois par semaine voient une portée organique nettement supérieure à ceux qui publient sporadiquement. La régularité, pas la production cinématographique, reste le premier facteur de croissance. Et un post utile vaut mille posts parfaits jamais publiés.',
        ],
      },
      {
        heading: 'Essayez sans risque',
        paragraphs: [
          'AuraPost génère un mois de contenu calibré sur votre spécialité et votre ville, en deux minutes. Essayez gratuitement — 4 posts offerts ce mois, sans carte bancaire.',
        ],
      },
    ],
  },
  {
    slug: 'hyrox-contenu-instagram',
    title: 'Hyrox : le guide complet du contenu Instagram pour coachs (2025)',
    excerpt:
      'Hyrox explose en France. Pour un coach spécialisé, Instagram est le canal d’acquisition n°1 — à condition de parler le bon langage. Le guide complet : angles, formats, accroches qui convertissent.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-05-27',
    category: 'Niche',
    cover: '#FF4D00',
    sections: [
      {
        paragraphs: [
          'Hyrox est passé en quelques années de discipline confidentielle à phénomène de masse, avec des événements complets en quelques minutes. Pour un coach spécialisé en préparation Hyrox, c’est une fenêtre rare : une demande forte, des pratiquants prêts à investir dans un accompagnement, et un réseau social — Instagram — où tout se joue.',
        ],
      },
      {
        heading: 'Ce que veulent voir les pratiquants Hyrox',
        paragraphs: [
          'Le public Hyrox est exigeant et technique. Il ne veut pas de motivation vague, il veut du concret : comment pacer le SkiErg, comment ne pas exploser sur les wall balls, comment gérer la transition course-station. Votre contenu doit prouver votre expertise sur ces points précis.',
        ],
        bullets: [
          'Décomposition technique d’une station (sled push, burpees broad jumps, farmer’s carry).',
          'Stratégie de pacing et erreurs classiques de débutants.',
          'Préparation des 12 dernières semaines avant une compétition.',
          'Retours d’expérience clients : un premier Hyrox terminé, un chrono battu.',
        ],
      },
      {
        heading: 'Les formats qui performent',
        paragraphs: [
          'Trois formats sortent du lot pour la niche Hyrox : le post conseil technique (« l’erreur n°1 sur le sled »), le storytelling de prépa (le parcours d’un client vers sa première ligne d’arrivée), et le post résultat chiffré (temps, progression). Évitez le contenu générique « motivation fitness » : la communauté Hyrox le repère immédiatement.',
        ],
      },
      {
        heading: 'Des accroches qui stoppent le scroll',
        paragraphs: ['La première ligne décide de tout. Pour Hyrox, ancrez-la dans le réel :'],
        bullets: [
          '« Tu exploses toujours après le 3ᵉ tour ? Voilà pourquoi. »',
          '« 1h08 sur mon premier Hyrox — sans jamais courir plus de 10 km/semaine. »',
          '« La station qui fait perdre le plus de temps n’est pas celle que tu crois. »',
        ],
      },
      {
        heading: 'Le piège du temps',
        paragraphs: [
          'Produire ce niveau de contenu spécialisé chaque semaine, en plus de coacher, épuise. C’est là qu’un outil calibré sur votre niche fait la différence : il connaît le vocabulaire Hyrox, les stations, le ton de la communauté, et génère des posts que vous n’avez plus qu’à relire.',
        ],
      },
      {
        heading: 'Lancez-vous',
        paragraphs: [
          'AuraPost génère du contenu spécifiquement calibré sur la préparation Hyrox — pas du fitness générique. Testez gratuitement, 4 posts offerts ce mois.',
        ],
      },
    ],
  },
  {
    slug: 'coach-fitness-clients-instagram',
    title: 'Comment un coach fitness génère 10 nouveaux clients par mois avec Instagram',
    excerpt:
      'Pas de budget pub, pas de danses virales : juste une mécanique de contenu pensée pour convertir. Voici la stratégie, étape par étape, pour transformer des abonnés en clients qui paient.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-06-03',
    category: 'Acquisition',
    cover: '#7C3AED',
    sections: [
      {
        paragraphs: [
          'Avoir 10 000 abonnés ne paie pas les factures. Convertir 10 abonnés en clients par mois, si. La différence ne tient pas au nombre de followers, mais à une mécanique de contenu pensée pour transformer l’attention en rendez-vous. Voici comment elle fonctionne.',
        ],
      },
      {
        heading: 'Étape 1 — Attirer les bonnes personnes',
        paragraphs: [
          'Mieux vaut 800 abonnés locaux qualifiés que 50 000 abonnés dispersés dans le monde. Visez la pertinence : votre ville, votre spécialité, votre type de client idéal. Le contenu éducatif (« comment », « pourquoi », « l’erreur à éviter ») attire exactement ceux qui ont un problème que vous résolvez.',
        ],
      },
      {
        heading: 'Étape 2 — Construire la confiance',
        paragraphs: [
          'Personne n’achète au premier post. La confiance se construit par la répétition et la preuve : témoignages clients, résultats chiffrés, coulisses de vos séances. Montrez des transformations réelles, pas des promesses. Alternez expertise (vous savez) et humanité (on a envie de bosser avec vous).',
        ],
      },
      {
        heading: 'Étape 3 — Convertir avec un appel à l’action clair',
        paragraphs: ['C’est l’étape que 90 % des coachs ratent. Chaque semaine, au moins un post doit inviter à passer à l’action :'],
        bullets: [
          '« Bilan offert de 20 minutes — envoie-moi BILAN en message. »',
          '« 2 places se libèrent ce mois-ci. DM ouvert. »',
          '« Réserve ta première séance via le lien en bio. »',
        ],
      },
      {
        heading: 'Le calcul concret',
        paragraphs: [
          'Avec 12 posts par mois, dont 3 à 4 orientés conversion, et un taux de réponse même modeste, générer 10 conversations qualifiées par mois est réaliste. Sur ces 10 conversations, convertir 3 à 5 en clients est un objectif atteignable pour un coach qui répond vite et bien.',
        ],
      },
      {
        heading: 'Tenir le rythme sans s’épuiser',
        paragraphs: [
          'Le seul vrai obstacle est la constance. Générez votre mois de contenu en une fois avec AuraPost, gardez votre énergie pour les conversations et les séances. Essayez gratuitement — 4 posts offerts.',
        ],
      },
    ],
  },
  {
    slug: 'contenu-reseaux-sociaux-coach',
    title: 'Pourquoi 80 % des coachs abandonnent Instagram après 3 mois (et comment l’éviter)',
    excerpt:
      'Ce n’est pas un manque de talent ni d’idées. C’est un problème de système. Comprendre la psychologie de l’abandon — et le mécanisme simple qui permet de tenir un an et plus.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-06-10',
    category: 'Psychologie',
    cover: '#A855F7',
    sections: [
      {
        paragraphs: [
          'Le scénario est toujours le même. Janvier : motivation à bloc, on poste tous les jours. Février : le rythme faiblit. Mars : plus rien. Huit coachs sur dix abandonnent Instagram en trois mois. Ce n’est ni un manque de talent, ni un manque d’idées. C’est un problème de système.',
        ],
      },
      {
        heading: 'L’erreur de départ : compter sur la motivation',
        paragraphs: [
          'La motivation est une ressource volatile. Les premiers jours, elle suffit. Mais dès que la nouveauté s’estompe et que les résultats tardent (l’algorithme met des semaines à récompenser), l’élan retombe. Construire sa présence sur la motivation, c’est bâtir sur du sable.',
        ],
      },
      {
        heading: 'Le piège de la perfection',
        paragraphs: [
          'Beaucoup de coachs abandonnent parce que chaque post leur coûte trop cher : trouver l’idée, écrire, peaufiner, douter. À ce prix, publier devient une montagne. Or la perfection est l’ennemie de la régularité. Un post utile et imparfait, publié, bat un chef-d’œuvre resté en brouillon.',
        ],
      },
      {
        heading: 'La solution : un système qui ne dépend pas de votre humeur',
        paragraphs: ['Pour tenir un an et plus, remplacez la motivation par un système :'],
        bullets: [
          'Produisez en lot : un mois de contenu d’un coup, pas un post à la fois.',
          'Programmez à l’avance : vous ne décidez plus chaque jour.',
          'Abaissez le coût de production : déléguez la rédaction, gardez la relecture.',
          'Mesurez mensuellement, pas quotidiennement : la croissance se voit sur des mois.',
        ],
      },
      {
        heading: 'Le déclic',
        paragraphs: [
          'Le jour où publier ne demande plus qu’une relecture de 20 minutes par mois, l’abandon disparaît. Ce n’est plus une corvée quotidienne, c’est une routine légère. C’est exactement le système qu’AuraPost met en place pour vous.',
        ],
      },
      {
        heading: 'Brisez le cycle',
        paragraphs: [
          'Ne soyez pas la statistique des 80 %. Générez votre premier mois de contenu en deux minutes et tenez la distance. Essayez gratuitement — 4 posts offerts ce mois.',
        ],
      },
    ],
  },
  {
    slug: 'aurapost-vs-chatgpt',
    title: 'AuraPost vs ChatGPT : pourquoi un outil généraliste ne suffit pas pour un coach',
    excerpt:
      'ChatGPT est puissant et gratuit. Alors pourquoi un coach sportif aurait-il besoin d’AuraPost ? Comparatif honnête : ce que chacun fait bien, et où le généraliste atteint ses limites.',
    author: 'L’équipe AuraPost',
    publishedAt: '2026-06-14',
    category: 'Comparatif',
    cover: '#7C3AED',
    sections: [
      {
        paragraphs: [
          'Soyons honnêtes : ChatGPT est un outil remarquable, et il est gratuit. Vous pouvez tout à fait lui demander d’écrire des posts Instagram. Alors pourquoi un coach sportif paierait-il pour AuraPost ? La réponse n’est pas « parce que l’IA est meilleure » — c’est la même famille de modèles. La réponse est dans le système autour de l’IA.',
        ],
      },
      {
        heading: 'Ce que ChatGPT fait très bien',
        paragraphs: [
          'Pour une tâche ponctuelle, ChatGPT est excellent : un post, une idée, une reformulation. Si vous aimez prompter et que vous avez le temps, c’est un super assistant. Aucun reproche là-dessus.',
        ],
      },
      {
        heading: 'Où le généraliste atteint ses limites',
        paragraphs: ['Le problème apparaît quand on veut un système de contenu durable, pas un post isolé :'],
        bullets: [
          'Il repart de zéro à chaque fois : vous re-expliquez votre spécialité, votre ton, votre ville à chaque session.',
          'Il ne mémorise pas votre style : impossible d’imiter durablement votre voix sans tout recoller manuellement.',
          'Il ne structure rien : pas de calendrier, pas de répartition Instagram/LinkedIn, pas de hashtags de niche, pas de programmation.',
          'Il ne fait que le texte : pas de site vitrine, pas de suivi, pas de variantes en un clic.',
        ],
      },
      {
        heading: 'Ce qu’AuraPost ajoute',
        paragraphs: [
          'AuraPost est ChatGPT spécialisé et industrialisé pour les coachs : il connaît déjà votre profil, génère 12 posts calibrés (8 Instagram + 4 LinkedIn) en un clic, mémorise votre ton, ajoute les hashtags de votre niche, propose un calendrier et un site vitrine. Vous passez de « prompter pendant une heure » à « relire pendant vingt minutes ».',
        ],
      },
      {
        heading: 'Le verdict honnête',
        paragraphs: [
          'Si vous publiez occasionnellement et aimez bricoler, ChatGPT suffit. Si vous voulez une présence régulière et professionnelle sans y passer vos soirées, un outil dédié vous fera gagner des heures chaque mois. Le bon outil dépend de votre objectif — mais pour la régularité, le spécialisé gagne.',
        ],
      },
      {
        heading: 'Jugez sur pièces',
        paragraphs: [
          'Le mieux est de comparer vous-même. Générez gratuitement vos premiers posts AuraPost et voyez la différence de calibrage — 4 posts offerts ce mois, sans carte bancaire.',
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
