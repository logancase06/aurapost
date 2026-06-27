'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Copy, Check, Sparkles, AlertTriangle, Camera, Briefcase, Clock, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { applyBioAction, markRecommendationDoneAction, optimizeBioAction, type BioVariants } from './actions';
import type { InstagramAnalysis, LinkedInAnalysis } from '@/lib/analyze/types';

type Hist = { score: number; date: string };
const area = 'flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function scoreColor(s: number): string {
  return s >= 70 ? 'hsl(142 71% 45%)' : s >= 50 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)';
}
function scoreLabel(s: number): string {
  return s >= 85 ? 'excellent' : s >= 70 ? 'solide' : s >= 50 ? 'moyen' : 'faible';
}

function ScoreCircle({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  const col = scoreColor(score);
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={col} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color: col }}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBars({ scores }: { scores: Record<string, { note: number; max: number }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Object.entries(scores).map(([key, v]) => {
        const pct = v.max > 0 ? (v.note / v.max) * 100 : 0;
        return (
          <div key={key} className="rounded-md border border-border p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
              <span className="text-xs font-bold">{v.note}/{v.max}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor(pct) }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast.success('Copié ✦');
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error('Copie impossible');
        }
      }}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {label}
    </Button>
  );
}

const IMPACT: Record<string, { label: string; variant: 'destructive' | 'warning' | 'secondary' }> = {
  fort: { label: 'Impact fort', variant: 'destructive' },
  moyen: { label: 'Impact moyen', variant: 'warning' },
  faible: { label: 'Impact faible', variant: 'secondary' },
};

