import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant';
import { createOrActivateWebsite } from '@/lib/db/website';
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

    const result = await createOrActivateWebsite(tenantId, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: 'Complétez d’abord votre profil coach.' }, { status: 400 });
    }

    const siteUrl = `https://${result.subdomain}.${APP_DOMAIN}`;

    (async () => {
      const [u] = await db
        .select({ email: users.email, fullName: users.fullName })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      if (u) await sendWebsiteActivatedEmail({ email: u.email, name: u.fullName }, siteUrl);
    })().catch((err) => logError('[websites] email activation', { error: String(err) }));

    return NextResponse.json({ ok: true, subdomain: result.subdomain, url: siteUrl }, { status: 201 });
  } catch (err) {
    logError('[websites/create] erreur', { error: String(err) });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
