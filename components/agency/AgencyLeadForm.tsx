'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Formulaire de demande de démo agence/réseau → POST /api/agency-contact. */
export default function AgencyLeadForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      company: String(fd.get('company') ?? ''),
      contactName: String(fd.get('contactName') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      distributorCount: fd.get('distributorCount') ? Number(fd.get('distributorCount')) : undefined,
      message: String(fd.get('message') ?? ''),
      company_website: String(fd.get('company_website') ?? ''), // honeypot
    };
    try {
      const res = await fetch('/api/agency-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setDone(true);
      else setError(data.error || 'Une erreur est survenue. Réessayez.');
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-4 text-lg font-bold">Demande envoyée ✦</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Merci ! Nous vous recontactons sous 24h pour organiser votre démo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      {/* Honeypot anti-spam (caché aux humains). */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="company" label="Entreprise / réseau" required placeholder="Ex : Herbalife France" />
        <Field name="contactName" label="Votre nom" required placeholder="Prénom Nom" />
        <Field name="email" label="Email pro" type="email" required placeholder="vous@entreprise.com" />
        <Field name="phone" label="Téléphone" type="tel" placeholder="+33 6 12 34 56 78" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="distributorCount" className="text-xs">Nombre de distributeurs</Label>
        <Input id="distributorCount" name="distributorCount" type="number" min={0} placeholder="Ex : 250" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs">Votre besoin (optionnel)</Label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Parlez-nous de votre réseau et de vos objectifs de contenu."
          className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} variant="gradient" className="w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Demander une démo
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">Réponse sous 24h · Sans engagement</p>
    </form>
  );
}

function Field({ name, label, type = 'text', required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs">{label}{required && ' *'}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
    </div>
  );
}
