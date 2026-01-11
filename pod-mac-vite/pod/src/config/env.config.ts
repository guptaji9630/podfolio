// Environment configuration with type safety
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = (import.meta.env as unknown as Record<string, string>)[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
  }
  return value || '';
};

export const ENV = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3002/api'),
  GEMINI_API_KEY: getEnvVar('VITE_GEMINI_API_KEY'),
  
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

// Validation - throw error if critical env vars are missing in production
if (ENV.IS_PROD && !ENV.GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is required in production');
}
