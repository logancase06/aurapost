import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getWebsiteForTenant } from '@/lib/db/website';
import { getCoachSiteData } from '@/lib/db/public';
import { ExternalLink, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardShell from '../DashboardShell';
import WebsiteActions from './WebsiteActions';
import TemplateChooser from './TemplateChooser';
import CoachSite, { styleForTone, type SiteStyle } from '@/templates/coach-site/CoachSite';

const SITE_STYLES: SiteStyle[] = ['impact', 'clarte', 'authenticite'];

export const metadata = { title: 'Mon site' };

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

export default async function WebsitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  const site = await getWebsiteForTenant(tenantId);
  const siteData = site ? await getCoachSiteData(site.subdomain) : null;
  const publicUrl = site ? `https://${site.subdomain}.${APP_DOMAIN}` : null;

  const [prof] = await db.select({ tone: coachProfiles.tone }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)).limit(1);
  const recommended = styleForTone(prof?.tone);
  const currentStyle = site && SITE_STYLES.includes(site.template as SiteStyle) ? (site.template as SiteStyle) : null;

  return (
    <DashboardShell active="/dashboard/website">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon site loué</h1>
          <p className="mt-1 text-sm text-muted-foreground">Un site vitrine personnalisé, généré depuis votre profil coach.</p>
        </div>
        <WebsiteActions exists={!!site} />
      </div>

      {/* Choix du style visuel */}
      <Card className="mt-6 p-5">
        <p className="font-semibold">Choisis le style de ton site</p>
        <p className="mb-4 text-sm text-muted-foreground">3 directions artistiques. Tu peux changer à tout moment — le contenu reste identique.</p>
        <TemplateChooser current={currentStyle} recommended={recommended} />
      </Card>

      {/* Génération avancée à partir des vraies données */}
      <Card className="mt-6 flex flex-wrap items-center gap-4 border-primary/30 bg-primary/5 p-5">
        <Wand2 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Générer un site à partir de vos vraies données</p>
          <p className="text-sm text-muted-foreground">Instagram, avis clients et photos → un site sur-mesure rédigé par l&apos;IA.</p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/onboarding/site">Lancer l&apos;assistant</Link>
        </Button>
      </Card>

      {!site ? (
        <Card className="mt-6 border-dashed p-12 text-center">
          <p className="text-lg font-semibold">Aucun site pour le moment</p>
          <p className="mt-1 text-sm text-muted-foreground">Cliquez sur « Générer et activer mon site » pour créer votre vitrine en un clic.</p>
        </Card>
      ) : (
        <>
          <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
            <Badge variant={site.status === 'active' ? 'success' : 'secondary'}>{site.status === 'active' ? 'Actif' : 'Inactif'}</Badge>
            <code className="rounded bg-secondary px-2 py-1 text-sm text-primary">
              {site.subdomain}.{APP_DOMAIN}
            </code>
            <div className="ml-auto flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/site/${site.subdomain}`} target="_blank">
                  Aperçu local <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {publicUrl && (
                <Button asChild variant="ghost" size="sm">
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    URL publique <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </Card>

          {siteData && (
            <Card className="mt-6 overflow-hidden">
              <div className="border-b border-border bg-secondary/40 px-4 py-2 text-xs font-medium text-muted-foreground">Aperçu du site</div>
              <div className="max-h-[640px] overflow-y-auto bg-white">
                <CoachSite data={siteData} />
              </div>
            </Card>
          )}
        </>
      )}
    </DashboardShell>
  );
}
