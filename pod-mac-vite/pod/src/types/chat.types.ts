export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: Date;
  canvasUrl?: string;
  downloadUrl?: string;
  cached?: boolean;
  source?: 'cache' | 'llm' | 'mcp' | 'local';
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface ChatApiRequest {
  messages: ChatMessage[];
  tools?: boolean;
  conversationId?: string;
}

export interface ChatApiResponse {
  message: string;
  toolCalls?: ToolCall[];
  conversationId?: string;
  error?: string;
  canvasUrl?: string;
  downloadUrl?: string;
  cached?: boolean;
  source?: 'cache' | 'llm' | 'mcp' | 'local';
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
}
