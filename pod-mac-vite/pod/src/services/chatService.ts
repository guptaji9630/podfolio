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
