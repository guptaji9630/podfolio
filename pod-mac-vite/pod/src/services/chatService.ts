import { ENV } from '../config/env.config';
import type { ChatMessage, ChatApiResponse } from '../types';
import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { CHAT_CONTEXT_LIMIT, CHAT_INPUT_LIMIT } from '../config/chat';

export class ChatService {
  async sendMessage(messages: ChatMessage[], enableTools = ENV.ENABLE_AI_TOOLS, signal?: AbortSignal, conversationId?: string): Promise<ChatApiResponse> {
    signal?.throwIfAborted();
    let remaining = 54000;
    const recent: Array<{ role: ChatMessage['role']; content: string }> = [];
    for (const message of messages.slice(-CHAT_CONTEXT_LIMIT).reverse()) {
      const content = message.content.slice(0, CHAT_INPUT_LIMIT);
      if (content.length > remaining) break;
      recent.unshift({ role: message.role, content }); remaining -= content.length;
    }
    const response = await apiClient.post<{ success: boolean; data: ChatApiResponse }>(API_ENDPOINTS.CHAT.MESSAGE,
      { messages: recent, options: { useTools: enableTools, useCache: true, conversationId, stream: false } }, undefined, signal);
    signal?.throwIfAborted();
    if (!response.success || !response.data?.success || !response.data.data) {
      throw new Error(response.error?.message || 'The assistant is unavailable. Please try again.');
    }
    const result = response.data.data;
    for (const call of result.toolCalls ?? []) {
      signal?.throwIfAborted();
      if (call.name === 'launch_game' && call.result?.success && ['dino', 'pong'].includes(call.arguments.gameId) &&
          (!call.arguments.mode || ['classic', 'survival'].includes(call.arguments.mode))) {
        window.parent.postMessage({ type: 'LAUNCH_GAME', payload: call.arguments }, window.location.origin);
      }
      if (call.name === 'get_game_list') {
        try {
          result.message += `\nHigh scores — Dino: ${Number(localStorage.getItem('guptaos_dino_highscore') || 0)}, Pong classic: ${Number(localStorage.getItem('guptaos_pong_classic_highscore') || 0)}, survival: ${Number(localStorage.getItem('guptaos_pong_survival_highscore') || 0)}.`;
        } catch { /* Storage is optional. */ }
      }
    }
    return result;
  }
}
export const chatService = new ChatService();
