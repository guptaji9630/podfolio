/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_NVIDIA_NIM_API_KEY?: string;
  readonly VITE_NVIDIA_NIM_API_URL?: string;
  readonly VITE_NVIDIA_NIM_MODEL?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_AI_TOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}