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

// Bibliotheque photos pour le dialog d'approbation des posts.
//   GET  -> 3 dernieres photos + mini-profil coach (handle + specialite pour l'apercu).
//   POST -> upload (jpg/png/webp/heic <= 10 Mo) ; validation magic bytes + resize sharp + R2/mock.

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
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
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
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    const tenantId = await requireTenantId();

    // Limite de photos selon le plan.
    const max = getPlanLimits(session.user.plan).photosMax;
    const existing = await listPhotos(tenantId, max + 1);
    if (existing.length >= max) {
      return NextResponse.json(
        { error: `Limite de ${max} photos atteinte -- supprime-en une pour en ajouter.` },
        { status: 429 }
      );
    }

    const form = await req.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Aucune photo recue.' }, { status: 400 });

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Photo trop lourde. Taille maximale : ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} Mo.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Validation par signature binaire reelle (pas le file.type declare, falsifiable).
    if (!validateImage(buffer, POST_PHOTO_MIME)) {
      return NextResponse.json({ error: 'Format non supporte (JPG, PNG, WebP ou HEIC).' }, { status: 400 });
    }

    const res = await uploadCoachPhoto(tenantId, file.name || 'photo.jpg', buffer);
    if (!res.ok) {
      logError('[posts/photo POST] uploadCoachPhoto echoue', { reason: res.reason, tenantId });
      return NextResponse.json({ error: "Echec de l'upload. Reessayez." }, { status: 500 });
    }

    const photo = await savePhoto(tenantId, { r2Url: res.url, r2Key: res.key, sizeBytes: file.size });
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    const e = err as { message?: string; stack?: string; code?: string; cause?: unknown };
    logError('[posts/photo POST] erreur interne', {
      error: e?.message ?? String(err),
      stack: e?.stack ?? null,
      code: e?.code ?? null,
      cause: e?.cause ? String(e.cause) : null,
    });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const maxDuration = 30;
