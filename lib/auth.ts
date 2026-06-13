import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { findUserByEmail, findUserById } from '@/lib/db/users-db';
import { db } from '@/lib/db/index';
import { magicTokens, tenants } from '@/lib/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { logError } from '@/lib/logger';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';
import { isPlanExpired } from '@/lib/plan-guard';

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' },
        type: { label: 'Type', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // ── Auth magic link ─────────────────────────────────────────────
          if (credentials?.type === 'magic' && credentials?.token) {
            const now = new Date().toISOString();

            // Claim atomique du token — un seul appel concurrent matche (rowsAffected === 1).
            const result = await db
              .update(magicTokens)
              .set({ usedAt: now })
              .where(
                and(
                  eq(magicTokens.token, credentials.token as string),
                  isNull(magicTokens.usedAt),
                  gt(magicTokens.expiresAt, now)
                )
              );

            if (!result || result.rowsAffected !== 1) return null;

            const [row] = await db
              .select({ email: magicTokens.email })
              .from(magicTokens)
              .where(eq(magicTokens.token, credentials.token as string))
              .limit(1);
            if (!row) return null;

            // Suppression fire-and-forget du token après usage.
            db.delete(magicTokens)
              .where(eq(magicTokens.token, credentials.token as string))
              .catch((err) => logError('[auth] suppression magic token échouée', { error: String(err) }));

            const user = await findUserByEmail(row.email);
            if (!user) return null;

            return {
              id: user.id,
              email: user.email,
              name: user.fullName,
              role: user.role,
              plan: user.plan ?? 'starter',
              tenantId: user.tenantId ?? null,
              emailVerifiedAt: user.emailVerifiedAt ?? null,
              planExpiresAt: user.planExpiresAt ?? null,
            };
          }

          // ── Auth mot de passe ───────────────────────────────────────────
          if (!credentials?.email || !credentials?.password) return null;

          // Rate limit : 10 tentatives / 15 min par email (brute-force ciblé).
          const emailKey = `login:email:${(credentials.email as string).toLowerCase()}`;
          const rl = await checkAuthRateLimit(emailKey, 10, 15 * 60 * 1000);
          if (!rl.allowed) {
            logError('[auth] Rate limit login atteint', {
              emailPrefix: String(credentials.email).slice(0, 3) + '***',
            });
            return null;
          }

          const user = await findUserByEmail(credentials.email as string);
          if (!user) {
            // bcrypt factice à temps constant — empêche l'énumération par timing.
            await bcrypt.compare(
              credentials.password as string,
              '$2b$12$fakehashfortimingXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
            );
            return null;
          }
          if (!user.passwordHash) return null; // compte magic-link — pas de mot de passe
          const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            plan: user.plan ?? 'starter',
            tenantId: user.tenantId ?? null,
            emailVerifiedAt: user.emailVerifiedAt ?? null,
            planExpiresAt: user.planExpiresAt ?? null,
          };
        } catch (err) {
          logError('[auth] authorize error', { error: String(err) });
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Anti open-redirect : autorise uniquement les chemins relatifs ou le même origin.
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        /* URL malformée → fallback */
      }
      return baseUrl;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'owner';
        token.plan = user.plan ?? 'starter';
        token.tenantId = user.tenantId ?? null;
        token.emailVerifiedAt = user.emailVerifiedAt ?? null;
        token.planExpiresAt = user.planExpiresAt ?? null;
      }
      if (trigger === 'update') {
        const dbUser = await findUserById(token.sub!);
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan ?? 'starter';
          token.tenantId = dbUser.tenantId ?? null;
          token.emailVerifiedAt = dbUser.emailVerifiedAt ?? null;
          token.planExpiresAt = dbUser.planExpiresAt ?? null;
        }
      }

      // Contrôle périodique (toutes les 6h) : compte supprimé → JWT invalidé.
      const lastCheck = token.lastDbCheckAt as number | undefined;
      const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
      if (!lastCheck || Date.now() - lastCheck > CHECK_INTERVAL_MS) {
        const dbUser = await findUserById(token.sub!);
        if (!dbUser) return null; // compte supprimé → révoque le JWT
        token.plan = dbUser.plan ?? 'starter';
        token.planExpiresAt = dbUser.planExpiresAt ?? null;
        token.lastDbCheckAt = Date.now();
      }

      // Auto-downgrade : plan expiré → retour starter (filet si webhook Stripe manqué).
      if (token.plan && token.plan !== 'starter' && isPlanExpired(token.planExpiresAt)) {
        logError('[auth] Plan expiré détecté, rétrogradation vers starter', {
          userId: String(token.sub),
          tenantId: String(token.tenantId),
        });
        token.plan = 'starter';
        token.planExpiresAt = null;
        if (token.tenantId) {
          db.update(tenants)
            .set({ plan: 'starter', planExpiresAt: null, updatedAt: new Date().toISOString() })
            .where(eq(tenants.id, token.tenantId as string))
            .catch((err) =>
              logError('[auth] Échec persistance downgrade', { tenantId: String(token.tenantId), error: String(err) })
            );
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role ?? 'owner';
        session.user.plan = token.plan ?? 'starter';
        session.user.tenantId = token.tenantId ?? null;
        session.user.emailVerifiedAt = token.emailVerifiedAt ?? null;
        session.user.planExpiresAt = token.planExpiresAt ?? null;
      }
      return session;
    },
  },

  pages: { signIn: '/login' },
  // 7 jours — spec AuraPost.
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  // Requis sur Netlify/Vercel (Host header ≠ NEXTAUTH_URL) — sinon UntrustedHost.
  trustHost: true,

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
