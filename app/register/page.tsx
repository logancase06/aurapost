'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const HONEYPOT_FIELD = 'company_website';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', brandName: '', email: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Lit le code de parrainage depuis l'URL (?ref=CODE) côté client — pas de Suspense requis.
  // setState en effet volontaire (window absent au SSR → évite une divergence d'hydratation).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ref) setRefCode(ref.trim().toUpperCase().slice(0, 16));
  }, []);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error('Vous devez accepter les conditions d’utilisation.');
      return;
    }
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        consentGivenAt: new Date().toISOString(),
        ref: refCode || undefined,
        locale: navigator.language?.startsWith('en') ? 'en' : 'fr',
        [HONEYPOT_FIELD]: honeypot,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || 'Une erreur est survenue.');
      return;
    }

    const signInRes = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      toast.success('Compte créé. Connectez-vous.');
      router.push('/login');
      return;
    }
    toast.success('Bienvenue sur AuraPost ✦');
    router.push('/onboarding');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <Card className="relative z-10 w-full max-w-md border-border/80 bg-card/80 p-8 backdrop-blur-xl">
        <Link href="/" className="mb-2 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          AuraPost
        </Link>
        <p className="mb-6 text-center text-sm text-muted-foreground">Créez votre compte — gratuit, sans carte bancaire.</p>

        {refCode && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            <Gift className="h-4 w-4 shrink-0" />
            <span>
              Parrainé via le code <strong>{refCode}</strong> — 1 mois offert à l’inscription.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot anti-bot : invisible pour les humains, jamais rempli. */}
          <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" tabIndex={-1}>
            <label htmlFor={HONEYPOT_FIELD}>Ne pas remplir</label>
            <input
              id={HONEYPOT_FIELD}
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <Field id="name" label="Votre nom" value={form.name} onChange={update('name')} autoComplete="name" />
          <Field id="brandName" label="Nom de votre marque / activité" value={form.brandName} onChange={update('brandName')} placeholder="ex: Coach Léa Fitness" />
          <Field id="email" label="Email" type="email" value={form.email} onChange={update('email')} autoComplete="email" />
          <Field
            id="password"
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            hint="8+ caractères, 1 majuscule, 1 chiffre, 1 caractère spécial."
          />

          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring"
            />
            <span>J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité d&apos;AuraPost.</span>
          </label>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} required value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
