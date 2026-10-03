import { API_CONFIG } from '../config/api.config';
import { ApiError, ApiResponse } from '../types';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
    const path = base.endsWith('/api') ? endpoint.replace(/^\/api(?=\/|$)/, '') : endpoint;
    const callerSignal = options.signal;

    for (let attempt = 0; ; attempt++) {
      const controller = new AbortController();
      const abort = () => controller.abort();
      callerSignal?.addEventListener('abort', abort, { once: true });
      if (callerSignal?.aborted) controller.abort();
      const timeoutId = setTimeout(abort, API_CONFIG.TIMEOUT);
      let failure: ApiError & { name?: string };
      try {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
        const response = await fetch(`${base}${path}`, {
          ...options,
          headers: { ...API_CONFIG.HEADERS, ...options.headers },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw { message: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
        }
        // Keep the timeout active while consuming the body too.
        const data = await response.json();
        if (callerSignal?.aborted) return this.cancelled<T>();
        return { success: true, data };
      } catch (error: unknown) {
        failure = error as ApiError & { name?: string };
      } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener('abort', abort);
      }

      if (callerSignal?.aborted) return this.cancelled<T>();
      const retryable = failure.name === 'AbortError' ||
        failure.message?.includes('fetch') ||
        (failure.status >= 500 && failure.status < 600);
      // Retrying writes can duplicate emails or other side effects.
      if (options.method !== 'GET' || attempt >= API_CONFIG.RETRY_ATTEMPTS || !retryable) {
        return { success: false, error: { message: failure.message || 'Network error occurred', code: failure.code, status: failure.status } };
      }
      if (!await this.delay(API_CONFIG.RETRY_DELAY * (attempt + 1), callerSignal)) {
        return this.cancelled<T>();
      }
    }
  }

  private cancelled<T>(): ApiResponse<T> {
    return { success: false, error: { message: 'Request cancelled', code: 'ABORTED' } };
  }

  private delay(ms: number, signal?: AbortSignal | null): Promise<boolean> {
    if (signal?.aborted) return Promise.resolve(false);
    return new Promise(resolve => {
      const finish = (completed: boolean) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        resolve(completed);
      };
      const abort = () => finish(false);
      const timer = setTimeout(() => finish(true), ms);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  async get<T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers, signal });
  }

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', headers, signal, body: JSON.stringify(body) });
  }

  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', headers, signal, body: JSON.stringify(body) });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers, signal });
  }
}

export const apiClient = new ApiClient();
