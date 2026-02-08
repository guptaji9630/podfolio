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
      
      // Use gemini-2.5-flash - latest stable Gemini model
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: lastMessage.content,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
      
      const responseText = response.text || "I'm sorry, I couldn't process that request.";

      // Check for tool calls in response
      const toolCalls = this.extractToolCalls(response);

      return {
        message: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error: any) {
      console.error('Chat service error:', error);
      
      // Return user-friendly messages without exposing technical errors
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('API key expired') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('INVALID_ARGUMENT')) {
        return {
          message: "🔑 The AI service is temporarily unavailable. Please contact the administrator to renew the API key.",
        };
      }
      
      if (errorMsg.includes('not found') || errorMsg.includes('NOT_FOUND')) {
        return {
          message: "I'm experiencing technical difficulties. Please try again in a moment.",
        };
      }
      
      // Generic friendly error message
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
      };
    }
  }

  private formatToolsForGemini(): any[] {
    // Format tools according to Gemini's function calling specification
    const functionDeclarations = AI_TOOLS.map(tool => {
      // Convert our parameters format to Gemini's expected format
      const properties: Record<string, any> = {};
      const required: string[] = [];

      Object.entries(tool.parameters).forEach(([key, param]) => {
        properties[key] = {
          type: param.type,
          description: param.description,
        };
        if (param.required) {
          required.push(key);
        }
      });

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        },
      };
    });

    return [{
      functionDeclarations,
    }];
  }

  private extractToolCalls(response: any): any[] {
    // Extract tool/function calls from Gemini response
    try {
      // Gemini response structure for function calls
      const candidates = response.candidates || [];
      if (candidates.length === 0) return [];

      const firstCandidate = candidates[0];
      const content = firstCandidate.content;
      
      if (!content || !content.parts) return [];

      const functionCalls: any[] = [];
      
      for (const part of content.parts) {
        if (part.functionCall) {
          functionCalls.push({
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }

      return functionCalls;
    } catch (error) {
      console.error('Error extracting tool calls:', error);
      return [];
    }
  }
}

export const chatService = new ChatService();
