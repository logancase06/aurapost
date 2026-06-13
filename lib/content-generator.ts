import { runClaudeCode } from './claude-code';
import { logError, logInfo } from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Générateur de contenu — produit 8 posts Instagram + 4 posts LinkedIn par mois à
// partir du profil coach. Utilise le SDK Claude Code (query()) ; en cas d'échec ou
// d'indisponibilité, bascule sur un générateur mock déterministe (toujours fonctionnel).
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

/** Backoff exponentiel entre tentatives (250ms, 500ms, 1s…), borné à 4s. */
function backoffDelay(attempt: number): number {
  return Math.min(250 * 2 ** (attempt - 1), 4000);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TONE_LABELS: Record<string, string> = {
  motivant: 'motivant et énergique',
  educatif: 'éducatif et pédagogique',
  personnel: 'personnel et authentique',
};

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(profile: CoachProfileInput): string {
  const lang = profile.language === 'en' ? 'English' : 'français';
  const toneLabel = TONE_LABELS[profile.tone] ?? profile.tone;
  return `Tu es un expert en marketing de contenu pour coachs sportifs.

Génère un mois complet de contenu social pour ce coach :
- Nom : ${profile.displayName}
- Spécialité : ${profile.speciality}
- Ville : ${profile.city ?? 'non précisée'}
- Audience cible : ${profile.targetAudience ?? 'grand public sportif'}
- Style de contenu : ${profile.contentStyle ?? 'naturel'}
- Ton souhaité : ${toneLabel}
- Langue de rédaction : ${lang}
${profile.bio ? `- Bio : ${profile.bio}` : ''}

Produis EXACTEMENT ${INSTAGRAM_COUNT} posts Instagram et ${LINKEDIN_COUNT} posts LinkedIn.
Les posts Instagram sont visuels, courts, avec emojis et 5 à 10 hashtags pertinents.
Les posts LinkedIn sont plus professionnels, posent une réflexion, avec 3 à 5 hashtags.

Réponds UNIQUEMENT avec un objet JSON valide (aucun texte avant ou après), au format :
{
  "posts": [
    {
      "network": "instagram" | "linkedin",
      "title": "accroche courte",
      "content": "texte complet du post",
      "hashtags": ["motcle1", "motcle2"],
      "callToAction": "appel à l'action",
      "theme": "thématique du post"
    }
  ]
}`;
}

// ── Parsing robuste ──────────────────────────────────────────────────────────

function extractJson(text: string): unknown {
  // Retire d'éventuelles fences markdown puis isole le premier objet/tableau JSON.
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

/** Vérifie qu'on a assez de posts par réseau ; sinon, on considère la génération invalide. */
function isComplete(posts: PostDraft[]): boolean {
  const ig = posts.filter((p) => p.network === 'instagram').length;
  const li = posts.filter((p) => p.network === 'linkedin').length;
  return ig >= INSTAGRAM_COUNT && li >= LINKEDIN_COUNT;
}

/** Tronque/ordonne pour garantir exactement 8 IG + 4 LI. */
function trimToTarget(posts: PostDraft[]): PostDraft[] {
  const ig = posts.filter((p) => p.network === 'instagram').slice(0, INSTAGRAM_COUNT);
  const li = posts.filter((p) => p.network === 'linkedin').slice(0, LINKEDIN_COUNT);
  return [...ig, ...li];
}

// ── Génération principale ────────────────────────────────────────────────────

/**
 * Génère 8 posts Instagram + 4 posts LinkedIn. Tente le SDK Claude Code avec
 * retry automatique (3 tentatives) ; bascule sur le mock déterministe en dernier recours.
 */
export async function generateMonthlyContent(profile: CoachProfileInput): Promise<PostDraft[]> {
  const prompt = buildPrompt(profile);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await runClaudeCode(prompt);
      const posts = normalizePosts(extractJson(text), profile);
      if (isComplete(posts)) {
        logInfo('[content-generator] génération SDK complète', { attempt, count: posts.length });
        return trimToTarget(posts);
      }
      logError('[content-generator] génération incomplète, retry', { attempt, count: posts.length });
    } catch (err) {
      logError('[content-generator] tentative échouée', { attempt, error: String(err) });
    }
    if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
  }

  logInfo('[content-generator] fallback mock après échec SDK', {});
  return generateMockContent(profile);
}

/**
 * Régénère UN seul post (variante) — même réseau/thème, angle différent.
 */
export async function generateVariant(profile: CoachProfileInput, original: PostDraft): Promise<PostDraft> {
  const prompt = `${buildPrompt(profile)}

CONTEXTE : régénère UN SEUL post ${original.network} sur la thématique « ${original.theme} »,
avec un angle DIFFÉRENT de celui-ci : "${original.content.slice(0, 200)}".
Réponds UNIQUEMENT avec un objet JSON : { "posts": [ { ... un seul post ${original.network} ... } ] }`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await runClaudeCode(prompt);
      const posts = normalizePosts(extractJson(text), profile).filter((p) => p.network === original.network);
      if (posts.length > 0) return posts[0];
    } catch (err) {
      logError('[content-generator] variante échouée', { attempt, error: String(err) });
    }
    if (attempt < MAX_RETRIES) await sleep(backoffDelay(attempt));
  }

  return generateMockVariant(profile, original);
}

