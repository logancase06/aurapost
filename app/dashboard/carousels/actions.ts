'use server';

import { auth } from '@/lib/auth';
import { requireTenantId as tenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { withAnthropicRetry } from '@/lib/anthropic-retry';
import { logError } from '@/lib/logger';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { getPlanLimits } from '@/lib/plans';
import { z } from 'zod';

export type SlideType = 'titre' | 'point' | 'citation' | 'cta';
export type CarouselStyle = 'minimaliste' | 'colore' | 'pro_sombre';

export interface CarouselSlide {
  numero: number;
  type: SlideType;
  emoji?: string;
  texte: string;
}

export interface CarouselResult {
  slides: CarouselSlide[];
  style: CarouselStyle;
  coachName: string;
}

const InputSchema = z.object({
  postContent: z.string().min(20).max(3000).trim(),
  style: z.enum(['minimaliste', 'colore', 'pro_sombre']),
});

const MOCK_SLIDES: CarouselSlide[] = [
  { numero: 1, type: 'titre', texte: '3 erreurs qui sabotent ta progression' },
  { numero: 2, type: 'point', emoji: '💪', texte: 'Tu sautes les echauffements. Resultat : blessures a repetition qui t\'arretent des semaines.' },
  { numero: 3, type: 'point', emoji: '🍎', texte: 'Tu negliges la nutrition apres l\'effort. La recup\'eration commence dans l\'assiette.' },
  { numero: 4, type: 'point', emoji: '😴', texte: 'Tu dors 5h et tu t\'etonnes de stagner. Le sommeil, c\'est quand tu progresses vraiment.' },
  { numero: 5, type: 'point', emoji: '📊', texte: 'Tu t\'entraines sans plan. Sans structure, tu t\'epuises sans avancer.' },
  { numero: 6, type: 'citation', texte: '"La constance bat l\'intensite. Chaque jour compte, meme les petits efforts."' },
  { numero: 7, type: 'cta', texte: 'Tu veux aller plus loin ? Suis @coach pour plus de conseils ✓' },
];

export async function generateCarouselAction(
  postContent: string,
  style: CarouselStyle
): Promise<{ ok: boolean; data?: CarouselResult; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorise' };
    const tenantId = await tenant();
    if (!tenantId) return { ok: false, error: 'Non autorise' };

    const limits = getPlanLimits(session.user.plan);
    if (!limits.socialPublishEnabled) return { ok: false, error: 'upgrade_required' };

    const parsed = InputSchema.safeParse({ postContent, style });
    if (!parsed.success) return { ok: false, error: 'Contenu invalide' };

    const rl = await checkAuthRateLimit(`carousels:${tenantId}`, 15, 60 * 60 * 1000);
    if (!rl.allowed) return { ok: false, error: `Limite atteinte. Reessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` };

    const [profile] = await db
      .select({ displayName: coachProfiles.displayName })
      .from(coachProfiles)
      .where(eq(coachProfiles.tenantId, tenantId))
      .limit(1);

    const coachName = profile?.displayName ?? 'Coach';

    if (!process.env.ANTHROPIC_API_KEY) {
      return { ok: true, data: { slides: MOCK_SLIDES, style: parsed.data.style, coachName } };
    }

    const systemPrompt = `Tu recois un post LinkedIn/Instagram d'un coach.
Decoupe-le en 5 a 7 slides de carrousel.

Regles :
- Slide 1 : titre court et accrocheur (max 8 mots), type "titre"
- Slides 2-5 : un seul point par slide, max 2 phrases, commence par un emoji, type "point"
- Slide 6 : la phrase la plus impactante du post, en citation, type "citation"
- Slide 7 : "Tu veux aller plus loin ? Suis ${coachName} pour plus de conseils v", type "cta"

Retourne en JSON strict, sans markdown :
{"slides":[{"numero":1,"type":"titre","texte":"..."},{"numero":2,"type":"point","emoji":"...","texte":"..."}]}`;

    const client = new Anthropic();
    const msg = await withAnthropicRetry(
      () => client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Post a transformer en carrousel :\n\n${parsed.data.postContent}` }],
      }, { timeout: 25_000 }),
      '[carousel]',
    );

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const data = JSON.parse(clean) as { slides: CarouselSlide[] };

    return { ok: true, data: { slides: data.slides, style: parsed.data.style, coachName } };
  } catch (err) {
    logError('[carousel-action]', { error: String(err) });
    return { ok: false, error: 'Generation impossible — reessaie.' };
  }
}
