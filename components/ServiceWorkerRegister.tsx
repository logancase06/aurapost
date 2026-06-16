'use client';

import { useEffect } from 'react';

// Enregistre le service worker EN PRODUCTION uniquement (offline + base notifications push).
// En développement, on le DÉSENREGISTRE et on purge ses caches : un SW actif en dev sert des
// chunks Turbopack périmés dès que leurs hashes changent → boucle de « Failed to fetch ».
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }

    const onLoad = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
