'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Libellé de la section (affiché dans le fallback). */
  label?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary React réutilisable pour isoler une section critique du dashboard :
 * si un widget plante, le reste de la page reste fonctionnel.
 */
export class SectionBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[SectionBoundary]', this.props.label ?? 'section', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span>
            {this.props.label ? `« ${this.props.label} » ` : 'Cette section '}
            n’a pas pu s’afficher. Rechargez la page pour réessayer.
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
