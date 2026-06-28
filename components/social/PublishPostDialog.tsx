'use client';

// Z-3.2 — Dialog de publication depuis la page de détail d'un post.
// Charge les comptes connectés à l'ouverture (lazy, pas au mount).
// Appelle POST /api/social/publish/[postId] avec { platforms }.

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Logos plateformes (SVG inline) ──────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  platform: string;
  accountName: string | null;
  accountAvatar: string | null;
}

interface PublishResult {
  platform: string;
  publicationId: string;
  ok: boolean;
  error?: string;
}

interface Props {
  postId: string;
  postContent: string;
  disabled?: boolean;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function PublishPostDialog({ postId, postContent, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Charge les comptes à la première ouverture (lazy)
  async function handleOpen(next: boolean) {
    setOpen(next);
    if (!next || accounts !== null) return;
    setFetching(true);
    try {
      const res = await fetch('/api/social/accounts');
      if (!res.ok) throw new Error('fetch failed');
      const data = (await res.json()) as { accounts: Account[] };
      const list = data.accounts ?? [];
      setAccounts(list);
      setSelected(new Set(list.map((a) => a.platform)));
    } catch {
      setAccounts([]);
      toast.error('Impossible de charger vos réseaux.');
    } finally {
      setFetching(false);
    }
  }

  function toggle(platform: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  }

  async function handlePublish() {
    const platforms = [...selected];
    if (platforms.length === 0) { toast.error('Sélectionne au moins un réseau.'); return; }
    setPublishing(true);
    try {
      const res = await fetch(`/api/social/publish/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms }),
      });
      const data = (await res.json()) as { ok: boolean; publications?: PublishResult[]; error?: string };

      if (!res.ok && !data.publications) {
        toast.error(data.error ?? 'Erreur de publication. Réessaie.');
        return;
      }

      const pubs = data.publications ?? [];
      const successes = pubs.filter((p) => p.ok).map((p) => PLATFORM_LABEL[p.platform] ?? p.platform);
      const failures = pubs.filter((p) => !p.ok);

      if (successes.length > 0 && failures.length === 0) {
        toast.success(`Publié sur ${successes.join(', ')} ✓`, { duration: 5000 });
        setOpen(false);
      } else if (successes.length > 0) {
        const ko = failures.map((f) => PLATFORM_LABEL[f.platform] ?? f.platform).join(', ');
        toast(`Partiel : ✓ ${successes.join(', ')} — ✗ ${ko}`, { icon: '⚠️', duration: 8000 });
        setOpen(false);
      } else {
        toast.error(failures[0]?.error ?? 'Publication impossible.', { duration: 8000 });
      }
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setPublishing(false);
    }
  }

  // Prévisualisation tronquée à 280 chars (limite Twitter/X)
  const preview = postContent.length > 280 ? postContent.slice(0, 277) + '…' : postContent;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => !disabled && handleOpen(true)}
        disabled={disabled}
        className="h-11 sm:h-8"
        title={disabled ? 'Le post doit être approuvé avant publication' : 'Publier sur mes réseaux sociaux'}
      >
        <Share2 className="h-3.5 w-3.5" />
        Publier sur mes réseaux
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publier sur mes réseaux</DialogTitle>
          </DialogHeader>

          {/* Prévisualisation du contenu */}
          <div className="rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {preview}
            {postContent.length > 280 && (
              <span className="block mt-1 text-xs opacity-60">Tronqué à 280 caractères (aperçu X/Twitter)</span>
            )}
          </div>

          {/* États de chargement / contenu */}
          {fetching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!fetching && accounts !== null && accounts.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              Aucun réseau connecté.{' '}
              <Link
                href="/dashboard/social"
                className="text-primary underline underline-offset-2"
                onClick={() => setOpen(false)}
              >
                Connecter mes réseaux →
              </Link>
            </p>
          )}

          {!fetching && accounts !== null && accounts.length > 0 && (
            <>
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const checked = selected.has(acc.platform);
                  return (
                    <button
                      key={acc.platform}
                      type="button"
                      onClick={() => toggle(acc.platform)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        checked
                          ? 'border-primary/40 bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:bg-secondary/40'
                      }`}
                    >
                      <PlatformLogo platform={acc.platform} className="h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {PLATFORM_LABEL[acc.platform] ?? acc.platform}
                        </p>
                        {acc.accountName && (
                          <p className="truncate text-xs text-muted-foreground">{acc.accountName}</p>
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

              <Button
                onClick={handlePublish}
                disabled={publishing || selected.size === 0}
                className="mt-2 w-full"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {publishing ? 'Publication…' : 'Publier maintenant'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
