import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Email Service
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL || 'abhishekg9630@gmail.com',
  
  // Security
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 min
};

// Validate required env vars
const required = ['RESEND_API_KEY'];
required.forEach(key => {
  if (!process.env[key]) {
    console.warn(`⚠️  Missing environment variable: ${key}`);
  }
});
