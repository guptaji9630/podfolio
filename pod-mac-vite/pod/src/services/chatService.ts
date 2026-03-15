import axios from 'axios';
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

## ABOUT ABHISHEK
Abhishek Gupta is a Quality Assurance Engineer and Software Tester with a strong background in software development.

**Current Role:** Quality Assurance Engineer | Software Tester
**Location:** Delhi, India
**Contact:** abhishekg9630@gmail.com | +91-9560934582

## PROFESSIONAL SUMMARY
Dedicated Quality Assurance Engineer with hands-on experience in manual and automated testing. Skilled in identifying bugs, ensuring product quality, and improving testing processes. Strong background in software development with expertise in MERN stack and testing frameworks like Jest and Playwright. Committed to delivering high-quality software through rigorous testing and continuous improvement.

## EXPERIENCE
1. **Associate Engineer (QA)** at Successive Digital (May 2025 - Nov 2025)
   - Ran manual checks on new features to ensure everything worked as expected
   - Reported clear and detailed issues to help speed up fixes
   - Helped improve the testing process by sharing feedback with the team

2. **Software Engineer Trainee** at Successive Digital (May 2025 - Nov 2025)
   - Developed the fitness-forge MERN app
   - Developed skills in Next.js, Node.js with Jest Testing
   - Technologies: JavaScript, NEXT.js, Axios, MongoDB, Git, Github, Node.js, Graph QL

3. **Freelance Web Developer** (May 2023 - Mar 2024)
   - Delivered tailored web development solutions using React.js and Node.js
   - Improved user experience and boosted website traffic by 15% on average
   - Managed end-to-end project lifecycles

## PROJECTS
1. **Trail Management System - Agmatix** (QA Testing)
   - Tested core features to ensure smooth data flow and reliable performance
   - Reported bugs with clear steps and improved system quality
   - Validated stability and usability after each update

2. **FitForge - The Fitness Tracker** (Full Stack Development)
   - Developed full stack web app using MERN stack
   - Shows analytical workout data with progress photo feature
   - Technologies: MERN, Graph QL

## SKILLS
**QA & Testing:**
- Manual Testing, Automated Testing, Bug Reporting, Test Cases
- Jest, Playwright, Selenium, Cypress, API Testing
- Regression Testing, Smoke Testing

**Development:**
- JavaScript, React Native, Node.js, HTML, CSS
- MERN Stack, Next.js

**Tools & Technologies:**
- Git, GitHub, MongoDB, MySQL, Postman
- Android Development, C++, Python

**Certifications:**
- Machine Learning Course by Andrew Nug On Cousera
- Java Foundational Certification on Udemy
- Digital Marketing Certification on Google
- Graph QL Associate Certification

**Awards:**
- Snap AR hackathon(2022): Top 10% successful candidates
- Nasa Space App hackathon: Top 20% successful candidates

## PERSONALITY
Abhishek is curious, fast-learning, and career-driven — always open to exploring new technologies and best practices. He's passionate about quality assurance and ensuring software reliability.

## INSTRUCTIONS
When users express interest in contacting Abhishek, proactively offer to send an email on their behalf using the send_contact_email tool.
When asked about projects, use the get_project_details tool to fetch information.
When discussing his skills or experience, refer to the detailed information above.

Be helpful, practical, and slightly witty.
Keep responses concise like a chat message — no unnecessary lectures, just clear, actionable guidance.`;

export class ChatService {
  constructor() {}

  async sendMessage(
    messages: ChatMessage[],
    enableTools: boolean = ENV.ENABLE_AI_TOOLS
  ): Promise<ChatApiResponse> {
    try {
      const firstPass = await this.requestCompletion(messages, enableTools);

      // Some models return function call JSON as plain text content.
      // If that happens, retry without tools so user gets a natural-language reply.
      const needsPlainTextRetry =
        firstPass.responseText.length === 0 || this.looksLikeFunctionPayload(firstPass.responseText);

      const finalResponse = needsPlainTextRetry
        ? await this.requestCompletion(messages, false)
        : firstPass;

      return {
        message: finalResponse.responseText || "I'm sorry, I couldn't process that request.",
        toolCalls: finalResponse.toolCalls.length > 0 ? finalResponse.toolCalls : undefined,
      };
    } catch (error: unknown) {
      console.error('Chat service error:', error);

      const errorMsg = axios.isAxiosError(error)
        ? String(error.response?.data?.error?.message || error.message || '')
        : String((error as { message?: string })?.message || '');

      if (errorMsg.includes('invalid') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
        return {
          message: "The AI service is temporarily unavailable. Please contact the administrator to renew the API key.",
        };
      }

      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        return {
          message: "I'm experiencing technical difficulties. Please try again in a moment.",
        };
      }

      return {
        message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
      };
    }
  }

  private async requestCompletion(
    messages: ChatMessage[],
    enableTools: boolean
  ): Promise<{ responseText: string; toolCalls: Array<{ name: string; arguments: Record<string, any> }> }> {
    const response = await axios.post(
      ENV.NVIDIA_NIM_API_URL,
      {
        model: ENV.NVIDIA_NIM_MODEL,
        messages: this.buildNimMessages(messages),
        max_tokens: 512,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false,
        ...(enableTools ? { tools: this.formatToolsForNim() } : {}),
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        responseType: 'json',
      }
    );

    const assistantMessage = response.data?.choices?.[0]?.message;
    const responseText = String(assistantMessage?.content || '').trim();
    const toolCalls = this.extractToolCalls(assistantMessage?.tool_calls);

    return { responseText, toolCalls };
  }

  private looksLikeFunctionPayload(content: string): boolean {
    if (!content) {
      return false;
    }

    const trimmed = content.trim();

    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return false;
    }

    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const type = parsed?.type;
      const name = parsed?.name;
      return type === 'function' && typeof name === 'string' && name.length > 0;
    } catch {
      return false;
    }
  }

  private buildNimMessages(messages: ChatMessage[]): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    return [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...messages.map(message => ({
        role: message.role,
        content: message.content,
      })),
    ];
  }

  private formatToolsForNim(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, { type: string; description: string }>;
        required?: string[];
      };
    };
  }> {
    return AI_TOOLS.map(tool => {
      const properties = Object.fromEntries(
        Object.entries(tool.parameters).map(([name, config]) => [
          name,
          {
            type: config.type,
            description: config.description,
          },
        ])
      );

      const required = Object.entries(tool.parameters)
        .filter(([, config]) => config.required)
        .map(([name]) => name);

      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties,
            ...(required.length > 0 ? { required } : {}),
          },
        },
      };
    });
  }

  private extractToolCalls(toolCalls: unknown): Array<{ name: string; arguments: Record<string, any> }> {
    if (!Array.isArray(toolCalls)) {
      return [];
    }

    return toolCalls
      .map((toolCall: any) => {
        const rawArgs = toolCall?.function?.arguments;
        let parsedArgs: Record<string, any> = {};

        if (typeof rawArgs === 'string' && rawArgs.trim()) {
          try {
            parsedArgs = JSON.parse(rawArgs);
          } catch {
            parsedArgs = { raw: rawArgs };
          }
        }

        return {
          name: toolCall?.function?.name || 'unknown_tool',
          arguments: parsedArgs,
        };
      })
      .filter(call => call.name !== 'unknown_tool');
  }
}

export const chatService = new ChatService();
