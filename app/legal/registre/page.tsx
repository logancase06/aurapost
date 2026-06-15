import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin';

export const metadata = { title: 'Registre de traitement', robots: { index: false, follow: false } };

// Registre des activités de traitement (RGPD art. 30) — accès admin uniquement.
const REGISTRE = [
  { finalite: 'Gestion des comptes coachs', base: 'Exécution du contrat', donnees: 'Email, nom, mot de passe (hashé)', duree: '3 ans après dernière activité' },
  { finalite: 'Génération de contenu', base: 'Exécution du contrat', donnees: 'Profil coach, spécialité, ton', duree: 'Durée de l’abonnement' },
  { finalite: 'Analyse de présence (IG/LinkedIn)', base: 'Consentement', donnees: 'URL publique, légendes, bio', duree: '3 dernières analyses' },
  { finalite: 'Emails marketing', base: 'Consentement / intérêt légitime', donnees: 'Email, prénom', duree: 'Jusqu’au désabonnement' },
  { finalite: 'Comptes distributeurs (réseaux)', base: 'Intérêt légitime du réseau', donnees: 'Email, prénom, ville, spécialité', duree: 'Durée du contrat réseau' },
  { finalite: 'Facturation', base: 'Obligation légale', donnees: 'Email, données de facturation', duree: '10 ans (comptable)' },
  { finalite: 'Sécurité & logs', base: 'Intérêt légitime', donnees: 'IP, logs d’activité', duree: '90 jours' },
];

export default async function RegistrePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!isAdminSession(session)) redirect('/dashboard');

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Back-office</Link>
      <h1 className="mt-3 text-2xl font-bold">Registre des activités de traitement</h1>
      <p className="mt-1 text-sm text-muted-foreground">RGPD art. 30 — interne. Voir aussi les <Link href="/legal/sous-traitants" className="text-primary hover:underline">sous-traitants</Link>.</p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Finalité</th><th className="p-3">Base légale</th><th className="p-3">Données</th><th className="p-3">Conservation</th></tr>
          </thead>
          <tbody>
            {REGISTRE.map((r) => (
              <tr key={r.finalite} className="border-t border-border">
                <td className="p-3 font-semibold">{r.finalite}</td>
                <td className="p-3 text-muted-foreground">{r.base}</td>
                <td className="p-3 text-muted-foreground">{r.donnees}</td>
                <td className="p-3 text-muted-foreground">{r.duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
