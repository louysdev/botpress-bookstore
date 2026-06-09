import { useContext } from 'react';
import { BotpressContext } from './BotpressProvider';

/**
 * Hook to access the Botpress chat context.
 * Returns { isReady, sendEvent, openChat }.
 * Throws if used outside of BotpressProvider.
 */
export function useBotpress() {
  const context = useContext(BotpressContext);

  if (!context) {
    throw new Error(
      'useBotpress must be used within a BotpressProvider. ' +
        'Wrap your application in a BotpressProvider to use this hook.',
    );
  }

  return context;
}
