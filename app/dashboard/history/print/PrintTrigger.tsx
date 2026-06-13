'use client';

import { useEffect } from 'react';

// Déclenche la boîte d'impression du navigateur au chargement (→ enregistrer en PDF).
export default function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
