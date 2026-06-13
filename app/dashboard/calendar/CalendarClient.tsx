'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, CalendarDays, Download, Camera, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { schedulePostAction } from '../post-actions';

export interface CalPost {
  id: string;
  title: string;
  network: string;
  scheduledFor: string | null;
}

interface Props {
  month: string; // YYYY-MM affiché
  prevMonth: string;
  nextMonth: string;
  monthLabel: string;
  initialScheduled: CalPost[];
  reservoir: CalPost[];
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function NetIcon({ network }: { network: string }) {
  return network === 'linkedin' ? <Briefcase className="h-3 w-3" /> : <Camera className="h-3 w-3" />;
}

/** Calendrier éditorial : grille mensuelle + drag & drop natif + export iCal. */
export default function CalendarClient({ month, prevMonth, nextMonth, monthLabel, initialScheduled, reservoir }: Props) {
  const [scheduled, setScheduled] = useState<CalPost[]>(initialScheduled);
  const [pool, setPool] = useState<CalPost[]>(reservoir);
  const [dragId, setDragId] = useState<string | null>(null);

  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();
  // Lundi = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function dayISO(day: number) {
    return `${month}-${String(day).padStart(2, '0')}`;
  }

  function postsForDay(day: number) {
    const iso = dayISO(day);
    return scheduled.filter((p) => p.scheduledFor?.slice(0, 10) === iso);
  }

  async function assign(postId: string, date: string | null) {
    const fromScheduled = scheduled.find((p) => p.id === postId);
    const fromPool = pool.find((p) => p.id === postId);
    const post = fromScheduled ?? fromPool;
    if (!post) return;

    // Optimiste
    const updated: CalPost = { ...post, scheduledFor: date ? `${date}T09:00:00.000Z` : null };
    if (date) {
      setScheduled((s) => [...s.filter((p) => p.id !== postId), updated]);
      setPool((p) => p.filter((x) => x.id !== postId));
    } else {
      setScheduled((s) => s.filter((p) => p.id !== postId));
      setPool((p) => [updated, ...p.filter((x) => x.id !== postId)]);
    }

    const res = await schedulePostAction(postId, date);
    if (!res.ok) {
      toast.error(res.error || 'Action impossible');
    } else {
      toast.success(date ? 'Programmé ✦' : 'Retiré du calendrier');
    }
  }

  function onDropDay(e: React.DragEvent, day: number) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (id) void assign(id, dayISO(day));
    setDragId(null);
  }

  function onDropPool(e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (id) void assign(id, null);
    setDragId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
            <CalendarDays className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Calendrier éditorial</h1>
            <p className="text-sm capitalize text-muted-foreground">{monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Mois précédent">
            <Link href={`/dashboard/calendar?m=${prevMonth}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Mois suivant">
            <Link href={`/dashboard/calendar?m=${nextMonth}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/calendar/ical">
              <Download className="h-4 w-4" /> Export iCal
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Grille */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-1 text-center text-xs font-bold uppercase text-muted-foreground">
                {d}
              </div>
            ))}
            {cells.map((day, i) => (
              <div
                key={i}
                onDragOver={(e) => day && e.preventDefault()}
                onDrop={(e) => day && onDropDay(e, day)}
                className={
                  'min-h-[84px] rounded-md border p-1.5 ' +
                  (day ? 'border-border bg-background' : 'border-transparent')
                }
              >
                {day && <div className="mb-1 text-xs font-semibold text-muted-foreground">{day}</div>}
                <div className="space-y-1">
                  {day &&
                    postsForDay(day).map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', p.id);
                          setDragId(p.id);
                        }}
                        className="flex cursor-grab items-center gap-1 rounded bg-primary/15 px-1.5 py-1 text-[11px] font-medium text-primary active:cursor-grabbing"
                        title={p.title}
                      >
                        <NetIcon network={p.network} />
                        <span className="truncate">{p.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Réservoir de posts approuvés à planifier */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropPool}
          className="rounded-lg border border-dashed border-border bg-card/50 p-4"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">À programmer</p>
          <p className="mt-1 text-xs text-muted-foreground">Glissez un post sur un jour. Déposez ici pour retirer du calendrier.</p>
          <div className="mt-3 space-y-2">
            {pool.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun post approuvé en attente de planification.</p>
            ) : (
              pool.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', p.id);
                    setDragId(p.id);
                  }}
                  className="flex cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm active:cursor-grabbing"
                  title={p.title}
                >
                  <NetIcon network={p.network} />
                  <span className="truncate">{p.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