function Problemes({ items }: { items: { titre: string; description: string; impact: string; correction: string }[] }) {
  if (items.length === 0) return null;
  const order = { fort: 0, moyen: 1, faible: 2 } as Record<string, number>;
  const sorted = [...items].sort((a, b) => (order[a.impact] ?? 1) - (order[b.impact] ?? 1));
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /> Ce qu’il faut corriger</h3>
      <div className="mt-3 space-y-3">
        {sorted.map((p, i) => {
          const im = IMPACT[p.impact] ?? IMPACT.moyen;
          return (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{p.titre}</p>
                <Badge variant={im.variant}>{im.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              {p.correction && (
                <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <span className="font-semibold text-primary">Comment corriger : </span>{p.correction}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PointsForts({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold"><Check className="h-4 w-4 text-success" /> Ce qui marche</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {p}</li>
        ))}
      </ul>
    </div>
  );
}

function Priority({ action }: { action: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (!action) return null;
  return (
    <Card className="border-primary/40 bg-primary/5 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Ta priorité du moment</p>
      <p className="mt-2 text-lg font-semibold">{action}</p>
      <Button
        size="sm"
        variant={done ? 'secondary' : 'gradient'}
        className="mt-3"
        disabled={pending || done}
        onClick={() => start(async () => { await markRecommendationDoneAction(); setDone(true); toast.success('Bien joué ✦'); })}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} {done ? 'Fait ✓' : 'Marquer comme fait'}
      </Button>
    </Card>
  );
}

function Evolution({ history }: { history: Hist[] }) {
  if (history.length < 2) return null;
  const ordered = [...history].reverse(); // ancien → récent
  const max = Math.max(...ordered.map((h) => h.score), 100);
  const last = ordered[ordered.length - 1].score;
  const prev = ordered[ordered.length - 2].score;
  const delta = last - prev;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Évolution de ton score</span>
        {delta !== 0 && <Badge variant={delta > 0 ? 'success' : 'secondary'}>{delta > 0 ? `+${delta}` : delta} pts</Badge>}
      </div>
      <div className="mt-3 flex items-end gap-2" style={{ height: 60 }}>
        {ordered.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${(h.score / max) * 100}%`, background: scoreColor(h.score) }} title={`${h.score}/100`} />
          </div>
        ))}
      </div>
      {delta > 0 && <p className="mt-2 text-xs text-success">En progrès depuis ta dernière analyse — continue ✦</p>}
    </Card>
  );
}

function InstagramResult({ a, history }: { a: InstagramAnalysis; history: Hist[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreCircle score={a.score_global} />
        <div>
          <p className="text-sm text-muted-foreground">Profil</p>
          <p className="text-2xl font-black capitalize" style={{ color: scoreColor(a.score_global) }}>{scoreLabel(a.score_global)}</p>
        </div>
      </div>
      <ScoreBars scores={a.scores_detail as unknown as Record<string, { note: number; max: number }>} />
      <Priority action={a.prochaine_action} />
      <PointsForts items={a.points_forts} />
      <Problemes items={a.problemes} />

      {/* Bio */}
      {(a.bio_actuelle || a.bio_proposee) && (
        <div>
          <h3 className="font-bold">Réécriture de ta bio</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Actuelle</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.bio_actuelle || '(vide)'}</p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-[11px] font-semibold uppercase text-primary">Proposée</p>
              <p className="mt-1 text-sm">{a.bio_proposee}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={a.bio_proposee} label="Copier la bio" />
            <Button size="sm" variant="gradient" disabled={pending || !a.bio_proposee} onClick={() => start(async () => { const r = await applyBioAction(a.bio_proposee); r.ok ? toast.success('Bio appliquée ✦') : toast.error(r.error || 'Erreur'); })}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Appliquer à mon profil
            </Button>
          </div>
        </div>
      )}

      {/* Hashtags */}
      {a.hashtags_proposes.length > 0 && (
        <div>
          <h3 className="font-bold">Hashtags optimisés</h3>
          {a.hashtags_actuels.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Actuels : {a.hashtags_actuels.map((h) => <span key={h} className="line-through">#{h} </span>)}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {a.hashtags_proposes.map((h) => (
              <span key={h} className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">#{h}</span>
            ))}
          </div>
          <div className="mt-3"><CopyButton text={a.hashtags_proposes.map((h) => `#${h}`).join(' ')} label="Copier les hashtags" /></div>
        </div>
      )}

      {/* Posts */}
      {(a.meilleur_post || a.post_a_ameliorer) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {a.meilleur_post && (
            <div className="rounded-lg border border-success/40 bg-success/5 p-4">
              <p className="text-xs font-bold uppercase text-success">Ton meilleur post</p>
              <p className="mt-1 line-clamp-4 text-sm">{a.meilleur_post}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.pourquoi_meilleur}</p>
            </div>
          )}
          {a.post_a_ameliorer && (
            <div className="rounded-lg border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5 p-4">
              <p className="text-xs font-bold uppercase text-[hsl(var(--warning))]">À améliorer</p>
              <p className="mt-1 line-clamp-4 text-sm">{a.post_a_ameliorer}</p>
              <p className="mt-2 text-xs text-muted-foreground">{a.comment_ameliorer}</p>
            </div>
          )}
        </div>
      )}

      {/* Créneaux */}
      {a.creneaux_recommandes.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-bold"><Clock className="h-4 w-4 text-primary" /> Créneaux recommandés</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.creneaux_recommandes.map((c) => (
              <span key={c} className="rounded-md border border-border px-3 py-2 text-sm font-medium">{c}</span>
            ))}
          </div>
        </div>
      )}

      <Evolution history={history} />
    </div>
  );
}

