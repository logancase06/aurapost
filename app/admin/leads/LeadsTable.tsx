'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { setLeadStatusAction, saveLeadNotesAction } from './actions';
import type { AgencyLeadRow, AgencyLeadStatus } from '@/lib/db/agency';

const STATUSES: { key: AgencyLeadStatus; label: string }[] = [
  { key: 'new', label: 'Nouveau' },
  { key: 'contacted', label: 'Contacté' },
  { key: 'demo', label: 'Démo planifiée' },
  { key: 'won', label: 'Signé' },
  { key: 'lost', label: 'Perdu' },
];

const VARIANT: Record<AgencyLeadStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  new: 'warning',
  contacted: 'secondary',
  demo: 'warning',
  won: 'success',
  lost: 'destructive',
};

export default function LeadsTable({ leads }: { leads: AgencyLeadRow[] }) {
  const [pending, start] = useTransition();

  function changeStatus(id: string, status: AgencyLeadStatus) {
    start(async () => {
      const res = await setLeadStatusAction(id, status);
      if (res.ok) toast.success('Statut mis à jour');
      else toast.error(res.error || 'Action impossible');
    });
  }

  if (leads.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Aucun prospect agence pour le moment.</Card>;
  }

  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <LeadCard key={l.id} lead={l} pending={pending} onStatus={changeStatus} />
      ))}
    </div>
  );
}

function LeadCard({ lead, pending, onStatus }: { lead: AgencyLeadRow; pending: boolean; onStatus: (id: string, s: AgencyLeadStatus) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [savingNotes, start] = useTransition();

  function saveNotes() {
    start(async () => {
      const res = await saveLeadNotesAction(lead.id, notes);
      if (res.ok) toast.success('Notes enregistrées');
      else toast.error(res.error || 'Action impossible');
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{lead.company} {lead.distributorCount ? <span className="text-muted-foreground">· {lead.distributorCount} distributeurs</span> : null}</p>
          <p className="text-xs text-muted-foreground">{lead.contactName} · {lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>
          {lead.message && <p className="mt-2 text-sm text-muted-foreground">{lead.message}</p>}
        </div>
        <Badge variant={VARIANT[lead.status]}>{STATUSES.find((s) => s.key === lead.status)?.label ?? lead.status}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            disabled={pending || s.key === lead.status}
            onClick={() => onStatus(lead.id, s.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${s.key === lead.status ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {s.label}
          </button>
        ))}
        <a href={`mailto:${lead.email}?subject=AuraPost for Teams — suite à votre demande`} className="ml-auto text-xs font-semibold text-primary hover:underline">
          Email de suivi →
        </a>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes internes…"
          className="h-9 flex-1 rounded-md border border-input bg-background/50 px-3 text-sm"
        />
        <button onClick={saveNotes} disabled={savingNotes} className="h-9 rounded-md border border-border px-3 text-xs font-semibold hover:bg-secondary">
          Enregistrer
        </button>
      </div>
    </Card>
  );
}
