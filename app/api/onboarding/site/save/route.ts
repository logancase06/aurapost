import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { savePartial, saveInstagram } from '@/lib/db/coach-site';
import type { InstagramData } from '@/lib/instagram';

// Sauvegarde automatique de l'état du formulaire (pas de perte si fermeture).
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = await requireTenantId();

    const body = await req.json().catch(() => ({}));
    const fields: { instagramUrl?: string; reviewsText?: string } = {};
    if (typeof body?.instagramUrl === 'string') fields.instagramUrl = body.instagramUrl.slice(0, 300);
    if (typeof body?.reviewsText === 'string') fields.reviewsText = body.reviewsText.slice(0, 8000);
    if (Object.keys(fields).length) await savePartial(tenantId, fields);

    // Saisie manuelle (fallback Instagram bloqué) : nom + bio.
    if (body?.manual && typeof body.manual === 'object') {
      const m = body.manual as { name?: string; bio?: string };
      const data: InstagramData = {
        name: String(m.name ?? '').slice(0, 120),
        bio: String(m.bio ?? '').slice(0, 300),
        followers: null,
        captions: [],
      };
      await saveInstagram(tenantId, typeof body.instagramUrl === 'string' ? body.instagramUrl : '', data);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
