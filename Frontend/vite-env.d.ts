/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_BACKEND: string;
  readonly VITE_WINDY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
