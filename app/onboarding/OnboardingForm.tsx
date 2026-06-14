'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { detectBrowserLocale, type Locale } from '@/lib/i18n';
import { saveCoachProfile } from './actions';

const TONES = [
  { value: 'motivant', label: 'Motivant', desc: 'Énergie, dépassement' },
  { value: 'educatif', label: 'Éducatif', desc: 'Conseils, pédagogie' },
  { value: 'personnel', label: 'Personnel', desc: 'Authenticité, storytelling' },
] as const;

export default function OnboardingForm() {
  const [pending, setPending] = useState(false);
  const [tone, setTone] = useState<string>('motivant');
  // Pré-sélectionne la langue détectée du navigateur (détection auto à l'inscription).
  // setState en effet volontaire : `navigator` n'existe pas au SSR (un init paresseux
  // provoquerait une divergence d'hydratation sur la valeur du <select>).
  const [language, setLanguage] = useState<Locale>('fr');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguage(detectBrowserLocale());
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPending(true);
    let res: Awaited<ReturnType<typeof saveCoachProfile>> = null;
    try {
      res = await saveCoachProfile(null, formData);
    } catch (err) {
      console.error('[onboarding-client] action a levé:', err);
      setPending(false);
      toast.error('Erreur lors de l’enregistrement. Réessaie.');
      return;
    }
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Profil enregistré ✦');
    // Navigation pleine page (fiable) : le dashboard se rend à neuf avec la session
    // à jour (onboardingCompleted). Évite la course router.push()+router.refresh().
    window.location.assign('/dashboard');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="tone" value={tone} />

      <Field name="displayName" label="Nom public" placeholder="ex: Coach Léa Fitness" required />
      <Field name="speciality" label="Spécialité" placeholder="ex: Préparation physique CrossFit" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="city" label="Ville" placeholder="ex: Lyon" />
        <Field name="contentStyle" label="Style (optionnel)" placeholder="ex: punchy, expert" />
      </div>

      <div>
        <Label>Ton souhaité</Label>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {TONES.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setTone(t.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all duration-200',
                tone === t.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              )}
            >
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Langue de l’interface et des posts générés</Label>
        <select
          id="language"
          name="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Locale)}
          className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <Textarea name="targetAudience" label="Audience cible (optionnel)" placeholder="ex: débutants 25-40 ans" />
      <Textarea name="bio" label="Bio (optionnel)" placeholder="Présentez votre parcours en quelques phrases." />

      <Button type="submit" variant="gradient" className="w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Terminer et accéder au tableau de bord
      </Button>
    </form>
  );
}

function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} placeholder={placeholder} />
    </div>
  );
}

function Textarea({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
