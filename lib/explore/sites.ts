import type { CoachSiteData, SiteStyle } from '@/templates/coach-site/CoachSite';
import { unsplash, FITNESS_PHOTO_IDS } from '@/lib/stock-images';

// ─────────────────────────────────────────────────────────────────────────────
// Sites de démonstration de l'explorateur (Bloc F). 10 exemples statiques
// (aucune DB) — un par couple style × spécialité. Données 100 % fictives mais
// crédibles : jamais de vrais noms de famille, jamais de statistiques inventées
// présentées comme réelles. Le coach explore ces exemples, met ses préférés en
// favoris, puis choisit un point de départ.
//
// adaptDemoSiteToCoachSiteData() convertit un DemoSite vers le type attendu par
// CoachSite.tsx → on réutilise le renderer unique (pas de second renderer).
// ─────────────────────────────────────────────────────────────────────────────

export type DemoSite = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  style: 'impact' | 'clarte' | 'authenticite';
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  strengths: Array<{
    title: string;
    description: string;
    enabled: boolean;
  }>;
  testimonials: Array<{
    quote: string;
    author: string;
    result?: string;
  }>;
  about: {
    bio: string;
    headline: string;
  };
  contact: {
    email?: string;
    whatsapp?: string;
    calendly?: string;
    instagram?: string;
  };
  tags: string[];
  accentLabel: string;
};

