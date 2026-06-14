import { Users } from 'lucide-react';

/**
 * Preuve sociale honnête pour un lancement : pas de compteur fabriqué.
 * « Rejoins les premiers coachs AuraPost » — crédible et vrai.
 */
export default function TrustWidget() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm backdrop-blur">
      <Users className="h-4 w-4 text-primary" />
      <span className="font-semibold text-foreground">Rejoins les premiers coachs AuraPost</span>
    </div>
  );
}
