import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Frames d'appareils (SVG/CSS) pour présenter des screenshots produit.
 * Images locales (public/mockups) → next/image optimisé.
 */

export function MacBookFrame({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('w-full', className)}>
      {/* Écran */}
      <div className="relative rounded-t-xl border-[10px] border-b-[14px] border-[#1a1a22] bg-[#1a1a22] shadow-2xl">
        <div className="overflow-hidden rounded-md bg-background">
          <div className="relative aspect-[16/10] w-full">
            <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 768px) 100vw, 640px" className="object-cover object-top" />
          </div>
        </div>
        {/* Caméra */}
        <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-[#3a3a44]" />
      </div>
      {/* Base / charnière */}
      <div className="relative mx-auto h-3 w-[112%] -translate-x-[5.4%] rounded-b-xl bg-gradient-to-b from-[#2a2a33] to-[#15151b] shadow-lg">
        <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-[#0d0d12]" />
      </div>
    </div>
  );
}

export function PhoneFrame({
  src,
  alt,
  className,
  label,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('relative mx-auto w-full max-w-[220px]', className)}>
      <div className="relative rounded-[2rem] border-[8px] border-[#1a1a22] bg-[#1a1a22] shadow-2xl">
        {/* Encoche */}
        <span className="absolute left-1/2 top-1.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1a1a22]" />
        <div className="overflow-hidden rounded-[1.5rem] bg-background">
          <div className="relative aspect-[9/19] w-full">
            <Image src={src} alt={alt} fill sizes="220px" className="object-cover object-top" />
          </div>
        </div>
      </div>
      {label && <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>}
    </div>
  );
}
