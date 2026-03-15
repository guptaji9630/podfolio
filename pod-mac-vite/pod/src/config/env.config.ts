// Environment configuration with type safety
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = (import.meta.env as unknown as Record<string, string>)[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
  }
  return value || '';
};

const getNimApiUrl = (): string => {
  const configured = getEnvVar('VITE_NVIDIA_NIM_API_URL', '/nim-api/chat/completions');

  // In dev, force local proxy path to avoid browser CORS failures.
  if (import.meta.env.DEV && /^https?:\/\//i.test(configured)) {
    return '/nim-api/chat/completions';
  }

  return configured;
};

export const ENV = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3002/api'),
  NVIDIA_NIM_API_URL: getNimApiUrl(),
  NVIDIA_NIM_MODEL: getEnvVar('VITE_NVIDIA_NIM_MODEL', 'meta/llama-4-maverick-17b-128e-instruct'),
  
  // Feature Flags
  ENABLE_ANALYTICS: getEnvVar('VITE_ENABLE_ANALYTICS', 'false') === 'true',
  ENABLE_AI_TOOLS: getEnvVar('VITE_ENABLE_AI_TOOLS', 'true') === 'true',
  
  // App Configuration
  APP_NAME: 'Abhishek Portfolio',
  VERSION: '1.0.0',
  
  // Development
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
