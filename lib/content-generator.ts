import { isMockForced } from './claude-code';
import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Générateur de contenu — 3 chemins avec sélection automatique :
//
//  1. anthropic-api    : ANTHROPIC_API_KEY présent → appel direct à l'API Anthropic
//                        (claude-sonnet-4-6). C'est le chemin de production (Netlify).
//  2. cloudflare-tunnel: CLAUDE_TUNNEL_URL présent → POST vers une machine locale qui
//                        exécute le SDK Claude Code (route /api/local-generate).
//  3. mock-enrichi     : aucune des deux → générateur mock seedé par tenant, 20 templates
//                        Instagram + 8 LinkedIn par catégorie, sans répétition visible.
//
// `AURAPOST_USE_MOCK=1` force le mock (CI / dev).
// ─────────────────────────────────────────────────────────────────────────────

export interface CoachProfileInput {
  displayName: string;
  speciality: string;
  city?: string | null;
  tone: string; // 'motivant' | 'educatif' | 'personnel'
  contentStyle?: string | null;
  bio?: string | null;
  targetAudience?: string | null;
  language?: string; // 'fr' | 'en'
  /** Analyse du ton détecté sur Instagram (JSON sérialisé) — imité par la génération. */
  toneAnalysis?: string | null;
}

export type Network = 'instagram' | 'linkedin';

export interface PostDraft {
  network: Network;
  title: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  theme: string;
  tone: string;
}

const INSTAGRAM_COUNT = 8;
const LINKEDIN_COUNT = 4;
const MAX_RETRIES = 3;
const CAPTION_PACK_COUNT = 30;
const API_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

// ── Sélection du mode + log clair au démarrage ───────────────────────────────

export type GenerationMode = 'anthropic-api' | 'cloudflare-tunnel' | 'mock-enrichi';

export const GENERATION_MODE: GenerationMode = isMockForced()
  ? 'mock-enrichi'
  : process.env.ANTHROPIC_API_KEY
    ? 'anthropic-api'
    : process.env.CLAUDE_TUNNEL_URL
      ? 'cloudflare-tunnel'
      : 'mock-enrichi';

// Log explicite du mode actif (une fois par process / cold start).
// eslint-disable-next-line no-console
console.log(`[AuraPost] Génération mode: ${GENERATION_MODE}`);
logInfo('[content-generator] mode de génération actif', { mode: GENERATION_MODE });

function backoffDelay(attempt: number): number {
  return Math.min(250 * 2 ** (attempt - 1), 4000);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TONE_LABELS: Record<string, string> = {
  motivant: 'motivant et énergique',
  educatif: 'éducatif et pédagogique',
  personnel: 'personnel et authentique',
};

// ── Appel texte selon le chemin actif ────────────────────────────────────────

/** Chemin 1 — API Anthropic directe (claude-sonnet-4-6). */
async function generateViaAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const mod = await import('@anthropic-ai/sdk');
  const Anthropic = mod.default;
  const client = new Anthropic(); // lit ANTHROPIC_API_KEY dans l'environnement
  const message = await client.messages.create({
    model: API_MODEL,
    max_tokens: maxTokens,
    system:
      'Tu es un expert en copywriting et marketing de contenu pour coachs sportifs. ' +
      'Tu réponds TOUJOURS avec du JSON valide strict, sans aucun texte avant ou après le JSON.',
    messages: [{ role: 'user', content: prompt }],
  });
  let text = '';
  for (const block of message.content) {
    if (block.type === 'text') text += block.text + '\n';
  }
  if (!text.trim()) throw new Error('Réponse vide de l’API Anthropic');
  return text;
}

