import { mailService } from './mailService';
import { ToolCall } from '../types';

/**
 * Tool Executor - Handles execution of AI tool calls
 */
export class ToolExecutor {
  async execute(toolCall: ToolCall): Promise<any> {
    console.log(`Executing tool: ${toolCall.name}`, toolCall.arguments);

    switch (toolCall.name) {
      case 'send_contact_email':
        return await this.executeSendContactEmail(toolCall.arguments);
      
      case 'get_project_details':
        return await this.executeGetProjectDetails(toolCall.arguments);
      
      case 'get_availability':
        return await this.executeGetAvailability(toolCall.arguments);
      
      default:
        console.warn(`Unknown tool: ${toolCall.name}`);
        return { error: `Tool ${toolCall.name} is not implemented` };
    }
  }

  private async executeSendContactEmail(args: Record<string, any>): Promise<any> {
    try {
      const { subject, message, senderName, senderEmail } = args;

      // Validate required fields
      if (!subject || !message) {
        return {
          success: false,
          error: 'Subject and message are required',
        };
      }

      // Call the mail service
      const result = await mailService.sendContactEmail({
        subject,
        message,
        senderName,
        senderEmail,
      });

      if (result.success) {
        return {
          success: true,
          message: 'Email sent successfully! Abhishek will get back to you soon.',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send email',
        };
      }
    } catch (error: any) {
      console.error('Error executing send_contact_email:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  private async executeGetProjectDetails(args: Record<string, any>): Promise<any> {
    // Placeholder for project details functionality
    const { query } = args;
    return {
      success: true,
      message: `Project details for "${query}" would be shown here. This feature is coming soon!`,
    };
  }

  private async executeGetAvailability(args: Record<string, any>): Promise<any> {
    // Placeholder for availability check
    return {
      success: true,
      message: 'Abhishek is currently available for new opportunities and consultations. Feel free to reach out!',
    };
  }
}

export const toolExecutor = new ToolExecutor();
