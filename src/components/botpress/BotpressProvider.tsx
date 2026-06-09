import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
 * Context provider that wraps Botpress webchat initialization.
 *
 * - Waits for window.botpressWebChat to be available.
 * - Initializes with the configured client ID.
 * - Falls back gracefully (error state) if the CDN is down or client ID missing.
 */
export function BotpressProvider({ children }: BotpressProviderProps) {
  const [state, setState] = useState<BotpressState>('init');

  useEffect(() => {
    const clientId = import.meta.env.VITE_BOTPRESS_CLIENT_ID;

    if (!clientId) {
      console.warn(
        '[BotpressProvider] VITE_BOTPRESS_CLIENT_ID is not set. ' +
          'Botpress webchat will not initialize.',
      );
      setState('error');
      return;
    }

    // Fire a page-view event when the app mounts
    fireCustomEvent('bookvault:page-view', { page: 'app' });

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20; // ~5 seconds polling

    const poll = () => {
      if (cancelled) return;
      attempts++;

      const bp = window.botpressWebChat;
      if (bp) {
        try {
          bp.init({
            botId: clientId,
            configuration: {
              color: '#3276EA',
              variant: 'solid',
              themeMode: 'light',
              botName: 'BookVault Assistant',
              botDescription: 'Ask me about any book!',
              composerPlaceholder: 'Ask about books...',
              proactiveMessageEnabled: true,
              proactiveBubbleMessage: 'Need book recommendations?',
              proactiveBubbleTriggerType: 'afterDelay',
              proactiveBubbleDelayTime: 3,
            },
            clientId,
          });

          if (!cancelled) setState('ready');
        } catch {
          if (!cancelled) {
            console.warn('[BotpressProvider] Failed to initialize webchat');
            setState('error');
          }
        }
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 250);
      } else {
        if (!cancelled) {
          console.warn(
            '[BotpressProvider] Botpress webchat script not loaded after polling. ' +
              'Ensure the CDN script is included in index.html.',
          );
          setState('error');
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendEvent = useCallback(
    (event: BookVaultEvent) => {
      fireCustomEvent(event.type, event.detail);
    },
    [],
  );

  const openChat = useCallback(() => {
    const bp = window.botpressWebChat;
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
