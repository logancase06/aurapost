// Wrapper GPT Image 1.5 (OpenAI) pour l'édition de photos existantes.
// Choix du modèle : meilleure préservation d'identité/visage sur photos réelles (mode
// "high input fidelity") — critique pour les photos de coachs.
// Modération : intégrée côté OpenAI — les prompts ou images refusés retournent une
// erreur API avec code "content_policy_violation".

import { logError, logEvent } from './logger';

export const AI_IMAGE_MODEL = 'gpt-image-1.5' as const;
export const AI_IMAGE_QUALITY = 'standard' as const; // standard ≈ $0.05/img; high = $0.08

// Vérifie la présence de la clé API (pas de crash silencieux).
export function isAiImageConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export interface EditImageResult {
  ok: true;
  base64: string; // image JPEG base64 (sera re-encodée via sharp avant stockage)
  model: string;
}

export interface EditImageError {
  ok: false;
  reason: 'not_configured' | 'content_policy' | 'api_error' | 'invalid_image';
  message: string;
}

/**
 * Édite une image existante via GPT Image 1.5.
 *
 * @param imageBuffer  Buffer de l'image source (JPEG/PNG, max 20 Mo)
 * @param prompt       Description de la modification souhaitée
 * @param tenantId     Pour le logging (pas envoyé à l'API)
 */
export async function editImage(
  imageBuffer: Buffer,
  prompt: string,
  tenantId: string
): Promise<EditImageResult | EditImageError> {
  if (!isAiImageConfigured()) {
    return { ok: false, reason: 'not_configured', message: 'OPENAI_API_KEY absent — édition image désactivée.' };
  }

  try {
    const { default: OpenAI, toFile } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Convertit le buffer en File (requis par le SDK OpenAI pour les images en entrée).
    const imageFile = await toFile(imageBuffer, 'source.jpg', { type: 'image/jpeg' });

    const response = await client.images.edit({
      model: AI_IMAGE_MODEL,
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: AI_IMAGE_QUALITY,
      response_format: 'b64_json',
    } as Parameters<typeof client.images.edit>[0]);

    const imgResponse = response as { data?: Array<{ b64_json?: string }> };
    const b64 = imgResponse.data?.[0]?.b64_json;
    if (!b64) {
      logError('[ai-image-edit] Réponse vide de l\'API', { tenantId });
      return { ok: false, reason: 'api_error', message: 'Aucune image retournée par l\'API.' };
    }

    logEvent('image_edit.success', tenantId, { model: AI_IMAGE_MODEL });
    return { ok: true, base64: b64, model: AI_IMAGE_MODEL };
  } catch (err: unknown) {
    const errStr = String(err);

    // Erreur de modération OpenAI
    if (errStr.includes('content_policy') || errStr.includes('safety')) {
      logEvent('image_edit.content_policy', tenantId, { prompt: prompt.slice(0, 100) });
      return {
        ok: false,
        reason: 'content_policy',
        message: 'Cette modification n\'est pas autorisée. Essayez une description différente.',
      };
    }

    // Image illisible ou format invalide
    if (errStr.includes('invalid_image') || errStr.includes('Could not process image')) {
      return { ok: false, reason: 'invalid_image', message: 'L\'image source n\'a pas pu être traitée.' };
    }

    logError('[ai-image-edit] Erreur API', { tenantId, error: errStr });
    return { ok: false, reason: 'api_error', message: 'L\'édition a échoué. Réessayez dans quelques instants.' };
  }
}

/**
 * Convertit un résultat base64 en Buffer JPEG, prêt pour sharp + R2.
 */
export function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, 'base64');
}
