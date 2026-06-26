'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Force un rafraîchissement du JWT next-auth au montage.
 * Utilisé sur /success après un paiement Stripe : le webhook a mis à jour
 * tenants.plan en DB mais le JWT en cookie peut encore afficher 'starter'
 * (cycle de rafraîchissement normal = 6h). update() relit la DB et re-signe
 * le JWT sans déconnecter l'utilisateur.
 */
export default function SessionRefresher() {
  const { update } = useSession();
  useEffect(() => {
    update();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
