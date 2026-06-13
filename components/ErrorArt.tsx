// Illustration SVG simple et réutilisable pour les pages d'erreur (orbe « aura »).
export function ErrorArt({ code }: { code: string }) {
  return (
    <div className="relative">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" aria-hidden>
        <defs>
          <linearGradient id="aura-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="70" stroke="url(#aura-grad)" strokeWidth="2" strokeOpacity="0.5" />
        <circle cx="90" cy="90" r="52" stroke="url(#aura-grad)" strokeWidth="2" strokeOpacity="0.3" />
        <circle cx="90" cy="90" r="34" fill="url(#aura-grad)" fillOpacity="0.12" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-extrabold text-transparent">
        {code}
      </span>
    </div>
  );
}
