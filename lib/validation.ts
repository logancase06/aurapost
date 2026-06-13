/**
 * Schémas Zod centralisés pour les routes API critiques d'AuraPost.
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { sanitizeText, HONEYPOT_FIELD } from '@/lib/security';

/** Transform Zod : nettoie une chaîne (anti-XSS) avant validation de longueur. */
const cleanString = (max: number, label: string) =>
  z
    .string()
    .transform((s) => sanitizeText(s))
    .pipe(z.string().min(1, `${label} requis`).max(max));

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export function parseBody<T>(schema: z.ZodSchema<T>, raw: unknown): ParseResult<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  const field = first?.path.join('.') ?? 'inconnu';
  const msg = first?.message ?? 'Donnée invalide';
  const error = field && field !== 'inconnu' ? `${field} : ${msg}` : msg;
  return { ok: false, response: NextResponse.json({ error }, { status: 400 }) };
}

/** POST /api/auth/register */
export const RegisterSchema = z.object({
  name: cleanString(100, 'Nom'),
  email: z.string().email('Email invalide').max(254),
  password: z.string().min(8, 'Minimum 8 caractères').max(128),
  brandName: cleanString(200, 'Nom de marque'),
  consentGivenAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Format date-heure ISO requis')
    .max(50),
  // Code de parrainage optionnel (lien /ref/[code]).
  ref: z.string().max(16).optional(),
  locale: z.enum(['fr', 'en']).optional(),
  // Honeypot anti-bot : doit rester vide (champ caché côté formulaire).
  [HONEYPOT_FIELD]: z.string().max(0, 'bot détecté').optional(),
});
export type RegisterBody = z.infer<typeof RegisterSchema>;

/** POST /api/auth/magic-link */
export const MagicLinkSchema = z.object({
  email: z.string().email('Email invalide').max(254),
});
export type MagicLinkBody = z.infer<typeof MagicLinkSchema>;

/** Onboarding — création/maj du profil coach (#2). */
export const CoachProfileSchema = z.object({
  displayName: z.string().min(1, 'Nom public requis').max(120),
  speciality: z.string().min(1, 'Spécialité requise').max(160),
  city: z.string().max(120).optional(),
  contentStyle: z.string().max(80).optional(),
  tone: z.enum(['motivant', 'educatif', 'personnel']).default('motivant'),
  bio: z.string().max(1000).optional(),
  targetAudience: z.string().max(200).optional(),
  language: z.enum(['fr', 'en']).default('fr'),
});
export type CoachProfileBody = z.infer<typeof CoachProfileSchema>;
