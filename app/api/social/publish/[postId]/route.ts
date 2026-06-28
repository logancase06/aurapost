// Z-3.1 — Publication sur réseaux sociaux (route dynamique par postId).
// POST /api/social/publish/[postId]
// Body: { platforms: string[] }  ex: ["linkedin", "instagram"]
//
// Différences vs POST /api/social/publish (body: { postId, connectionIds }) :
//   - postId dans le chemin (REST idiomatique)
//   - platforms dans le body (noms de plateforme, pas IDs de connexion)
//   - vérifie que post.status === 'approved' avant de publier

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { getPlanLimits } from '@/lib/plans';
import { publishPost, isZernioConfigured, SUPPORTED_PLATFORMS, type SocialPlatform } from '@/lib/zernio';
import {
  getConnectionsByTenant,
  createPublication,
  touchConnectionLastUsed,
} from '@/lib/db/social-connections';
import { getPostById } from '@/lib/db/posts';
import { getPostPhotoUrl } from '@/lib/db/photos';
import { logError, logEvent } from '@/lib/logger';

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const limits = getPlanLimits(session.user.plan);
    if (!limits.socialPublishEnabled) {
      return NextResponse.json({ error: 'Publication sociale réservée au plan pack_complet.' }, { status: 403 });
    }

    if (!isZernioConfigured()) {
      return NextResponse.json({ error: 'Publication sociale non configurée.' }, { status: 503 });
    }

    const tenantId = await requireTenantId();
    const { postId } = await params;

    // Anti-IDOR : getPostById scope sur tenantId
    const post = await getPostById(tenantId, postId);
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable.' }, { status: 404 });
    }
    if (post.status !== 'approved') {
      return NextResponse.json({ error: 'Le post doit être approuvé avant publication.' }, { status: 400 });
    }

    const body = await req.json() as { platforms?: unknown };
    const requestedPlatforms = (Array.isArray(body.platforms) ? body.platforms as unknown[] : [])
      .filter((p): p is SocialPlatform =>
        typeof p === 'string' && (SUPPORTED_PLATFORMS as readonly string[]).includes(p)
      );

    if (requestedPlatforms.length === 0) {
      return NextResponse.json({ error: 'Au moins une plateforme valide requise (linkedin, instagram).' }, { status: 400 });
    }

    // Connexions actives du tenant, indexées par plateforme
    const allConnections = await getConnectionsByTenant(tenantId);
    const connectionsByPlatform = new Map(allConnections.map((c) => [c.platform as string, c]));

    // Vérifier que chaque plateforme demandée a une connexion active
    const missing = requestedPlatforms.filter((p) => !connectionsByPlatform.has(p));
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Aucun compte connecté pour : ${missing.join(', ')}. Connectez vos réseaux dans Mes réseaux.`,
      }, { status: 400 });
    }

    // Média du post (data: URLs filtrées — non téléchargeables par Zernio)
    const rawPhotoUrl = await getPostPhotoUrl(tenantId, postId);
    const mediaUrl = rawPhotoUrl && !rawPhotoUrl.startsWith('data:') ? rawPhotoUrl : null;

    // Contenu final (texte + hashtags)
    const hashtagLine = post.hashtags.length > 0
      ? '\n\n' + post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
      : '';
    const content = post.content + hashtagLine;

    // Publication parallèle sur chaque plateforme
    const publications = await Promise.all(
      requestedPlatforms.map(async (platform) => {
        const conn = connectionsByPlatform.get(platform)!;

        // Instagram exige un média
        if (platform === 'instagram' && !mediaUrl) {
          return {
            platform,
            publicationId: '',
            ok: false,
            error: 'Instagram exige une photo. Associez une photo à ce post avant de publier.',
          };
        }

        const result = await publishPost({
          zernioAccountId: conn.zernioAccountId,
          platform,
          content,
          mediaUrls: mediaUrl ? [mediaUrl] : undefined,
          isAiGenerated: true,
          tenantId,
        });

        const publicationId = nanoid();

        if (result.ok) {
          await createPublication({
            id: publicationId,
            postId,
            tenantId,
            connectionId: conn.id,
            zernioPostId: result.data.zernioPostId,
          });
          await touchConnectionLastUsed(conn.id);
          logEvent('social.post_published', tenantId, {
            postId,
            platform,
            zernioPostId: result.data.zernioPostId,
            hasMedia: !!mediaUrl,
          });
          return { platform, publicationId, ok: true as const };
        } else {
          await createPublication({ id: publicationId, postId, tenantId, connectionId: conn.id });
          logError('[social/publish/[postId]] Zernio erreur', {
            tenantId, postId, platform, reason: result.reason, message: result.message,
          });
          return { platform, publicationId, ok: false as const, error: result.message };
        }
      })
    );

    const allFailed = publications.every((p) => !p.ok);
    return NextResponse.json({ ok: !allFailed, publications }, { status: allFailed ? 502 : 200 });
  } catch (err) {
    logError('[social/publish/[postId] POST]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
