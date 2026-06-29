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

export interface NewsletterResult {
  subject: string;
  intro: string;
  sections: { title: string; body: string }[];
  cta: string;
}

const themeSchema = z.string().min(3).max(200).trim();

export async function generateNewsletterAction(theme: string): Promise<{ ok: boolean; data?: NewsletterResult; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
    const tenantId = await tenant();
    if (!tenantId) return { ok: false, error: 'Non autorisé' };

    const parsed = themeSchema.safeParse(theme);
    if (!parsed.success) return { ok: false, error: 'Thème invalide' };

    const rl = await checkAuthRateLimit(`newsletter:${tenantId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) return { ok: false, error: `Limite atteinte. Réessaie dans ${Math.ceil(rl.retryAfterSec / 60)} min.` };

    const [profile] = await db
      .select({ displayName: coachProfiles.displayName, speciality: coachProfiles.speciality, bio: coachProfiles.bio, tone: coachProfiles.tone, targetAudience: coachProfiles.targetAudience })
      .from(coachProfiles)
      .where(eq(coachProfiles.tenantId, tenantId))
      .limit(1);

    if (!profile) return { ok: false, error: 'Profil introuvable' };

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        ok: true,
        data: {
          subject: `${theme} — La newsletter de ${profile.displayName}`,
          intro: `Bonjour ! Ce mois-ci, on parle de ${theme}. Un sujet qui revient souvent dans mes échanges avec mes clients, et pour cause : c'est un levier puissant pour progresser durablement.`,
          sections: [
            { title: "Pourquoi c'est important", body: `La plupart des coachs sous-estiment l'impact de ${theme} sur les résultats à long terme. Voici pourquoi c'est central dans ma méthode.` },
            { title: 'Ma méthode en 3 étapes', body: "1. Observer sans juger\n2. Planifier avec intention\n3. Ajuster semaine après semaine\n\nCes étapes sont simples mais leur régularité fait toute la différence." },
            { title: 'Ce que disent mes clients', body: "\"Depuis qu'on a travaillé sur ce point, j'ai gagné en clarté et en régularité. Je ne m'imaginais pas que ça pouvait changer autant de choses.\" — Marie, 34 ans" },
          ],
          cta: "Tu veux qu'on en discute ? Réserve une séance découverte gratuite — le lien est dans ma bio Instagram.",
        },
      };
    }

    const client = new Anthropic();
    const msg = await withAnthropicRetry(
      () => client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: `Tu es ${profile.displayName}, coach ${profile.speciality}${profile.targetAudience ? ` spécialisé pour ${profile.targetAudience}` : ''}.
Ton ton : ${profile.tone ?? 'professionnel et bienveillant'}.

Génère une newsletter mensuelle sur le thème : "${parsed.data}"

Réponds UNIQUEMENT en JSON strict :
{
  "subject": "Objet de l'email (max 60 chars, accrocheur)",
  "intro": "Introduction chaleureuse, 2-3 phrases (max 300 chars)",
  "sections": [
    {"title": "Titre section 1 (max 40 chars)", "body": "Corps 3-4 phrases (max 400 chars)"},
    {"title": "Titre section 2 (max 40 chars)", "body": "Corps 3-4 phrases (max 400 chars)"},
    {"title": "Titre section 3 (max 40 chars)", "body": "Corps 3-4 phrases (max 400 chars)"}
  ],
  "cta": "Call to action final, 1-2 phrases (max 200 chars)"
}`,
          },
        ],
      }, { timeout: 25_000 }),
      '[newsletter]',
    );

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const data = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());

    return { ok: true, data: data as NewsletterResult };
  } catch (err) {
    logError('[newsletter-action]', { error: String(err) });
    return { ok: false, error: 'Génération impossible' };
  }
}
