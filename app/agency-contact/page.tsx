import type { Metadata } from 'next';
import Link from 'next/link';
import AgencyLeadForm from '@/components/agency/AgencyLeadForm';

export const metadata: Metadata = {
  title: 'Demander une démo agence — AuraPost for Teams',
  description: 'Réseaux, franchises et agences : demandez une démo d’AuraPost for Teams.',
  alternates: { canonical: '/agency-contact' },
};

export default function AgencyContactPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/agency-demo" className="text-sm text-muted-foreground hover:text-foreground">← AuraPost for Teams</Link>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tighter">Demander une démo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Parlez-nous de votre réseau. Un membre de l’équipe vous recontacte sous 24h.
      </p>
      <div className="mt-8">
        <AgencyLeadForm />
      </div>
    </main>
  );
}