/** Chemin 2 — tunnel HTTP vers Claude Code local (timeout 30 s). */
async function generateViaTunnel(prompt: string): Promise<string> {
  const base = (process.env.CLAUDE_TUNNEL_URL ?? '').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${base}/api/local-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tunnel-Secret': process.env.TUNNEL_SECRET ?? '' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Tunnel HTTP ${res.status}`);
    const data = (await res.json().catch(() => ({}))) as { text?: string };
    const text = typeof data.text === 'string' ? data.text : '';
    if (!text.trim()) throw new Error('Réponse vide du tunnel');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Texte généré par le chemin actif (api ou tunnel). Le mock ne passe jamais ici. */
async function generateText(prompt: string, maxTokens = 8000): Promise<string> {
  if (GENERATION_MODE === 'anthropic-api') return generateViaAnthropic(prompt, maxTokens);
  if (GENERATION_MODE === 'cloudflare-tunnel') return generateViaTunnel(prompt);
  throw new Error('mode mock-enrichi — aucun appel externe');
}

// ── Prompt mensuel détaillé (catégories + hook + anti-doublon) ───────────────

function buildPrompt(profile: CoachProfileInput): string {
  const lang = profile.language === 'en' ? 'English' : 'français';
  const toneLabel = TONE_LABELS[profile.tone] ?? profile.tone;
  const city = profile.city ?? 'sa ville';
  const toneAnalysisLine = profile.toneAnalysis
    ? `- Ton naturel détecté sur Instagram (À IMITER fidèlement) : ${profile.toneAnalysis}\n`
    : '';
  return `Tu es un expert en copywriting et marketing de contenu pour coachs sportifs.

PROFIL DU COACH :
- Nom : ${profile.displayName}
- Spécialité : ${profile.speciality}
- Ville : ${profile.city ?? 'non précisée'}
- Audience cible : ${profile.targetAudience ?? 'grand public sportif local'}
- Style de contenu : ${profile.contentStyle ?? 'naturel'}
- Ton souhaité : ${toneLabel}
- Langue de rédaction : ${lang}
${toneAnalysisLine}${profile.bio ? `- Bio : ${profile.bio}\n` : ''}
MISSION : produis EXACTEMENT 12 posts, TOUS DIFFÉRENTS — aucune répétition d'angle, d'accroche ni de formulation.

8 posts INSTAGRAM, répartis ainsi :
- 2 MOTIVATION personnelle (énergie, dépassement, mindset)
- 2 ÉDUCATIFS sur la spécialité (conseil technique concret, erreur fréquente à éviter)
- 2 COULISSES / authentiques (quotidien du coach, vécu, côté humain)
- 2 CTA CLIENTS (invitation à travailler ensemble, premier pas, offre)

4 posts LINKEDIN, répartis ainsi :
- 1 STORYTELLING personnel (parcours, anecdote marquante)
- 1 EXPERTISE technique (analyse de fond sur la spécialité)
- 1 RÉSULTAT CLIENT transformé (étude de cas anonymisée et crédible)
- 1 VISION / philosophie du métier

RÈGLES PAR POST :
- Première ligne = accroche forte (hook) qui stoppe le scroll.
- Corps développé (3 à 6 phrases), dans le ton imité du coach.
- Call-to-action clair à la fin.
- 5 à 8 hashtags : mélange de hashtags de NICHE (${profile.speciality}) et de VILLE (${city}).

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant ou après) :
{
  "posts": [
    {
      "network": "instagram" | "linkedin",
      "category": "motivation" | "educatif" | "coulisses" | "cta" | "storytelling" | "expertise" | "resultat" | "vision",
      "title": "accroche courte",
      "content": "texte complet du post (hook en première ligne)",
      "hashtags": ["motcle1", "motcle2"],
      "callToAction": "appel à l'action",
      "theme": "thématique du post"
    }
  ]
}`;
}

// ── Parsing robuste + déduplication ──────────────────────────────────────────

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (start === -1) throw new Error('Aucun JSON détecté dans la réponse');
  const open = cleaned[start];
  const close = open === '{' ? '}' : ']';
  const end = cleaned.lastIndexOf(close);
  if (end === -1) throw new Error('JSON incomplet dans la réponse');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizePosts(raw: unknown, profile: CoachProfileInput): PostDraft[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { posts?: unknown[] })?.posts)
      ? (raw as { posts: unknown[] }).posts
      : [];

  const posts: PostDraft[] = [];
  for (const item of arr) {
    const p = item as Record<string, unknown>;
    const network: Network = p.network === 'linkedin' ? 'linkedin' : 'instagram';
    const content = typeof p.content === 'string' ? p.content.trim() : '';
    if (!content) continue;
    posts.push({
      network,
      title: typeof p.title === 'string' && p.title.trim() ? p.title.trim() : content.slice(0, 60),
      content,
      hashtags: Array.isArray(p.hashtags)
        ? p.hashtags.map((h) => String(h).replace(/^#/, '').trim()).filter(Boolean)
        : [],
      callToAction: typeof p.callToAction === 'string' ? p.callToAction.trim() : '',
      theme: typeof p.theme === 'string' && p.theme.trim() ? p.theme.trim() : 'général',
      tone: profile.tone,
    });
  }
  return posts;
}

/** Supprime les doublons (même accroche/contenu) — vérification anti-répétition. */
function dedupePosts(posts: PostDraft[]): PostDraft[] {
  const seen = new Set<string>();
  const out: PostDraft[] = [];
  for (const p of posts) {
    const key = p.content.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function isComplete(posts: PostDraft[]): boolean {
  const ig = posts.filter((p) => p.network === 'instagram').length;
  const li = posts.filter((p) => p.network === 'linkedin').length;
  return ig >= INSTAGRAM_COUNT && li >= LINKEDIN_COUNT;
}

function trimToTarget(posts: PostDraft[]): PostDraft[] {
  const ig = posts.filter((p) => p.network === 'instagram').slice(0, INSTAGRAM_COUNT);
  const li = posts.filter((p) => p.network === 'linkedin').slice(0, LINKEDIN_COUNT);
  return [...ig, ...li];
}

// ── Génération mensuelle ─────────────────────────────────────────────────────

/**
 * Génère 8 posts Instagram + 4 posts LinkedIn via le chemin actif, avec retry +
 * backoff et déduplication. Bascule sur le mock enrichi en dernier recours.
 * `seed` (tenantId) garantit un mock varié et stable par coach.
 */
export async function generateMonthlyContent(profile: CoachProfileInput, seed?: string): Promise<PostDraft[]> {
  if (GENERATION_MODE === 'mock-enrichi') return generateMockContent(profile, seed);

  const prompt = buildPrompt(profile);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await generateText(prompt, 8000);
      const posts = dedupePosts(normalizePosts(extractJson(text), profile));
      if (isComplete(posts)) {
        logInfo('[content-generator] génération complète', { mode: GENERATION_MODE, attempt, count: posts.length });
        return trimToTarget(posts);
      }
      logError('[content-generator] incomplète/doublons, retry', { attempt, count: posts.length });
    } catch (err) {
      logError('[content-generator] tentative échouée', { mode: GENERATION_MODE, attempt, error: String(err) });
    }
    if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
  }

  logInfo('[content-generator] fallback mock enrichi', {});
  return generateMockContent(profile, seed);
}

/** Régénère UN seul post (variante) — même réseau/thème, angle différent. */
export async function generateVariant(profile: CoachProfileInput, original: PostDraft): Promise<PostDraft> {
  if (GENERATION_MODE === 'mock-enrichi') return generateMockVariant(profile, original);

  const prompt = `${buildPrompt(profile)}

CONTEXTE : régénère UN SEUL post ${original.network} sur la thématique « ${original.theme} »,
avec un angle TOTALEMENT DIFFÉRENT de celui-ci : "${original.content.slice(0, 200)}".
Réponds UNIQUEMENT avec un objet JSON : { "posts": [ { ... un seul post ${original.network} ... } ] }`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await generateText(prompt, 1500);
      const posts = normalizePosts(extractJson(text), profile).filter((p) => p.network === original.network);
      if (posts.length > 0) return posts[0];
    } catch (err) {
      logError('[content-generator] variante échouée', { attempt, error: String(err) });
    }
    if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
  }
  return generateMockVariant(profile, original);
}

