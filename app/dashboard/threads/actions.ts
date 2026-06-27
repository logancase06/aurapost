'use server';

import { auth } from '@/lib/auth';
import { requireTenantId as tenant } from '@/lib/tenant';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { logError } from '@/lib/logger';
import { z } from 'zod';

export interface TwitterThread {
  topic: string;
  tweets: { index: number; text: string; isHook?: boolean; isCta?: boolean }[];
  hashtags: string[];
}

const topicSchema = z.string().min(3).max(200).trim();

export async function generateThreadAction(topic: string): Promise<{ ok: boolean; data?: TwitterThread; error?: string }> {
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
          topic: parsed.data,
          tweets: [
            { index: 1, text: `${parsed.data} : voici ce que la plupart des gens ne savent pas. 🧵 (1/6)`, isHook: true },
            { index: 2, text: `En tant que coach en ${profile.speciality}, je vois ça chaque semaine dans mes séances.` },
            { index: 3, text: `Le problème n°1 : les gens cherchent des résultats rapides sans poser les bases. Résultat → abandon à J+21.` },
            { index: 4, text: `Ce qui fonctionne vraiment : une progression structurée sur 8 semaines, avec des micro-objectifs hebdomadaires.` },
            { index: 5, text: `3 actions concrètes pour ${profile.targetAudience ?? 'débutants'} :\n→ 15 min/jour plutôt que 1h/semaine\n→ Suivre 1 seul indicateur\n→ Célébrer les petites victoires` },
            { index: 6, text: `Si tu veux en savoir plus sur ${parsed.data}, réponds « OUI » ci-dessous. Je prépare un guide complet. 👇`, isCta: true },
          ],
          hashtags: [profile.speciality.split(' ')[0], 'coaching', 'Twitter', 'thread'],
        },
      };
    }

    const client = new Anthropic();
    // Timeout 20 s : server action synchrone — sans timeout le SDK attend 10 min.
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `Tu es ${profile.displayName}, coach en ${profile.speciality}. Tu crées des fils Twitter/X engageants pour ton audience : ${profile.targetAudience ?? 'sportifs et personnes actives'}. Ton ton : ${profile.tone}. Réponds UNIQUEMENT en JSON valide.`,
      messages: [{
        role: 'user',
        content: `Crée un fil Twitter/X de 6 tweets sur le sujet : "${parsed.data}".

Règles :
- Tweet 1 : accroche forte + "(1/6)" à la fin
- Tweets 2–5 : développement avec valeur concrète, chiffres ou anecdotes
- Tweet 6 : CTA clair (demande une réponse, invite à s'abonner ou poser une question)
- Chaque tweet : max 250 caractères
- Naturel, humain, première personne

Réponds avec ce JSON exact :
{
  "tweets": [
    {"index": 1, "text": "...", "isHook": true},
    {"index": 2, "text": "..."},
    {"index": 3, "text": "..."},
    {"index": 4, "text": "..."},
    {"index": 5, "text": "..."},
    {"index": 6, "text": "...", "isCta": true}
  ],
  "hashtags": ["mot1", "mot2", "mot3"]
}`,
      }],
    }, { timeout: 20_000 });

    let raw = '';
    for (const b of message.content) { if (b.type === 'text') raw += b.text; }
    const parsed2 = JSON.parse(raw.trim()) as { tweets: TwitterThread['tweets']; hashtags: string[] };

    return {
      ok: true,
      data: {
        topic: parsed.data,
        tweets: parsed2.tweets ?? [],
        hashtags: parsed2.hashtags ?? [],
      },
    };
  } catch (err) {
    logError('[threads/generate]', { error: String(err) });
    return { ok: false, error: 'Génération impossible. Réessayez.' };
  }
}
