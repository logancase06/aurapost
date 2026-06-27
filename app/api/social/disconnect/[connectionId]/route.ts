// Z-2.4 — Déconnecte un compte social (soft-delete DB + révocation Zernio).
// DELETE /api/social/disconnect/{connectionId}
// Anti-IDOR : vérifie que la connexion appartient bien au tenant de la session.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard, logUnauthorized } from '@/lib/security';
import { revokeConnection, getConnectionById } from '@/lib/db/social-connections';
import { deleteZernioAccount, isZernioConfigured } from '@/lib/zernio';
import { logError, logEvent } from '@/lib/logger';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/social/disconnect' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const tenantId = await requireTenantId();
    const { connectionId } = await params;

    // Anti-IDOR : la connexion doit appartenir à ce tenant.
    const connection = await getConnectionById(connectionId, tenantId);
    if (!connection) {
      return NextResponse.json({ error: 'Connexion introuvable' }, { status: 404 });
    }

    // 1. Soft-delete en DB (status → 'revoked')
    await revokeConnection(connectionId, tenantId);

    // 2. Révoquer côté Zernio si la clé est configurée (non bloquant si erreur).
    if (isZernioConfigured()) {
      const result = await deleteZernioAccount(connection.zernioAccountId);
      if (!result.ok) {
        // On ne bloque pas la déconnexion locale si Zernio échoue.
        logError('[social/disconnect] deleteZernioAccount échec (non bloquant)', {
          tenantId,
          connectionId,
          reason: result.reason,
        });
      }
    }

    logEvent('social.connection_revoked', tenantId, { connectionId, platform: connection.platform });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[social/disconnect DELETE]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
