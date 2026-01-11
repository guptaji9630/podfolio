import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env.config';
import { ChatMessage, ChatApiResponse, AITool } from '../types';

// AI Tools available to the assistant
export const AI_TOOLS: AITool[] = [
  {
    name: 'send_contact_email',
    description: 'Send a contact/inquiry email to Abhishek on behalf of the user',
    parameters: {
      subject: {
        type: 'string',
        description: 'Email subject line',
        required: true,
      },
      message: {
        type: 'string',
        description: 'Email message content',
        required: true,
      },
      senderName: {
        type: 'string',
        description: 'Name of the person sending the email',
      },
      senderEmail: {
        type: 'string',
        description: 'Email address of the sender for reply',
      },
    },
  },
  {
    name: 'get_project_details',
    description: 'Get detailed information about a specific project by name or category',
    parameters: {
      query: {
        type: 'string',
        description: 'Project name or category to search for',
        required: true,
      },
    },
  },
  {
    name: 'get_availability',
    description: "Check Abhishek's current availability for projects or consultations",
    parameters: {},
  },
];

const SYSTEM_INSTRUCTION = `You are Abhishek's personal AI assistant.

Abhishek is a fresher in Software Development and Testing, starting his professional journey in 2025. He specializes in the MERN stack, React Native, and modern web development. He has hands-on experience with testing frameworks like Playwright and is actively learning Generative AI and Agentic AI systems.

He is based in Delhi, India.
He is curious, fast-learning, and career-driven — always open to exploring new technologies and best practices.

When users express interest in contacting Abhishek, proactively offer to send an email on their behalf using the send_contact_email tool.
When asked about projects, use the get_project_details tool to fetch information.

Be helpful, practical, and slightly witty.
Keep responses concise like a chat message — no unnecessary lectures, just clear, actionable guidance.`;

export class ChatService {
  private ai: any;

  constructor() {
    if (ENV.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    }
  }

  async sendMessage(
    messages: ChatMessage[],
    enableTools: boolean = ENV.ENABLE_AI_TOOLS
  ): Promise<ChatApiResponse> {
    if (!this.ai) {
      return {
        message: "AI service is not configured. Please check your API key.",
        error: 'MISSING_API_KEY',
      };
    }

    try {
      const lastMessage = messages[messages.length - 1];
      
      const config: any = {
        model: 'gemini-2.0-flash-exp',
        contents: lastMessage.content,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      };

      // Add tools if enabled
      if (enableTools) {
        config.tools = this.formatToolsForGemini();
      }

      const response = await this.ai.models.generateContent(config);
      
      const responseText = response.text || "I'm sorry, I couldn't process that request.";

      // Check for tool calls in response
      const toolCalls = this.extractToolCalls(response);

      return {
        message: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error: any) {
      console.error('Chat service error:', error);
      return {
        message: "I'm having trouble connecting right now. Please try again.",
        error: error.message,
      };
    }
  }

  private formatToolsForGemini(): any[] {
    // Format tools according to Gemini's function calling specification
    return AI_TOOLS.map(tool => ({
      functionDeclarations: [{
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters,
        },
      }],
    }));
  }

  private extractToolCalls(response: any): any[] {
    // Extract tool/function calls from Gemini response
    // This will depend on Gemini's response format
    // Placeholder implementation
    if (response.functionCalls) {
      return response.functionCalls.map((call: any) => ({
        name: call.name,
        arguments: call.args,
      }));
    }
    return [];
  }
}

export const chatService = new ChatService();
