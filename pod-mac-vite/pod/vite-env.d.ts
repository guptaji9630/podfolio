/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_AI_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}