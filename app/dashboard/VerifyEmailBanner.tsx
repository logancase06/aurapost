'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resendVerificationEmail } from './account-actions';

// Bandeau de rappel (non bloquant) : vérifie ton email + renvoi du lien.
export default function VerifyEmailBanner() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  function resend() {
    start(async () => {
      const res = await resendVerificationEmail();
      if (res.ok) {
        setSent(true);
        toast.success('Lien de vérification renvoyé ✓');
      } else {
        toast.error(res.error || 'Envoi impossible');
      }
    });
  }

  return (
    <Alert variant="warning" className="mt-6">
      <Mail />
      <AlertDescription className="flex flex-wrap items-center gap-2">
        Vérifie ton adresse email pour sécuriser ton compte.
        <button onClick={resend} disabled={pending || sent} className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 disabled:opacity-60">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {sent ? 'Lien envoyé ✓' : 'Renvoyer le lien →'}
        </button>
      </AlertDescription>
    </Alert>
  );
}
