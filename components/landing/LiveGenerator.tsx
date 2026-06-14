'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Wand2, Loader2, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShimmerButton } from '@/components/ui/shimmer-button';

interface LivePost {
  content: string;
  hashtags: string[];
  callToAction: string;
}

/** Effet machine à écrire : révèle le texte mot par mot. */
function useTypewriter(full: string, speed = 28) {
  const [shown, setShown] = useState('');
  const ref = useRef<number | null>(null);
  useEffect(() => {
    // Réinitialise l'effet machine à écrire à chaque nouveau texte (reset volontaire).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown('');
    if (!full) return;
    const words = full.split(' ');
    let i = 0;
    const tick = () => {
      i++;
      setShown(words.slice(0, i).join(' '));
      if (i < words.length) ref.current = window.setTimeout(tick, speed) as unknown as number;
    };
    ref.current = window.setTimeout(tick, speed) as unknown as number;
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, [full, speed]);
  return shown;
}

export default function LiveGenerator() {
  const [speciality, setSpeciality] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<LivePost | null>(null);
  const [error, setError] = useState('');

  const typed = useTypewriter(post?.content ?? '');

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (speciality.trim().length < 2) {
      setError('Indique ta spécialité (ex: Coach Hyrox).');
      return;
    }
    setError('');
    setLoading(true);
    setPost(null);
    try {
      const res = await fetch('/api/demo/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciality, city }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setPost(data as LivePost);
      else setError(data.error || 'Réessaie dans un instant.');
    } catch {
      setError('Erreur réseau. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-28">
      <div className="aura-glow absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
          <Wand2 className="h-3.5 w-3.5" /> Essai instantané, sans inscription
        </span>
        <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter sm:text-5xl">Vois un post généré pour toi</h2>
        <p className="mt-3 text-muted-foreground">Deux mots sur ton activité, et l’IA écrit un vrai post Instagram. Tout de suite.</p>

        <form onSubmit={generate} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input
            value={speciality}
            onChange={(e) => setSpeciality(e.target.value)}
            placeholder="Ta spécialité — ex: Coach Hyrox"
            className="h-12 flex-1"
            aria-label="Spécialité"
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ta ville — ex: Nice"
            className="h-12 sm:w-44"
            aria-label="Ville"
          />
          <ShimmerButton type="submit" className="h-12 px-6" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Voir un exemple
          </ShimmerButton>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {/* Résultat */}
        {(loading || post) && (
          <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-xl border border-border bg-card text-left shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
                <Camera className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-bold">ton_coaching</span>
              <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Aperçu</span>
            </div>
            <div className="min-h-[160px] p-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> L’IA rédige ton post…
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {typed}
                    {typed.length < (post?.content.length ?? 0) && <span className="ml-0.5 inline-block animate-pulse">▋</span>}
                  </p>
                  {post && typed.length >= post.content.length && (
                    <>
                      {post.hashtags.length > 0 && (
                        <p className="mt-3 text-sm text-primary">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
                      )}
                      {post.callToAction && <p className="mt-2 text-sm font-medium">👉 {post.callToAction}</p>}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {post && (
          <div className="mt-8">
            <Button asChild size="lg" variant="gradient" className="hover-lift">
              <Link href="/register">
                Générer mes 12 posts → Créer mon compte <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">Et celui-là, ce n’est qu’un avant-goût.</p>
          </div>
        )}
      </div>
    </section>
  );
}
