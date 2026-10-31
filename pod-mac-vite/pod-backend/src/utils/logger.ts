import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { RequestHandler } from 'express';
import axios from 'axios';
import { ServiceError } from './serviceError.js';

const context = new AsyncLocalStorage<{ requestId: string }>();
type Details = { operation?: string; method?: string; route?: string; status?: number; durationMs?: number; code?: string; finishReason?: string; completionTokens?: number; source?: string };
export function logEvent(event: string, details: Details = {}) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, requestId: context.getStore()?.requestId, ...details }));
}
export function failureDetails(error: unknown): Details {
  if (error instanceof ServiceError) return { code: error.code, status: error.status };
  if (axios.isAxiosError(error)) return { code: error.code?.match(/^[A-Z_0-9]+$/)?.[0] ?? 'UPSTREAM_ERROR', status: error.response?.status };
  return { code: error instanceof Error && error.name === 'AbortError' ? 'CANCELLED' : 'OPERATION_FAILED' };
}
export async function traceOperation<T>(operation: string, run: () => Promise<T>): Promise<T> {
  const start = performance.now();
  logEvent('operation.started', { operation });
  try {
    const result = await run();
    logEvent('operation.completed', { operation, durationMs: Math.round(performance.now() - start) });
    return result;
  } catch (error) {
    logEvent('operation.failed', { operation, durationMs: Math.round(performance.now() - start), ...failureDetails(error) });
    throw error;
  }
}
export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  context.run({ requestId }, () => {
    const start = performance.now();
    res.setHeader('X-Request-ID', requestId);
    logEvent('request.started', { method: req.method });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      res.off('finish', finish); res.off('close', finish);
      context.run({ requestId }, () => logEvent(res.writableFinished ? (res.statusCode >= 400 ? 'request.failed' : 'request.completed') : 'request.aborted', {
        method: req.method, route: typeof req.route?.path === 'string' ? req.route.path : 'unmatched',
        status: res.writableFinished ? res.statusCode : undefined, durationMs: Math.round(performance.now() - start),
      }));
    };
    res.once('finish', finish); res.once('close', finish);
    next();
  });
};
