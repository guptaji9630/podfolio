import { Router } from 'express';
import { emailService } from '../services/emailService.js';
import { validateContactForm, sanitizeInput } from '../middleware/validation.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import { ENV } from '../config/env.js';
import type { ContactFormData } from '../types/index.js';

const router = Router();

router.post('/', contactLimiter, validateContactForm, async (req, res) => {
  try {
    const { subject, message, senderEmail, senderName } = req.body as ContactFormData;

    // Sanitize all inputs
    const sanitizedData = {
      subject: sanitizeInput(subject),
      message: sanitizeInput(message),
      senderEmail: senderEmail ? sanitizeInput(senderEmail) : undefined,
      senderName: senderName ? sanitizeInput(senderName) : undefined,
    };

    // Send email
    const result = await emailService.sendContactEmail({
      to: ENV.RECIPIENT_EMAIL,
      ...sanitizedData,
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email. Please try again later.',
      });
    }
  } catch (error: any) {
    console.error('Contact route error:', error);
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage =
      !isProduction && error && typeof error.message === 'string'
        ? error.message
        : 'Internal server error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Contact service is running' });
});

export default router;