// ── Générateur MOCK déterministe ─────────────────────────────────────────────
// Toujours fonctionnel, sans aucune clé. Produit du contenu réaliste et varié
// dérivé du profil coach. Remplacé en pratique par la sortie du SDK Claude Code.

const IG_THEMES = [
  'Conseil du jour',
  'Exercice phare',
  'Erreur à éviter',
  'Témoignage client',
  'Routine matinale',
  'Nutrition',
  'Motivation',
  'Coulisses',
];
const LI_THEMES = ['Expertise', 'Vision du métier', 'Étude de cas', 'Tendance du secteur'];

function emojiFor(tone: string): string {
  return tone === 'educatif' ? '📚' : tone === 'personnel' ? '💬' : '🔥';
}

function mockHashtags(profile: CoachProfileInput, theme: string): string[] {
  const base = profile.speciality
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const city = profile.city ? profile.city.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
  const themeTag = theme.toLowerCase().replace(/[^a-z0-9]/g, '');
  return [...base, 'coachsportif', 'fitness', themeTag, ...(city ? [`coach${city}`] : [])].filter(Boolean);
}

function mockPost(profile: CoachProfileInput, network: Network, theme: string, index: number): PostDraft {
  const e = emojiFor(profile.tone);
  const who = profile.displayName;
  const spec = profile.speciality;
  const place = profile.city ? ` à ${profile.city}` : '';

  const igTemplates = [
    `${e} ${theme} — ${spec}\n\nAujourd'hui je partage avec vous un point clé pour progresser${place}. Petit rappel : la régularité bat l'intensité ponctuelle. Quel est votre objectif cette semaine ? 💪`,
    `${e} ${theme}\n\nVous débutez en ${spec.toLowerCase()} ? Voici l'essentiel à retenir pour des résultats durables. On se concentre sur la technique avant la performance. Enregistrez ce post !`,
    `${e} ${theme}\n\nLa transformation commence par une décision. ${who} vous accompagne${place} pas à pas. Aujourd'hui, on travaille ${theme.toLowerCase()}. Prêt(e) ?`,
  ];
  const liTemplates = [
    `${theme} : ce que 10 ans de ${spec.toLowerCase()} m'ont appris.\n\nLa plupart des gens cherchent des raccourcis. La vérité, c'est que la constance et un accompagnement adapté font toute la différence. Voici ma réflexion pour les professionnels et passionnés${place}.`,
    `${theme}\n\nEn tant que coach spécialisé en ${spec.toLowerCase()}, je constate une chose : le mental précède le physique. Investir dans un suivi structuré change durablement les résultats. Qu'en pensez-vous ?`,
  ];

  const content =
    network === 'instagram'
      ? igTemplates[index % igTemplates.length]
      : liTemplates[index % liTemplates.length];

  return {
    network,
    title: `${theme} — ${spec}`.slice(0, 80),
    content,
    hashtags: mockHashtags(profile, theme),
    callToAction:
      network === 'instagram'
        ? 'Envoyez-moi un message pour démarrer 💬'
        : 'Contactez-moi pour un premier échange.',
    theme,
    tone: profile.tone,
  };
}

export function generateMockContent(profile: CoachProfileInput): PostDraft[] {
  const posts: PostDraft[] = [];
  for (let i = 0; i < INSTAGRAM_COUNT; i++) {
    posts.push(mockPost(profile, 'instagram', IG_THEMES[i % IG_THEMES.length], i));
  }
  for (let i = 0; i < LINKEDIN_COUNT; i++) {
    posts.push(mockPost(profile, 'linkedin', LI_THEMES[i % LI_THEMES.length], i));
  }
  return posts;
}

function generateMockVariant(profile: CoachProfileInput, original: PostDraft): PostDraft {
  const variant = mockPost(profile, original.network, original.theme, Math.floor(Math.random() * 3) + 1);
  return { ...variant, theme: original.theme };
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

/** Génère un pack de 30 légendes courtes. SDK avec retry+backoff, fallback mock. */
export async function generateCaptionPack(profile: CoachProfileInput): Promise<CaptionDraft[]> {
  const prompt = buildCaptionPrompt(profile);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await runClaudeCode(prompt);
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
  for (let i = 0; i < CAPTION_PACK_COUNT; i++) {
    out.push({ content: seeds[i % seeds.length], theme: 'story' });
  }
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
  const all = generateMockContent(profile);
  const ig = all.filter((p) => p.network === 'instagram').slice(0, 2);
  const li = all.filter((p) => p.network === 'linkedin').slice(0, 1);
  return [...ig, ...li];
}
