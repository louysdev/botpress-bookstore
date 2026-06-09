/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BIGBOOK_API_KEY: string;
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
