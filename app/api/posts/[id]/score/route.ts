import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { db } from '@/lib/db';
import { generatedPosts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { withAnthropicRetry } from '@/lib/anthropic-retry';
import { logError } from '@/lib/logger';
import { getPlanLimits } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ScoreResult {
  score: number; // 0–100
  accroche: number; // /25
  lisibilite: number; // /25
  cta: number; // /25
  hashtags: number; // /25
  conseil: string;
}

function mockScore(content: string): ScoreResult {
  const len = content.length;
  return {
    score: 72,
    accroche: 18,
    lisibilite: 20,
    cta: 17,
    hashtags: 17,
    conseil: 'Renforce ton accroche avec une question ou une statistique frappante.',
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const limits = getPlanLimits(session.user.plan);
    if (!limits.exportEnabled) return NextResponse.json({ error: 'Plan insuffisant' }, { status: 403 });
    const tenantId = await requireTenantId();
    const { id } = await params;

    const [post] = await db
      .select({ content: generatedPosts.content, hashtags: generatedPosts.hashtags, network: generatedPosts.network })
      .from(generatedPosts)
      .where(and(eq(generatedPosts.id, id), eq(generatedPosts.tenantId, tenantId)))
      .limit(1);

    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: true, score: mockScore(post.content) });
    }

    const client = new Anthropic();
    const hashtagsText = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '';

    const msg = await withAnthropicRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Évalue ce post ${post.network} pour un coach sportif. Note chaque critère sur 25 (total /100).

POST :
${post.content}
${hashtagsText ? `\nHASHTAGS : ${hashtagsText}` : ''}

Réponds UNIQUEMENT en JSON strict (pas de markdown) :
{"accroche":X,"lisibilite":X,"cta":X,"hashtags":X,"conseil":"string court max 100 chars"}`,
        },
      ],
    }, { timeout: 15_000 }), 'post-score');

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    let parsed: { accroche: number; lisibilite: number; cta: number; hashtags: number; conseil: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: true, score: mockScore(post.content) });
    }

    const result: ScoreResult = {
      accroche: Math.min(25, Math.max(0, parsed.accroche ?? 0)),
      lisibilite: Math.min(25, Math.max(0, parsed.lisibilite ?? 0)),
      cta: Math.min(25, Math.max(0, parsed.cta ?? 0)),
      hashtags: Math.min(25, Math.max(0, parsed.hashtags ?? 0)),
      conseil: parsed.conseil ?? '',
      score: 0,
    };
    result.score = result.accroche + result.lisibilite + result.cta + result.hashtags;

    return NextResponse.json({ ok: true, score: result });
  } catch (err) {
    logError('[post-score]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
