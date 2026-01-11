import type { Request, Response, NextFunction } from 'express';
import type { ContactFormData } from '../types/index.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContactForm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { subject, message, senderEmail, senderName } = req.body as ContactFormData;

  const errors: string[] = [];

  // Required fields
  if (!subject || subject.trim().length === 0) {
    errors.push('Subject is required');
  } else if (subject.length > 200) {
    errors.push('Subject must be less than 200 characters');
  }

  if (!message || message.trim().length === 0) {
    errors.push('Message is required');
  } else if (message.length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (message.length > 5000) {
    errors.push('Message must be less than 5000 characters');
  }

  // Optional fields validation
  if (senderEmail && !emailRegex.test(senderEmail)) {
    errors.push('Invalid email format');
  }

  if (senderName && senderName.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: errors[0],
      errors,
    });
    return;
  }

  next();
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .substring(0, 5000); // Limit length
};
