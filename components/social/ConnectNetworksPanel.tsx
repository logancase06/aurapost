'use client';

// Z-2.6 — Panel de gestion des connexions sociales (LinkedIn + Instagram).
// Affiche l'état de chaque plateforme, permet de connecter ou déconnecter.

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle2, Plus, Unlink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { SocialPlatform } from '@/lib/zernio';

// SVG logos de marque inline — lucide-react ne fournit pas les icônes de plateformes sociales.
function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  accountName: string | null;
  accountAvatar: string | null;
  connectedAt: string;
}

interface ConnectNetworksPanelProps {
  initialConnections: SocialConnection[];
  maxAccounts: number;
  successParam?: string;
  errorParam?: string;
}

type PlatformMeta = {
  label: string;
  Logo: React.ComponentType<{ className?: string }>;
  color: string;
};

const PLATFORM_META: Record<SocialPlatform, PlatformMeta> = {
  linkedin: { label: 'LinkedIn', Logo: LinkedInLogo, color: 'text-[#0077B5]' },
  instagram: { label: 'Instagram', Logo: InstagramLogo, color: 'text-[#E1306C]' },
};

const SUPPORTED: SocialPlatform[] = ['linkedin', 'instagram'];

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "La publication sociale n'est pas encore activée.",
  plan_required: 'Cette fonctionnalité est réservée au plan Coach+Site.',
  invalid_platform: 'Plateforme non supportée.',
  quota_reached: 'Limite de réseaux connectés atteinte.',
  cancelled: 'Connexion annulée.',
  api_error: 'Erreur côté service. Réessayez dans quelques instants.',
  save_failed: "La connexion n'a pas pu être enregistrée. Réessayez.",
};

export default function ConnectNetworksPanel({
  initialConnections,
  maxAccounts,
  successParam,
  errorParam,
}: ConnectNetworksPanelProps) {
  const [connections, setConnections] = useState<SocialConnection[]>(initialConnections);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Toasts basés sur les query params retournés par le flow OAuth.
  useEffect(() => {
    if (successParam) {
      const meta = PLATFORM_META[successParam as SocialPlatform];
      toast.success(meta ? `${meta.label} connecté avec succès !` : 'Réseau connecté !');
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
    if (errorParam) {
      toast.error(ERROR_MESSAGES[errorParam] ?? 'Une erreur est survenue.');
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [successParam, errorParam]);

  const getConnection = (platform: SocialPlatform) =>
    connections.find((c) => c.platform === platform) ?? null;

  const handleConnect = (platform: SocialPlatform) => {
    window.location.href = `/api/social/connect?platform=${platform}`;
  };

  const handleDisconnect = async (connectionId: string, platform: SocialPlatform) => {
    setDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/social/disconnect/${connectionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        toast.error(data.error ?? 'La déconnexion a échoué.');
        return;
      }
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      toast.success(`${PLATFORM_META[platform].label} déconnecté.`);
    } catch {
      toast.error('Erreur réseau. Réessayez.');
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedCount = connections.length;

  return (
    <div className="space-y-6">
      {/* Indicateur quota */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {connectedCount}/{maxAccounts}
          </span>{' '}
          réseau{connectedCount !== 1 ? 'x' : ''} connecté{connectedCount !== 1 ? 's' : ''}
        </p>
        {connectedCount >= maxAccounts && (
          <Badge variant="outline" className="border-amber-400 text-xs text-amber-600">
            Limite atteinte
          </Badge>
        )}
      </div>

      {/* Cards LinkedIn + Instagram */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SUPPORTED.map((platform) => {
          const meta = PLATFORM_META[platform];
          const connection = getConnection(platform);
          const isDisconnecting = disconnecting === connection?.id;
          const canConnect = !connection && connectedCount < maxAccounts;

          return (
            <Card
              key={platform}
              className={cn(
                'flex flex-col gap-4 p-5 transition-all duration-200',
                connection ? 'border-primary/30 bg-primary/5' : 'border-border'
              )}
            >
              {/* En-tête plateforme */}
              <div className="flex items-center gap-3">
                <meta.Logo className={cn('h-6 w-6 shrink-0', meta.color)} />
                <span className="font-semibold">{meta.label}</span>
                {connection && (
                  <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-500" />
                )}
              </div>

              {connection ? (
                /* Compte connecté */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {connection.accountAvatar ? (
                      <Image
                        src={connection.accountAvatar}
                        alt={connection.accountName ?? meta.label}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <meta.Logo className={cn('h-5 w-5', meta.color)} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {connection.accountName ?? `Compte ${meta.label}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connecté le {formatDate(connection.connectedAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:border-destructive hover:text-destructive"
                    disabled={isDisconnecting}
                    onClick={() => handleDisconnect(connection.id, platform)}
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Déconnecter
                  </Button>
                </div>
              ) : (
                /* Compte non connecté */
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">Non connecté</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!canConnect}
                    onClick={() => handleConnect(platform)}
                    title={!canConnect ? `Limite de ${maxAccounts} réseaux atteinte` : undefined}
                  >
                    <Plus className="h-4 w-4" />
                    Connecter {meta.label}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        La connexion passe par Zernio, un service de publication social certifié. AuraPost ne stocke jamais ton mot de passe.
      </p>
    </div>
  );
}
