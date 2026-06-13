// ─────────────────────────────────────────────────────────────────────────────
// Données de démo publiques (sans inscription) — `/demo/[slug]`.
// Sert de page de vente personnalisée : un prospect voit SON futur produit rempli
// de contenu réaliste. Vincent Ferré est le premier client de démonstration.
//
// 100 % statique : aucune écriture en base, aucune clé requise.
// ─────────────────────────────────────────────────────────────────────────────

export interface DemoPost {
  id: string;
  network: 'instagram' | 'linkedin';
  title: string;
  theme: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  status: 'approved' | 'draft';
}

export interface DemoService {
  title: string;
  description: string;
}

export interface DemoTestimonial {
  name: string;
  city: string;
  quote: string;
  rating: number;
}

export interface DemoCoach {
  slug: string;
  displayName: string;
  brandName: string;
  speciality: string;
  cities: string;
  tone: string;
  bio: string;
  themeColor: string;
  subdomain: string;
  stats: { posts: number; approved: number; followersGain: number; siteVisits: number };
  services: DemoService[];
  testimonials: DemoTestimonial[];
  posts: DemoPost[];
}

const VINCENT: DemoCoach = {
  slug: 'vincent',
  displayName: 'Vincent Ferré',
  brandName: 'Ferré Performance',
  speciality: 'Coach Hyrox & Fitness',
  cities: 'Nice & Cagnes-sur-Mer',
  tone: 'motivant',
  bio: 'Coach Hyrox certifié, j’accompagne les athlètes du dimanche comme les compétiteurs sur la Côte d’Azur. Mon obsession : te rendre plus fort, plus endurant, et fier de ce que ton corps peut accomplir.',
  themeColor: '#7C3AED',
  subdomain: 'ferre-performance',
  stats: { posts: 12, approved: 9, followersGain: 1840, siteVisits: 326 },
  services: [
    {
      title: 'Préparation Hyrox',
      description: 'Programmation spécifique course + stations (wall balls, sled, burpees). Pacing, transitions et mental de compétition pour ton prochain chrono.',
    },
    {
      title: 'Coaching PPL & Force',
      description: 'Push / Pull / Legs structuré pour prendre du muscle et de la force sans te blesser. Suivi de charges et progression mesurée chaque semaine.',
    },
    {
      title: 'Trail & Endurance',
      description: 'Plans d’entraînement pour tes courses sur les sentiers de l’arrière-pays niçois. VMA, seuil et sorties longues, calibrés sur ton objectif.',
    },
  ],
  testimonials: [
    { name: 'Julie M.', city: 'Nice', quote: 'J’ai bouclé mon premier Hyrox en 1h12 grâce à Vincent. Le pacing qu’il m’a appris a tout changé.', rating: 5 },
    { name: 'Marc D.', city: 'Cagnes-sur-Mer', quote: 'En 4 mois : +8 kg de masse et un dos qui ne me fait plus mal. Sérieux et à l’écoute.', rating: 5 },
    { name: 'Sophie L.', city: 'Saint-Laurent-du-Var', quote: 'Le trail de l’Estérel terminé sans marcher une seule côte. Merci coach 🙏', rating: 5 },
  ],
  posts: [
    {
      id: 'demo-v-1',
      network: 'instagram',
      status: 'approved',
      theme: 'Conseil Hyrox',
      title: 'Le mur des wall balls',
      content:
        '🔥 Le mur des wall balls, parlons-en.\n\nLa plupart des athlètes explosent ici parce qu’ils partent trop vite. La vérité ? Le Hyrox se gagne au pacing, pas au sprint.\n\nMa règle pour Nice : 10 reps, 3 secondes de pause, on repart. Régulier > héroïque.\n\nTu prépares ton premier Hyrox ? Dis-moi en commentaire ton objectif chrono 👇',
      hashtags: ['hyrox', 'hyroxfrance', 'coachnice', 'wallballs', 'fitnessmotivation', 'cotedazur'],
      callToAction: 'Envoie-moi un message pour un plan Hyrox sur-mesure 💬',
    },
    {
      id: 'demo-v-2',
      network: 'instagram',
      status: 'approved',
      theme: 'Motivation',
      title: 'Ton seul adversaire',
      content:
        '💪 Ton seul adversaire, c’est le toi d’hier.\n\nPas le mec à côté sur le rameur. Pas le chrono des autres. Toi. Hier.\n\nChaque séance à Cagnes, je vois des gens se comparer et s’éteindre. Concentre-toi sur TON pas suivant.\n\nObjectif de la semaine ? Écris-le, ça le rend réel.',
      hashtags: ['motivation', 'mindset', 'coachsportif', 'cagnessurmer', 'discipline', 'hyrox'],
      callToAction: 'Prêt à t’y mettre sérieusement ? DM ouvert.',
    },
    {
      id: 'demo-v-3',
      network: 'instagram',
      status: 'approved',
      theme: 'Exercice phare',
      title: 'Le sled push parfait',
      content:
        '🛷 Le sled push, c’est 80 % de jambes et 20 % de tête.\n\n3 erreurs que je corrige tous les jours :\n1️⃣ Buste trop droit → penche-toi, pousse dans l’axe\n2️⃣ Petits pas → grandes foulées puissantes\n3️⃣ Tu retiens ta respiration → expire à chaque poussée\n\nEnregistre ce post pour ta prochaine séance 📌',
      hashtags: ['sledpush', 'hyroxtraining', 'technique', 'coachnice', 'fitness', 'forcemax'],
      callToAction: 'Tu veux que je filme ta technique ? Viens à un essai.',
    },
    {
      id: 'demo-v-4',
      network: 'instagram',
      status: 'approved',
      theme: 'Nutrition',
      title: 'Avant une grosse séance',
      content:
        '🍌 Quoi manger avant une grosse séance Hyrox ?\n\nMon combo simple, 90 min avant :\n• 1 banane + 1 café\n• 1 tranche de pain complet + miel\n\nPas besoin de compliquer. Du carburant rapide, peu de fibres, zéro ballonnement.\n\nEt toi, c’est quoi ton pré-training ? 👇',
      hashtags: ['nutrition', 'prentrainement', 'hyrox', 'energie', 'coachsportif', 'nice'],
      callToAction: 'Besoin d’un plan nutrition ? Parlons-en en DM.',
    },
    {
      id: 'demo-v-5',
      network: 'instagram',
      status: 'approved',
      theme: 'Coulisses',
      title: '6h du matin à Nice',
      content:
        '🌅 6h du matin sur la Prom’.\n\nPendant que la ville dort, on pousse le sled face à la mer. C’est ça, la Côte d’Azur que j’aime : exigeante et magnifique.\n\nLa motivation ne tombe pas du ciel. Elle se construit, un réveil à la fois.\n\nQui est team early bird ? 🐦',
      hashtags: ['nice', 'promenadedesanglais', 'morningworkout', 'discipline', 'hyrox', 'cotedazur'],
      callToAction: 'Rejoins le créneau 6h, places limitées.',
    },
    {
      id: 'demo-v-6',
      network: 'instagram',
      status: 'approved',
      theme: 'Erreur à éviter',
      title: 'Tu sautes l’échauffement ?',
      content:
        '⛔ Tu sautes l’échauffement pour "gagner du temps" ?\n\nTu gagnes 10 minutes aujourd’hui, tu perds 3 semaines à la prochaine blessure.\n\nMon échauffement Hyrox minimal (8 min) :\n• 2 min cardio progressif\n• mobilité hanches + épaules\n• 10 air squats + 10 swings légers\n\nNon négociable. Ton corps te remerciera.',
      hashtags: ['prevention', 'echauffement', 'blessure', 'coachnice', 'hyrox', 'mobilite'],
      callToAction: 'Je t’envoie ma routine complète : commente "WARMUP".',
    },
    {
      id: 'demo-v-7',
      network: 'instagram',
      status: 'draft',
      theme: 'Témoignage',
      title: 'Julie, 1h12 au premier Hyrox',
      content:
        '🏆 Julie, 1h12 sur son TOUT premier Hyrox.\n\nIl y a 5 mois, elle ne tenait pas 500m de course. Aujourd’hui elle enchaîne 8 stations sans s’arrêter.\n\nLe secret ? La constance. 3 séances/semaine, sans excuse.\n\nBravo Julie, tu es la preuve que ça marche 👏',
      hashtags: ['transformation', 'hyroxfrance', 'temoignage', 'coachnice', 'fierte', 'resultats'],
      callToAction: 'Et si la prochaine histoire, c’était la tienne ? DM.',
    },
    {
      id: 'demo-v-8',
      network: 'instagram',
      status: 'draft',
      theme: 'Routine',
      title: 'Récupération du dimanche',
      content:
        '🧘 Le dimanche, on ne s’entraîne pas. On récupère.\n\nMa routine :\n• 30 min de marche sur le bord de mer\n• mobilité + foam roller\n• 8h de sommeil minimum\n\nLes muscles ne grandissent pas à l’entraînement, mais au repos. Respecte ça et tu progresseras 2x plus vite.',
      hashtags: ['recuperation', 'repos', 'mobilite', 'sommeil', 'coachsportif', 'nice'],
      callToAction: 'Tu veux un plan qui inclut la récup ? Écris-moi.',
    },
    {
      id: 'demo-v-9',
      network: 'linkedin',
      status: 'approved',
      theme: 'Expertise',
      title: 'Pourquoi le Hyrox explose',
      content:
        'Le Hyrox est en train de devenir le sport de fitness le plus accessible de France. Voici pourquoi, et ce que ça change pour l’accompagnement.\n\nContrairement au CrossFit, le format est standardisé : 8 km de course, 8 stations, partout pareil. Résultat : on peut comparer, progresser, se fixer un chrono concret.\n\nEn tant que coach à Nice, je vois arriver un public qui ne se serait jamais lancé en salle classique. Le Hyrox donne un OBJECTIF. Et un objectif change tout dans l’adhésion à long terme.\n\nMon conseil aux pros du sport : ne sous-estimez pas le pouvoir d’un format clair.',
      hashtags: ['hyrox', 'coaching', 'fitness', 'cotedazur'],
      callToAction: 'Vous préparez un Hyrox ? Échangeons.',
    },
    {
      id: 'demo-v-10',
      network: 'linkedin',
      status: 'approved',
      theme: 'Vision du métier',
      title: 'Le mental précède le physique',
      content:
        '10 ans de coaching m’ont appris une chose : le corps suit toujours la tête.\n\nLes clients qui progressent ne sont pas les plus doués. Ce sont ceux qui décident d’y aller, encore, le jour où ils n’en ont pas envie.\n\nMon rôle n’est pas de compter les répétitions. C’est de construire cette discipline, séance après séance, jusqu’à ce qu’elle devienne une identité.\n\n"Je suis quelqu’un qui s’entraîne." Tout part de cette phrase.',
      hashtags: ['mindset', 'coaching', 'discipline', 'performance'],
      callToAction: 'Contactez-moi pour un premier échange.',
    },
    {
      id: 'demo-v-11',
      network: 'linkedin',
      status: 'approved',
      theme: 'Étude de cas',
      title: 'De 0 à finisher en 4 mois',
      content:
        'Cas client (anonymisé) : cadre de 38 ans, sédentaire, objectif Hyrox en 4 mois.\n\nProtocole :\n• Mois 1 : base aérobie + technique des mouvements\n• Mois 2 : volume station + course fractionnée\n• Mois 3 : simulations partielles, travail du pacing\n• Mois 4 : affûtage et mental de course\n\nRésultat : finisher en 1h28, zéro blessure, et surtout l’envie de continuer.\n\nLa méthode bat la motivation. Toujours.',
      hashtags: ['etudedecas', 'hyrox', 'methode', 'resultats'],
      callToAction: 'Un objectif en tête ? Parlons méthode.',
    },
    {
      id: 'demo-v-12',
      network: 'linkedin',
      status: 'draft',
      theme: 'Tendance du secteur',
      title: 'Le coaching hybride',
      content:
        'Présentiel ou distanciel ? La vraie réponse en 2026, c’est : les deux.\n\nMes clients les plus assidus combinent 2 séances encadrées à Nice et 2 séances autonomes guidées par une programmation claire. Le présentiel crée le lien et corrige la technique ; le distanciel crée l’autonomie.\n\nLe coach de demain n’est pas un compteur de reps. C’est un architecte de progression et un créateur de constance.\n\nLe contenu régulier (Instagram, newsletter) fait partie de cet accompagnement. C’est même devenu essentiel.',
      hashtags: ['coaching', 'hybride', 'futuredufitness', 'cotedazur'],
      callToAction: 'Échangeons sur votre accompagnement.',
    },
  ],
};

export const DEMO_COACHES: Record<string, DemoCoach> = {
  vincent: VINCENT,
};

export function getDemoCoach(slug: string): DemoCoach | null {
  return DEMO_COACHES[slug.toLowerCase()] ?? null;
}

export function getDemoSlugs(): string[] {
  return Object.keys(DEMO_COACHES);
}
