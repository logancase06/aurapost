// Z-2.3 — Liste les comptes sociaux connectés du tenant.
// GET /api/social/accounts
// Utilisé par ConnectNetworksPanel pour l'état courant des connexions.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { logUnauthorized } from '@/lib/security';
import { getConnectionsByTenant } from '@/lib/db/social-connections';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/social/accounts' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const tenantId = await requireTenantId();
    const connections = await getConnectionsByTenant(tenantId);

    const accounts = connections.map((c) => ({
      id: c.id,
      platform: c.platform,
      accountName: c.accountName,
      accountAvatar: c.accountAvatar,
      connectedAt: c.connectedAt,
    }));

    return NextResponse.json({ ok: true, accounts });
  } catch (err) {
    logError('[social/accounts GET]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
