// ─────────────────────────────────────────────────────────────────────────────
// Tracking analytics — Google Analytics 4 + Meta Pixel, gaté par le consentement
// cookies (lib CookieBanner). Sans ID d'env configuré → no-op propre (mock).
//
// Events clés : sign_up, content_generated, post_approved, site_published, checkout.
// ─────────────────────────────────────────────────────────────────────────────

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export type AnalyticsEvent =
  | 'sign_up'
  | 'content_generated'
  | 'post_approved'
  | 'site_published'
  | 'demo_viewed'
  | 'begin_checkout'
  | 'purchase';

interface Gtag {
  (command: 'event', event: string, params?: Record<string, unknown>): void;
  (command: 'consent', mode: 'update', params: Record<string, string>): void;
  (command: string, ...args: unknown[]): void;
}

type Fbq = (command: string, ...args: unknown[]) => void;

function consentAllowsAnalytics(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('aurapost_cookie_consent');
    if (!raw) return false;
    return !!JSON.parse(raw)?.analytics;
  } catch {
    return false;
  }
}

/** Envoie un event à GA4 et Meta Pixel si configurés ET consentement accordé. */
export function track(event: AnalyticsEvent, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (!consentAllowsAnalytics()) return;

  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  if (GA_ID && typeof w.gtag === 'function') {
    w.gtag('event', event, params);
  }
  if (META_PIXEL_ID && typeof w.fbq === 'function') {
    // Mappe quelques events vers les events standards Meta.
    const metaMap: Partial<Record<AnalyticsEvent, string>> = {
      sign_up: 'CompleteRegistration',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase',
    };
    const metaEvent = metaMap[event];
    if (metaEvent) w.fbq('track', metaEvent, params);
    else w.fbq('trackCustom', event, params);
  }
}

/** Met à jour le consentement GA (Consent Mode v2). */
export function updateAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: Gtag };
  if (typeof w.gtag === 'function') {
    w.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: granted ? 'granted' : 'denied',
    });
  }
}
