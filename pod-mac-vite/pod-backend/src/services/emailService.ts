import { Resend } from 'resend';
import { ENV } from '../config/env.js';
import type { EmailData } from '../types/index.js';

const resend = new Resend(ENV.RESEND_API_KEY);

export interface AgentOutputEmailData {
  to: string;
  subject: string;
  agentOutput: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }>;
  conversationId?: string;
}

export class EmailService {
  async sendContactEmail(data: EmailData) {
    const escapedSubject = this.escapeHtml(data.subject);
    const escapedMessage = this.escapeHtml(data.message);
    const escapedSenderName = data.senderName ? this.escapeHtml(data.senderName) : '';
    const escapedSenderEmail = data.senderEmail ? this.escapeHtml(data.senderEmail) : '';

    const html = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' +
      '<div style="background: linear-gradient(135deg, #0a84ff 0%, #0056d6 100%); padding: 30px; text-align: center;">' +
      '<h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Contact Form Submission</h2>' +
      '</div>' +
      '<div style="padding: 30px;">' +
      '<div style="background: #f5f5f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">' +
      '<p style="margin: 0 0 12px 0; color: #1d1d1f;"><strong style="color: #0a84ff;">Subject:</strong> ' + escapedSubject + '</p>' +
      (data.senderName ? '<p style="margin: 0 0 12px 0; color: #1d1d1f;"><strong style="color: #0a84ff;">From:</strong> ' + escapedSenderName + '</p>' : '') +
      (data.senderEmail ? '<p style="margin: 0; color: #1d1d1f;"><strong style="color: #0a84ff;">Email:</strong> <a href="mailto:' + escapedSenderEmail + '" style="color: #0a84ff; text-decoration: none;">' + escapedSenderEmail + '</a></p>' : '') +
      '</div>' +
      '<div style="margin: 20px 0;">' +
      '<h3 style="color: #1d1d1f; font-size: 18px; margin: 0 0 12px 0;">Message:</h3>' +
      '<div style="background: #f5f5f7; padding: 20px; border-radius: 8px; border-left: 4px solid #0a84ff;">' +
      '<p style="white-space: pre-wrap; margin: 0; color: #1d1d1f; line-height: 1.6;">' + escapedMessage + '</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="background: #f5f5f7; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">' +
      '<p style="color: #86868b; font-size: 12px; margin: 0;">This message was sent via your portfolio contact form</p>' +
      '</div>' +
      '</div>';

    try {
      const result = await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: data.to,
        replyTo: data.senderEmail || undefined,
        subject: 'Portfolio Contact: ' + data.subject,
        html,
      });

      console.log('Email sent successfully:', result.data?.id || result);
      return { success: true, messageId: result.data?.id || 'sent' };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAgentOutput(data: AgentOutputEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let toolCallsHtml = '';
    if (data.toolCalls && data.toolCalls.length > 0) {
      toolCallsHtml = '<div style="margin: 20px 0;"><h3 style="color: #1d1d1f; font-size: 18px; margin: 0 0 12px 0;">Tools Used:</h3><ul style="padding-left: 20px;">' +
        data.toolCalls.map((tc) => {
          return '<li style="margin: 8px 0;"><strong>' + this.escapeHtml(tc.name) + '</strong>: ' +
            '<code style="background: #f5f5f7; padding: 2px 6px; border-radius: 4px; font-size: 12px;">' + this.escapeHtml(JSON.stringify(tc.arguments)) + '</code>' +
            (tc.result && typeof tc.result === 'object' && 'error' in tc.result ? '<span style="color: #dc2626;"> (Error: ' + this.escapeHtml(String(tc.result.error)) + ')</span>' : '') +
          '</li>';
        }).join('') +
        '</ul></div>';
    }

    var escapedConversationId = data.conversationId ? this.escapeHtml(data.conversationId) : '';

    var html = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' +
      '<div style="background: linear-gradient(135deg, #0a84ff 0%, #0056d6 100%); padding: 30px; text-align: center;">' +
      '<h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">AI Agent Output</h2>' +
      '</div>' +
      '<div style="padding: 30px;">' +
      (data.conversationId ? '<p style="margin: 0 0 12px 0; color: #1d1d1f;"><strong style="color: #0a84ff;">Conversation ID:</strong> ' + escapedConversationId + '</p>' : '') +
      '<div style="margin: 20px 0;">' +
      '<h3 style="color: #1d1d1f; font-size: 18px; margin: 0 0 12px 0;">Agent Response:</h3>' +
      '<div style="background: #f5f5f7; padding: 20px; border-radius: 8px; border-left: 4px solid #0a84ff; white-space: pre-wrap;">' + this.escapeHtml(data.agentOutput) + '</div>' +
      '</div>' + toolCallsHtml + '</div>' +
      '<div style="background: #f5f5f7; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">' +
      '<p style="color: #86868b; font-size: 12px; margin: 0;">Sent from Abhishek\'s Portfolio AI Agent</p>' + '</div></div>';

    try {
      const result = await resend.emails.send({
        from: 'Portfolio AI Agent <onboarding@resend.dev>',
        to: data.to,
        subject: data.subject,
        html,
      });

      if (result.error) {
        console.error('Agent output email sending failed:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('Agent output email sent successfully:', result.data?.id || result);
      return { success: true, messageId: result.data?.id || 'sent' };
    } catch (error: any) {
      console.error('Agent output email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
}

export const emailService = new EmailService();