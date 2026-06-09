import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BookVaultEvent } from '../../types/events';
import { fireCustomEvent } from './EventDispatcher';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface BotpressContextValue {
  isReady: boolean;
  sendEvent: (event: BookVaultEvent) => void;
  openChat: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const BotpressContext = createContext<BotpressContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface BotpressProviderProps {
  children: ReactNode;
}

type BotpressState = 'init' | 'ready' | 'error';

/**
 * Context provider that wraps Botpress webchat.
 *
 * - The Studio embed script in index.html handles initialization.
 * - This provider detects readiness and wires up navigation events.
 * - Falls back gracefully (error state) if the CDN fails to load.
 */
export function BotpressProvider({ children }: BotpressProviderProps) {
  const [state, setState] = useState<BotpressState>('init');
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Detect webchat readiness (embed script initializes it)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const poll = () => {
      if (cancelled) return;
      attempts++;

      if (window.botpress) {
        if (!cancelled) setState('ready');
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 250);
      } else {
        if (!cancelled) setState('error');
      }
    };

    poll();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------------------
  // Listen for custom events FROM the bot → app navigation
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (state !== 'ready') return;

    const bp = window.botpress;
    if (!bp) return;

    const handler = (event: { type: string; payload?: { id?: string } }) => {
      if (event.type === 'bookvault:navigate-to-book' && event.payload?.id) {
        navigate(`/books/${event.payload.id}`);
      }
    };

    bp.on('customEvent', handler);
    return () => {
      bp.off?.('customEvent', handler);
    };
  }, [state, navigate]);

  // -------------------------------------------------------------------------
  // Fire page-view event when webchat is ready
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (state === 'ready') {
      fireCustomEvent('bookvault:page-view', { page: 'app' });
    }
  }, [state]);

  const sendEvent = useCallback(
    (event: BookVaultEvent) => {
      fireCustomEvent(event.type, event.detail);
    },
    [],
  );

  const openChat = useCallback(() => {
    const bp = window.botpress;
    if (bp) {
      try {
        bp.open();
      } catch {
        console.warn('[BotpressProvider] Failed to open chat');
      }
    }
  }, []);

  return (
    <BotpressContext.Provider
      value={{
        isReady: state === 'ready',
        sendEvent,
        openChat,
      }}
    >
      {children}
    </BotpressContext.Provider>
  );
}
