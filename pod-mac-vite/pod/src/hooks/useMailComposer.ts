import { useState, useCallback } from 'react';
import { MailFormState } from '../types';
import { mailService } from '../services/mailService';
import { CONTACT_EMAIL } from '../config/constants';

const initialState: MailFormState = {
  subject: '',
  message: '',
  senderEmail: '',
  senderName: '',
  isSubmitting: false,
  error: null,
  success: false,
};

export const useMailComposer = () => {
  const [formState, setFormState] = useState<MailFormState>(initialState);

  const updateField = useCallback((field: keyof MailFormState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null, // Clear error when user types
      success: false, // Clear success when user types
    }));
  }, []);

  const sendEmail = useCallback(async () => {
    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    const result = await mailService.sendContactEmail({
      to: CONTACT_EMAIL,
      subject: formState.subject,
      message: formState.message,
      senderEmail: formState.senderEmail || undefined,
      senderName: formState.senderName || undefined,
    });

    if (result.success) {
      setFormState({
        ...initialState,
        success: true,
      });
    } else {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: result.error || 'Failed to send email',
      }));
    }
  }, [formState]);

  const reset = useCallback(() => {
    setFormState(initialState);
  }, []);

  return {
    formState,
    updateField,
    sendEmail,
    reset,
  };
};
