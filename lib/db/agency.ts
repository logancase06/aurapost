import { db } from './index';
import { agencyLeads } from './schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type AgencyLeadStatus = 'new' | 'contacted' | 'demo' | 'won' | 'lost';

export interface AgencyLeadInput {
  company: string;
  contactName: string;
  email: string;
  phone?: string | null;
  distributorCount?: number | null;
  message?: string | null;
}

export interface AgencyLeadRow extends AgencyLeadInput {
  id: string;
  status: AgencyLeadStatus;
  notes: string | null;
  createdAt: string;
}

/** Enregistre un prospect agence/réseau. Retourne l'id créé. */
export async function createAgencyLead(input: AgencyLeadInput): Promise<string> {
  const id = nanoid();
  await db.insert(agencyLeads).values({
    id,
    company: input.company,
    contactName: input.contactName,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    distributorCount: input.distributorCount ?? null,
    message: input.message ?? null,
    status: 'new',
    createdAt: new Date().toISOString(),
  });
  return id;
}

/** Liste les prospects agence (tracker admin). */
export async function listAgencyLeads(limit = 200): Promise<AgencyLeadRow[]> {
  const rows = await db.select().from(agencyLeads).orderBy(desc(agencyLeads.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    company: r.company,
    contactName: r.contactName,
    email: r.email,
    phone: r.phone,
    distributorCount: r.distributorCount,
    message: r.message,
    status: (r.status as AgencyLeadStatus) ?? 'new',
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}

/** Met à jour le statut et/ou les notes d'un prospect. */
export async function updateAgencyLead(id: string, patch: { status?: AgencyLeadStatus; notes?: string }): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.status) set.status = patch.status;
  if (patch.notes !== undefined) set.notes = patch.notes;
  if (Object.keys(set).length === 0) return;
  await db.update(agencyLeads).set(set).where(eq(agencyLeads.id, id));
}
