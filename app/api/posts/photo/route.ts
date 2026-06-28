import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { uploadCoachPhoto } from '@/lib/r2';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { listPhotos, savePhoto } from '@/lib/db/photos';
import { logError } from '@/lib/logger';
import { csrfGuard, logUnauthorized, MAX_UPLOAD_BYTES } from '@/lib/security';
import { validateImage, POST_PHOTO_MIME } from '@/lib/upload';
import { getPlanLimits } from '@/lib/plans';

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
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      logError('[posts/photo GET] tenantId manquant dans la session', { userId: session.user.id });
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
    }
    const [photos, coach] = await Promise.all([listPhotos(tenantId, 6), coachMini(tenantId)]);
    return NextResponse.json({ ok: true, photos, coach });
  } catch (err) {
    logError('[posts/photo GET] erreur interne', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    // ── 1. Session ────────────────────────────────────────────────────────────
    let session: Session | null = null;
    try {
      session = await auth();
    } catch (authErr) {
      logError('[posts/photo POST] auth() a throw', {
        error: authErr instanceof Error ? authErr.stack ?? authErr.message : String(authErr),
      });
      return NextResponse.json({ error: 'Erreur de session.' }, { status: 500 });
    }

    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/posts/photo' });
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // ── 2. Tenant (pas de second appel auth() -- on lit directement la session) ─
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      logError('[posts/photo POST] tenantId manquant dans la session', {
        userId: session.user.id,
        plan: session.user.plan ?? null,
      });
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
    }

    // ── 3. Limite photos selon le plan ────────────────────────────────────────
    const max = getPlanLimits(session.user.plan).photosMax;
    let existing: Awaited<ReturnType<typeof listPhotos>>;
    try {
      existing = await listPhotos(tenantId, max + 1);
    } catch (listErr) {
      logError('[posts/photo POST] listPhotos a throw', {
        tenantId,
        error: listErr instanceof Error ? listErr.message : String(listErr),
      });
      existing = [];
    }
    if (existing.length >= max) {
      return NextResponse.json(
        { error: `Limite de ${max} photos atteinte -- supprime-en une pour en ajouter.` },
        { status: 429 }
      );
    }

    // ── 4. Parsing FormData ───────────────────────────────────────────────────
    let form: FormData;
    try {
      form = await req.formData();
    } catch (formErr) {
      logError('[posts/photo POST] formData() a throw', {
        tenantId,
        error: formErr instanceof Error ? formErr.message : String(formErr),
      });
      return NextResponse.json({ error: 'Corps de requete invalide.' }, { status: 400 });
    }

    const file = form.get('photo');
    if (!(file instanceof File)) {
      logError('[posts/photo POST] champ "photo" absent ou invalide', { tenantId, type: typeof file });
      return NextResponse.json({ error: 'Aucune photo recue.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Photo trop lourde. Taille maximale : ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} Mo.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ── 5. Validation format (magic bytes) ───────────────────────────────────
    if (!validateImage(buffer, POST_PHOTO_MIME)) {
      logError('[posts/photo POST] format invalide', {
        tenantId,
        fileName: file.name,
        fileSize: file.size,
        header: buffer.slice(0, 8).toString('hex'),
      });
      return NextResponse.json({ error: 'Format non supporte (JPG, PNG, WebP ou HEIC).' }, { status: 400 });
    }

    // ── 6. Upload R2 (inclut resize sharp) ───────────────────────────────────
    const res = await uploadCoachPhoto(tenantId, file.name || 'photo.jpg', buffer);
    if (!res.ok) {
      logError('[posts/photo POST] uploadCoachPhoto echoue', { reason: res.reason, tenantId });
      return NextResponse.json({ error: "Echec de l'upload. Reessayez." }, { status: 500 });
    }

    // ── 7. Sauvegarde en base ─────────────────────────────────────────────────
    const photo = await savePhoto(tenantId, { r2Url: res.url, r2Key: res.key, sizeBytes: file.size });
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    const e = err as { message?: string; stack?: string; code?: string; cause?: unknown };
    logError('[posts/photo POST] erreur interne non anticipee', {
      error: e?.message ?? String(err),
      stack: e?.stack ?? null,
      code: e?.code ?? null,
      cause: e?.cause ? String(e.cause) : null,
    });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const maxDuration = 30;