function LinkedInResult({ a, history }: { a: LinkedInAnalysis; history: Hist[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreCircle score={a.score_global} />
        <div>
          <p className="text-sm text-muted-foreground">Profil</p>
          <p className="text-2xl font-black capitalize" style={{ color: scoreColor(a.score_global) }}>{scoreLabel(a.score_global)}</p>
        </div>
      </div>
      <ScoreBars scores={a.scores_detail as unknown as Record<string, { note: number; max: number }>} />
      <Priority action={a.prochaine_action} />
      <PointsForts items={a.points_forts} />
      <Problemes items={a.problemes} />

      <div>
        <h3 className="font-bold">Réécriture de ton titre</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/30 p-3"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Actuel</p><p className="mt-1 text-sm text-muted-foreground">{a.titre_actuel || '(vide)'}</p></div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3"><p className="text-[11px] font-semibold uppercase text-primary">Proposé</p><p className="mt-1 text-sm">{a.titre_propose}</p></div>
        </div>
        <div className="mt-2"><CopyButton text={a.titre_propose} label="Copier le titre" /></div>
      </div>

      <div>
        <h3 className="font-bold">Réécriture de ton résumé</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/30 p-3"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Actuel</p><p className="mt-1 text-sm text-muted-foreground">{a.resume_actuel || '(vide)'}</p></div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3"><p className="text-[11px] font-semibold uppercase text-primary">Proposé</p><p className="mt-1 whitespace-pre-line text-sm">{a.resume_propose}</p></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <CopyButton text={a.resume_propose} label="Copier le résumé" />
          <Button size="sm" variant="gradient" disabled={pending || !a.resume_propose} onClick={() => start(async () => { const r = await applyBioAction(a.resume_propose); r.ok ? toast.success('Appliqué à ta bio AuraPost ✦') : toast.error(r.error || 'Erreur'); })}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Appliquer à mon profil
          </Button>
        </div>
      </div>

      <Evolution history={history} />
    </div>
  );
}

export default function AnalyzeClient({
  instagramUrl,
  initialInstagram,
  instagramHistory,
  initialLinkedIn,
  linkedinHistory,
}: {
  instagramUrl: string;
  initialInstagram: InstagramAnalysis | null;
  instagramHistory: Hist[];
  initialLinkedIn: LinkedInAnalysis | null;
  linkedinHistory: Hist[];
}) {
  // Instagram
  const [igUrl, setIgUrl] = useState(instagramUrl);
  const [igRes, setIgRes] = useState<InstagramAnalysis | null>(initialInstagram);
  const [igLoading, setIgLoading] = useState(false);
  const [igNeedManual, setIgNeedManual] = useState(false);
  const [igManual, setIgManual] = useState('');

  async function analyzeIg() {
    setIgLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (igUrl.trim()) body.profileUrl = igUrl.trim();
      if (igManual.trim()) body.manualCaptions = igManual.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
      const res = await fetch('/api/analyze/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setIgRes(data.analysis);
        setIgNeedManual(false);
        if (data.source === 'mock') toast('Analyse de démonstration (IA non configurée)', { icon: 'ℹ️' });
      } else if (data.reason === 'private') {
        setIgNeedManual(true);
        toast(data.error || 'Compte privé — colle tes légendes', { icon: 'ℹ️' });
      } else toast.error(data.error || 'Analyse impossible');
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setIgLoading(false);
    }
  }

  // LinkedIn
  const [li, setLi] = useState({ headline: '', summary: '', posts: '' });
  const [liRes, setLiRes] = useState<LinkedInAnalysis | null>(initialLinkedIn);
  const [liLoading, setLiLoading] = useState(false);

  async function analyzeLi() {
    setLiLoading(true);
    try {
      const res = await fetch('/api/analyze/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: li.headline, summary: li.summary, posts: li.posts.split('\n\n').map((s) => s.trim()).filter(Boolean).slice(0, 5) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setLiRes(data.analysis);
        if (data.source === 'mock') toast('Analyse de démonstration (IA non configurée)', { icon: 'ℹ️' });
      } else toast.error(data.error || 'Analyse impossible');
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLiLoading(false);
    }
  }

  // Bio optimizer
  const [bioRes, setBioRes] = useState<BioVariants | null>(null);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioTab, setBioTab] = useState<'ig' | 'li'>('ig');

  async function optimizeBio() {
    setBioLoading(true);
    try {
      const res = await optimizeBioAction();
      if (res.ok && res.data) {
        setBioRes(res.data);
        setBioTab('ig');
      } else {
        toast.error(res.error || 'Optimisation impossible');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setBioLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Instagram + LinkedIn */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Instagram */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Camera className="h-5 w-5 text-primary" /> Instagram</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ig" className="text-xs">URL de ton profil public</Label>
            <Input id="ig" value={igUrl} onChange={(e) => setIgUrl(e.target.value)} placeholder="https://instagram.com/ton_compte" />
          </div>
          {igNeedManual && (
            <div className="space-y-1.5">
              <Label htmlFor="igm" className="text-xs">Compte privé — colle tes 3 dernières légendes (une par ligne)</Label>
              <textarea id="igm" rows={4} className={area} value={igManual} onChange={(e) => setIgManual(e.target.value)} />
            </div>
          )}
          <Button onClick={analyzeIg} disabled={igLoading || (!igUrl.trim() && !igManual.trim())} variant="gradient">
            {igLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyser
          </Button>
        </div>
        {igRes && <InstagramResult a={igRes} history={instagramHistory} />}
      </Card>

      {/* LinkedIn */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-primary" /> LinkedIn</h2>
        <p className="mt-1 text-xs text-muted-foreground">LinkedIn interdit le scraping : colle toi-même ton titre, ton résumé et tes posts.</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Ton titre (headline)</Label><Input value={li.headline} onChange={(e) => setLi({ ...li, headline: e.target.value })} placeholder="Coach sportif certifié · Préparation physique · Lyon" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Ton résumé</Label><textarea rows={3} className={area} value={li.summary} onChange={(e) => setLi({ ...li, summary: e.target.value })} placeholder="Colle ton résumé LinkedIn…" /></div>
          <div className="space-y-1.5"><Label className="text-xs">2-3 posts (séparés par une ligne vide)</Label><textarea rows={4} className={area} value={li.posts} onChange={(e) => setLi({ ...li, posts: e.target.value })} placeholder="Colle quelques posts récents…" /></div>
          <Button onClick={analyzeLi} disabled={liLoading || !li.headline.trim()} variant="gradient">
            {liLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Analyser
          </Button>
        </div>
        {liRes && <LinkedInResult a={liRes} history={linkedinHistory} />}
      </Card>
      </div>

      {/* Bio Optimizer D-3 */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-primary" /> Optimiseur de bio
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Génère 3 variantes Instagram (150 car. max) et 2 titres + résumés LinkedIn à partir de ton profil.
            </p>
          </div>
          <Button onClick={optimizeBio} disabled={bioLoading} variant="gradient" size="sm">
            {bioLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {bioRes ? 'Régénérer' : 'Optimiser ma bio'}
          </Button>
        </div>

        {bioRes && (
          <div className="mt-5">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              {(['ig', 'li'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBioTab(tab)}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${bioTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab === 'ig' ? '📸 Instagram' : '💼 LinkedIn'}
                </button>
              ))}
            </div>

            {bioTab === 'ig' && (
              <div className="mt-4 space-y-3">
                {bioRes.instagram.map((bio, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Variante {i + 1} · {bio.length}/150</p>
                        <p className="text-sm">{bio}</p>
                      </div>
                      <CopyButton text={bio} label="Copier" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bioTab === 'li' && (
              <div className="mt-4 space-y-4">
                {bioRes.linkedin.map((variant, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Variante {i + 1}</p>
                    <div>
                      <p className="text-[11px] font-medium text-primary uppercase tracking-wide">Titre</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{variant.headline}</p>
                        <CopyButton text={variant.headline} label="Copier" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-primary uppercase tracking-wide">Résumé</p>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-line flex-1">{variant.summary}</p>
                        <CopyButton text={variant.summary} label="Copier" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
