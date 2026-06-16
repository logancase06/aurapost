'use client';

import { Chip } from '@/components/ui/chip';
import { SUGGESTION_GROUPS, appendSentence, briefPlaceholder } from './brief-helpers';

/**
 * Zone de description guidée réutilisable : micro-copy rassurante + textarea + chips de
 * suggestions cliquables (groupées par intention). Cliquer une chip AJOUTE une phrase
 * complète (jamais le label brut), sans remplacer le texte existant ni le bloquer.
 * Utilisée en création directe (« Décris ton site ») ET comme dernière question (Q6) du
 * questionnaire de création.
 */
export default function GuidedBrief({
  value,
  onChange,
  specialty,
  disabled,
  rows = 4,
  showMicroCopy = true,
}: {
  value: string;
  onChange: (v: string) => void;
  specialty?: string | null;
  disabled?: boolean;
  rows?: number;
  showMicroCopy?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showMicroCopy && (
        <p className="text-xs text-muted-foreground">
          Pas besoin d’être précis — quelques mots suffisent, tu pourras tout ajuster ensuite dans l’éditeur.
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={500}
        disabled={disabled}
        placeholder={briefPlaceholder(specialty)}
        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
      <div className="space-y-2">
        {SUGGESTION_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium text-muted-foreground">{group.title} :</span>
            {group.items.map((s) => (
              <Chip key={s.label} onClick={() => onChange(appendSentence(value, s.sentence))}>
                {s.label}
              </Chip>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">{value.length}/500 · optionnel</p>
    </div>
  );
}
