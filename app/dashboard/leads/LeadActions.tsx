'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { updateLeadStatusAction } from './actions';

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  new: { label: 'Marquer contacté', value: 'contacted' },
  contacted: { label: 'Marquer converti', value: 'converted' },
  converted: { label: 'Archiver', value: 'archived' },
  archived: { label: '', value: '' },
};

export default function LeadActions({ leadId, currentStatus, email }: { leadId: string; currentStatus: string; email: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[currentStatus];

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="h-7">
        <a href={`mailto:${email}?subject=Suite%20à%20votre%20message`}>Répondre</a>
      </Button>
      {next?.label && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={pending}
          onClick={() => startTransition(async () => {
            const res = await updateLeadStatusAction(leadId, next.value);
            if (res.ok) toast.success('Statut mis à jour');
            else toast.error('Impossible de mettre à jour');
          })}
        >
          {next.label}
        </Button>
      )}
    </div>
  );
}
