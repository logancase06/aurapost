import Link from 'next/link';

// Empty state dessiné — illustration SVG custom + message motivant.
export function EmptyPosts({ alreadyGenerated }: { alreadyGenerated: boolean }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
        <defs>
          <linearGradient id="empty-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <rect x="24" y="18" width="56" height="72" rx="4" stroke="url(#empty-grad)" strokeWidth="2.5" strokeOpacity="0.5" />
        <rect x="40" y="30" width="56" height="72" rx="4" fill="#111118" stroke="url(#empty-grad)" strokeWidth="2.5" />
        <line x1="50" y1="46" x2="86" y2="46" stroke="url(#empty-grad)" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="58" x2="78" y2="58" stroke="#A855F7" strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round" />
        <line x1="50" y1="70" x2="82" y2="70" stroke="#A855F7" strokeWidth="3" strokeOpacity="0.3" strokeLinecap="round" />
        <circle cx="96" cy="30" r="10" fill="url(#empty-grad)" />
        <path d="M96 26v8M92 30h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <h3 className="mt-6 text-xl font-black uppercase tracking-tight">
        {alreadyGenerated ? 'Rien ici… pour ces filtres' : 'Ta page est vide. Pour l’instant.'}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {alreadyGenerated
          ? 'Change les filtres pour retrouver tes posts du mois.'
          : 'Un clic, et 12 posts taillés pour ton audience apparaissent ici. Lance la machine.'}
      </p>
      {!alreadyGenerated && (
        <Link href="#" className="mt-4 text-sm font-semibold text-primary hover:underline">
          ↑ Bouton « Créer mes 12 posts » en haut de page
        </Link>
      )}
    </div>
  );
}
