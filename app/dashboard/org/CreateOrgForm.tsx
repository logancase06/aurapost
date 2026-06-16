'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Building2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createOrgAction } from './actions';

export default function CreateOrgForm() {
  const [name, setName] = useState('');
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await createOrgAction(name);
      if (res.ok) {
        toast.success('Organisation créée');
        window.location.reload();
      } else toast.error(res.error || 'Action impossible');
    });
  }

  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <Building2 className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-xl font-bold">Créez votre organisation</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Chapeautez vos distributeurs : brand kit imposé, templates validés, reporting global.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du réseau / de l’agence" />
        <Button onClick={submit} disabled={pending || name.trim().length < 2} variant="gradient">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Créer
        </Button>
      </div>
    </Card>
  );
}
