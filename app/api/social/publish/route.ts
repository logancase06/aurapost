// Z-3 — Publie un post sur les réseaux sociaux connectés via Zernio.
// POST /api/social/publish
// Body: { postId: string, connectionIds?: string[] }
// Si connectionIds est absent ou vide, publie sur toutes les connexions actives du tenant.
// Gating : pack_complet uniquement (socialPublishEnabled).

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard, logUnauthorized } from '@/lib/security';
import { getPlanLimits } from '@/lib/plans';
import { publishPost, isZernioConfigured } from '@/lib/zernio';
import {
  getConnectionsByTenant,
  getConnectionById,
  createPublication,
  touchConnectionLastUsed,
  type SocialConnectionRow,
} from '@/lib/db/social-connections';
import { getPostById } from '@/lib/db/posts';
import { logError, logEvent } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/social/publish' });
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
    const body = await req.json() as { postId?: unknown; connectionIds?: unknown };

    const postId = typeof body.postId === 'string' ? body.postId : null;
    if (!postId) {
      return NextResponse.json({ error: 'postId requis.' }, { status: 400 });
    }

    const post = await getPostById(tenantId, postId);
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable.' }, { status: 404 });
    }

    // Construire le contenu final (texte + hashtags si présents).
    const hashtagLine =
      post.hashtags.length > 0
        ? '\n\n' + post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
        : '';
    const content = post.content + hashtagLine;

    // Résoudre la liste des connexions cibles.
    let connections;
    const requestedIds = Array.isArray(body.connectionIds)
      ? (body.connectionIds as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];

    if (requestedIds.length > 0) {
      const found = await Promise.all(requestedIds.map((id) => getConnectionById(id, tenantId)));
      connections = found.filter((c): c is SocialConnectionRow => c !== null && c.status === 'active');
    } else {
      connections = await getConnectionsByTenant(tenantId);
    }

    if (connections.length === 0) {
      return NextResponse.json({ error: 'Aucun réseau connecté pour ce tenant.' }, { status: 422 });
    }

    // Publier sur chaque connexion.
    const results = await Promise.all(
      connections.map(async (conn) => {
        const result = await publishPost({
          zernioAccountId: conn.zernioAccountId,
          platform: conn.platform,
          content,
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
            connectionId: conn.id,
            platform: conn.platform,
            zernioPostId: result.data.zernioPostId,
          });
          return { connectionId: conn.id, platform: conn.platform, ok: true, zernioPostId: result.data.zernioPostId };
        } else {
          await createPublication({ id: publicationId, postId, tenantId, connectionId: conn.id });
          logError('[social/publish] publication Zernio échouée', {
            tenantId,
            postId,
            connectionId: conn.id,
            platform: conn.platform,
            reason: result.reason,
            message: result.message,
          });
          return { connectionId: conn.id, platform: conn.platform, ok: false, error: result.message };
        }
      })
    );

    const allFailed = results.every((r) => !r.ok);
    return NextResponse.json({ ok: !allFailed, results }, { status: allFailed ? 502 : 200 });
  } catch (err) {
    logError('[social/publish POST]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
