import type { RequestHandler } from 'express';

const ROLES = new Set(['system', 'user', 'assistant', 'tool']);

export const validateChat: RequestHandler = (req, res, next) => {
  const body = req.body;
  const reject = (message: string) => res.status(400).json({ error: { message } });
  if (!body || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 21) {
    return reject('Provide between 1 and 21 messages.');
  }
  let total = 0;
  for (const message of body.messages) {
    if (!message || !ROLES.has(message.role) || typeof message.content !== 'string' ||
        !message.content.trim() || message.content.length > 12000) {
      return reject('Each message needs a valid role and 1–12000 characters of content.');
    }
    total += message.content.length;
    if (message.tool_call_id !== undefined &&
        (typeof message.tool_call_id !== 'string' || message.tool_call_id.length > 200)) {
      return reject('Invalid tool call identifier.');
    }
  }
  if (total > 60000) return reject('Conversation exceeds 60000 characters.');
  if (body.max_tokens !== undefined && (!Number.isInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 2048)) {
    return reject('max_tokens must be an integer between 1 and 2048.');
  }
  if (body.stream !== undefined && body.stream !== false) return reject('Only non-streaming requests are supported.');
  if (body.model !== undefined && (typeof body.model !== 'string' || !body.model.trim() || body.model.length > 200)) {
    return reject('Invalid model.');
  }
  for (const [field, min, max] of [
    ['temperature', 0, 2], ['top_p', 0, 1], ['frequency_penalty', -2, 2], ['presence_penalty', -2, 2],
  ] as const) {
    const value = body[field];
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) {
      return reject(`Invalid ${field}.`);
    }
  }
  next();
};
