export interface EmailData {
  to: string;
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
}

export interface ContactFormData {
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  messageId?: string;
}
