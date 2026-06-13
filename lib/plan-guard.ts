import { NextResponse } from 'next/server';

export type Plan = 'starter' | 'pro' | 'enterprise';

// Tout plan non-starter est payant (pro, enterprise, content_only, pack_complet…).
export function isPro(plan: string | undefined | null): boolean {
  return !!plan && plan !== 'starter';
}

// Le site loué + le portail public sont réservés au Pack Complet.
export function hasWebsiteAccess(plan: string | undefined | null): boolean {
  return plan === 'pack_complet' || plan === 'enterprise';
}

/** true si le plan a expiré. null/undefined = pas d'expiration (legacy / lifetime). */
export function isPlanExpired(planExpiresAt: string | null | undefined): boolean {
  if (!planExpiresAt) return false;
  return new Date(planExpiresAt) < new Date();
}

/** true si le plan Pro/Enterprise est actif (non expiré). */
export function isActivePro(plan: string | undefined | null, planExpiresAt: string | null | undefined): boolean {
  return isPro(plan) && !isPlanExpired(planExpiresAt);
}

export function planGateResponse(): NextResponse {
  return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.', upgrade: '/pricing' }, { status: 403 });
}
