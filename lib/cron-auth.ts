import type { NextRequest } from 'next/server';

// Vérifie le secret CRON. Netlify/Vercel injectent `Authorization: Bearer <CRON_SECRET>`.
// En l'absence de CRON_SECRET configuré, on refuse par défaut (sécurité).
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}
