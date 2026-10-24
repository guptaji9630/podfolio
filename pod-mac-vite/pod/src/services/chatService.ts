import { ENV } from '../config/env.config';
import { ChatMessage, ChatApiResponse, AITool } from '../types';
import { PROJECTS } from '../config/constants';
import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { CHAT_CONTEXT_LIMIT, CHAT_INPUT_LIMIT } from '../config/chat';
import { mcpService } from './mcpService';
import { MCPTool } from '../types/mcp.types';

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
    name: 'send_agent_output',
    description: 'Send the AI agent conversation/output to Abhishek via email. Use this when user explicitly asks to email the conversation or send a summary.',
    parameters: {
      subject: {
        type: 'string',
        description: 'Email subject line',
        required: true,
      },
      content: {
        type: 'string',
        description: 'The conversation content or summary to send',
        required: true,
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
  {
    name: 'get_game_list',
    description: 'Get list of available games with high scores and descriptions',
    parameters: {},
  },
  {
    name: 'launch_game',
    description: 'Launch a specific game for the user',
    parameters: {
      gameId: {
        type: 'string',
        description: 'Game to launch (dino or pong)',
        required: true,
      },
      mode: {
        type: 'string',
        description: 'Game mode for Pong (classic or survival)',
      },
    },
  },
];

async function executeToolCall(name: string, args: Record<string, any>, signal?: AbortSignal): Promise<any> {
  signal?.throwIfAborted();
  switch (name) {
    case 'send_contact_email': {
      const { subject, message, senderName, senderEmail } = args;
      const response = await apiClient.post(API_ENDPOINTS.CONTACT.SEND,
        { subject, message, senderName, senderEmail }, undefined, signal);
      signal?.throwIfAborted();
      if (!response.success) throw new Error(response.error?.message || 'Failed to send email');
      const data = response.data;
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
    case 'get_game_list': {
      let dinoHighScore = 0;
      let pongClassicHighScore = 0;
      let pongSurvivalHighScore = 0;
      try {
        dinoHighScore = Number(localStorage.getItem('guptaos_dino_highscore') || '0');
        pongClassicHighScore = Number(localStorage.getItem('guptaos_pong_classic_highscore') || '0');
        pongSurvivalHighScore = Number(localStorage.getItem('guptaos_pong_survival_highscore') || '0');
      } catch {
        // localStorage unavailable, use defaults
      }
      return {
        games: [
          {
            id: 'dino',
            name: 'Dino Run',
            description: 'Endless runner inspired by Chrome\'s offline dinosaur game. Jump over cacti and duck under birds. How far can you go?',
            highScore: dinoHighScore,
            genre: 'Endless Runner',
          },
          {
            id: 'pong',
            name: 'Pong vs AI',
            description: 'Classic Pong with an AI opponent. Choose from 4 difficulty levels (Easy to Unbeatable) and 2 game modes (Classic & Survival).',
            modes: ['classic', 'survival'],
            highScores: {
              classic: pongClassicHighScore,
              survival: pongSurvivalHighScore,
            },
            genre: 'Arcade',
          },
        ],
      };
    }
    case 'launch_game': {
      const { gameId, mode } = args;
      const allowedGameIds = ['dino', 'pong'];
      const allowedPongModes = ['classic', 'survival'];
      if (!gameId || !allowedGameIds.includes(gameId)) {
        return { success: false, message: 'Invalid game ID' };
      }
      if (gameId === 'pong' && mode && !allowedPongModes.includes(mode)) {
        return { success: false, message: 'Invalid mode for Pong' };
      }
      // Use specific targetOrigin instead of wildcard
      const targetOrigin = window.location.origin;
      window.parent.postMessage({ 
        type: 'LAUNCH_GAME', 
        payload: { gameId, mode } 
      }, targetOrigin);
      return { success: true, message: `Launching ${gameId}${mode ? ` (${mode} mode)` : ''}...` };
    }
    case 'send_agent_output': {
      const { subject, content } = args;
      const response = await apiClient.post(API_ENDPOINTS.MCP.AGENT_SEND_OUTPUT, { subject, content }, undefined, signal);
      signal?.throwIfAborted();
      if (!response.success) throw new Error(response.error?.message || 'Failed to send agent output email');
      return { success: true, message: 'Agent output sent via email' };
    }
    case 'list_available_tools': {
      const mcpToolResults = await mcpService.listTools();
      const mcpTools = mcpToolResults.flatMap(r => r.tools);
      const allTools = [...AI_TOOLS, ...mcpTools];
      return { 
        tools: allTools.map(t => ({ 
          name: t.name, 
          description: t.description || 'No description',
          type: AI_TOOLS.some(ai => ai.name === t.name) ? 'local' : 'mcp'
        }))
      };
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

  private detectToolIntent(message: string, availableTools: (AITool | MCPTool)[] = AI_TOOLS): { name: string; arguments: Record<string, any> } | null {
    const lower = message.toLowerCase();
    
    // Check for specific game launch requests FIRST (before general game queries)
    if (/(launch|start|open|play).*dino/.test(lower)) {
      return { name: 'launch_game', arguments: { gameId: 'dino' } };
    }
    if (/(launch|start|open|play).*pong/.test(lower)) {
      const mode = lower.includes('survival') ? 'survival' : 'classic';
      return { name: 'launch_game', arguments: { gameId: 'pong', mode } };
    }

    // Check for game queries - bored, want to play, games
    if (/(bored|game|play|fun|entertain|what.*game|show.*game)/.test(lower)) {
      return { name: 'get_game_list', arguments: {} };
    }
    
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
    
    // Check for "list tools" / "what tools" / "available tools" queries
    if (/(what tools|list tools|available tools|show tools|tools available)/.test(lower)) {
      return { name: 'list_available_tools', arguments: {} };
    }

    // Check for excalidraw/drawing related queries
    if (/(draw|diagram|sketch|excalidraw|whiteboard|chart|flowchart|mind.?map)/.test(lower)) {
      // First, check for create_from_mermaid for flowchart/mermaid/diagram requests
      if (/(flowchart|flow.?chart|diagram|mermaid)/.test(lower)) {
        for (const tool of availableTools) {
          if (tool.name === 'create_from_mermaid') {
            return { name: tool.name, arguments: { 
              mermaidDiagram: 'flowchart TD\n    A[Start] --> B[Process]\n    B --> C[Decision]\n    C -->|Yes| D[End]\n    C -->|No| B' 
            }};
          }
        }
      }
      
      // For general draw requests, find first matching excalidraw tool
      for (const tool of availableTools) {
        const toolName = tool.name.toLowerCase();
        const toolDesc = tool.description?.toLowerCase() || '';
        if (toolName.includes('excalidraw') || toolName.includes('draw') || toolName.includes('diagram') || toolDesc.includes('excalidraw') || toolDesc.includes('draw') || toolDesc.includes('diagram')) {
          // Skip create_from_mermaid for general draw (already handled above)
          if (toolName === 'create_from_mermaid') continue;
          return { name: tool.name, arguments: {} };
        }
      }
    }
    
    // Check for MCP tools by name matching (name or description)
    for (const tool of availableTools) {
      const keywords = tool.name.toLowerCase().split('_');
      const descKeywords = (tool.description || '').toLowerCase().split(/[\s_]+/);
      const allKeywords = [...keywords, ...descKeywords];
      if (allKeywords.some(k => k.length > 2 && lower.includes(k))) {
        return { name: tool.name, arguments: {} };
      }
    }
    
    return null;
  }

  async sendMessage(
    messages: ChatMessage[],
    enableTools: boolean = ENV.ENABLE_AI_TOOLS,
    signal?: AbortSignal
  ): Promise<ChatApiResponse> {
    signal?.throwIfAborted();
    messages = messages.slice(-CHAT_CONTEXT_LIMIT);
    const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';

    // Try local execution first (local tools + NIM proxy)
    const localResult = await this.tryLocalExecution(messages, enableTools, signal);
    if (localResult) {
      return localResult;
    }

    // Fallback to backend agent service if local execution fails or returns empty
    console.log('[ChatService] Local execution failed/empty, falling back to backend agent');
    return this.tryBackendAgent(messages, enableTools, signal);
  }

  private async tryLocalExecution(
    messages: ChatMessage[],
    enableTools: boolean,
    signal?: AbortSignal
  ): Promise<ChatApiResponse | null> {
    const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';
    try {
      // Fetch MCP tools if enabled
      let mcpTools: MCPTool[] = [];
      if (enableTools) {
        try {
          const mcpToolResults = await mcpService.listTools();
          mcpTools = mcpToolResults.flatMap(r => r.tools);
        } catch {
          // MCP tools unavailable, continue with local tools only
        }
      }

      // Check if any MCP tools would be needed
      const toolIntent = this.detectToolIntent(latestUserMessage, [...AI_TOOLS, ...mcpTools]);
      if (toolIntent) {
        const isMcpTool = mcpTools.some(t => t.name === toolIntent.name);
        if (isMcpTool) {
          // MCP tool detected - route to backend agent instead of local execution
          return null; // Trigger fallback to backend agent
        }
      }

      const allToolCalls: Array<{ name: string; arguments: Record<string, any> }> = [];
      let currentMessages = [...messages];

      // Local tool detection and execution (only for local tools)
      if (enableTools && toolIntent && !mcpTools.some(t => t.name === toolIntent.name)) {
        try {
          const result = await executeToolCall(toolIntent.name, toolIntent.arguments, signal);
          allToolCalls.push(toolIntent);
          
          // Add tool result as context for the model
          const toolResultMessage = `Tool "${toolIntent.name}" returned: ${JSON.stringify(result)}`;
          currentMessages.push({
            role: 'tool',
            content: toolResultMessage,
            toolCalls: [{ name: toolIntent.name, arguments: toolIntent.arguments, result }],
          });
        } catch (toolError: any) {
          signal?.throwIfAborted();
          allToolCalls.push(toolIntent);
          currentMessages.push({
            role: 'tool',
            content: `Tool "${toolIntent.name}" failed: ${toolError.message}`,
            toolCalls: [{ name: toolIntent.name, arguments: toolIntent.arguments, result: { error: toolError.message } }],
          });
        }
      }

      // Get final response from model with tool context
      const response = await this.requestCompletion(currentMessages, false, signal);
      
      // If we got a meaningful response with content, return it
      const responseText = response.responseText?.trim();
      if (responseText && responseText.length > 0) {
        return {
          message: responseText,
          toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        };
      }

      // Empty response, return null to trigger fallback
      return null;
    } catch (error: unknown) {
      console.error('[ChatService] Local execution error:', error);
      return null; // Trigger fallback
    }
  }

  private async tryBackendAgent(
    messages: ChatMessage[],
    enableTools: boolean,
    signal?: AbortSignal
  ): Promise<ChatApiResponse> {
    try {
      // Use backend agent which has full MCP tool access
      const result = await mcpService.sendAgentMessage(
        messages.map(m => ({ role: m.role, content: m.content })),
        { sendEmail: false } // Don't auto-send email, let user request it
      );
      
      return {
        message: result.message || "I'm sorry, I couldn't process that request.",
        toolCalls: result.toolCalls?.map(tc => ({ name: tc.name, arguments: tc.arguments })),
      };
    } catch (error: unknown) {
      console.error('[ChatService] Backend agent error:', error);
      
      // Final fallback to frontend reply
      const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';
      return {
        message: this.generateFrontendReply(latestUserMessage),
      };
    }
  }

  async sendMessage(
    messages: ChatMessage[],
    enableTools: boolean = ENV.ENABLE_AI_TOOLS,
    signal?: AbortSignal
  ): Promise<ChatApiResponse> {
    signal?.throwIfAborted();
    messages = messages.slice(-CHAT_CONTEXT_LIMIT);
    
    // Try local execution first, then fallback to backend agent
    const localResult = await this.tryLocalExecution(messages, enableTools, signal);
    if (localResult) {
      return localResult;
    }
    
    console.log('[ChatService] Local execution failed/empty, falling back to backend agent');
    return this.tryBackendAgent(messages, enableTools, signal);
  }

  private generateFrontendReply(userInput: string): string {
    const input = userInput.trim().toLowerCase();

    if (!input) {
      return "Hey! Ask me about Abhishek's skills, QA experience, projects, or how to contact him.";
    }

    if (/^(hi|hii|hello|hey|yo|namaste)\b/.test(input)) {
      return "Hey! I can help with Abhishek's QA experience, projects, skills, or contact details.";
    }

    if (/(bored|game|play|fun|entertain)/.test(input)) {
      let dinoHighScore = 0;
      let pongClassicHighScore = 0;
      let pongSurvivalHighScore = 0;
      try {
        dinoHighScore = Number(localStorage.getItem('guptaos_dino_highscore') || '0');
        pongClassicHighScore = Number(localStorage.getItem('guptaos_pong_classic_highscore') || '0');
        pongSurvivalHighScore = Number(localStorage.getItem('guptaos_pong_survival_highscore') || '0');
      } catch {
        // localStorage unavailable (privacy mode, etc.)
      }
      return `Bored? Let's play! 🎮 Available games:
• **Dino Run** - Endless runner, high score: ${dinoHighScore.toLocaleString()}
• **Pong vs AI** - Classic (First to 10) high: ${pongClassicHighScore}, Survival (60s) high: ${pongSurvivalHighScore}

Say "play dino" or "play pong" to launch, or open the Games app from the dock!`;
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
    _enableTools: boolean,
    signal?: AbortSignal
  ): Promise<{ responseText: string; toolCalls: Array<{ name: string; arguments: Record<string, any> }> }> {
    signal?.throwIfAborted();
    const response = await apiClient.post<{ choices: Array<{ message: { content: string } }> }>(
      API_ENDPOINTS.CHAT.MESSAGE,
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
      undefined,
      signal
    );
    signal?.throwIfAborted();

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get completion');
    }

    const assistantMessage = response.data.choices?.[0]?.message;
    const responseText = String(assistantMessage?.content || '').trim();

    return { responseText, toolCalls: [] };
  }

  private buildNimMessages(messages: ChatMessage[]): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }> {
    const recent: ChatMessage[] = [];
    let remaining = 60000 - SYSTEM_INSTRUCTION.length;
    for (const message of messages.slice(-CHAT_CONTEXT_LIMIT).reverse()) {
      const content = message.content.slice(0, CHAT_INPUT_LIMIT);
      if (content.length > remaining) break;
      recent.unshift({ ...message, content });
      remaining -= content.length;
    }
    return [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...recent.map(message => {
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
