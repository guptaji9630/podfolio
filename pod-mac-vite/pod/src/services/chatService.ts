import axios from 'axios';
import { ENV } from '../config/env.config';
import { ChatMessage, ChatApiResponse, AITool } from '../types';
import { PROJECTS } from '../config/constants';

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

async function executeToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'send_contact_email': {
      const { subject, message, senderName, senderEmail } = args;
      const response = await fetch(`${ENV.API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, senderName, senderEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send email');
      return { success: true, message: 'Email sent successfully', data };
    }
    case 'get_project_details': {
      const { query } = args;
      const lowerQuery = query.toLowerCase();
      const projects = PROJECTS.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.category.toLowerCase().includes(lowerQuery) ||
        p.techStack?.some(t => t.toLowerCase().includes(lowerQuery))
      );
      return { projects: projects.map(p => ({ name: p.name, description: p.description, techStack: p.techStack, githubUrl: p.githubUrl, liveDemo: p.liveDemo })) };
    }
    case 'get_availability': {
      return { available: true, message: "Abhishek is currently open to QA/testing roles and freelance projects. Available for consultations and full-time opportunities." };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

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

  private detectToolIntent(message: string): { name: string; arguments: Record<string, any> } | null {
    const lower = message.toLowerCase();
    
    // Check for project queries
    if (/(project|portfolio|fitforge|agmatix|trail management|what.*project|show.*project)/.test(lower)) {
      return { name: 'get_project_details', arguments: { query: message } };
    }
    
    // Check for availability queries
    if (/(availability|available|free|open to work|open for|hiring|hire me)/.test(lower)) {
      return { name: 'get_availability', arguments: {} };
    }
    
    // Check for contact/email queries - require minimum 10 chars to avoid backend validation errors
    if (message.trim().length >= 10 && /(contact|email|reach|hire|connect|call|phone|send.*email|message.*abhishek)/.test(lower)) {
      return { name: 'send_contact_email', arguments: { 
        subject: 'Inquiry from portfolio chat', 
        message: message,
        senderName: 'Portfolio Visitor',
        senderEmail: ''
      }};
    }
    
    return null;
  }

  async sendMessage(
    messages: ChatMessage[],
    enableTools: boolean = ENV.ENABLE_AI_TOOLS
  ): Promise<ChatApiResponse> {
    const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';

    // Frontend-only production mode (no backend/proxy available).
    if (ENV.IS_PROD) {
      return {
        message: this.generateFrontendReply(latestUserMessage),
      };
    }

    try {
      const allToolCalls: Array<{ name: string; arguments: Record<string, any> }> = [];
      let currentMessages = [...messages];

      // Local tool detection and execution (since NIM API doesn't support function calling reliably)
      if (enableTools) {
        const toolIntent = this.detectToolIntent(latestUserMessage);
        if (toolIntent) {
          try {
            const result = await executeToolCall(toolIntent.name, toolIntent.arguments);
            allToolCalls.push(toolIntent);
            
            // Add tool result as context for the model
            const toolResultMessage = `Tool "${toolIntent.name}" returned: ${JSON.stringify(result)}`;
            currentMessages.push({
              role: 'tool',
              content: toolResultMessage,
              toolCalls: [{ name: toolIntent.name, arguments: toolIntent.arguments, result }],
            });
          } catch (toolError: any) {
            allToolCalls.push(toolIntent);
            currentMessages.push({
              role: 'tool',
              content: `Tool "${toolIntent.name}" failed: ${toolError.message}`,
              toolCalls: [{ name: toolIntent.name, arguments: toolIntent.arguments, result: { error: toolError.message } }],
            });
          }
        }
      }

      // Get final response from model with tool context
      const response = await this.requestCompletion(currentMessages, false);
      
      return {
        message: response.responseText || "I'm sorry, I couldn't process that request.",
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
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

      if (errorMsg.includes('Network Error') || errorMsg.includes('CORS') || errorMsg.includes('ERR_NETWORK')) {
        return {
          message: this.generateFrontendReply(latestUserMessage),
        };
      }

      return {
        message: this.generateFrontendReply(latestUserMessage),
      };
    }
  }

  private generateFrontendReply(userInput: string): string {
    const input = userInput.trim().toLowerCase();

    if (!input) {
      return "Hey! Ask me about Abhishek's skills, QA experience, projects, or how to contact him.";
    }

    if (/^(hi|hii|hello|hey|yo|namaste)\b/.test(input)) {
      return "Hey! I can help with Abhishek's QA experience, projects, skills, or contact details.";
    }

    if (/(contact|email|reach|hire|connect|call|phone)/.test(input)) {
      return "You can contact Abhishek at abhishekg9630@gmail.com or +91-9560934582. If you want, draft a short message and I can help improve it.";
    }

    if (/(availability|available|free|open to work|open for)/.test(input)) {
      return "Abhishek is open to QA/testing roles and project discussions. Share your timeline and requirements, and I can help draft a message for him.";
    }

    if (/(project|portfolio|fitforge|agmatix|trail management)/.test(input)) {
      return "Key projects: Trail Management System (QA testing, bug reporting, stability validation) and FitForge (MERN full-stack app with workout analytics).";
    }

    if (/(skill|tech|stack|tools?|jest|playwright|cypress|selenium|api testing|manual testing|automation)/.test(input)) {
      return "Abhishek's core strengths: Manual + Automated Testing, bug reporting, API testing, regression/smoke testing, and tools like Jest, Playwright, Selenium, Cypress, Postman, plus MERN/Node/React experience.";
    }

    if (/(experience|role|work|successive|freelance)/.test(input)) {
      return "He has worked as Associate Engineer (QA) and Software Engineer Trainee at Successive Digital, plus freelance web development experience.";
    }

    if (/(resume|cv)/.test(input)) {
      return "You can open the Resume app from the dock to view/download Abhishek's resume. I can also summarize it for a specific role.";
    }

    return "I can help with Abhishek's QA experience, skills, projects, and contact details. Ask me something like 'What are his QA skills?' or 'How can I contact him?'";
  }

  private async requestCompletion(
    messages: ChatMessage[],
    _enableTools: boolean
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

    return { responseText, toolCalls: [] };
  }

  private buildNimMessages(messages: ChatMessage[]): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }> {
    return [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...messages.map(message => {
        if (message.role === 'tool') {
          // For tool messages, we need to extract tool_call_id from toolCalls
          const toolCallId = message.toolCalls?.[0]?.name ? `call_${message.toolCalls[0].name}_${Date.now()}` : undefined;
          return {
            role: 'tool' as const,
            content: message.content,
            tool_call_id: toolCallId,
          };
        }
        return {
          role: message.role,
          content: message.content,
        };
      }),
    ];
  }
}

export const chatService = new ChatService();
