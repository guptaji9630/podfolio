export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
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
