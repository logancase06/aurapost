import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { uploadCoachPhoto } from '@/lib/r2';
import { getSiteWizardState, savePhotos } from '@/lib/db/coach-site';
import { logError } from '@/lib/logger';
import { csrfGuard, logUnauthorized, MAX_UPLOAD_BYTES } from '@/lib/security';

const MAX_PHOTOS = 3;
const MAX_SIZE = MAX_UPLOAD_BYTES; // 5 Mo (limite serveur, message clair)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Upload de 1 à 3 photos (multipart). Resize serveur + R2 (ou data URL en mock).
export async function POST(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/onboarding/site/photos' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();

    const form = await req.formData();
    const files = form.getAll('photos').filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 });

    const existing = (await getSiteWizardState(tenantId))?.photos ?? [];
    const room = MAX_PHOTOS - existing.length;
    if (room <= 0) return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos.` }, { status: 400 });

    const urls: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json({ error: 'Format non supporté (JPG, PNG ou WebP).' }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `Photo trop lourde. Taille maximale : ${(MAX_SIZE / 1024 / 1024).toFixed(0)} Mo.` },
          { status: 413 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const res = await uploadCoachPhoto(tenantId, file.name, buffer, file.type);
      if (!res.ok) {
        return NextResponse.json({ error: 'Échec de l’upload. Réessayez.' }, { status: 500 });
      }
      urls.push(res.url);
    }

    const photos = [...existing, ...urls].slice(0, MAX_PHOTOS);
    await savePhotos(tenantId, photos);
    return NextResponse.json({ ok: true, photos });
  } catch (err) {
    logError('[onboarding/site/photos]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/onboarding/site/photos' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();
    const body = await req.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url : '';
    const existing = (await getSiteWizardState(tenantId))?.photos ?? [];
    const photos = existing.filter((p) => p !== url);
    await savePhotos(tenantId, photos);
    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
