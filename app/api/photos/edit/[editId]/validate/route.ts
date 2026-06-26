import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard, logUnauthorized } from '@/lib/security';
import { validateEditedPhoto } from '@/lib/db/edited-photos';
import { logError } from '@/lib/logger';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ editId: string }> }) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/photos/edit/[editId]/validate' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();
    const { editId } = await params;

    const ok = await validateEditedPhoto(tenantId, editId);
    if (!ok) return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('[photos/edit/validate PATCH]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
