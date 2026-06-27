// Z-4 — Réception des webhooks Zernio (statut de publication).
// POST /api/social/webhook
// Header attendu : X-Zernio-Signature: sha256=<hex>
// Configurer dans le dashboard Zernio : https://aurapost.fr/api/social/webhook
//
// Événements gérés :
//   post.published → socialPublications.status = 'published'
//   post.failed    → socialPublications.status = 'failed'
//
// Les autres événements sont acceptés silencieusement (HTTP 200) pour éviter les retry Zernio.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyZernioWebhookSignature } from '@/lib/zernio';
import { updatePublicationStatus } from '@/lib/db/social-connections';
import { logError, logEvent } from '@/lib/logger';

interface ZernioWebhookPayload {
  event: string;
  data: {
    _id: string;         // Zernio post ID (= zernioPostId dans socialPublications)
    errorMessage?: string;
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
    logError('[social/webhook] signature invalide', { signatureHeader: signatureHeader ?? 'absent' });
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
    logError('[social/webhook] payload sans _id', { event });
    return NextResponse.json({ error: 'data._id manquant.' }, { status: 400 });
  }

  try {
    if (event === 'post.published') {
      await updatePublicationStatus(zernioPostId, 'published');
      logEvent('social.webhook_published', null, { zernioPostId });
    } else if (event === 'post.failed') {
      await updatePublicationStatus(zernioPostId, 'failed', data.errorMessage);
      logEvent('social.webhook_failed', null, { zernioPostId, errorMessage: data.errorMessage });
    }
    // Les autres événements sont ignorés silencieusement.
  } catch (err) {
    logError('[social/webhook] updatePublicationStatus erreur', { event, zernioPostId, error: String(err) });
    return NextResponse.json({ error: 'Erreur traitement.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
