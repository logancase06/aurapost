'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Check, X, Upload, ImageIcon, Loader2, ArrowLeft, ArrowRight, Download,
  Calendar, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Repeat2, Pencil,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PostRow } from '@/lib/db/posts';
import type { PhotoRow } from '@/lib/db/photos';
import { approveWithPhotoAction } from './post-actions';

// ─────────────────────────────────────────────────────────────────────────────
// Dialog d'approbation en 3 étapes : 1) photo (upload / librairie / sans photo),
// 2) aperçu final (mockup iPhone Instagram ou carte LinkedIn), 3) action (préparer
// pour Instagram = image 1080×1080 + légende copiée / publier LinkedIn / sauver /
// programmer). Fonctionne en mode mock (data URL) comme en R2 réel.
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_SIZE = 1080;

function accentFor(speciality: string): string {
  const t = (speciality || '').toLowerCase();
  if (/hyrox|cross|wod|metcon/.test(t)) return '#FF4D00';
  if (/yoga|pilates|mobil|stretch/.test(t)) return '#7A9E7E';
  if (/run|course|marath|trail|cardio/.test(t)) return '#1A56DB';
  if (/box|combat|mma|boxe/.test(t)) return '#D7263D';
  if (/nutri|dietet/.test(t)) return '#0F8B5F';
  if (/muscu|force|halt|strong/.test(t)) return '#E8590C';
  return '#FF4D00';
}

