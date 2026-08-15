import { Router } from 'express';
import contactRouter from './contact.js';
import nimRouter from './nim.js';

const router = Router();

// Mount routes
router.use('/contact', contactRouter);
router.use('/nim', nimRouter);

// Root endpoint
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Portfolio API is running',
    version: '1.0.0',
    endpoints: {
      contact: '/api/contact',
      health: '/api/health',
    },
  });
});

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
