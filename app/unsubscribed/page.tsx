import Link from 'next/link';
import { verifyUnsubscribeToken, getResubscribeUrl } from '@/lib/unsubscribe';

export const metadata = { title: 'Désabonné', robots: { index: false, follow: false } };

/**
 * Page de confirmation de désabonnement. Le bouton « Me réabonner » n'apparaît que si
 * le couple tenant/token est valide (lien issu de l'email).
 */
export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; token?: string }>;
}) {
  const { tenant = '', token = '' } = await searchParams;
  const canResubscribe = !!tenant && verifyUnsubscribeToken(tenant, token);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative z-10 max-w-md">
        <span className="text-4xl">📭</span>
        <h1 className="mt-4 text-2xl font-bold">Tu es désabonné</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu ne recevras plus les emails marketing d’AuraPost (relances, nouveautés). Tu continueras à recevoir les
          emails importants liés à ton compte : paiement, sécurité et confirmations.
        </p>
        {canResubscribe && (
          <a
            href={getResubscribeUrl(tenant, token)}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white"
          >
            Me réabonner
          </a>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Retour à l’accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
