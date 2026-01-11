import { API_ENDPOINTS } from '../config/api.config';
import { MailComposerData, MailApiResponse } from '../types';
import { validateMailForm, sanitizeInput } from '../utils/validators';
import { apiClient } from './api';

export class MailService {
  async sendContactEmail(data: MailComposerData): Promise<{ success: boolean; error?: string }> {
    // Validate form data
    const validation = validateMailForm(data);
    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors)[0],
      };
    }

    // Sanitize inputs
    const sanitizedData = {
      ...data,
      subject: sanitizeInput(data.subject),
      message: sanitizeInput(data.message),
      senderName: data.senderName ? sanitizeInput(data.senderName) : undefined,
      senderEmail: data.senderEmail ? sanitizeInput(data.senderEmail) : undefined,
    };

    // Send request
    const response = await apiClient.post<MailApiResponse>(
      API_ENDPOINTS.CONTACT.SEND,
      sanitizedData
    );

    if (!response.success || !response.data?.success) {
      return {
        success: false,
        error: response.error?.message || response.data?.error || 'Failed to send email',
      };
    }

    return { success: true };
  }
}

export const mailService = new MailService();
