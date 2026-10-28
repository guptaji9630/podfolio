import axios from 'axios';
import { ENV } from '../config/env.js';
export interface AgentMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }
export async function complete(messages: AgentMessage[], signal?: AbortSignal): Promise<string> {
  const response = await axios.post(`${ENV.NVIDIA_NIM_API_URL}/chat/completions`, {
    model: ENV.NVIDIA_NIM_MODEL, messages, max_tokens: 512, temperature: 0.7, stream: false,
  }, { headers: { Authorization: `Bearer ${ENV.NVIDIA_NIM_API_KEY}` }, signal, timeout: 20000, maxContentLength: 1024 * 1024 });
  const content = response.data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI provider returned an empty response.');
  return content.trim();
}
export async function embedQuestion(text: string, signal?: AbortSignal): Promise<number[]> {
  const response = await axios.post(`${ENV.NVIDIA_NIM_API_URL}/embeddings`, {
    model: ENV.NVIDIA_EMBEDDING_MODEL, input: [text], input_type: 'query', encoding_format: 'float', truncate: 'END',
  }, { headers: { Authorization: `Bearer ${ENV.NVIDIA_NIM_API_KEY}` }, signal, timeout: 2500, maxContentLength: 128 * 1024 });
  return response.data?.data?.[0]?.embedding;
}
