import axios from 'axios';
import { logEvent, traceOperation, failureDetails } from '../utils/logger.js';
import { ENV } from '../config/env.js';
import { ServiceError } from '../utils/serviceError.js';
export interface AgentMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }
async function completeRequest(messages: AgentMessage[], signal?: AbortSignal): Promise<string> {
  const response = await axios.post(`${ENV.NVIDIA_NIM_API_URL}/chat/completions`, {
    model: ENV.NVIDIA_NIM_MODEL, messages, max_tokens: 2048, temperature: 0.7, stream: false,
  }, { headers: { Authorization: `Bearer ${ENV.NVIDIA_NIM_API_KEY}` }, signal, timeout: 20000, maxContentLength: 1024 * 1024 }).catch(error => {
    logEvent('llm.upstream_failed', failureDetails(error));
    signal?.throwIfAborted();
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 429 || status === 503) throw new ServiceError('LLM_BUSY', 'The AI provider is busy. Please try your request again shortly.', 503);
    throw new ServiceError('LLM_UNAVAILABLE', 'The AI provider is unavailable. Please try again shortly.');
  });
  const choice = response.data?.choices?.[0];
  logEvent('llm.response', { finishReason: ['stop', 'length', 'tool_calls', 'content_filter'].includes(choice?.finish_reason) ? choice.finish_reason : 'other', completionTokens: typeof response.data?.usage?.completion_tokens === 'number' ? response.data.usage.completion_tokens : undefined });
  const content = choice?.message?.content;
  if (choice?.finish_reason === 'length') throw new ServiceError('LLM_RESPONSE_TRUNCATED', 'The AI provider reached its response limit before finishing. Please try a simpler request.');
  if (typeof content !== 'string' || !content.trim()) throw new ServiceError('LLM_EMPTY_RESPONSE', 'The AI provider returned no answer. Please try again.');
  return content.trim();
}
async function embedRequest(text: string, signal?: AbortSignal): Promise<number[]> {
  const response = await axios.post(`${ENV.NVIDIA_NIM_API_URL}/embeddings`, {
    model: ENV.NVIDIA_EMBEDDING_MODEL, input: [text], input_type: 'query', encoding_format: 'float', truncate: 'END',
  }, { headers: { Authorization: `Bearer ${ENV.NVIDIA_NIM_API_KEY}` }, signal, timeout: 2500, maxContentLength: 128 * 1024 });
  return response.data?.data?.[0]?.embedding;
}

export function complete(messages: AgentMessage[], signal?: AbortSignal): Promise<string> {
  return traceOperation('llm.completion', () => completeRequest(messages, signal));
}
export function embedQuestion(text: string, signal?: AbortSignal): Promise<number[]> {
  return traceOperation('llm.embedding', () => embedRequest(text, signal));
}
