/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOTPRESS_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* Botpress webchat v3 global */
interface Window {
  botpressWebChat?: {
    init: (config: Record<string, unknown>) => void;
    open: () => void;
    sendEvent?: (event: Record<string, unknown>) => void;
  };
}

/* Botpress webchat v3+ (newer embed) */
interface BotpressWebchat {
  on: (event: string, handler: (event: { type: string; payload?: { id?: string } }) => void) => void;
  off?: (event: string, handler: (event: { type: string; payload?: { id?: string } }) => void) => void;
  open: () => void;
  sendEvent?: (event: Record<string, unknown>) => void;
}

interface Window {
  botpress?: BotpressWebchat;
}
