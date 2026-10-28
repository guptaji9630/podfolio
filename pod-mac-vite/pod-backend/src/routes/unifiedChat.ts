import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { validateChat } from '../middleware/chatValidation.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import { agentService, isEmailRequest } from '../services/agentService.js';
import { SYSTEM_INSTRUCTION } from '../config/assistant.js';
import { ServiceError } from '../utils/serviceError.js';
import type { AgentMessage } from '../services/nimClient.js';

export const chatOptionsSchema = z.object({
  useCache: z.boolean().optional(), useTools: z.boolean().optional(), stream: z.literal(false).optional(),
  conversationId: z.string().uuid().optional(),
}).strict();
const validateOptions: RequestHandler = (req, res, next) => {
  const result = chatOptionsSchema.safeParse(req.body.options ?? {});
  if (!result.success || req.body.messages.at(-1)?.role !== 'user' || req.body.messages.reduce((n: number, m: AgentMessage) => n + m.content.length, SYSTEM_INSTRUCTION.length) > 60000) {
    return res.status(400).json({ success: false, error: { message: 'Invalid chat options or missing final user message.' } });
  }
  req.body.options = result.data;
  next();
};
const emailLimit: RequestHandler = (req, res, next) => {
  if (req.body.options.useTools !== false && isEmailRequest(req.body.messages.at(-1).content)) return contactLimiter(req, res, next);
  next();
};
export const handleChat: RequestHandler = async (req, res) => {
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(new Error('Chat deadline exceeded')), 27000);
  const abort = () => { if (!res.writableEnded) controller.abort(); };
  res.once('close', abort); req.once('aborted', abort);
  if (req.aborted || res.destroyed) controller.abort();
  try {
    const data = await agentService.processMessage(req.body.messages as AgentMessage[], req.body.options, controller.signal);
    if (!res.destroyed && !controller.signal.aborted) res.json({ success: true, data });
  } catch (error) {
    if (!res.destroyed && !req.aborted) {
      const timeout = controller.signal.aborted;
      const known = error instanceof ServiceError ? error : undefined;
      res.status(timeout ? 504 : known?.status ?? 502).json({
        success: false,
        error: {
          code: timeout ? 'CHAT_TIMEOUT' : known?.code ?? 'CHAT_SERVICE_UNAVAILABLE',
          message: timeout ? 'The request timed out. Please try again.' : known?.message ?? 'Chat or tool service is unavailable. Please try again.',
        },
      });
    }
  } finally { clearTimeout(deadline); res.off('close', abort); req.off('aborted', abort); }
};
export const chatMiddleware = [validateChat, validateOptions, emailLimit, handleChat];
const router = Router();
router.post('/', ...chatMiddleware);
export default router;