function buildCaption(post: PostRow): string {
  const tags = post.hashtags.length ? `\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}` : '';
  const cta = post.callToAction ? `\n\n👉 ${post.callToAction}` : '';
  return `${post.content}${cta}${tags}`.trim();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

/** Dessine la composition (image cover-fit + scrim + texte) dans le canvas donné. */
function drawComposition(
  canvas: HTMLCanvasElement,
  size: number,
  img: HTMLImageElement | null,
  overlay: string,
  accent: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);

  if (img) {
    const ratio = Math.max(size / img.width, size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, accent);
    g.addColorStop(1, '#0A0A0A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const text = overlay.trim().toUpperCase();
  if (!text) return;

  const scrim = ctx.createLinearGradient(0, size * 0.45, 0, size);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, size * 0.4, size, size * 0.6);

  const pad = size * 0.075;
  const fontSize = size * 0.066;
  const lineHeight = fontSize * 1.16;
  ctx.font = `800 ${fontSize}px Inter, "Segoe UI", system-ui, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrapLines(ctx, text, size - pad * 2);

  const blockH = lines.length * lineHeight;
  let y = size - pad - blockH + fontSize;

  // Barre d'accent au-dessus du texte.
  ctx.fillStyle = accent;
  ctx.fillRect(pad, y - fontSize - size * 0.03, size * 0.12, size * 0.012);

  ctx.fillStyle = '#FFFFFF';
  for (const l of lines) {
    ctx.fillText(l, pad, y);
    y += lineHeight;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface CoachMini {
  displayName: string;
  speciality: string;
}

export default function ApprovePostDialog({
  post,
  open,
  onOpenChange,
}: {
  post: PostRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [coach, setCoach] = useState<CoachMini | null>(null);
  const [selected, setSelected] = useState<PhotoRow | null>(null);
  const [skip, setSkip] = useState(false);
  const [overlay, setOverlay] = useState(post.title || '');
  const [caption, setCaption] = useState(buildCaption(post));
  const [editingCaption, setEditingCaption] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = accentFor(coach?.speciality || '');
  const isInstagram = post.network === 'instagram';
  const handle = (coach?.displayName || 'coach').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Charge la librairie + le mini-profil à l'ouverture.
  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch('/api/posts/photo')
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d?.ok) return;
        setPhotos(Array.isArray(d.photos) ? d.photos : []);
        setCoach(d.coach ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open]);

  // (Re)dessine l'aperçu quand la photo/overlay change.
  const redraw = useCallback(async () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    let img: HTMLImageElement | null = null;
    if (selected?.r2Url) {
      img = imgCache.current.get(selected.r2Url) ?? null;
      if (!img) {
        try {
          img = await loadImage(selected.r2Url);
          imgCache.current.set(selected.r2Url, img);
        } catch {
          img = null;
        }
      }
    }
    drawComposition(canvas, 540, img, overlay, accent);
  }, [selected, overlay, accent]);

  useEffect(() => {
    if (open && (step === 1 || step === 2)) void redraw();
  }, [open, step, redraw]);

  async function uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo trop lourde (max 10 Mo).');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/posts/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || 'Upload impossible');
        return;
      }
      setPhotos((prev) => [data.photo, ...prev].slice(0, 6));
      setSelected(data.photo);
      setSkip(false);
    } catch {
      toast.error('Upload impossible');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  async function exportImage(): Promise<Blob | null> {
    if (!selected) return null;
    const canvas = document.createElement('canvas');
    let img: HTMLImageElement | null = imgCache.current.get(selected.r2Url) ?? null;
    if (!img) {
      try {
        img = await loadImage(selected.r2Url);
      } catch {
        return null;
      }
    }
    drawComposition(canvas, EXPORT_SIZE, img, overlay, accent);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.95));
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      return true;
    } catch {
      return false;
    }
  }

  function finalize(opts: { scheduleDate?: string } = {}, successMsg: string) {
    startTransition(async () => {
      const res = await approveWithPhotoAction(post.id, {
        photoId: skip ? null : selected?.id ?? null,
        textOverlay: skip ? null : overlay || null,
        scheduleDate: opts.scheduleDate ?? null,
      });
      if (!res.ok) {
        toast.error(res.error || 'Action impossible');
        return;
      }
      toast.success(successMsg);
      onOpenChange(false);
      router.refresh();
    });
  }

  async function prepareInstagram() {
    const copied = await copyCaption();
    if (!skip && selected) {
      const blob = await exportImage();
      if (blob) downloadBlob(blob, `aurapost-${post.id}.png`);
    }
    finalize({}, copied ? 'Image téléchargée + légende copiée ✓' : 'Image téléchargée ✓');
  }

  async function publishLinkedin() {
    await copyCaption();
    if (!skip && selected) {
      const blob = await exportImage();
      if (blob) downloadBlob(blob, `aurapost-${post.id}.png`);
    }
    window.open('https://www.linkedin.com/feed/', '_blank', 'noopener');
    finalize({}, 'Légende copiée — colle-la sur LinkedIn ✓');
  }

  const canNext = step === 1 ? skip || !!selected : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Approuver et préparer le post</DialogTitle>

        {/* Stepper */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                style={{
                  background: step >= s ? accent : 'transparent',
                  color: step >= s ? '#fff' : 'var(--muted-foreground, #888)',
                  border: step >= s ? 'none' : '1px solid currentColor',
                }}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && <div className="h-px flex-1" style={{ background: step > s ? accent : 'var(--border, #333)' }} />}
            </div>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {/* ── ÉTAPE 1 : photo ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Ajoute une photo</h3>
                <p className="text-xs text-muted-foreground">Une vraie photo de toi performe 3× mieux. Tu peux passer cette étape.</p>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 text-center transition-colors"
                style={{ borderColor: dragOver ? accent : 'var(--border, #333)', background: dragOver ? `${accent}10` : 'transparent' }}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: accent }} />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">{uploading ? 'Envoi…' : 'Glisse une photo ou clique'}</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, HEIC · 10 Mo max</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadFile(f);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Librairie récente */}
              {photos.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Tes photos récentes</p>
                  <div className="flex gap-2">
                    {photos.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelected(p);
                          setSkip(false);
                        }}
                        className="relative aspect-square w-1/3 overflow-hidden rounded-lg border-2 transition"
                        style={{ borderColor: selected?.id === p.id ? accent : 'transparent' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.thumbnailUrl || p.r2Url} alt="" className="h-full w-full object-cover" />
                        {selected?.id === p.id && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: accent }}>
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aperçu live + overlay */}
              {selected && (
                <div className="space-y-2">
                  <div className="mx-auto w-48 overflow-hidden rounded-xl border border-border">
                    <canvas ref={previewRef} className="h-auto w-full" />
                  </div>
                  <input
                    value={overlay}
                    onChange={(e) => setOverlay(e.target.value.slice(0, 60))}
                    placeholder="Texte sur l'image (optionnel)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  setSkip(true);
                  setSelected(null);
                  setStep(2);
                }}
                className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Passer sans photo →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 : aperçu final ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold">Aperçu final</h3>
              {isInstagram ? (
                <InstagramMock handle={handle} canvasRef={previewRef} skip={skip} caption={caption} accent={accent} />
              ) : (
                <LinkedinMock name={coach?.displayName || 'Coach'} speciality={coach?.speciality || ''} canvasRef={previewRef} skip={skip} caption={caption} accent={accent} />
              )}

              <div>
                <button
                  onClick={() => setEditingCaption((v) => !v)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                  style={{ color: accent }}
                >
                  <Pencil className="h-3 w-3" /> Modifier le texte
                </button>
                {editingCaption && (
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={6}
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : action ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="font-bold">Et maintenant ?</h3>

              {isInstagram ? (
                <>
                  <ActionButton accent={accent} onClick={prepareInstagram} disabled={pending} icon={<Download className="h-4 w-4" />} title="Préparer pour Instagram" subtitle={skip ? 'Légende copiée' : 'Image 1080×1080 téléchargée + légende copiée'} primary />
                  {/* Instagram n'a pas d'API de publication directe → on guide le coller. */}
                  <ol className="space-y-1 rounded-xl border border-border p-3 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2 text-success"><Check className="h-3.5 w-3.5" /> Légende copiée automatiquement</li>
                    <li className="flex items-center gap-2"><span style={{ color: accent }}>1.</span> Ouvre l’app Instagram</li>
                    <li className="flex items-center gap-2"><span style={{ color: accent }}>2.</span> Nouvelle publication</li>
                    <li className="flex items-center gap-2"><span style={{ color: accent }}>3.</span> Colle la légende (déjà copiée ✓)</li>
                    {!skip && <li className="flex items-center gap-2"><span style={{ color: accent }}>4.</span> Ajoute l’image téléchargée</li>}
                  </ol>
                </>
              ) : (
                <ActionButton accent={accent} onClick={publishLinkedin} disabled={pending} icon={<Send className="h-4 w-4" />} title="Publier sur LinkedIn" subtitle="Ouvre LinkedIn + légende copiée" primary />
              )}

              <ActionButton accent={accent} onClick={() => finalize({}, 'Post approuvé ✓')} disabled={pending} icon={<Check className="h-4 w-4" />} title="Sauvegarder" subtitle="Approuver sans publier maintenant" />

              {!showSchedule ? (
                <ActionButton accent={accent} onClick={() => setShowSchedule(true)} disabled={pending} icon={<Calendar className="h-4 w-4" />} title="Programmer" subtitle="Choisir une date de publication" />
              ) : (
                <div className="rounded-xl border border-border p-3">
                  <p className="mb-2 text-sm font-medium">Publier le :</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={scheduleDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    />
                    <Button
                      size="sm"
                      disabled={!scheduleDate || pending}
                      onClick={() => finalize({ scheduleDate }, 'Post programmé 📅')}
                      style={{ background: accent, color: '#fff' }}
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Programmer'}
                    </Button>
                  </div>
                </div>
              )}

              {pending && <p className="text-center text-xs text-muted-foreground">Traitement…</p>}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} disabled={pending}>
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" /> Annuler
            </Button>
          )}
          {step < 3 && (
            <Button size="sm" disabled={!canNext} onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)} style={{ background: accent, color: '#fff' }}>
              Suivant <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionButton({
  icon, title, subtitle, onClick, disabled, accent, primary,
}: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; disabled?: boolean; accent: string; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-muted/40 disabled:opacity-50"
      style={primary ? { background: accent, borderColor: accent } : { borderColor: 'var(--border, #333)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={primary ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: `${accent}1a`, color: accent }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold" style={primary ? { color: '#fff' } : undefined}>{title}</span>
        <span className="block text-xs" style={primary ? { color: 'rgba(255,255,255,0.8)' } : { color: 'var(--muted-foreground, #888)' }}>{subtitle}</span>
      </span>
    </button>
  );
}

function InstagramMock({
  handle, canvasRef, skip, caption, accent,
}: {
  handle: string; canvasRef: React.Ref<HTMLCanvasElement>; skip: boolean; caption: string; accent: string;
}) {
  return (
    <div className="mx-auto max-w-[300px] rounded-[2.2rem] border-[6px] border-black bg-white p-1 shadow-xl">
      <div className="overflow-hidden rounded-[1.7rem] bg-white text-black">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${accent}, #0A0A0A)` }} />
          <span className="text-sm font-semibold">{handle}</span>
        </div>
        {skip ? (
          <div className="flex aspect-square items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, #0A0A0A)` }}>
            <ImageIcon className="h-8 w-8 text-white/70" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="block aspect-square w-full" />
        )}
        <div className="flex items-center gap-3 px-3 pt-2 text-black">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
          <Bookmark className="ml-auto h-5 w-5" />
        </div>
        <p className="px-3 pb-3 pt-1.5 text-xs leading-snug">
          <span className="font-semibold">{handle}</span>{' '}
          <span className="line-clamp-3 whitespace-pre-line align-baseline">{caption}</span>
        </p>
      </div>
    </div>
  );
}

function LinkedinMock({
  name, speciality, canvasRef, skip, caption, accent,
}: {
  name: string; speciality: string; canvasRef: React.Ref<HTMLCanvasElement>; skip: boolean; caption: string; accent: string;
}) {
  return (
    <div className="mx-auto max-w-[340px] overflow-hidden rounded-xl border border-border bg-white text-black shadow-md">
      <div className="flex items-center gap-2 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: accent }}>
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-neutral-500">{speciality}</p>
        </div>
      </div>
      <p className="px-3 pb-2 text-xs leading-snug line-clamp-4 whitespace-pre-line">{caption}</p>
      {!skip && <canvas ref={canvasRef} className="block aspect-square w-full" />}
      <div className="flex items-center gap-5 px-3 py-2 text-neutral-600">
        <span className="flex items-center gap-1 text-xs"><ThumbsUp className="h-4 w-4" /> J&apos;aime</span>
        <span className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> Commenter</span>
        <span className="flex items-center gap-1 text-xs"><Repeat2 className="h-4 w-4" /> Republier</span>
      </div>
    </div>
  );
}
