'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

const CRISP_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

export default function CrispChat() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!CRISP_ID) return;

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_ID;

    const s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.head.appendChild(s);

    return () => {
      document.head.removeChild(s);
    };
  }, []);

  // Identification automatique quand l'utilisateur est connecté.
  useEffect(() => {
    if (!CRISP_ID || !session?.user?.email || !Array.isArray(window.$crisp)) return;
    window.$crisp.push(['set', 'user:email', [session.user.email]]);
    if (session.user.name) window.$crisp.push(['set', 'user:nickname', [session.user.name]]);
    window.$crisp.push(['set', 'session:data', [[['plan', session.user.plan ?? 'starter']]]]);
  }, [session]);

  if (!CRISP_ID) return null;
  return null;
}
