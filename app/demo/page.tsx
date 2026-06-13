'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, Camera, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spotlight } from '@/components/ui/spotlight';
import { useIsDesktop } from '@/lib/hooks/use-media-query';

interface DemoPost {
  network: string;
  title: string;
  content: string;
  hashtags: string[];
  callToAction: string;
}

const TONES = [
  { value: 'motivant', label: 'Motivant' },
  { value: 'educatif', label: 'Éducatif' },
  { value: 'personnel', label: 'Personnel' },
];

export default function DemoPage() {
  const isDesktop = useIsDesktop();
  const [speciality, setSpeciality] = useState('');
  const [city, setCity] = useState('');
  const [tone, setTone] = useState('motivant');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<DemoPost[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPosts(null);
    try {
      const res = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciality, city, tone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Génération impossible.');
        return;
      }
      setTimeout(() => setPosts(data.posts), 450);
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-black uppercase tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AuraPost
          </Link>
          <ShimmerButton onClick={() => (window.location.href = '/register')} className="h-9 px-4 text-xs">
            Créer mon compte
          </ShimmerButton>
        </div>
      </header>

      {/* Hero compact + spotlight */}
      <section className="relative overflow-hidden">
        {isDesktop && <Spotlight className="-top-20 left-10" fill="#A855F7" />}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-6 pt-14 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Teste sans t&apos;inscrire</h1>
          <p className="mt-3 text-muted-foreground">Ta spécialité, et 3 posts apparaissent. Tout de suite.</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-16">
        <Card className="mx-auto max-w-2xl border-border/80 bg-card/70 p-6 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="spec">Ta spécialité</Label>
                <Input id="spec" required value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="ex: Préparation physique CrossFit" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="ex: Lyon" />
              </div>
              <div className="space-y-2">
                <Label>Ton</Label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                        tone === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <ShimmerButton type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Génère mes 3 posts
            </ShimmerButton>
          </form>
        </Card>

        {(loading || posts) && (
          <div className="mt-12">
            <h2 className="text-xl font-black uppercase tracking-tight">Tes posts exemple</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3" style={{ perspective: '1200px' }}>
              {loading && !posts
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden p-5">
                      <div className="relative overflow-hidden">
                        <div className="h-4 w-20 rounded bg-muted" />
                        <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
                        <div className="mt-2 h-3 w-full rounded bg-muted" />
                        <div className="mt-2 h-3 w-5/6 rounded bg-muted" />
                        <div className="mt-4 h-3 w-1/2 rounded bg-muted" />
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ backgroundSize: '200% 100%' }} />
                      </div>
                    </Card>
                  ))
                : posts?.map((p, i) => {
                    const Icon = p.network === 'linkedin' ? Briefcase : Camera;
                    return (
                      <motion.div
                        key={i}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.45, delay: i * 0.12, ease: 'easeOut' }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <Card className="hover-lift h-full p-5">
                          <Badge variant={p.network === 'linkedin' ? 'secondary' : 'default'}>
                            <Icon className="h-3 w-3" /> {p.network}
                          </Badge>
                          {p.title && <h3 className="mt-3 font-bold">{p.title}</h3>}
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.content}</p>
                          {p.hashtags.length > 0 && <p className="mt-3 text-sm text-primary">{p.hashtags.map((h) => `#${h}`).join(' ')}</p>}
                        </Card>
                      </motion.div>
                    );
                  })}
            </div>

            {posts && (
              <Card className="mt-10 overflow-hidden border-primary/40 bg-gradient-to-r from-primary/15 to-accent/15 p-8 text-center">
                <p className="text-lg font-black uppercase tracking-tight">Et ça, c&apos;est juste l&apos;échantillon.</p>
                <p className="mt-1 text-sm text-muted-foreground">12 posts/mois + ton site vitrine t&apos;attendent.</p>
                <Button asChild variant="gradient" className="mt-5">
                  <Link href="/register">
                    Je crée mon compte <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
