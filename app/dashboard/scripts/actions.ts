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
import { z } from 'zod';

export type VideoFormat = 'reel_tiktok' | 'youtube_shorts' | 'linkedin';
export type VideoStyle = 'educatif' | 'motivant' | 'storytelling' | 'conseil';

export interface VideoScript {
  accroche: string;
  blocs: { temps: string; texte: string }[];
  cta: string;
  hashtags: string[];
  duree_estimee: string;
}

const FORMAT_LABELS: Record<VideoFormat, string> = {
  reel_tiktok: 'Reel / TikTok (30-60s)',
  youtube_shorts: 'YouTube Shorts (60s)',
  linkedin: 'LinkedIn (60-90s)',
};

const STYLE_LABELS: Record<VideoStyle, string> = {
  educatif: 'Educatif',
  motivant: 'Motivant',
  storytelling: 'Storytelling',
  conseil: 'Conseil direct',
};

const InputSchema = z.object({
  sujet: z.string().min(3).max(300).trim(),
  format: z.enum(['reel_tiktok', 'youtube_shorts', 'linkedin']),
  style: z.enum(['educatif', 'motivant', 'storytelling', 'conseil']),
});

export async function generateVideoScriptAction(
  sujet: string,
  format: VideoFormat,
  style: VideoStyle
): Promise<{ ok: boolean; data?: VideoScript; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorise' };
    const tenantId = await tenant();
    if (!tenantId) return { ok: false, error: 'Non autorise' };

    const parsed = InputSchema.safeParse({ sujet, format, style });
    if (!parsed.success) return { ok: false, error: 'Parametres invalides' };

    const rl = await checkAuthRateLimit(`scripts:${tenantId}`, 20, 60 * 60 * 1000);
    if (!rl.allowed) return { ok: false, error: `Limite atteinte. Reessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` };

    const [profile] = await db
      .select({ speciality: coachProfiles.speciality, tone: coachProfiles.tone })
      .from(coachProfiles)
      .where(eq(coachProfiles.tenantId, tenantId))
      .limit(1);

    const specialite = profile?.speciality ?? 'coaching';
    const ton = profile?.tone ?? 'direct, authentique, motivant';

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        ok: true,
        data: {
          accroche: `Tu fais CETTE erreur avec ${parsed.data.sujet}... et tu ne le sais meme pas.`,
          blocs: [
            { temps: '0:03-0:15', texte: "La plupart des gens pensent que c'est une question de volonte. C'est faux." },
            { temps: '0:15-0:30', texte: "Ce qui change tout, c'est la methode. Pas les efforts en plus, la bonne direction." },
            { temps: '0:30-0:45', texte: "Concretement, voici ce que j'applique avec mes clients des la premiere semaine..." },
          ],
          cta: "Si ca te parle, le lien en bio pour qu'on en discute ensemble.",
          hashtags: ['coaching', specialite.toLowerCase().replace(/\s+/g, ''), 'conseil', 'motivation', 'reels'],
          duree_estimee: '45 secondes',
        },
      };
    }

    const systemPrompt = `Tu es expert en creation de contenu video pour coachs sur les reseaux sociaux.
Tu generes des scripts courts, percutants, optimises pour ${FORMAT_LABELS[parsed.data.format]}.

Regles imperatives :
- L'accroche (3 premieres secondes) doit creer une tension ou poser une question qui force a regarder la suite
- Chaque phrase doit pouvoir etre dite en moins de 5 secondes
- Le coach parle a la premiere personne, authentique, pas corporatif
- Le style doit etre : ${STYLE_LABELS[parsed.data.style]}
- La specialite du coach est : ${specialite}
- Son ton habituel est : ${ton}

Retourne le script en JSON strict, sans markdown :
{"accroche":"...","blocs":[{"temps":"0:03-0:10","texte":"..."}],"cta":"...","hashtags":["..."],"duree_estimee":"45 secondes"}`;

    const client = new Anthropic();
    const msg = await withAnthropicRetry(
      () => client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Sujet de la video : "${parsed.data.sujet}"\n\nGenere un script video complet et percutant.` }],
      }, { timeout: 25_000 }),
      '[video-script]',
    );

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const data = JSON.parse(clean) as VideoScript;

    return { ok: true, data };
  } catch (err) {
    logError('[video-script-action]', { error: String(err) });
    return { ok: false, error: 'Generation impossible — reessaie.' };
  }
}
