# Backend API Implementation Guide

This guide provides step-by-step instructions for implementing the backend services for the portfolio application.

## Tech Stack Recommendation

- **Runtime:** Node.js 20+ / Bun
- **Framework:** Express.js (simple, widely supported)
- **Email Service:** Resend (modern, developer-friendly) or SendGrid
- **Deployment:** Vercel Serverless Functions / Railway / Render
- **Rate Limiting:** Redis (Upstash) or in-memory store

---

## Setup Instructions

### 1. Initialize Backend Project

```bash
mkdir pod-backend
cd pod-backend
npm init -y
npm install express cors dotenv helmet express-rate-limit
npm install --save-dev typescript @types/express @types/node tsx
```

### 2. Project Structure

```
pod-backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── email.ts
│   ├── middleware/
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── contact.ts
│   │   ├── chat.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── aiService.ts
│   │   └── toolsService.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

---

## Code Implementation

### 3. Environment Configuration (`src/config/env.ts`)

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Email Service
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL || 'abhishekg9630@gmail.com',
  
  // AI Service
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  
  // Security
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 min
};

// Validate required env vars
const required = ['RESEND_API_KEY', 'GEMINI_API_KEY'];
required.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

### 4. Email Service (`src/services/emailService.ts`)

```typescript
import { Resend } from 'resend';
import { ENV } from '../config/env';

const resend = new Resend(ENV.RESEND_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
}

export class EmailService {
  async sendContactEmail(data: EmailData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a84ff;">New Contact Form Submission</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Subject:</strong> ${data.subject}</p>
          ${data.senderName ? `<p><strong>From:</strong> ${data.senderName}</p>` : ''}
          ${data.senderEmail ? `<p><strong>Email:</strong> ${data.senderEmail}</p>` : ''}
        </div>
        <div style="margin: 20px 0;">
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          This message was sent via your portfolio contact form.
        </p>
      </div>
    `;

    try {
      const result = await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>', // Update with your domain
        to: data.to,
        replyTo: data.senderEmail || undefined,
        subject: `Portfolio Contact: ${data.subject}`,
        html,
      });

      return { success: true, messageId: result.id };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const emailService = new EmailService();
```

### 5. Contact Route (`src/routes/contact.ts`)

```typescript
import { Router } from 'express';
import { emailService } from '../services/emailService';
import { validateContactForm } from '../middleware/validation';
import { ENV } from '../config/env';

const router = Router();

router.post('/', validateContactForm, async (req, res) => {
  try {
    const { subject, message, senderEmail, senderName } = req.body;

    const result = await emailService.sendContactEmail({
      to: ENV.RECIPIENT_EMAIL,
      subject,
      message,
      senderEmail,
      senderName,
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
      });
    }
  } catch (error: any) {
    console.error('Contact route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

export default router;
```

### 6. Validation Middleware (`src/middleware/validation.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContactForm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { subject, message, senderEmail } = req.body;

  // Validate required fields
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Subject is required',
    });
  }

  if (subject.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Subject must be less than 200 characters',
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Message must be at least 10 characters',
    });
  }

  if (message.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Message must be less than 5000 characters',
    });
  }

  // Validate optional email
  if (senderEmail && !emailRegex.test(senderEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address',
    });
  }

  next();
};
```

### 7. Rate Limiting (`src/middleware/rateLimit.ts`)

```typescript
import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';

export const contactRateLimit = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW,
  max: ENV.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 8. Main Server (`src/index.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { contactRateLimit } from './middleware/rateLimit';
import contactRoutes from './routes/contact';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ENV.ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/contact', contactRateLimit, contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(ENV.PORT, () => {
  console.log(`Server running on port ${ENV.PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);
});
```

### 9. Environment Variables (`.env.example`)

```bash
# Server
PORT=3000
NODE_ENV=development

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RECIPIENT_EMAIL=abhishekg9630@gmail.com

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Security
ALLOWED_ORIGINS=http://localhost:5173,https://your-portfolio.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

---

## Deployment Options

### Option 1: Vercel Serverless Functions

Create `api/contact.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { emailService } from '../src/services/emailService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add validation and rate limiting
  const result = await emailService.sendContactEmail(req.body);
  
  if (result.success) {
    return res.json({ success: true, messageId: result.messageId });
  }
  
  return res.status(500).json({ success: false, error: 'Failed to send email' });
}
```

### Option 2: Railway / Render

1. Push code to GitHub
2. Connect repository to Railway/Render
3. Add environment variables in dashboard
4. Deploy automatically

---

## Testing

### Test Contact Endpoint

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Message",
    "message": "This is a test message from the contact form.",
    "senderEmail": "test@example.com",
    "senderName": "Test User"
  }'
```

Expected Response:
```json
{
  "success": true,
  "messageId": "abc123..."
}
```

---

## Email Service Alternatives

### Using SendGrid

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: data.to,
  from: 'your-verified-sender@example.com',
  subject: data.subject,
  html: htmlContent,
};

await sgMail.send(msg);
```

### Using Nodemailer (SMTP)

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: data.to,
  subject: data.subject,
  html: htmlContent,
});
```

---

## Security Checklist

- [ ] Environment variables properly configured
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] XSS protection (sanitize inputs)
- [ ] CSRF protection (if using cookies)
- [ ] HTTPS enabled in production
- [ ] API keys never exposed to frontend
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (but don't log sensitive data)

---

## Monitoring & Logging

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Uptime monitoring** (UptimeRobot, Better Uptime)
- **Analytics** for API usage tracking

---

## Next Steps

1. Set up Resend account and get API key
2. Implement backend following this guide
3. Deploy to Vercel/Railway/Render
4. Update frontend `.env.local` with API URL
5. Test thoroughly
6. Monitor in production
