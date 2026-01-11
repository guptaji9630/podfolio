# Portfolio Backend API

Backend service for Abhishek's Portfolio with contact form email functionality.

## Features

- ✉️ Contact form email delivery via Resend
- 🔒 Security with Helmet, CORS, and rate limiting
- ✅ Input validation and sanitization
- 🚀 TypeScript for type safety
- 📝 Comprehensive error handling

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Email Service:** Resend
- **Language:** TypeScript
- **Dev Tool:** tsx (TypeScript executor)

## Quick Start

### 1. Install Dependencies

```bash
cd pod-backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3000
NODE_ENV=development
RESEND_API_KEY=your_resend_api_key
RECIPIENT_EMAIL=abhishekg9630@gmail.com
ALLOWED_ORIGINS=http://localhost:5173
```

**Get Resend API Key:**
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy it to your `.env` file

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Send Contact Email
```
POST /api/contact
Content-Type: application/json

{
  "subject": "Hello from Portfolio",
  "message": "This is a test message",
  "senderName": "John Doe", // optional
  "senderEmail": "john@example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_xxx"
}
```

## Rate Limits

- **General API:** 100 requests per 15 minutes
- **Contact Form:** 5 submissions per 15 minutes per IP

<!-- 
## Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

### Option 2: Railway

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Option 3: Render

1. Connect repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

## Project Structure

```
pod-backend/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── rateLimit.ts        # Rate limiting
│   │   └── validation.ts       # Input validation
│   ├── routes/
│   │   ├── contact.ts          # Contact form route
│   │   └── index.ts            # Route aggregation
│   ├── services/
│   │   └── emailService.ts     # Email sending logic
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── index.ts                # Server entry point
├── .env.example                # Environment template
├── .gitignore
├── package.json
└── tsconfig.json
``` -->

## Security Features

- **Helmet:** Sets secure HTTP headers
- **CORS:** Controlled cross-origin requests
- **Rate Limiting:** Prevents spam and abuse
- **Input Validation:** Validates all incoming data
- **Sanitization:** Removes potentially harmful content
- **XSS Protection:** Escapes HTML in emails

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Resend email not sending
- Verify your API key is correct
- Check if you're using a verified domain (or use onboarding@resend.dev for testing)
- Check Resend dashboard for delivery logs

### CORS errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Ensure frontend is using the correct API URL

## Support

For issues or questions, contact abhishekg9630@gmail.com

## License

MIT