export const DEMO_SITES: DemoSite[] = [
  // ── IMPACT × fitness ───────────────────────────────────────────────────────
  {
    id: 'alex-fitness',
    name: 'Coach Alex',
    specialty: 'Préparation physique',
    city: 'Lyon',
    style: 'impact',
    accentColor: '#FF3B30',
    heroTitle: 'DÉPASSE TES LIMITES.',
    heroSubtitle: 'Programme sur mesure · Résultats garantis · Lyon',
    strengths: [
      { title: 'Adapté à ton niveau', description: 'Chaque programme est construit pour toi, pas pour la moyenne.', enabled: true },
      { title: 'Disponible entre les séances', description: 'WhatsApp, questions, doutes — je réponds toujours.', enabled: true },
      { title: 'Tu comprends pourquoi', description: "J'explique chaque exercice. Tu progresses en sachant.", enabled: true },
    ],
    testimonials: [
      { quote: "En 3 mois j'ai perdu 8kg sans me priver. Alex adapte vraiment tout.", author: 'Marie', result: '-8kg en 3 mois' },
      { quote: 'Programme béton, coach toujours dispo. Je recommande les yeux fermés.', author: 'Thomas', result: '+12kg de muscle' },
    ],
    about: {
      bio: "Coach certifié depuis 8 ans, j'ai accompagné plus de 200 clients à Lyon et en ligne. Mon approche : concret, progressif, adapté à ta vie réelle.",
      headline: 'Coach sportif certifié · Préparation physique · Lyon',
    },
    contact: { whatsapp: '+33600000001', instagram: 'https://instagram.com/alexcoach' },
    tags: ['fitness', 'musculation', 'sport'],
    accentLabel: 'Énergie · Dépassement',
  },

  // ── IMPACT × boxe ────────────────────────────────────────────────────────────
  {
    id: 'marco-boxe',
    name: 'Coach Marco',
    specialty: 'Boxe & Cardio',
    city: 'Paris',
    style: 'impact',
    accentColor: '#8B5CF6',
    heroTitle: 'FORGE TON CORPS.\nFORGE TON MENTAL.',
    heroSubtitle: 'Boxe · Cardio · Confiance en soi',
    strengths: [
      { title: 'Aucune expérience requise', description: 'On part de zéro et on construit ta technique geste après geste.', enabled: true },
      { title: 'Le mental autant que le physique', description: 'La boxe forge la discipline. Tu repars plus solide, dedans comme dehors.', enabled: true },
      { title: 'Des séances qui défoulent', description: 'Tu arrives stressé, tu repars vidé et fier. Cardio garanti.', enabled: true },
    ],
    testimonials: [
      { quote: "Je n'avais jamais touché un sac. Aujourd'hui je m'entraîne trois fois par semaine et j'adore.", author: 'Sofiane', result: '3 mois de régularité' },
      { quote: 'Marco pousse au bon moment et rassure au bon moment. Exactement ce qu\'il me fallait.', author: 'Laura', result: 'Confiance retrouvée' },
    ],
    about: {
      bio: "Ancien compétiteur amateur, je transmets la boxe comme on me l'a transmise : exigeante, respectueuse, et accessible à tous. Mon ring est ouvert à ceux qui veulent se découvrir autant que se dépenser.",
      headline: 'Coach boxe & cardio · Paris',
    },
    contact: { whatsapp: '+33600000002', instagram: 'https://instagram.com/marcoboxe' },
    tags: ['boxe', 'cardio', 'combat'],
    accentLabel: 'Force · Discipline',
  },

  // ── IMPACT × running ──────────────────────────────────────────────────────────
  {
    id: 'sarah-run',
    name: 'Sarah Coaching',
    specialty: 'Running & Trail',
    city: 'Grenoble',
    style: 'impact',
    accentColor: '#F97316',
    heroTitle: 'COURS PLUS LOIN\nQUE TES LIMITES.',
    heroSubtitle: 'De 5km au trail · À ton rythme',
    strengths: [
      { title: 'Du 5km au premier trail', description: 'Un plan progressif qui respecte ton corps et tes objectifs réels.', enabled: true },
      { title: 'Zéro blessure, vraie progression', description: 'On dose la charge intelligemment. Tu cours mieux, pas juste plus.', enabled: true },
      { title: 'La montagne comme terrain de jeu', description: "À Grenoble, on s'entraîne là où les autres rêvent de courir.", enabled: true },
    ],
    testimonials: [
      { quote: "Premier semi terminé en novembre, moi qui soufflais après 2km au départ.", author: 'Julien', result: 'Premier semi-marathon' },
      { quote: 'Sarah a su me remettre en confiance après une blessure. Je cours à nouveau sans peur.', author: 'Nadia', result: 'Retour après blessure' },
    ],
    about: {
      bio: "Traileuse passionnée et coach diplômée, je crois qu'on peut tous courir, à condition d'écouter son corps. J'accompagne des débutants comme des coureurs confirmés vers des objectifs qui les font vibrer.",
      headline: 'Coach running & trail · Grenoble',
    },
    contact: { whatsapp: '+33600000003', instagram: 'https://instagram.com/sarahrun' },
    tags: ['running', 'trail', 'endurance'],
    accentLabel: 'Souffle · Liberté',
  },

  // ── IMPACT × crossfit ─────────────────────────────────────────────────────────
  {
    id: 'crossfit-lyon',
    name: 'CrossFit Élan',
    specialty: 'Force & Endurance',
    city: 'Lyon',
    style: 'impact',
    accentColor: '#DC2626',
    heroTitle: 'PLUS FORT.\nPLUS RAPIDE.\nPLUS TU.',
    heroSubtitle: 'CrossFit · Haltérophilie · Conditioning',
    strengths: [
      { title: 'Une communauté qui te porte', description: "On s'entraîne ensemble, on progresse ensemble. Personne ne reste au fond de la salle.", enabled: true },
      { title: 'Technique avant intensité', description: 'On apprend le mouvement juste avant de charger. La performance vient sans la blessure.', enabled: true },
      { title: 'Scalable à 100%', description: 'Chaque WOD est adapté à ton niveau du jour. Débutant ou confirmé, tu as ta place.', enabled: true },
    ],
    testimonials: [
      { quote: "Je n'aurais jamais cru aimer soulever de la fonte. La communauté change tout.", author: 'Camille', result: '6 mois de pratique' },
      { quote: 'Mon premier pull-up strict après des mois de travail. Émotion totale.', author: 'Hugo', result: 'Premier pull-up strict' },
    ],
    about: {
      bio: "CrossFit Élan, c'est une box à taille humaine où l'on prend le temps de bien faire. Coachs certifiés, ambiance famille, exigence sans ego. On vient pour la forme, on reste pour les gens.",
      headline: 'Box CrossFit · Force & conditioning · Lyon',
    },
    contact: { whatsapp: '+33600000004', instagram: 'https://instagram.com/crossfitelan' },
    tags: ['crossfit', 'force', 'conditioning'],
    accentLabel: 'Intensité · Collectif',
  },

  // ── CLARTÉ × nutrition ───────────────────────────────────────────────────────
  {
    id: 'marie-nutrition',
    name: 'Marie Diététicienne',
    specialty: 'Nutrition & Santé',
    city: 'Bordeaux',
    style: 'clarte',
    accentColor: '#059669',
    heroTitle: 'Mange mieux.\nVis mieux.',
    heroSubtitle: 'Nutrition sans frustration, adaptée à ta vie',
    strengths: [
      { title: 'Zéro régime, zéro interdit', description: 'On rééquilibre ton assiette sans privation. Le durable bat le restrictif.', enabled: true },
      { title: 'Adapté à ton quotidien', description: 'Famille, travail, budget : tes contraintes deviennent le point de départ.', enabled: true },
      { title: 'Un suivi qui rassure', description: 'On ajuste ensemble, semaine après semaine. Tu ne restes jamais seul avec tes questions.', enabled: true },
    ],
    testimonials: [
      { quote: "J'ai enfin compris comment manger sans culpabiliser. Mon énergie a changé du tout au tout.", author: 'Hélène', result: 'Plus d\'énergie au quotidien' },
      { quote: 'Marie ne juge jamais. On avance à mon rythme et ça marche vraiment.', author: 'Romain', result: 'Habitudes durables' },
    ],
    about: {
      bio: "Diététicienne diplômée, je suis convaincue qu'une alimentation saine doit rester un plaisir. Mon rôle : t'aider à construire des habitudes qui te ressemblent et qui tiennent dans le temps, loin des modes.",
      headline: 'Diététicienne diplômée · Nutrition & santé · Bordeaux',
    },
    contact: { email: 'contact@marie-nutrition.fr', calendly: 'https://calendly.com/marie-nutrition/bilan' },
    tags: ['nutrition', 'diététique', 'santé'],
    accentLabel: 'Équilibre · Sérénité',
  },

  // ── CLARTÉ × yoga ─────────────────────────────────────────────────────────────
  {
    id: 'studio-zen',
    name: 'Studio Zen',
    specialty: 'Yoga & Méditation',
    city: 'Toulouse',
    style: 'clarte',
    accentColor: '#2563EB',
    heroTitle: "Retrouve l'équilibre.",
    heroSubtitle: 'Yoga doux · Méditation · Respiration consciente',
    strengths: [
      { title: 'Des cours à taille humaine', description: 'Petits groupes pour un vrai accompagnement, débutant comme initié.', enabled: true },
      { title: 'Le corps et le souffle', description: 'On relie mouvement et respiration pour apaiser le mental durablement.', enabled: true },
      { title: 'Un espace pour souffler', description: 'Loin du tumulte, le studio est pensé comme une parenthèse rien que pour toi.', enabled: true },
    ],
    testimonials: [
      { quote: "Je dors mieux, je respire mieux. Le yoga est devenu mon rendez-vous non négociable.", author: 'Claire', result: 'Sommeil apaisé' },
      { quote: "Première fois que je tiens une pratique régulière. L'ambiance du studio y est pour beaucoup.", author: 'Antoine', result: 'Pratique régulière' },
    ],
    about: {
      bio: "Professeure certifiée, j'ai ouvert le Studio Zen pour offrir un lieu où ralentir vraiment. Mon enseignement est doux, progressif, sans performance : ici, on écoute son corps plutôt qu'on ne le force.",
      headline: 'Professeure de yoga certifiée · Toulouse',
    },
    contact: { email: 'bonjour@studio-zen.fr', calendly: 'https://calendly.com/studio-zen/cours-essai' },
    tags: ['yoga', 'méditation', 'bien-être'],
    accentLabel: 'Calme · Présence',
  },

  // ── CLARTÉ × bien-être ────────────────────────────────────────────────────────
  {
    id: 'emma-bienetre',
    name: 'Coach Emma',
    specialty: 'Bien-être Global',
    city: 'Nantes',
    style: 'clarte',
    accentColor: '#7C3AED',
    heroTitle: 'Ton bien-être,\nenfin priorité.',
    heroSubtitle: 'Corps, mental, habitudes — une approche complète',
    strengths: [
      { title: 'Une vision à 360°', description: 'Sommeil, mouvement, alimentation, mental : on regarde tout, sans cloisonner.', enabled: true },
      { title: 'Des petits pas qui durent', description: 'Pas de révolution brutale. On installe des habitudes simples, tenables, qui s\'accumulent.', enabled: true },
      { title: 'Un accompagnement bienveillant', description: 'Aucun jugement, juste de l\'écoute et un cap clair vers ce qui compte pour toi.', enabled: true },
    ],
    testimonials: [
      { quote: "J'ai repris la main sur mon quotidien sans tout chambouler. Emma rend les choses simples.", author: 'Sophie', result: 'Routine apaisée' },
      { quote: 'Pour la première fois je prends soin de moi sans culpabiliser. Ça change tout.', author: 'Karim', result: 'Équilibre retrouvé' },
    ],
    about: {
      bio: "Coach en bien-être, j'accompagne celles et ceux qui se sont longtemps oubliés. Mon approche est globale et douce : on avance par petites touches, en partant de ta réalité, vers un équilibre qui te ressemble.",
      headline: 'Coach bien-être global · Nantes',
    },
    contact: { email: 'hello@coach-emma.fr', calendly: 'https://calendly.com/coach-emma/decouverte' },
    tags: ['bien-être', 'habitudes', 'équilibre'],
    accentLabel: 'Douceur · Harmonie',
  },

  // ── AUTHENTICITÉ × coach de vie ────────────────────────────────────────────────
  {
    id: 'julie-vie',
    name: 'Julie Martin',
    specialty: 'Coach de Vie',
    city: 'Marseille',
    style: 'authenticite',
    accentColor: '#C2713A',
    heroTitle: 'Reprends les rênes\nde ta vie.',
    heroSubtitle: 'Coaching de vie · Confiance · Clarté intérieure',
    strengths: [
      { title: 'Un espace pour toi seul', description: 'Des séances confidentielles où tu peux enfin déposer ce que tu portes.', enabled: true },
      { title: 'Des outils concrets', description: 'Pas que de l\'écoute : tu repars avec des pistes claires et des actions à ta portée.', enabled: true },
      { title: 'Avancer à ton rythme', description: "Aucune pression. On respecte là où tu en es, et on construit à partir de là.", enabled: true },
    ],
    testimonials: [
      { quote: "J'ai retrouvé une clarté que je n'avais plus depuis des années. Les séances m'ont remise en mouvement.", author: 'Valérie', result: 'Cap retrouvé' },
      { quote: "Julie m'a aidé à oser un changement de vie que je repoussais depuis trop longtemps.", author: 'Marc', result: 'Décision assumée' },
    ],
    about: {
      bio: "Après un parcours qui m'a appris la valeur des vrais virages, je suis devenue coach pour accompagner ces moments où l'on cherche sa direction. Mon coaching est humain, sans recette toute faite : il part de toi, de ton histoire, de tes possibles.",
      headline: 'Coach de vie certifiée · Marseille',
    },
    contact: { email: 'contact@julie-martin.fr', calendly: 'https://calendly.com/julie-martin/premier-echange' },
    tags: ['coaching de vie', 'confiance', 'développement'],
    accentLabel: 'Authenticité · Clarté',
  },

  // ── AUTHENTICITÉ × développement personnel ──────────────────────────────────────
  {
    id: 'thomas-perso',
    name: 'Thomas Coaching',
    specialty: 'Développement Personnel',
    city: 'Lille',
    style: 'authenticite',
    accentColor: '#B45309',
    heroTitle: 'Deviens la meilleure\nversion de toi.',
    heroSubtitle: 'Mindset · Habitudes · Performance durable',
    strengths: [
      { title: 'Du concret, pas du vent', description: 'On laisse les citations de côté pour des méthodes qui tiennent dans le temps.', enabled: true },
      { title: 'Le mindset qui change tout', description: 'On travaille tes croyances limitantes, là où se jouent les vrais blocages.', enabled: true },
      { title: 'Des habitudes qui collent', description: "On installe des routines simples, ancrées dans ton quotidien, qui finissent par devenir toi.", enabled: true },
    ],
    testimonials: [
      { quote: "J'ai arrêté de me saboter et commencé à avancer. Thomas pose les bonnes questions au bon moment.", author: 'Léa', result: 'Passage à l\'action' },
      { quote: 'Des séances qui bousculent dans le bon sens. Je vois enfin où je vais.', author: 'Nicolas', result: 'Objectifs clarifiés' },
    ],
    about: {
      bio: "Longtemps freiné par mes propres doutes, j'ai fini par comprendre que tout se joue dans la tête avant le reste. Je transmets aujourd'hui ce que j'ai appris : des outils de mindset et d'habitudes pour avancer pour de vrai, sans formule magique.",
      headline: 'Coach en développement personnel · Lille',
    },
    contact: { email: 'contact@thomas-coaching.fr', instagram: 'https://instagram.com/thomascoaching' },
    tags: ['développement personnel', 'mindset', 'habitudes'],
    accentLabel: 'Croissance · Constance',
  },

  // ── AUTHENTICITÉ × mental ────────────────────────────────────────────────────────
  {
    id: 'anna-mental',
    name: 'Anna Performance',
    specialty: 'Performance Mentale',
    city: 'Strasbourg',
    style: 'authenticite',
    accentColor: '#92400E',
    heroTitle: 'Ton mental,\nton avantage.',
    heroSubtitle: 'Préparation mentale · Sport et vie professionnelle',
    strengths: [
      { title: 'Gérer la pression', description: "On apprend à transformer le stress en ressource, le jour J comme au quotidien.", enabled: true },
      { title: 'La concentration qui fait gagner', description: 'Des techniques d\'attention et de routine pour rester lucide quand ça compte.', enabled: true },
      { title: 'Pour le sport et le bureau', description: 'Les mêmes leviers mentaux servent en compétition comme dans une prise de parole.', enabled: true },
    ],
    testimonials: [
      { quote: "J'ai abordé ma compétition avec un calme que je ne me connaissais pas. Le travail mental paie.", author: 'Émilie', result: 'Compétition maîtrisée' },
      { quote: 'Mes prises de parole en réunion ne me terrifient plus. Anna m\'a donné des outils précieux.', author: 'David', result: 'Stress maîtrisé' },
    ],
    about: {
      bio: "Préparatrice mentale, j'accompagne sportifs et professionnels sur ce terrain invisible qui décide souvent de tout. Mon travail est sur-mesure et discret : on construit ensemble les routines mentales qui te rendent solide sous pression.",
      headline: 'Préparatrice mentale · Strasbourg',
    },
    contact: { email: 'contact@anna-performance.fr', calendly: 'https://calendly.com/anna-performance/bilan' },
    tags: ['préparation mentale', 'performance', 'concentration'],
    accentLabel: 'Lucidité · Maîtrise',
  },
];

