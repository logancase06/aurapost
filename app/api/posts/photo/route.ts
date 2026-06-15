import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { uploadCoachPhoto } from '@/lib/r2';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { listPhotos, savePhoto } from '@/lib/db/photos';
import { logError } from '@/lib/logger';
import { csrfGuard, logUnauthorized, MAX_UPLOAD_BYTES } from '@/lib/security';
import { validateImage, POST_PHOTO_MIME } from '@/lib/upload';
import { getPlanLimits } from '@/lib/plans';

// Bibliothèque photos pour le dialog d'approbation des posts.
//   GET  → 3 dernières photos + mini-profil coach (handle + spécialité pour l'aperçu).
//   POST → upload (jpg/png/webp/heic ≤ 10 Mo) ; validation magic bytes + resize sharp + R2/mock.

async function coachMini(tenantId: string): Promise<{ displayName: string; speciality: string } | null> {
  const [row] = await db
    .select({ displayName: coachProfiles.displayName, speciality: coachProfiles.speciality })
    .from(coachProfiles)
    .where(eq(coachProfiles.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/posts/photo' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();
    const [photos, coach] = await Promise.all([listPhotos(tenantId, 6), coachMini(tenantId)]);
    return NextResponse.json({ ok: true, photos, coach });
  } catch (err) {
    logError('[posts/photo GET]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/posts/photo' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();

    // Limite de photos selon le plan.
    const max = getPlanLimits(session.user.plan).photosMax;
    const existing = await listPhotos(tenantId, max + 1);
    if (existing.length >= max) {
      return NextResponse.json({ error: `Limite de ${max} photos atteinte — supprime-en une pour en ajouter.` }, { status: 429 });
    }

    const form = await req.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 });

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Photo trop lourde. Taille maximale : ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} Mo.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Validation par signature binaire réelle (pas le file.type déclaré, falsifiable).
    if (!validateImage(buffer, POST_PHOTO_MIME)) {
      return NextResponse.json({ error: 'Format non supporté (JPG, PNG, WebP ou HEIC).' }, { status: 400 });
    }

    const res = await uploadCoachPhoto(tenantId, file.name || 'photo.jpg', buffer);
    if (!res.ok) return NextResponse.json({ error: 'Échec de l’upload. Réessayez.' }, { status: 500 });

    const photo = await savePhoto(tenantId, { r2Url: res.url, r2Key: res.key, sizeBytes: file.size });
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    logError('[posts/photo POST]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const maxDuration = 30;
