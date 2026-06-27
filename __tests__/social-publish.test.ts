// Tests unitaires pour classifyPublishResults — logique de classification des réponses
// de l'API /api/social/publish. Couvre les 5 cas documentés dans Z-5.3.

import { classifyPublishResults, type ApiPublishResult } from '@/components/social/PublishButton';

function ok(platform: string, extra: Partial<ApiPublishResult> = {}): ApiPublishResult {
  return { connectionId: `conn-${platform}`, platform, ok: true, zernioPostId: `zp-${platform}`, ...extra };
}

function fail(platform: string, extra: Partial<ApiPublishResult> = {}): ApiPublishResult {
  return { connectionId: `conn-${platform}`, platform, ok: false, error: 'api_error', ...extra };
}

describe('classifyPublishResults', () => {
  it('full_success — toutes les plateformes OK', () => {
    const result = classifyPublishResults([ok('linkedin'), ok('instagram')]);
    expect(result.type).toBe('full_success');
    if (result.type === 'full_success') {
      expect(result.results).toHaveLength(2);
    }
  });

  it('partial — LinkedIn OK, Instagram KO', () => {
    const result = classifyPublishResults([ok('linkedin'), fail('instagram')]);
    expect(result.type).toBe('partial');
    if (result.type === 'partial') {
      expect(result.successes[0].platform).toBe('linkedin');
      expect(result.failures[0].platform).toBe('instagram');
    }
  });

  it('instagram_requires_media — code spécifique prioritaire sur le reste', () => {
    const result = classifyPublishResults([
      ok('linkedin'),
      fail('instagram', { code: 'instagram_requires_media', error: undefined }),
    ]);
    expect(result.type).toBe('instagram_requires_media');
  });

  it('instagram_requires_media — même sans succès partiel', () => {
    const result = classifyPublishResults([
      fail('instagram', { code: 'instagram_requires_media', error: undefined }),
    ]);
    expect(result.type).toBe('instagram_requires_media');
  });

  it('token_expired — détecté par message erreur (unauthorized)', () => {
    const result = classifyPublishResults([fail('linkedin', { error: 'Token unauthorized — refresh required' })]);
    expect(result.type).toBe('token_expired');
    if (result.type === 'token_expired') {
      expect(result.platform).toBe('linkedin');
    }
  });

  it('token_expired — détecté par mot "expired"', () => {
    const result = classifyPublishResults([fail('instagram', { error: 'OAuth token expired' })]);
    expect(result.type).toBe('token_expired');
  });

  it('token_expired — détecté par code HTTP 401 dans le message', () => {
    const result = classifyPublishResults([fail('linkedin', { error: 'HTTP 401 from Zernio API' })]);
    expect(result.type).toBe('token_expired');
  });

  it('total_failure — toutes les plateformes KO (erreur générique)', () => {
    const result = classifyPublishResults([fail('linkedin'), fail('instagram')]);
    expect(result.type).toBe('total_failure');
  });

  it('full_success — une seule plateforme, pas de platformPostUrl', () => {
    const result = classifyPublishResults([ok('linkedin')]);
    expect(result.type).toBe('full_success');
  });

  it('instagram_requires_media a priorité sur token_expired', () => {
    const result = classifyPublishResults([
      fail('instagram', { code: 'instagram_requires_media', error: 'OAuth token expired' }),
    ]);
    expect(result.type).toBe('instagram_requires_media');
  });
});
