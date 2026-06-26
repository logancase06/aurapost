// Test du drain Axiom dans lib/logger.ts.
// Verifie que les fonctions de log n'echouent jamais, et que le drain est
// declenche (ou pas) selon la presence des variables d'environnement.

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.AXIOM_DATASET;
  delete process.env.AXIOM_TOKEN;
  jest.resetModules();
});

describe('lib/logger — drain Axiom', () => {
  it('logInfo ne leve pas sans variables Axiom', async () => {
    const { logInfo } = await import('@/lib/logger');
    expect(() => logInfo('test info', { ctx: 'val' })).not.toThrow();
  });

  it('logError ne leve pas sans variables Axiom', async () => {
    const { logError } = await import('@/lib/logger');
    expect(() => logError('test erreur')).not.toThrow();
  });

  it('logEvent ne leve pas meme avec un objet non-serialisable', async () => {
    const { logEvent } = await import('@/lib/logger');
    expect(() => logEvent('test_event', 'tenant_123', { meta: 'val' })).not.toThrow();
  });

  it('appelle fetch vers Axiom quand les variables sont presentes', async () => {
    process.env.AXIOM_DATASET = 'test-dataset';
    process.env.AXIOM_TOKEN = 'xaat-test-token';

    const calls: { url: string; options: RequestInit }[] = [];
    global.fetch = jest.fn().mockImplementation((url: string, options: RequestInit) => {
      calls.push({ url, options });
      return Promise.resolve({ ok: true, status: 200 } as Response);
    });

    const { logError } = await import('@/lib/logger');
    logError('erreur critique', { tenantId: 'tenant_abc' });

    // fetch est fire-and-forget : on attend la prochaine micro-tache
    await new Promise((r) => setTimeout(r, 10));

    expect(calls.length).toBe(1);
    expect(calls[0].url).toContain('test-dataset');
    expect(calls[0].url).toContain('axiom.co');
    const body = JSON.parse(calls[0].options.body as string);
    expect(body[0].level).toBe('error');
    expect(body[0].message).toBe('erreur critique');
    expect(body[0].tenantId).toBe('tenant_abc');
  });

  it("n'appelle PAS fetch si AXIOM_DATASET est absent", async () => {
    process.env.AXIOM_TOKEN = 'xaat-test-token';

    const fetchMock = jest.fn().mockResolvedValue({ ok: true } as Response);
    global.fetch = fetchMock;

    const { logInfo } = await import('@/lib/logger');
    logInfo('message quelconque');

    await new Promise((r) => setTimeout(r, 10));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('absorbe silencieusement une erreur reseau du drain', async () => {
    process.env.AXIOM_DATASET = 'test-dataset';
    process.env.AXIOM_TOKEN = 'xaat-test-token';
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { logInfo } = await import('@/lib/logger');
    expect(() => logInfo('message')).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    // Pas d'exception non capturee
  });
});
