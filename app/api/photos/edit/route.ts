import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { csrfGuard, logUnauthorized } from '@/lib/security';
import { getPlanLimits } from '@/lib/plans';
import { getPhoto } from '@/lib/db/photos';
import { saveEditedPhoto, countEditedThisMonth, listEditedPhotos } from '@/lib/db/edited-photos';
import { editImage, base64ToBuffer, isAiImageConfigured } from '@/lib/ai-image-edit';
import { uploadEditedPhoto } from '@/lib/r2';
import { logError } from '@/lib/logger';

const MAX_PROMPT_LENGTH = 500;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith('data:')) {
      const comma = url.indexOf(',');
      return Buffer.from(url.slice(comma + 1), 'base64');
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/photos/edit' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();
    const photos = await listEditedPhotos(tenantId, 20);
    return NextResponse.json({ ok: true, photos });
  } catch (err) {
    logError('[photos/edit GET]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = csrfGuard(req);
    if (csrf) return csrf;

    const session = await auth();
    if (!session?.user?.id) {
      logUnauthorized('session manquante', { path: '/api/photos/edit' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const tenantId = await requireTenantId();

    const limits = getPlanLimits(session.user.plan);
    if (limits.aiEditsMax === 0) {
      return NextResponse.json(
        { error: "L'édition d'images par IA est réservée au plan Coach+Site." },
        { status: 403 }
      );
    }

    const usedThisMonth = await countEditedThisMonth(tenantId);
    if (usedThisMonth >= limits.aiEditsMax) {
      return NextResponse.json(
        { error: `Quota mensuel atteint (${limits.aiEditsMax} images). Réessayez le mois prochain.` },
        { status: 429 }
      );
    }

    let body: { photoId?: unknown; prompt?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
    }

    const photoId = typeof body.photoId === 'string' ? body.photoId.trim() : '';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!photoId) return NextResponse.json({ error: 'photoId manquant.' }, { status: 400 });
    if (!prompt) return NextResponse.json({ error: 'Décris la modification souhaitée.' }, { status: 400 });
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt trop long (max ${MAX_PROMPT_LENGTH} caractères).` },
        { status: 400 }
      );
    }

    const sourcePhoto = await getPhoto(tenantId, photoId);
    if (!sourcePhoto) {
      return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });
    }

    if (!isAiImageConfigured()) {
      return NextResponse.json(
        { error: "L'édition d'images n'est pas configurée sur ce serveur. Contactez le support." },
        { status: 503 }
      );
    }

    const sourceBuffer = await fetchImageBuffer(sourcePhoto.r2Url);
    if (!sourceBuffer) {
      return NextResponse.json({ error: 'Impossible de lire la photo source.' }, { status: 500 });
    }

    const result = await editImage(sourceBuffer, prompt, tenantId);
    if (!result.ok) {
      const status = result.reason === 'content_policy' ? 422 : 500;
      return NextResponse.json({ error: result.message }, { status });
    }

    const imgBuffer = base64ToBuffer(result.base64);
    const upload = await uploadEditedPhoto(tenantId, photoId, imgBuffer);
    if (!upload.ok) {
      return NextResponse.json({ error: "Échec du stockage de l'image éditée." }, { status: 500 });
    }

    const edited = await saveEditedPhoto(tenantId, {
      sourcePhotoId: photoId,
      r2Url: upload.url,
      r2Key: upload.key,
      prompt,
      model: result.model,
    });

    return NextResponse.json({
      ok: true,
      photo: edited,
      quota: { used: usedThisMonth + 1, max: limits.aiEditsMax },
    });
  } catch (err) {
    logError('[photos/edit POST]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const maxDuration = 60;
