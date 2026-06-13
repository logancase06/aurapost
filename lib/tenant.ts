import { auth } from '@/lib/auth';

/**
 * Retourne le tenantId de la session courante, ou null si non connecté / absent.
 * À utiliser pour les LECTURES — les Server Actions/routes qui lisent doivent
 * gérer le null (retourner [] plutôt que lever).
 */
export async function getTenantId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.tenantId ?? null;
}

/**
 * Variante stricte : lève si tenantId est absent.
 * À utiliser dans toute MUTATION DB — garantit l'isolation multi-tenant.
 */
export async function requireTenantId(): Promise<string> {
  const tenantId = await getTenantId();
  if (!tenantId) {
    throw new Error('[requireTenantId] Accès refusé : tenantId manquant dans la session');
  }
  return tenantId;
}
