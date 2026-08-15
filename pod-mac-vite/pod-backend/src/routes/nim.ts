import { Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env.js';

const router = Router();

const NIM_BASE_URL = ENV.NVIDIA_NIM_API_URL;
const NIM_API_KEY = ENV.NVIDIA_NIM_API_KEY;

router.post('/chat/completions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model, messages, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, stream } = req.body;

    const response = await axios.post(
      `${NIM_BASE_URL}/chat/completions`,
      {
        model: model || ENV.NVIDIA_NIM_MODEL,
        messages,
        max_tokens: max_tokens || 512,
        temperature: temperature ?? 1,
        top_p: top_p ?? 1,
        frequency_penalty: frequency_penalty ?? 0,
        presence_penalty: presence_penalty ?? 0,
        stream: stream ?? false,
      },
      {
        headers: {
          'Authorization': `Bearer ${NIM_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        responseType: 'json',
        timeout: 60000,
      }
    );

    res.json(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status || 500;
      const message = (axiosError.response?.data as { error?: { message?: string } })?.error?.message || axiosError.message;
      console.error('NIM API Error:', status, message);
      return res.status(status).json({ error: { message } });
    }
    next(error);
  }
});

export default router;