import { db } from './index';
import { users, coachProfiles, magicTokens } from './schema';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createTenantAndOwner, hashPassword } from './users-actions';
import { addTenantToOrg } from './organizations';
import { runMonthlyGeneration } from './posts';
import { sendEmail, shell, button, escHtml } from '@/lib/email';
import { getUnsubscribeUrl } from '@/lib/unsubscribe';
import { sanitizeText } from '@/lib/security';
import { logError } from '@/lib/logger';

export interface DistributorInput {
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  speciality?: string;
}

export interface InviteResult {
  ok: boolean;
  created: boolean;
  email: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Crée (à la volée) un magic link pour un email et retourne l'URL de connexion. */
async function createMagicLink(email: string): Promise<string> {
  await db.update(magicTokens).set({ usedAt: new Date().toISOString() }).where(and(eq(magicTokens.email, email), isNull(magicTokens.usedAt)));
  const token = nanoid(48);
  await db.insert(magicTokens).values({
    id: nanoid(),
    email,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 j : invitation
    createdAt: new Date().toISOString(),
  });
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/magic?token=${token}`;
}

function welcomeHtml(name: string, orgName: string, link: string, unsubscribeUrl: string): string {
  return shell(`
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e1b4b">Votre espace AuraPost est prêt ✦</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">
        Bonjour ${escHtml(name)}, <strong>${escHtml(orgName)}</strong> vous a créé un espace AuraPost.
        Bonne nouvelle : <strong>votre premier mois de contenu est déjà prêt</strong>, calibré sur la
        charte de votre réseau. Connectez-vous en un clic pour le relire et le publier.
      </p>
      ${button(link, 'Voir mes 12 posts →')}
      <p style="margin:24px 0 0;color:#9ca3af;font-size:11px;line-height:1.5">
        Vous recevez cet email car ${escHtml(orgName)} vous a inscrit sur AuraPost (intérêt légitime).
        Vous pouvez <a href="${unsubscribeUrl}" style="color:#9ca3af">vous désinscrire</a> à tout moment.
      </p>
    </td></tr>`);
}

/**
 * Invite un distributeur dans une organisation : crée son compte (si nouveau) + profil
 * pré-rempli, le rattache à l'org, et envoie un magic link « espace prêt ».
 * Idempotent : un email existant est simplement rattaché à l'org.
 */
export async function inviteDistributor(orgId: string, orgName: string, input: DistributorInput): Promise<InviteResult> {
  const email = (input.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, created: false, email, error: 'email invalide' };

  const displayName = sanitizeText([input.firstName, input.lastName].filter(Boolean).join(' ').trim() || email.split('@')[0]).slice(0, 120);
  const speciality = sanitizeText(input.speciality || 'Coach & bien-être').slice(0, 160);
  const city = input.city ? sanitizeText(input.city).slice(0, 120) : null;

  try {
    const [existing] = await db.select({ id: users.id, tenantId: users.tenantId }).from(users).where(eq(users.email, email)).limit(1);
    let tenantId: string;
    let created = false;

    if (existing) {
      tenantId = existing.tenantId;
    } else {
      const now = new Date().toISOString();
      // Compte magic-link : mot de passe aléatoire inutilisable (connexion par lien only).
      const passwordHash = await hashPassword(nanoid(24));
      const res = await createTenantAndOwner({ email, passwordHash, fullName: displayName, brandName: displayName, consentGivenAt: now });
      tenantId = res.tenantId;
      await db.insert(coachProfiles).values({
        id: nanoid(),
        tenantId,
        userId: res.userId,
        displayName,
        speciality,
        city,
        tone: 'motivant',
        language: 'fr',
        createdAt: now,
        updatedAt: now,
      });
      created = true;
    }

    await addTenantToOrg(orgId, tenantId, 'member');

    // Adoption : on génère le premier mois AVANT que le distributeur se connecte (best-effort,
    // non bloquant). Pour les nouveaux comptes uniquement, et seulement s'il n'a rien encore.
    if (created) {
      try {
        await runMonthlyGeneration(tenantId, tenantId);
      } catch (err) {
        logError('[org-invite] génération 1er mois échouée', { email, error: String(err) });
      }
    }

    const link = await createMagicLink(email);
    await sendEmail({ email, name: displayName }, `Votre espace AuraPost (${orgName}) est prêt ✦`, welcomeHtml(displayName.split(' ')[0] || 'là', orgName, link, getUnsubscribeUrl(tenantId)));
    return { ok: true, created, email };
  } catch (err) {
    logError('[org-invite] échec', { email, error: String(err) });
    return { ok: false, created: false, email, error: 'erreur interne' };
  }
}