/** Un seul post Instagram de démo (mini-générateur public de la landing). */
export async function generateSingleDemoPost(speciality: string, city?: string): Promise<PostDraft> {
  const profile: CoachProfileInput = {
    displayName: 'Coach',
    speciality: speciality?.trim() || 'coaching sportif',
    city: city?.trim() || null,
    tone: 'motivant',
  };

  if (GENERATION_MODE !== 'mock-enrichi') {
    const prompt = `Tu es un expert copywriting Instagram pour coachs sportifs.
Génère 1 SEUL post Instagram percutant pour un coach « ${profile.speciality} »${profile.city ? ` à ${profile.city}` : ''}.
Première ligne = hook fort. Corps de 3-5 phrases. CTA final. 5 à 8 hashtags (niche + ville).
Réponds UNIQUEMENT en JSON : { "posts": [ { "network": "instagram", "title": "...", "content": "...", "hashtags": ["..."], "callToAction": "...", "theme": "..." } ] }`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await generateText(prompt, 1200);
        const posts = normalizePosts(extractJson(text), profile).filter((p) => p.network === 'instagram');
        if (posts[0]) return posts[0];
      } catch (err) {
        logError('[content-generator] demo post échoué', { attempt, error: String(err) });
      }
    }
  }
  return generateMockContent(profile, city || speciality)[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ENRICHI — 20 templates Instagram (4 catégories) + 8 LinkedIn (4 catégories).
// Seedé par tenant pour une sélection stable mais sans répétition visible.
// ─────────────────────────────────────────────────────────────────────────────

interface MockCtx {
  who: string;
  spec: string;
  specLower: string;
  place: string;
  city: string | null;
  e: string;
  audience: string;
}

function emojiFor(tone: string): string {
  return tone === 'educatif' ? '📚' : tone === 'personnel' ? '💬' : '🔥';
}

// PRNG seedé (mulberry32) pour une variété déterministe par coach.
function hashSeed(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickN<T>(pool: T[], n: number, rng: () => number): T[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type Tpl = (c: MockCtx) => string;

const IG_MOTIVATION: Tpl[] = [
  (c) => `${c.e} Ton seul adversaire, c'est le toi d'hier.\n\nPas le voisin de tapis, pas le chrono des autres. Toi. Hier. Concentre-toi sur ton prochain pas et laisse le reste de côté. ${c.place ? `À ${c.city}, ` : ''}on construit la version de toi que tu mérites.`,
  (c) => `${c.e} Pas de motivation aujourd'hui ? Commence quand même.\n\nLa motivation suit l'action, jamais l'inverse. Tu n'as pas besoin d'être prêt, juste de t'y mettre. 10 minutes, et tu auras déjà gagné ta journée.`,
  (c) => `${c.e} La régularité bat l'intensité. Toujours.\n\nTrois séances tenues valent mieux qu'une séance parfaite suivie de deux semaines d'arrêt. En ${c.specLower}, c'est la constance qui transforme les corps. Tu tiens quoi cette semaine ?`,
  (c) => `${c.e} Ce n'est pas une question de temps, c'est une question de priorité.\n\n"J'ai pas le temps" = "ce n'est pas ma priorité". Et c'est ok. Mais le jour où tu décides que ta santé compte, tout change. ${c.who} est là pour t'y aider.`,
  (c) => `${c.e} Le confort ne t'a jamais rendu plus fort.\n\nLa croissance vit de l'autre côté de la zone de confort. Une rep de plus, un kilo de plus, une excuse de moins. C'est là que ça se joue.`,
];

const IG_EDUCATIF: Tpl[] = [
  (c) => `📌 L'erreur n°1 que je vois en ${c.specLower}.\n\nPartir trop vite, trop fort, sans technique. Résultat : blessure ou abandon. La bonne approche ? Maîtrise le mouvement AVANT de chercher la performance. Enregistre ce post.`,
  (c) => `📌 3 choses à corriger dès aujourd'hui.\n\n1. Ton échauffement (non, ce n'est pas une option).\n2. Ta respiration sous l'effort.\n3. Ta récupération entre les séances.\n\nLe détail qui change tout en ${c.specLower}.`,
  (c) => `📌 Tu progresses moins ? Voici pourquoi.\n\nTon corps s'est adapté. Sans nouvelle stimulation (charge, volume, tempo), il n'a aucune raison d'évoluer. La progression se planifie, elle ne s'improvise pas.`,
  (c) => `📌 Le mythe qu'il faut arrêter de croire.\n\n"Plus j'en fais, mieux c'est." Faux. Le muscle ne grandit pas à l'entraînement mais au repos. Récupérer, c'est s'entraîner. Note-le quelque part.`,
  (c) => `📌 Avant ta prochaine séance, lis ça.\n\nUn bon mouvement vaut mieux que dix mouvements bâclés. En ${c.specLower}, la qualité prime toujours sur la quantité. Ralentis, ressens, contrôle.`,
];

const IG_COULISSES: Tpl[] = [
  (c) => `${c.e} 6h du matin${c.place}.\n\nPendant que la ville dort, on est déjà au travail. La motivation ne tombe pas du ciel, elle se construit un réveil à la fois. C'est ça, mon quotidien de coach.`,
  (c) => `${c.e} Ce que personne ne voit derrière "coach sportif".\n\nLes programmes écrits le soir, les messages à 22h, les réussites de mes clients qui me font plus vibrer que les miennes. J'adore ce métier.`,
  (c) => `${c.e} J'ai longtemps cru que la force, c'était physique.\n\nAprès des années en ${c.specLower}, j'ai compris : le mental précède toujours le corps. Mon rôle n'est pas de compter tes reps, mais de construire ta discipline.`,
  (c) => `${c.e} Petit moment vrai.\n\nIl y a des jours où moi aussi je n'ai pas envie. La différence ? J'y vais quand même. Pas pour la perfection, pour la promesse que je me suis faite.`,
  (c) => `${c.e} Mon "pourquoi".\n\nVoir quelqu'un retrouver confiance en son corps, repousser une limite qu'il croyait infranchissable${c.place}… c'est pour ça que je me lève. Et toi, c'est quoi ton pourquoi ?`,
];

const IG_CTA: Tpl[] = [
  (c) => `${c.e} Et si on s'y mettait, pour de vrai ?\n\nTu connais déjà la théorie. Ce qui te manque, c'est un plan clair et quelqu'un qui te tient responsable. C'est exactement ce que je fais${c.place}. Envoie-moi "GO" en message.`,
  (c) => `${c.e} Quelques places se libèrent ce mois-ci.\n\nSi tu veux un accompagnement en ${c.specLower} taillé pour TON objectif (et pas un programme générique), c'est le moment. DM ouvert.`,
  (c) => `${c.e} Première séance offerte.\n\nViens tester, sans engagement. On évalue où tu en es, on définit ton objectif, et tu repars avec un premier plan d'action. Réserve en message.`,
  (c) => `${c.e} Arrête de t'entraîner au hasard.\n\nUn programme structuré te fait gagner des mois. Je construis le tien selon ton niveau et ton emploi du temps${c.place}. On en parle ? Écris-moi.`,
  (c) => `${c.e} Ton objectif mérite mieux que des bonnes résolutions.\n\nTransforme l'intention en résultats avec un suivi sérieux. Réponds à ce post ou envoie-moi un message, je te réponds personnellement.`,
];

const LI_STORYTELLING: Tpl[] = [
  (c) => `Il y a quelques années, je n'aurais jamais imaginé faire ce métier.\n\nUn déclic, une rencontre, et tout a basculé. Aujourd'hui, accompagner des gens en ${c.specLower}${c.place} est devenu une évidence. Le parcours n'est jamais linéaire — c'est ce qui le rend précieux.`,
  (c) => `Ma première séance en tant que coach, je tremblais.\n\nDes années plus tard, ce stress s'est transformé en passion tranquille. Ce que j'ai appris : la compétence rassure, mais c'est l'écoute qui crée la confiance. Mon métier, c'est d'abord une histoire humaine.`,
];

const LI_EXPERTISE: Tpl[] = [
  (c) => `Pourquoi la plupart des programmes de ${c.specLower} échouent.\n\nManque de progressivité, objectifs flous, zéro suivi. La performance durable repose sur trois piliers : planification, technique, récupération. Tout le reste est secondaire. Voici comment je structure un accompagnement efficace.`,
  (c) => `Le détail technique que 90 % des gens négligent en ${c.specLower}.\n\nLa qualité du mouvement avant la charge. Toujours. Un schéma moteur propre protège des blessures et débloque la progression. C'est moins spectaculaire qu'un record, mais infiniment plus rentable sur le long terme.`,
];

const LI_RESULTAT: Tpl[] = [
  (c) => `Cas client (anonymisé) : de zéro à finisher en 4 mois.\n\nObjectif clair, méthode structurée, constance. Mois 1 : les bases. Mois 2 : le volume. Mois 3-4 : l'intensité et le mental. Résultat : objectif atteint, zéro blessure, et surtout l'envie de continuer. La méthode bat la motivation.`,
  (c) => `Une cliente m'a dit : "Je ne pensais pas mon corps capable de ça."\n\nSix mois de travail régulier en ${c.specLower}, et une transformation qui dépasse le physique : confiance, énergie, fierté. Mon vrai métier n'est pas de faire transpirer — c'est de faire grandir.`,
];

const LI_VISION: Tpl[] = [
  (c) => `Le coaching de demain n'est pas un compteur de répétitions.\n\nC'est un architecte de progression et un créateur de constance. La technologie aide, mais rien ne remplace l'accompagnement humain. Ma conviction : on ne vend pas des séances, on transmet une identité — "je suis quelqu'un qui prend soin de soi".`,
  (c) => `Le mental précède toujours le physique.\n\nLes clients qui progressent ne sont pas les plus doués, mais les plus réguliers. Mon rôle de coach en ${c.specLower}${c.place} : construire cette discipline, séance après séance, jusqu'à ce qu'elle devienne une seconde nature.`,
];

const IG_CATEGORIES: { key: string; theme: string; pool: Tpl[] }[] = [
  { key: 'motivation', theme: 'Motivation', pool: IG_MOTIVATION },
  { key: 'educatif', theme: 'Conseil', pool: IG_EDUCATIF },
  { key: 'coulisses', theme: 'Coulisses', pool: IG_COULISSES },
  { key: 'cta', theme: 'Invitation', pool: IG_CTA },
];
const LI_CATEGORIES: { key: string; theme: string; pool: Tpl[] }[] = [
  { key: 'storytelling', theme: 'Storytelling', pool: LI_STORYTELLING },
  { key: 'expertise', theme: 'Expertise', pool: LI_EXPERTISE },
  { key: 'resultat', theme: 'Étude de cas', pool: LI_RESULTAT },
  { key: 'vision', theme: 'Vision du métier', pool: LI_VISION },
];

function mockHashtags(profile: CoachProfileInput, theme: string): string[] {
  const base = profile.speciality
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const city = profile.city ? profile.city.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '') : null;
  const themeTag = theme.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  return [...base, 'coachsportif', 'fitness', themeTag, ...(city ? [`coach${city}`] : [])].filter(Boolean);
}

function ctxFor(profile: CoachProfileInput): MockCtx {
  return {
    who: profile.displayName,
    spec: profile.speciality,
    specLower: profile.speciality.toLowerCase(),
    place: profile.city ? ` à ${profile.city}` : '',
    city: profile.city ?? null,
    e: emojiFor(profile.tone),
    audience: profile.targetAudience ?? 'grand public sportif',
  };
}

function buildMockPost(profile: CoachProfileInput, network: Network, theme: string, content: string): PostDraft {
  return {
    network,
    title: `${theme} — ${profile.speciality}`.slice(0, 80),
    content,
    hashtags: mockHashtags(profile, theme),
    callToAction:
      network === 'instagram' ? 'Envoie-moi un message pour démarrer 💬' : 'Contactez-moi pour un premier échange.',
    theme,
    tone: profile.tone,
  };
}

/** Mock enrichi : 8 IG (2 par catégorie) + 4 LI (1 par catégorie), seedé par coach. */
export function generateMockContent(profile: CoachProfileInput, seed?: string): PostDraft[] {
  const ctx = ctxFor(profile);
  const rng = mulberry32(hashSeed(seed || `${profile.displayName}|${profile.speciality}|${profile.city ?? ''}`));
  const posts: PostDraft[] = [];

  for (const cat of IG_CATEGORIES) {
    for (const tpl of pickN(cat.pool, 2, rng)) {
      posts.push(buildMockPost(profile, 'instagram', cat.theme, tpl(ctx)));
    }
  }
  for (const cat of LI_CATEGORIES) {
    const [tpl] = pickN(cat.pool, 1, rng);
    posts.push(buildMockPost(profile, 'linkedin', cat.theme, tpl(ctx)));
  }
  return posts;
}

function generateMockVariant(profile: CoachProfileInput, original: PostDraft): PostDraft {
  const ctx = ctxFor(profile);
  const cats = original.network === 'instagram' ? IG_CATEGORIES : LI_CATEGORIES;
  const cat = cats.find((c) => c.theme === original.theme) ?? cats[0];
  const rng = mulberry32(hashSeed(`${original.content.slice(0, 40)}|${Date.now()}`));
  const [tpl] = pickN(cat.pool, 1, rng);
  return { ...buildMockPost(profile, original.network, original.theme, tpl(ctx)), theme: original.theme };
}

// ── Pack de légendes (stories Instagram) ─────────────────────────────────────

export interface CaptionDraft {
  content: string;
  theme: string;
}

function buildCaptionPrompt(profile: CoachProfileInput): string {
  const lang = profile.language === 'en' ? 'English' : 'français';
  return `Tu es un expert en copywriting Instagram pour coachs sportifs.
Génère EXACTEMENT ${CAPTION_PACK_COUNT} légendes COURTES (1 à 2 phrases, format story Instagram)
pour ce coach : ${profile.displayName}, spécialité ${profile.speciality}${profile.city ? `, ${profile.city}` : ''}.
Langue : ${lang}. Variées, percutantes, avec 1 emoji max chacune.
Réponds UNIQUEMENT en JSON : { "captions": [ { "content": "...", "theme": "..." } ] }`;
}

/** Génère un pack de 30 légendes courtes via le chemin actif, fallback mock. */
export async function generateCaptionPack(profile: CoachProfileInput): Promise<CaptionDraft[]> {
  if (GENERATION_MODE === 'mock-enrichi') return generateMockCaptions(profile);

  const prompt = buildCaptionPrompt(profile);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await generateText(prompt, 3000);
      const raw = extractJson(text) as { captions?: unknown[] };
      const list = Array.isArray(raw?.captions) ? raw.captions : Array.isArray(raw) ? (raw as unknown[]) : [];
      const captions: CaptionDraft[] = [];
      for (const item of list) {
        const c = item as Record<string, unknown>;
        const content = typeof c.content === 'string' ? c.content.trim() : '';
        if (content) captions.push({ content, theme: typeof c.theme === 'string' ? c.theme : 'story' });
      }
      if (captions.length >= CAPTION_PACK_COUNT) return captions.slice(0, CAPTION_PACK_COUNT);
    } catch (err) {
      logError('[content-generator] caption pack échoué', { attempt, error: String(err) });
    }
    if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
  }
  return generateMockCaptions(profile);
}

