import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (ENV.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Portfolio API',
    version: '1.0.0',
    documentation: '/api',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = ENV.PORT;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Server Running Successfully       ║
╠════════════════════════════════════════╣
║   Port:        ${PORT}                    ║
║   Environment: ${ENV.NODE_ENV}         ║
║   API URL:     http://localhost:${PORT} ║
╚════════════════════════════════════════╝
  `);
});

// Stop accepting requests and allow active connections to finish before exit.
let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 10000);
  deadline.unref();
  server.close(error => {
    clearTimeout(deadline);
    process.exit(error ? 1 : 0);
  });
  server.closeIdleConnections();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
