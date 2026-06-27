'use server';

import { auth } from '@/lib/auth';
import { requireTenantId as tenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { logError } from '@/lib/logger';
import { z } from 'zod';

export interface ReelScript {
  title: string;
  hook: { duration: string; text: string; visualNote?: string };
  body: { duration: string; text: string; visualNote?: string };
  cta: { duration: string; text: string };
  hashtags: string[];
  caption: string;
}

const topicSchema = z.string().min(3).max(200).trim();

export async function generateReelScriptAction(topic: string): Promise<{ ok: boolean; data?: ReelScript; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Non autorisé' };
    const tenantId = await tenant();
    if (!tenantId) return { ok: false, error: 'Non autorisé' };

    const parsed = topicSchema.safeParse(topic);
    if (!parsed.success) return { ok: false, error: 'Sujet invalide' };

    const [profile] = await db
      .select({ displayName: coachProfiles.displayName, speciality: coachProfiles.speciality, tone: coachProfiles.tone, targetAudience: coachProfiles.targetAudience })
      .from(coachProfiles)
      .where(eq(coachProfiles.tenantId, tenantId))
      .limit(1);

    if (!profile) return { ok: false, error: 'Profil introuvable' };

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        ok: true,
        data: {
          title: `${topic} — Script Reel`,
          hook: {
            duration: '0–3s',
            text: `${topic.charAt(0).toUpperCase() + topic.slice(1)} : voici ce que personne ne te dit.`,
            visualNote: 'Regard caméra, fond neutre, sous-titres gros caractères',
          },
          body: {
            duration: '3–45s',
            text: "Première chose : la régularité. Tu n'as pas besoin de te surpasser à chaque fois. La constance bat l'intensité.\n\nDeuxième chose : ton environnement. Ce que tu mets autour de toi influence ton énergie plus que tu ne le penses.\n\nTroisième chose : la récupération. C'est là que la vraie progression se fait.",
            visualNote: 'B-roll entraînement / pause / environnement sain',
          },
          cta: {
            duration: '45–60s',
            text: 'Tu veux qu\'on creuse le sujet ensemble ? Clique sur le lien en bio et réserve une séance découverte.',
          },
          hashtags: ['coaching', 'motivation', 'fitness', 'bienetre', 'coach', 'reels', 'sport', 'mentale'],
          caption: `${topic.charAt(0).toUpperCase() + topic.slice(1)} — tu veux progresser vraiment ? Voici les 3 points que j'aborde avec tous mes clients. 🎯\n\n👉 Lien en bio pour qu'on en parle.`,
        },
      };
    }

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Tu es ${profile.displayName}, coach ${profile.speciality}${profile.targetAudience ? ` pour ${profile.targetAudience}` : ''}.
Ton style : ${profile.tone ?? 'direct, authentique, motivant'}.

Crée un script complet pour un Reel Instagram / TikTok (60s max) sur le sujet : "${parsed.data}"

Réponds UNIQUEMENT en JSON strict :
{
  "title": "Titre court du script",
  "hook": {
    "duration": "0–3s",
    "text": "Accroche (1-2 phrases percutantes, max 150 chars)",
    "visualNote": "Indication visuelle pour le tournage (optionnel, max 80 chars)"
  },
  "body": {
    "duration": "3–45s",
    "text": "Développement structuré (300-500 chars, lisible à voix haute)",
    "visualNote": "Indication visuelle (optionnel, max 80 chars)"
  },
  "cta": {
    "duration": "45–60s",
    "text": "CTA clair et direct (max 200 chars)"
  },
  "hashtags": ["tableau", "de", "8 à 12", "hashtags", "sans #"],
  "caption": "Légende pour le post (max 400 chars)"
}`,
        },
      ],
    }, { timeout: 25_000 });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const data = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());

    return { ok: true, data: data as ReelScript };
  } catch (err) {
    logError('[reel-script-action]', { error: String(err) });
    return { ok: false, error: 'Génération impossible' };
  }
}