// Photo de coach par démo — Unsplash VÉRIFIÉ (HTTP 200), choisi pour être COHÉRENT
// avec la spécialité (plus de musculation pour une diététicienne) et VARIÉ d'une démo à
// l'autre (4 activités distinctes pour les Impacts, portraits pro pour le coaching).
const DEMO_PHOTO_ID: Record<string, string> = {
  // Impact (fitness) — 4 activités différentes pour éviter la ressemblance entre démos.
  'alex-fitness': '1581009146145-b5ef050c2e1e', // coach / haltères
  'marco-boxe': '1571019613454-1cb2f99b2d8b', // entraînement explosif / box
  'sarah-run': '1517836357463-d25dfeac3438', // course / cardio
  'crossfit-lyon': '1599058917212-d750089bc07e', // conditioning / corde
  // Clarté (wellness) — alimentation, yoga, méditation.
  'marie-nutrition': '1512621776951-a57141f2eefd', // bol healthy / nutrition
  'studio-zen': '1506126613408-eca07ce68773', // yoga / méditation
  'emma-bienetre': '1599901860904-17e6ed7083a0', // méditation / calme
  // Authenticité (coaching) — portraits pro, genre cohérent avec le prénom.
  'julie-vie': '1438761681033-6461ffad8d80', // portrait femme
  'thomas-perso': '1507003211169-0a1dd7228f2d', // portrait homme
  'anna-mental': '1494790108377-be9c29b29330', // portrait femme
};
const FALLBACK_PHOTO_ID = FITNESS_PHOTO_IDS[0];

