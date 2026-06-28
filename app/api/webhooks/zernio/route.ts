// Z-4.1 — Réception des webhooks Zernio (statut de publication).
// POST /api/webhooks/zernio
// Header attendu : X-Zernio-Signature: sha256=<hex>
// À enregistrer dans le dashboard Zernio → Webhooks → URL : https://aurapost.fr/api/webhooks/zernio
//
// Événements gérés :
//   post.published → socialPublications.status = 'published'
//   post.failed    → socialPublications.status = 'failed'
//
// Les autres événements sont acceptés silencieusement (HTTP 200) pour éviter les retries Zernio.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyZernioWebhookSignature } from '@/lib/zernio';
import { updatePublicationStatus } from '@/lib/db/social-connections';
import { logError, logEvent } from '@/lib/logger';

interface ZernioWebhookPayload {
  event: string;
  data: {
    _id: string;
    errorMessage?: string;
    error?: { message?: string };
  };
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Lecture du body impossible.' }, { status: 400 });
  }

  const signatureHeader = req.headers.get('x-zernio-signature');
  const valid = await verifyZernioWebhookSignature(rawBody, signatureHeader);
  if (!valid) {
    logError('[webhooks/zernio] signature invalide', { signatureHeader: signatureHeader ?? 'absent' });
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
  }

  let payload: ZernioWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ZernioWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide.' }, { status: 400 });
  }

  const { event, data } = payload;
  const zernioPostId = data?._id;

  if (!zernioPostId) {
    logError('[webhooks/zernio] payload sans data._id', { event });
    return NextResponse.json({ error: 'data._id manquant.' }, { status: 400 });
  }

  try {
    if (event === 'post.published') {
      await updatePublicationStatus(zernioPostId, 'published');
      logEvent('social.webhook_published', null, { zernioPostId });
    } else if (event === 'post.failed') {
      const errorMessage = data.error?.message ?? data.errorMessage;
      await updatePublicationStatus(zernioPostId, 'failed', errorMessage);
      logError('[webhooks/zernio] échec publication', { zernioPostId, errorMessage });
    } else {
      // Événement inconnu — accepter silencieusement (ne jamais retourner 4xx :
      // Zernio retente indéfiniment sur les erreurs 4xx/5xx).
      logEvent('social.webhook_unknown_event', null, { event, zernioPostId });
    }
  } catch (err) {
    logError('[webhooks/zernio] updatePublicationStatus erreur', { event, zernioPostId, error: String(err) });
    return NextResponse.json({ error: 'Erreur traitement.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
