import { Resend } from 'resend';
import { ENV } from '../config/env.js';
import type { EmailData } from '../types/index.js';

const resend = new Resend(ENV.RESEND_API_KEY);

export class EmailService {
  async sendContactEmail(data: EmailData) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0a84ff 0%, #0056d6 100%); padding: 30px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Contact Form Submission</h2>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #f5f5f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0; color: #1d1d1f;"><strong style="color: #0a84ff;">Subject:</strong> ${this.escapeHtml(data.subject)}</p>
            ${data.senderName ? `<p style="margin: 0 0 12px 0; color: #1d1d1f;"><strong style="color: #0a84ff;">From:</strong> ${this.escapeHtml(data.senderName)}</p>` : ''}
            ${data.senderEmail ? `<p style="margin: 0; color: #1d1d1f;"><strong style="color: #0a84ff;">Email:</strong> <a href="mailto:${this.escapeHtml(data.senderEmail)}" style="color: #0a84ff; text-decoration: none;">${this.escapeHtml(data.senderEmail)}</a></p>` : ''}
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #1d1d1f; font-size: 18px; margin: 0 0 12px 0;">Message:</h3>
            <div style="background: #f5f5f7; padding: 20px; border-radius: 8px; border-left: 4px solid #0a84ff;">
              <p style="white-space: pre-wrap; margin: 0; color: #1d1d1f; line-height: 1.6;">${this.escapeHtml(data.message)}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #f5f5f7; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
          <p style="color: #86868b; font-size: 12px; margin: 0;">
            This message was sent via your portfolio contact form
          </p>
        </div>
      </div>
    `;

    try {
      const result = await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>', // Update with your verified domain
        to: data.to,
        reply_to: data.senderEmail || undefined,
        subject: `Portfolio Contact: ${data.subject}`,
        html,
      });

      const messageId = result.data?.id || 'unknown';
      console.log('✅ Email sent successfully:', messageId);
      return { success: true, messageId };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export const emailService = new EmailService();
