import { MailComposerData } from '../types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@.][^\s@]*(\.[^\s@.]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validateMailForm = (data: Partial<MailComposerData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!data.subject?.trim()) {
    errors.subject = 'Subject is required';
  } else if (data.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters';
  }

  if (!data.message?.trim()) {
    errors.message = 'Message is required';
  } else if (data.message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (data.message.length > 5000) {
    errors.message = 'Message must be less than 5000 characters';
  }

  if (data.senderEmail && !validateEmail(data.senderEmail)) {
    errors.senderEmail = 'Invalid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  let sanitized = input.trim();

  // Repeatedly remove <script>...</script> blocks to avoid multi-character sanitization issues
  let previous: string;
  const scriptBlockRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(scriptBlockRegex, '');
  } while (sanitized !== previous);

  // As a safety net, remove any remaining script tag openings/closings (even if malformed)
  sanitized = sanitized.replace(/<\s*script\b/gi, '').replace(/<\/\s*script\s*>/gi, '');

  return sanitized;
};
