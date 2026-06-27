'use client';

// Z-5.2 — Bouton de publication sur les réseaux sociaux depuis une carte post.
// Dialog : sélection des comptes, appel POST /api/social/publish, gestion des 5 cas de réponse.

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Share2, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { SerializedConnection, PublicationSummary } from '@/lib/db/social-connections';

// ─── Types résultats API ───────────────────────────────────────────────────────

export type ApiPublishResult = {
  connectionId: string;
  platform: string;
  ok: boolean;
  zernioPostId?: string;
  platformPostUrl?: string;
  error?: string;
  code?: string;
};

export type PublishClassification =
  | { type: 'full_success'; results: ApiPublishResult[] }
  | { type: 'partial'; successes: ApiPublishResult[]; failures: ApiPublishResult[] }
  | { type: 'instagram_requires_media' }
  | { type: 'token_expired'; platform: string }
  | { type: 'total_failure' };

/**
 * Classifie les résultats de l'API pour choisir le message à afficher.
 * Fonction pure — exportée pour les tests.
 */
export function classifyPublishResults(results: ApiPublishResult[]): PublishClassification {
  const mediaError = results.find((r) => !r.ok && r.code === 'instagram_requires_media');
  if (mediaError) return { type: 'instagram_requires_media' };

  const tokenError = results.find((r) => !r.ok && /token|unauthorized|expired|401/i.test(r.error ?? ''));
  if (tokenError) return { type: 'token_expired', platform: tokenError.platform };

  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);
  if (failures.length === 0) return { type: 'full_success', results };
  if (successes.length === 0) return { type: 'total_failure' };
  return { type: 'partial', successes, failures };
}

// ─── Logos plateformes (SVG inline — lucide-react ne couvre pas les marques) ──

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function PlatformLogo({ platform, className }: { platform: string; className?: string }) {
  if (platform === 'linkedin') return <LinkedInLogo className={className} />;
  return <InstagramLogo className={className} />;
}

const PLATFORM_LABEL: Record<string, string> = { linkedin: 'LinkedIn', instagram: 'Instagram' };
function platformLabel(p: string) { return PLATFORM_LABEL[p] ?? p; }

// ─── Badge de statut de publication (Z-5.4 — réexporté pour PostCard) ─────────

export function PlatformStatusBadge({ pub }: { pub: PublicationSummary }) {
  const name = platformLabel(pub.platform);
  if (pub.status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <CheckCircle2 className="h-3 w-3" /> {name}
      </span>
    );
  }
  if (pub.status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" /> {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="h-3 w-3" /> {name}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface PublishButtonProps {
  postId: string;
  connections: SerializedConnection[];
  publications: PublicationSummary[];
}

export default function PublishButton({ postId, connections, publications }: PublishButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(connections.map((c) => c.id)));
  const [loading, setLoading] = useState(false);

  const publishedIds = new Set(publications.filter((p) => p.status === 'published').map((p) => p.connectionId));
  const publishableConns = connections.filter((c) => !publishedIds.has(c.id));
  const alreadyPublished = publications.filter((p) => p.status === 'published');

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Z-5.3 — Gestion des 5 cas de réponse.
  async function handlePublish() {
    const ids = [...selected];
    if (ids.length === 0) { toast.error('Sélectionne au moins un réseau.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, connectionIds: ids }),
      });
      const data = (await res.json()) as { ok: boolean; results?: ApiPublishResult[]; error?: string };

      // Erreur HTTP sans résultats (auth, plan, serveur…)
      if (!res.ok && !data.results) {
        toast.error(data.error ?? 'Erreur de publication. Réessaie dans un instant.');
        return;
      }

      const results = data.results ?? [];
      const classification = classifyPublishResults(results);

      switch (classification.type) {
        case 'full_success': {
          const link = results.find((r) => r.platformPostUrl)?.platformPostUrl;
          toast(
            (t) => (
              <span className="flex items-center gap-2">
                Publié sur tous les réseaux ✓
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => toast.dismiss(t.id)}
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Voir →
                  </a>
                )}
              </span>
            ),
            { icon: '✅', duration: 6000 }
          );
          setOpen(false);
          break;
        }
        case 'partial': {
          const ok = classification.successes.map((r) => platformLabel(r.platform)).join(', ');
          const ko = classification.failures.map((r) => platformLabel(r.platform)).join(', ');
          toast(
            () => (
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">Publication partielle</span>
                <span className="text-xs text-success">✓ Publié : {ok}</span>
                <span className="text-xs text-destructive">✗ Échec : {ko}</span>
              </span>
            ),
            { icon: '⚠️', duration: 8000 }
          );
          setOpen(false);
          break;
        }
        case 'instagram_requires_media':
          toast.error(
            "Ce post n'a pas de photo associée — Instagram nécessite une image. Ajoute une photo via « + photo » puis réessaie.",
            { duration: 9000 }
          );
          break;
        case 'token_expired':
          toast(
            (t) => (
              <span className="flex items-center gap-2">
                Token {platformLabel(classification.platform)} expiré.{' '}
                <Link
                  href="/dashboard/social"
                  onClick={() => toast.dismiss(t.id)}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Reconnecter →
                </Link>
              </span>
            ),
            { icon: '🔑', duration: 10000 }
          );
          setOpen(false);
          break;
        case 'total_failure':
          toast.error('Publication impossible sur tous les réseaux. Réessaie ou contacte le support.', { duration: 8000 });
          break;
      }
    } catch {
      toast.error('Erreur réseau. Vérifie ta connexion et réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-11 sm:h-8"
        title="Publier ce post sur tes réseaux connectés"
      >
        <Share2 className="h-3.5 w-3.5" /> Publier
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Publier sur mes réseaux</DialogTitle>
          </DialogHeader>

          {/* Réseaux déjà publiés pour ce post */}
          {alreadyPublished.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alreadyPublished.map((pub) => (
                <PlatformStatusBadge key={pub.connectionId} pub={pub} />
              ))}
            </div>
          )}

          {publishableConns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ce post a déjà été publié sur tous tes réseaux connectés.
            </p>
          ) : (
            <div className="space-y-2">
              {publishableConns.map((conn) => {
                const checked = selected.has(conn.id);
                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => toggle(conn.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      checked
                        ? 'border-primary/40 bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary/40'
                    }`}
                  >
                    <PlatformLogo platform={conn.platform} className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{platformLabel(conn.platform)}</p>
                      {conn.accountName && (
                        <p className="truncate text-xs text-muted-foreground">{conn.accountName}</p>
                      )}
                    </div>
                    <span
                      className={`ml-auto h-4 w-4 shrink-0 rounded border transition-colors ${
                        checked ? 'border-primary bg-primary' : 'border-border bg-background'
                      }`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          )}

          {publishableConns.length > 0 && (
            <Button
              onClick={handlePublish}
              disabled={loading || selected.size === 0}
              className="mt-2 w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {loading ? 'Publication…' : 'Publier maintenant'}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
