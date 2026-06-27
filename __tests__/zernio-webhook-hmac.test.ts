// Tests unitaires — verifyZernioWebhookSignature (lib/zernio.ts).
// Couvre les cas nominaux et les attaques classiques sur les signatures HMAC.

import { createHmac } from 'crypto';

// Charge verifyZernioWebhookSignature APRÈS avoir positionné les env.
let verify: (body: string, header: string | null) => Promise<boolean>;

const SECRET = 'test-webhook-secret-32-bytes-long';

function sign(body: string, secret = SECRET): string {
  const hex = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return `sha256=${hex}`;
}

beforeAll(async () => {
  process.env.ZERNIO_WEBHOOK_SECRET = SECRET;
  ({ verifyZernioWebhookSignature: verify } = await import('@/lib/zernio'));
});

afterAll(() => {
  delete process.env.ZERNIO_WEBHOOK_SECRET;
});

describe('verifyZernioWebhookSignature', () => {
  it('valide une signature correcte', async () => {
    const body = JSON.stringify({ event: 'post.published', data: { _id: 'abc123' } });
    expect(await verify(body, sign(body))).toBe(true);
  });

  it('rejette une signature avec mauvais secret', async () => {
    const body = JSON.stringify({ event: 'post.published', data: { _id: 'abc123' } });
    expect(await verify(body, sign(body, 'wrong-secret'))).toBe(false);
  });

  it('rejette une signature sur un body altéré', async () => {
    const original = JSON.stringify({ event: 'post.published', data: { _id: 'abc123' } });
    const tampered = JSON.stringify({ event: 'post.failed', data: { _id: 'abc123' } });
    expect(await verify(tampered, sign(original))).toBe(false);
  });

  it('rejette un header null', async () => {
    const body = '{}';
    expect(await verify(body, null)).toBe(false);
  });

  it('rejette un header vide', async () => {
    expect(await verify('{}', '')).toBe(false);
  });

  it('rejette une signature tronquee (longueur incorrecte)', async () => {
    const body = '{"event":"test"}';
    const fullSig = sign(body);
    expect(await verify(body, fullSig.slice(0, -4))).toBe(false);
  });

  it('rejette une signature vide (sha256= sans valeur hex)', async () => {
    expect(await verify('{}', 'sha256=')).toBe(false);
  });

  it('retourne false si ZERNIO_WEBHOOK_SECRET est absent', async () => {
    const saved = process.env.ZERNIO_WEBHOOK_SECRET;
    delete process.env.ZERNIO_WEBHOOK_SECRET;
    const body = '{}';
    const result = await verify(body, sign(body));
    process.env.ZERNIO_WEBHOOK_SECRET = saved;
    expect(result).toBe(false);
  });

  it('valide un body vide (edge case)', async () => {
    const body = '';
    expect(await verify(body, sign(body))).toBe(true);
  });

  it('valide un body JSON complexe avec caracteres speciaux', async () => {
    const body = JSON.stringify({ event: 'post.published', data: { _id: 'abc', msg: 'Félicitations ✓ <&>' } });
    expect(await verify(body, sign(body))).toBe(true);
  });
});
