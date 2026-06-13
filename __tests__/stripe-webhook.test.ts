// Sans STRIPE_SECRET_KEY ni STRIPE_WEBHOOK_SECRET, le webhook répond en mode mock.
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;

import { POST } from '@/app/api/webhooks/stripe/route';

describe('webhook Stripe (mock)', () => {
  it('répond 200 mocked quand Stripe n’est pas configuré', async () => {
    // La garde !stripe || !secret retourne avant toute lecture de la requête.
    const res = await POST({} as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mocked).toBe(true);
  });
});
