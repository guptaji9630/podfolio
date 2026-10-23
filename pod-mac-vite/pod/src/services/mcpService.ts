import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { MCPTool, MCPConnectionConfig, MCPToolResult } from '../types/mcp.types';

export class MCPService {
  async getConnections(): Promise<MCPConnectionConfig[]> {
    const response = await apiClient.get<MCPConnectionConfig[]>(API_ENDPOINTS.MCP.CONNECTIONS);
    return response.data || [];
  }

  async addConnection(config: MCPConnectionConfig): Promise<void> {
    await apiClient.post(API_ENDPOINTS.MCP.CONNECTIONS, config);
  }

  async connect(connectionId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.MCP.CONNECT(connectionId));
  }

  async disconnect(connectionId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.MCP.DISCONNECT(connectionId));
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.MCP.CONNECTION(connectionId));
  }

  async listTools(): Promise<{ serverId: string; tools: MCPTool[] }[]> {
    const response = await apiClient.get<{ serverId: string; tools: MCPTool[] }[]>(API_ENDPOINTS.MCP.TOOLS);
    return response.data || [];
  }

  async callTool(serverId: string, name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    const response = await apiClient.post<MCPToolResult>(API_ENDPOINTS.MCP.CALL_TOOL, { serverId, name, arguments: args });
    if (!response.success || !response.data) throw new Error(response.error?.message || 'Tool call failed');
    return response.data;
  }

  async sendAgentMessage(messages: Array<{ role: string; content: string }>, options?: { sendEmail?: boolean; emailTo?: string; conversationId?: string }): Promise<{ message: string; toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }> }> {
    const response = await apiClient.post<{ message: string; toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }> }>(API_ENDPOINTS.MCP.AGENT_CHAT, { messages, ...options });
    if (!response.success || !response.data) throw new Error(response.error?.message || 'Agent chat failed');
    return response.data;
  }
}

export const mcpService = new MCPService();