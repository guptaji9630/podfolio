export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  content: string;
  date: Date;
  isRead: boolean;
}

export interface MailComposerData {
  to: string;
  subject: string;
  message: string;
  senderName?: string;
  senderEmail?: string;
}

export interface MailApiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MailFormState {
  subject: string;
  message: string;
  senderEmail: string;
  senderName: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}
