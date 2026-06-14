import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { coachProfiles, websites } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Pencil, ExternalLink, CheckCircle2, Lock } from 'lucide-react';
import { canGenerateSite } from '@/lib/plans';
import { getWebsiteForTenant } from '@/lib/db/website';
import { getCoachSiteData } from '@/lib/db/public';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardShell from '../DashboardShell';
import TemplateChooser from './TemplateChooser';
import CopyUrlButton from './CopyUrlButton';
import CreateSiteButton from './CreateSiteButton';
import PublishToggle from './PublishToggle';
import CoachSite, { styleForTone, type SiteStyle } from '@/templates/coach-site/CoachSite';

const SITE_STYLES: SiteStyle[] = ['impact', 'clarte', 'authenticite'];

export const metadata = { title: 'Mon site' };

const APP_DOMAIN = process.env.APP_DOMAIN ?? 'aurapost.fr';

export default async function WebsitePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const tenantId = session.user.tenantId!;

  // Le site vitrine est réservé au Pack Complet → écran d'upgrade si plan inférieur.
  if (!canGenerateSite(session.user.plan)) {
    return (
      <DashboardShell active="/dashboard/website">
        <Card className="mx-auto mt-10 max-w-lg border-primary/30 bg-primary/5 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Le site vitrine est dans le Pack Complet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Un site personnalisé sur ton sous-domaine, généré depuis ton profil et partageable à tes clients.
          </p>
          <Button asChild variant="gradient" className="mt-5">
            <Link href="/dashboard/billing">Passer au Pack Complet →</Link>
          </Button>
        </Card>
      </DashboardShell>
    );
  }

  const site = await getWebsiteForTenant(tenantId);
  const [prof] = await db.select({ tone: coachProfiles.tone }).from(coachProfiles).where(eq(coachProfiles.tenantId, tenantId)).limit(1);
  const recommended = styleForTone(prof?.tone);
  const currentStyle = site && SITE_STYLES.includes(site.template as SiteStyle) ? (site.template as SiteStyle) : null;

  const [w] = site ? await db.select({ content: websites.content }).from(websites).where(eq(websites.tenantId, tenantId)).limit(1) : [];
  const hasContent = !!w?.content;
  const published = site?.status === 'active';
  const publicUrl = site ? `https://${site.subdomain}.${APP_DOMAIN}` : null;
  const siteData = site ? await getCoachSiteData(site.subdomain, { requireActive: false }) : null;

  // ── État 1 : aucun site (ou pas encore de contenu) → choisir un style et créer ──
  if (!site || !hasContent) {
    return (
      <DashboardShell active="/dashboard/website">
        <div>
          <h1 className="text-2xl font-bold">Crée ton site vitrine</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choisis un style, on génère ton site depuis ton profil, puis tu le personnalises.</p>
        </div>
        <Card className="mt-6 p-5">
          <p className="font-semibold">1. Choisis un style</p>
          <p className="mb-4 text-sm text-muted-foreground">Tu pourras en changer à tout moment.</p>
          <TemplateChooser current={currentStyle} recommended={recommended} />
        </Card>
        <div className="mt-6">
          <CreateSiteButton />
        </div>
      </DashboardShell>
    );
  }

  // ── État 2 & 3 : site existant ──────────────────────────────────────────────
  return (
    <DashboardShell active="/dashboard/website">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Mon site
            {published && <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" /> En ligne</Badge>}
            {!published && <Badge variant="secondary">Brouillon</Badge>}
          </h1>
          {published ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="rounded bg-secondary px-2 py-1 text-sm text-primary">{site.subdomain}.{APP_DOMAIN}</code>
              {publicUrl && <CopyUrlButton url={publicUrl} />}
              <span className="w-full text-xs text-muted-foreground">Partage ce lien à tes clients.</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Ton site est prêt mais pas encore en ligne. Personnalise-le puis publie-le.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gradient" size="sm">
            <Link href="/dashboard/website/editor"><Pencil className="h-3.5 w-3.5" /> {published ? 'Modifier mon site' : 'Personnaliser'}</Link>
          </Button>
          <PublishToggle published={published} />
          {site && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/site/${site.subdomain}`} target="_blank">Aperçu <ExternalLink className="h-3.5 w-3.5" /></Link>
            </Button>
          )}
        </div>
      </div>

      {/* Aperçu miniature du site */}
      {siteData && (
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-border bg-secondary/40 px-4 py-2 text-xs font-medium text-muted-foreground">Aperçu du site</div>
          <div className="max-h-[560px] overflow-y-auto bg-white">
            <CoachSite data={siteData} />
          </div>
        </Card>
      )}

      {/* Changer de style — discret */}
      <details className="mt-6 rounded-xl border border-border bg-card p-1">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-muted-foreground">Changer de style</summary>
        <div className="p-3">
          <TemplateChooser current={currentStyle} recommended={recommended} />
        </div>
      </details>
    </DashboardShell>
  );
}
