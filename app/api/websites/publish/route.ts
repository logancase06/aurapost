import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { publishWebsite } from '@/lib/db/coach-site';
import { sendWebsiteActivatedEmail } from '@/lib/email';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logError } from '@/lib/logger';

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    const tenantId = await requireTenantId();

    const result = await publishWebsite(tenantId, session.user.id);
    if (!result.ok || !result.subdomain) {
      return NextResponse.json({ error: 'Générez d’abord votre site.' }, { status: 400 });
    }

    const url = `https://${result.subdomain}.${APP_DOMAIN}`;
    (async () => {
      const [u] = await db.select({ email: users.email, fullName: users.fullName }).from(users).where(eq(users.id, session.user.id)).limit(1);
      if (u) await sendWebsiteActivatedEmail({ email: u.email, name: u.fullName }, url);
    })().catch((err) => logError('[publish] email', { error: String(err) }));

    return NextResponse.json({ ok: true, subdomain: result.subdomain, url });
  } catch (err) {
    logError('[websites/publish]', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
