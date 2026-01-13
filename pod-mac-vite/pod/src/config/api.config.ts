import { ENV } from './env.config';

export const API_ENDPOINTS = {
  // Contact/Mail endpoints
  CONTACT: {
    SEND: '/api/contact',
  },
  
  // Chat endpoints
  CHAT: {
    MESSAGE: '/chat',
    HISTORY: '/chat/history',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    TRACK: '/analytics',
  },
  
  // Project endpoints (future)
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id: string) => `/projects/${id}`,
  },
} as const;

export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;
