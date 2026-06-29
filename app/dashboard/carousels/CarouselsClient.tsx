'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { LayoutGrid, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { UpgradeBanner } from '@/components/UpgradeGate';
import { generateCarouselAction, type CarouselResult, type CarouselStyle } from './actions';

const STYLES: { value: CarouselStyle; label: string; desc: string }[] = [
  { value: 'minimaliste', label: 'Minimaliste', desc: 'Fond blanc, texte noir, epure' },
  { value: 'colore', label: 'Colore', desc: 'Degrade violet, texte blanc, dynamique' },
  { value: 'pro_sombre', label: 'Pro sombre', desc: 'Fond sombre, accents or, premium' },
];

type StyleConfig = { bg: string; text: string; accent: string; badge: string };

const STYLE_CONFIG: Record<CarouselStyle, StyleConfig> = {
  minimaliste: { bg: 'bg-white', text: 'text-gray-900', accent: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' },
  colore: { bg: 'bg-gradient-to-br from-violet-600 to-indigo-500', text: 'text-white', accent: 'text-violet-100', badge: 'bg-white/20 text-white' },
  pro_sombre: { bg: 'bg-gray-900', text: 'text-white', accent: 'text-yellow-400', badge: 'bg-yellow-400/10 text-yellow-400' },
};

function SlidePreview({ slide, cfg, coachName }: { slide: import('./actions').CarouselSlide; cfg: StyleConfig; coachName: string }) {
  return (
    <div className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl p-6 shadow-lg ${cfg.bg}`}>
      <span className={`absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
        {slide.numero}/7
      </span>
      {slide.type === 'titre' && (
        <p className={`text-center text-xl font-black leading-tight ${cfg.text}`}>{slide.texte}</p>
      )}
      {slide.type === 'point' && (
        <div className="text-center">
          <span className="text-4xl">{slide.emoji}</span>
          <p className={`mt-3 text-sm leading-relaxed ${cfg.text}`}>{slide.texte}</p>
        </div>
      )}
      {slide.type === 'citation' && (
        <p className={`text-center text-sm italic leading-relaxed ${cfg.accent}`}>{slide.texte}</p>
      )}
      {slide.type === 'cta' && (
        <div className="text-center">
          <p className={`text-sm font-semibold ${cfg.text}`}>{slide.texte}</p>
          <p className={`mt-2 text-xs ${cfg.accent}`}>{coachName}</p>
        </div>
      )}
    </div>
  );
}

export default function CarouselsClient({
  canGenerate,
  initialPost = '',
}: {
  canGenerate: boolean;
  initialPost?: string;
}) {
  const [postContent, setPostContent] = useState(initialPost);
  const [style, setStyle] = useState<CarouselStyle>('minimaliste');
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pending, startTransition] = useTransition();

  if (!canGenerate) {
    return (
      <>
        <div className="mx-auto max-w-2xl">
          <h1 className="flex items-center gap-2 text-2xl font-bold mb-6">
            <LayoutGrid className="h-6 w-6 text-primary" /> Generateur de carrousels
          </h1>
          <UpgradeBanner featureName="Generateur de carrousels" requiredPlan="pack_complet" />
        </div>
      </>
    );
  }

  function generate() {
    if (!postContent.trim()) return;
    startTransition(async () => {
      const res = await generateCarouselAction(postContent.trim(), style);
      if (res.ok && res.data) { setResult(res.data); setCurrentSlide(0); }
      else toast.error(res.error || 'Generation impossible');
    });
  }

  const slides = result?.slides ?? [];
  const cfg = STYLE_CONFIG[result?.style ?? style];

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutGrid className="h-6 w-6 text-primary" /> Generateur de carrousels
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transforme un post en 5-7 slides pretes a poster sur Instagram ou LinkedIn.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="post-content">Contenu du post</Label>
                  <textarea
                    id="post-content"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Colle ton post LinkedIn ou Instagram ici..."
                    rows={8}
                    className="mt-1.5 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Style visuel</Label>
                  <div className="flex flex-col gap-2">
                    {STYLES.map((s) => (
                      <label key={s.value} className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" name="style" value={s.value} checked={style === s.value} onChange={() => setStyle(s.value)} className="accent-primary mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">{s.label}</span>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={generate} disabled={pending || !postContent.trim()} className="w-full">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generer le carrousel
                </Button>
              </div>
            </Card>
          </div>

          <div>
            {slides.length > 0 ? (
              <div className="space-y-3">
                <SlidePreview slide={slides[currentSlide]} cfg={cfg} coachName={result?.coachName ?? ''} />
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))} disabled={currentSlide === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Slide {currentSlide + 1} / {slides.length}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setCurrentSlide((i) => Math.min(slides.length - 1, i + 1))} disabled={currentSlide === slides.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-border">
                <p className="text-sm text-muted-foreground">L'apercu de tes slides apparait ici</p>
              </div>
            )}
          </div>
        </div>

        {slides.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-7">
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === currentSlide ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <div className={`h-full flex items-center justify-center text-center p-1 ${cfg.bg}`}>
                  <span className={`text-[8px] font-bold leading-tight ${cfg.text}`}>
                    {s.emoji ? s.emoji + ' ' : ''}{s.texte.slice(0, 20)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
