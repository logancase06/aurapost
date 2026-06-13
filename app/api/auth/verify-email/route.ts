import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicTokens } from '@/lib/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { markEmailVerified } from '@/lib/db/users-actions';
import { logError } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=invalid`);
  }

  try {
    const now = new Date().toISOString();

    // Consomme le token (atomic — même pattern que le magic link).
    const result = await db
      .update(magicTokens)
      .set({ usedAt: now })
      .where(and(eq(magicTokens.token, token), isNull(magicTokens.usedAt), gt(magicTokens.expiresAt, now)));

    if (!result || result.rowsAffected !== 1) {
      return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=expired`);
    }

    const [row] = await db
      .select({ email: magicTokens.email })
      .from(magicTokens)
      .where(eq(magicTokens.token, token))
      .limit(1);

    if (!row) {
      return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=invalid`);
    }

    await markEmailVerified(row.email);

    return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=success`);
  } catch (err) {
    logError('[verify-email]', { error: String(err) });
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?status=error`);
  }
}