/**
 * URL de la photo d'un site démo (Unsplash). Portrait par défaut pour le hero.
 * `crop=faces,entropy` : recadrage automatique sur le visage (sinon zone saillante) →
 * la photo n'est plus coupée au centre arbitraire, le sujet reste cadré quel que soit
 * le ratio du conteneur (hero plein cadre, arche, portrait…).
 */
export function demoPhoto(site: DemoSite, w = 1000, h = 1250): string {
  const id = DEMO_PHOTO_ID[site.id] ?? FALLBACK_PHOTO_ID;
  return `${unsplash(id, w, h, 76)}&crop=faces,entropy`;
}

/** Témoignages portant un résultat concret → section « Ce que ça change ». */
function demoResults(site: DemoSite): CoachSiteData['results'] {
  const list = site.testimonials
    .filter((t) => (t.result ?? '').trim())
    .map((t) => ({ result: t.result as string, name: t.author, city: '' }));
  return list.length ? list : undefined;
}

/**
 * Convertit un DemoSite en CoachSiteData (type attendu par CoachSite.tsx).
 * Mappe le titre éditorial du DemoSite vers `heroTagline` (le H1 du renderer),
 * les forces actives vers `forces`, et les témoignages « à résultat » vers
 * la section résultats. Les démos n'ont ni photo ni services → sections masquées.
 */
export function adaptDemoSiteToCoachSiteData(site: DemoSite): CoachSiteData {
  return {
    displayName: site.name,
    speciality: site.specialty,
    city: site.city,
    bio: site.about.bio,
    themeColor: site.accentColor,
    style: site.style as SiteStyle,
    accentColor: site.accentColor,
    contactEmail: site.contact.email ?? null,
    bookingUrl: site.contact.calendly ?? null,
    instagramUrl: site.contact.instagram ?? null,
    whatsapp: site.contact.whatsapp ?? null,
    services: [],
    testimonials: site.testimonials.map((t) => ({ name: t.author, quote: t.quote })),
    forces: site.strengths
      .filter((s) => s.enabled && s.title.trim())
      .map((s) => ({ title: s.title, description: s.description })),
    heroTagline: site.heroTitle,
    heroSubtitle: site.heroSubtitle,
    story: site.about.bio,
    storyQuote: site.about.headline,
    results: demoResults(site),
    photoUrl: demoPhoto(site),
  };
}

/** Recherche un DemoSite par id (utilisé par la server action applyDemoStyle). */
export function findDemoSite(id: string): DemoSite | undefined {
  return DEMO_SITES.find((s) => s.id === id);
}
