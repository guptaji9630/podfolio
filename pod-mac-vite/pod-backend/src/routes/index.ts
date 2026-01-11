import { Router } from 'express';
import contactRouter from './contact.js';

const router = Router();

// Mount routes
router.use('/contact', contactRouter);

// Root endpoint
router.get('/', (req, res) => {
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
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
