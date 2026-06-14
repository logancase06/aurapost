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
import { csrfGuard, logUnauthorized } from '@/lib/security';

// Bibliothèque photos pour le dialog d'approbation des posts.
//   GET  → 3 dernières photos + mini-profil coach (handle + spécialité pour l'aperçu).
//   POST → upload (jpg/png/heic ≤ 10 Mo) ; resize serveur + R2/mock → ligne coach_photos.

const MAX_POST_PHOTO = 10 * 1024 * 1024; // 10 Mo (le resize sharp réduit ensuite)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

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

    const form = await req.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucune photo reçue.' }, { status: 400 });

    // Certaines images HEIC arrivent avec un type vide selon le navigateur : on tolère
    // si l'extension est .heic/.heif.
    const heicByName = /\.(heic|heif)$/i.test(file.name);
    if (file.type && !ALLOWED.includes(file.type) && !heicByName) {
      return NextResponse.json({ error: 'Format non supporté (JPG, PNG, WebP ou HEIC).' }, { status: 400 });
    }
    if (file.size > MAX_POST_PHOTO) {
      return NextResponse.json(
        { error: `Photo trop lourde. Taille maximale : ${(MAX_POST_PHOTO / 1024 / 1024).toFixed(0)} Mo.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const res = await uploadCoachPhoto(tenantId, file.name || 'photo.jpg', buffer, file.type || 'image/jpeg');
    if (!res.ok) return NextResponse.json({ error: 'Échec de l’upload. Réessayez.' }, { status: 500 });

    const photo = await savePhoto(tenantId, { r2Url: res.url, sizeBytes: file.size });
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    logError('[posts/photo POST]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const maxDuration = 30;
