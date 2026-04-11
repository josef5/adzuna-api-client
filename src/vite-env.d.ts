/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEON_AUTH_URL: string;
  readonly VITE_NEON_DATA_API_URL?: string;
  readonly VITE_API_URL: string;
  readonly VITE_APP_ID: string;
  readonly VITE_APP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
