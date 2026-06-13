import type { DefaultSession } from 'next-auth';

// NextAuth v5 (beta.31) — augmentation de module.

declare module 'next-auth' {
  interface User {
    role: string;
    plan: string;
    tenantId?: string | null;
    emailVerifiedAt?: string | null;
    planExpiresAt?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
      tenantId: string | null;
      emailVerifiedAt: string | null;
      planExpiresAt: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string;
    plan?: string;
    tenantId?: string | null;
    emailVerifiedAt?: string | null;
    planExpiresAt?: string | null;
    lastDbCheckAt?: number;
  }
}
