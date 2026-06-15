import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sous-traitants & hébergement — AuraPost',
  description: 'Liste des sous-traitants (RGPD art. 28) d’AuraPost : hébergement, données traitées, pays, DPA.',
  alternates: { canonical: '/legal/sous-traitants' },
};

const SUBPROCESSORS = [
  { name: 'Turso (libSQL)', role: 'Base de données', data: 'Comptes, profils, posts, sites', country: 'UE / US', dpa: 'https://turso.tech/legal/dpa' },
  { name: 'Anthropic', role: 'Génération & analyse IA', data: 'Profil coach (texte) envoyé pour génération', country: 'US', dpa: 'https://www.anthropic.com/legal/commercial-terms' },
  { name: 'Resend', role: 'Envoi d’emails', data: 'Email, prénom, contenu transactionnel', country: 'US', dpa: 'https://resend.com/legal/dpa' },
  { name: 'Cloudflare (R2)', role: 'Stockage des photos', data: 'Images uploadées par le coach', country: 'UE / US', dpa: 'https://www.cloudflare.com/cloudflare-customer-dpa/' },
  { name: 'Upstash (Redis)', role: 'Rate-limiting & cache', data: 'Identifiants techniques (pas de données perso)', country: 'UE / US', dpa: 'https://upstash.com/trust/dpa.pdf' },
  { name: 'Stripe', role: 'Paiement', data: 'Email, données de facturation', country: 'US', dpa: 'https://stripe.com/legal/dpa' },
  { name: 'Netlify', role: 'Hébergement application', data: 'Logs techniques, requêtes', country: 'US', dpa: 'https://www.netlify.com/legal/sla/' },
];

export default function SousTraitantsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">← Confidentialité</Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight">Sous-traitants & hébergement</h1>
      <p className="mt-3 text-muted-foreground">
        Conformément à l’article 28 du RGPD, voici les sous-traitants auxquels AuraPost confie un traitement
        de données. AuraPost est responsable de traitement ; chaque sous-traitant est lié par un accord (DPA).
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Sous-traitant</th><th className="p-3">Rôle</th><th className="p-3">Données</th><th className="p-3">Pays</th><th className="p-3">DPA</th>
            </tr>
          </thead>
          <tbody>
            {SUBPROCESSORS.map((s) => (
              <tr key={s.name} className="border-t border-border">
                <td className="p-3 font-semibold">{s.name}</td>
                <td className="p-3 text-muted-foreground">{s.role}</td>
                <td className="p-3 text-muted-foreground">{s.data}</td>
                <td className="p-3 text-muted-foreground">{s.country}</td>
                <td className="p-3"><a href={s.dpa} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">DPA ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Transferts hors UE encadrés par les Clauses Contractuelles Types (CCT). Hébergement applicatif : Netlify.
        Base de données : Turso. Pour toute question : <a href="mailto:contact@aurapost.fr" className="text-primary hover:underline">contact@aurapost.fr</a>.
      </p>
    </main>
  );
}