function generateMockCaptions(profile: CoachProfileInput): CaptionDraft[] {
  const e = emojiFor(profile.tone);
  const spec = profile.speciality.toLowerCase();
  const seeds = [
    `${e} Ton seul concurrent, c'est toi d'hier.`,
    `Pas de motivation ? Commence quand même. ${e}`,
    `La régularité bat l'intensité. Toujours.`,
    `Un pas aujourd'hui > zéro pas parfait demain.`,
    `Ton corps peut. C'est ta tête qu'il faut convaincre.`,
    `${spec} : la technique avant la performance.`,
    `Repos = partie de l'entraînement, pas une pause.`,
    `Tu n'as pas besoin d'être prêt, juste de commencer.`,
    `Les résultats aiment la constance, pas les excuses.`,
    `Bois de l'eau. Dors. Recommence. ${e}`,
  ];
  const out: CaptionDraft[] = [];
  for (let i = 0; i < CAPTION_PACK_COUNT; i++) out.push({ content: seeds[i % seeds.length], theme: 'story' });
  return out;
}

/** Démo publique (sans inscription) : 3 posts exemple (2 Instagram + 1 LinkedIn). */
export function generateDemoPosts(speciality: string, tone: string, city?: string): PostDraft[] {
  const profile: CoachProfileInput = {
    displayName: 'Votre coaching',
    speciality: speciality || 'coaching sportif',
    city: city || null,
    tone: ['motivant', 'educatif', 'personnel'].includes(tone) ? tone : 'motivant',
  };
  const all = generateMockContent(profile, city || speciality);
  const ig = all.filter((p) => p.network === 'instagram').slice(0, 2);
  const li = all.filter((p) => p.network === 'linkedin').slice(0, 1);
  return [...ig, ...li];
}
