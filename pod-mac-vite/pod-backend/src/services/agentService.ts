import { randomUUID } from 'node:crypto';
import { ENV } from '../config/env.js';
import { SYSTEM_INSTRUCTION } from '../config/assistant.js';
import { PROJECTS } from '../config/constants.js';
import { SemanticCacheService } from './semanticCache.js';
import { complete, embedQuestion, type AgentMessage } from './nimClient.js';
import { deduplicateRequest, generateRequestKey } from '../utils/requestDeduplication.js';
import { mcpToolRegistry } from './mcpToolRegistry.js';
import { emailService } from './emailService.js';
import { ServiceError } from '../utils/serviceError.js';
import { isDiagramRequest, extractMermaid } from './diagramIntent.js';
export type { AgentMessage } from './nimClient.js';
export interface AgentResponse {
  message: string; cached: boolean; source: 'llm' | 'cache' | 'local' | 'mcp';
  conversationId?: string; canvasUrl?: string; downloadUrl?: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }>;
}
export interface ChatOptions { useCache?: boolean; useTools?: boolean; conversationId?: string }
export const localTools = [
  { name: 'get_project_details', description: 'Find portfolio projects', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } },
  { name: 'get_availability', description: 'Availability for work', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_game_list', description: 'List portfolio games', inputSchema: { type: 'object', properties: {} } },
  { name: 'launch_game', description: 'Open Dino or Pong in the portfolio', inputSchema: { type: 'object', properties: { gameId: { enum: ['dino', 'pong'] } }, required: ['gameId'] } },
  { name: 'send_agent_output', description: 'Email conversation to portfolio owner, only on explicit request', inputSchema: { type: 'object', properties: {} } },
];
export function isEmailRequest(text: string) {
  return /^(?:(?:please|can you|could you|would you|will you)\s+)*(?:send|email|mail|forward)\b/i.test(text.trim()) &&
    /\b(email|mail|conversation|output|transcript|message|response)\b/i.test(text) &&
    !/\b(don't|do not|never|not|without|how|why|what|if|example|no)\b/i.test(text);
}
export class AgentService {
  readonly cache: SemanticCacheService;
  constructor(private readonly dependencies = { complete, embed: embedQuestion, registry: mcpToolRegistry, email: emailService }) {
    this.cache = new SemanticCacheService({ embed: dependencies.embed });
  }
  async processMessage(messages: AgentMessage[], options: ChatOptions = {}, signal?: AbortSignal): Promise<AgentResponse> {
    signal?.throwIfAborted();
    const question = messages.at(-1)!.content.trim();
    const lower = question.toLowerCase();
    const conversationId = options.conversationId ?? randomUUID();
    const local = (name: string, args: Record<string, unknown>, result: unknown, message: string): AgentResponse => ({
      message, toolCalls: [{ name, arguments: args, result }], cached: false, source: 'local', conversationId,
    });
    if (options.useTools !== false) {
      if (/\b(list|show|available)\b.*\btools\b|\bwhat tools\b/.test(lower)) {
        const servers = await this.dependencies.registry.tools(conversationId, signal);
        const tools = [...localTools, ...servers.flatMap(s => s.tools)];
        return local('list_tools', {}, { localTools, servers }, `Available tools: ${tools.map(t => t.name).join(', ')}.${servers.some(s => s.status !== 'connected') ? ' Excalidraw is unavailable; start its service on port 3001.' : ''}`);
      }
      if (isEmailRequest(question)) {
        const addresses = question.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
        if (addresses.some(address => address.toLowerCase() !== ENV.RECIPIENT_EMAIL.toLowerCase())) return local('send_agent_output', {}, { success: false }, 'I can send portfolio conversations only to Abhishek.');
        signal?.throwIfAborted();
        const content = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n');
        const result = await this.dependencies.email.sendAgentOutput({ subject: 'Portfolio AI conversation', content });
        if (!result.success) throw new Error('Email delivery failed. Please try again later.');
        return local('send_agent_output', {}, result, 'The conversation was emailed to Abhishek.');
      }
      const drawingRequested = !/\b(don't|do not|never|without|how to|how do|how can)\b/.test(lower);
      let tool: { name: string; arguments: Record<string, unknown> } | undefined;
      if (drawingRequested && /\b(export|download)\b.*\b(canvas|drawing|diagram|image)\b/.test(lower)) tool = { name: 'export_to_image', arguments: { format: 'svg' } };
      else if (isDiagramRequest(question)) {
        let mermaid = extractMermaid(question);
        if (!mermaid && !/^(?:please\s+)?(?:draw|create|make|generate)\s+(?:a\s+)?(?:simple\s+)?(?:mermaid\s+)?flowchart[.!]?$/i.test(question)) {
          const generated = await this.dependencies.complete([
            { role: 'system', content: 'Return only a basic Mermaid flowchart beginning with flowchart TD or flowchart LR. Use at most 8 nodes with simple ASCII IDs and labels in [rectangle], (ellipse), or {diamond}. Use only --> arrows, with no edge labels, subgraphs, styling, or comments. Represent the user request faithfully. No prose.' },
            ...messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8),
          ], signal);
          mermaid = extractMermaid(generated);
          if (!mermaid || mermaid.length > 10000) throw new ServiceError('DIAGRAM_GENERATION_FAILED', 'The model could not generate a supported flowchart. Try describing the steps and connections, or paste a basic Mermaid flowchart.');
        }
        tool = { name: 'create_from_mermaid', arguments: { mermaidDiagram: mermaid ?? 'flowchart TD; A[Start] --> B[Process]; B --> C[End]' } };
      } else if (drawingRequested && /\b(draw|create|add|make)\b.*\b(rectangle|square|circle|ellipse|diamond)\b/.test(lower)) {
        const shape = lower.match(/\b(rectangle|square|circle|ellipse|diamond)\b/)![1];
        tool = { name: 'create_element', arguments: { type: /circle|ellipse/.test(shape) ? 'ellipse' : shape === 'diamond' ? 'diamond' : 'rectangle', x: 100, y: 100, width: 180, height: 100 } };
      }
      if (tool) {
        const result = await this.dependencies.registry.call('excalidraw', tool.name, tool.arguments, conversationId, signal);
        return { message: tool.name === 'export_to_image' ? 'Your SVG image is ready to download.' : 'Your drawing is ready. Open the canvas to edit it.',
          toolCalls: [{ ...tool, result }], canvasUrl: `${ENV.FRONTEND_URL}/mcp/canvas?canvasId=${conversationId}`,
          ...(tool.name === 'export_to_image' ? { downloadUrl: `/api/mcp/canvas/${conversationId}/export.svg` } : {}),
          cached: false, source: 'mcp', conversationId };
      }
      if (/\b(launch|start|open|play)\b.*\b(dino|pong)\b/.test(lower)) {
        const gameId = lower.includes('dino') ? 'dino' : 'pong'; const mode = lower.includes('survival') ? 'survival' : 'classic';
        return local('launch_game', { gameId, ...(gameId === 'pong' ? { mode } : {}) }, { success: true }, `Launching ${gameId}.`);
      }
      if (/\b(games?|bored)\b/.test(lower)) return local('get_game_list', {}, { games: ['dino', 'pong'] }, 'Play Dino Run or Pong vs AI. Say “play dino” or “play pong survival” to launch.');
      if (/\b(projects?|fitforge|agmatix)\b/.test(lower)) {
        const words = lower.split(/\W+/).filter(w => w.length > 3 && !['what','about','tell','show','projects','project','abhishek'].includes(w));
        const matched = PROJECTS.filter(p => words.some(w => `${p.name} ${p.category} ${p.techStack?.join(' ') ?? ''}`.toLowerCase().includes(w)));
        const projects = matched.length ? matched : PROJECTS;
        return local('get_project_details', { query: question }, { projects }, projects.map(p => `${p.name}: ${p.description}`).join('\n\n'));
      }
      if (/\b(availability|available|open to work)\b/.test(lower)) return local('get_availability', {}, { available: true }, 'Abhishek is open to QA/testing roles, freelance projects and consultations.');
    }
    const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'tool' ? 'user' as const : m.role, content: m.content }));
    const modelMessages: AgentMessage[] = [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...history];
    const scope = generateRequestKey({ model: ENV.NVIDIA_NIM_MODEL, prompt: SYSTEM_INSTRUCTION, history: history.slice(0, -1), conversationId: options.conversationId });
    const generate = async (sharedSignal: AbortSignal): Promise<AgentResponse> => {
      if (options.useCache !== false) {
        const answer = await this.cache.get(question, scope, sharedSignal);
        if (answer !== null) return { message: answer, cached: true, source: 'cache' };
      }
      const answer = await this.dependencies.complete(modelMessages, sharedSignal);
      sharedSignal.throwIfAborted();
      if (options.useCache !== false) await this.cache.set(question, answer, scope, sharedSignal);
      return { message: answer, cached: false, source: 'llm' };
    };
    const result = options.useCache === false ? await generate(signal ?? new AbortController().signal)
      : await deduplicateRequest(generateRequestKey({ scope, question }), generate, signal);
    return { ...result, conversationId };
  }
}
export const agentService = new AgentService();
