import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { storage, KEYS } from '../utils/storage';
import { CHAT_HISTORY_LIMIT, CHAT_INPUT_LIMIT } from '../config/chat';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm Abhishek's AI assistant. Ask me anything about Abhishek's skills, experience, or projects!",
  timestamp: new Date(),
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInputValue] = useState('');
  const setInput = useCallback((value: string) => {
    setInputValue(value.slice(0, CHAT_INPUT_LIMIT));
  }, []);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState(() => {
    const stored = storage.get<string>(KEYS.CHAT_CONVERSATION_ID);
    return typeof stored === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored) ? stored : crypto.randomUUID();
  });
  const conversationRef = useRef(conversationId);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage
  useEffect(() => {
    const savedMessages = storage.get<ChatMessage[]>(KEYS.CHAT_HISTORY);
    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      // Convert timestamp strings back to Date objects
      const messagesWithDates = savedMessages.filter(msg => msg && typeof msg.content === 'string' && ['user', 'assistant'].includes(msg.role)).slice(-CHAT_HISTORY_LIMIT).map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
      }));
      setMessages(messagesWithDates);
    }
  }, []);

  // Save chat history to storage
  useEffect(() => {
    if (messages.length > 1) {
      storage.set(KEYS.CHAT_HISTORY, messages);
      storage.set(KEYS.CHAT_CONVERSATION_ID, conversationRef.current);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim().slice(0, CHAT_INPUT_LIMIT),
      timestamp: new Date(),
    };

    setInput('');
    setMessages(prev => [...prev, userMessage].slice(-CHAT_HISTORY_LIMIT));
    setError('');
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage([...messages, userMessage], true, controller.signal, conversationRef.current);
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        canvasUrl: response.canvasUrl,
        downloadUrl: response.downloadUrl,
        cached: response.cached,
        source: response.source,
      };
      setMessages(prev => [...prev, assistantMessage].slice(-CHAT_HISTORY_LIMIT));
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Chat request failed. Please retry.');
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsTyping(false);
      }
    }
  }, [input, isTyping, messages]);

  const clearHistory = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setIsTyping(false);
    conversationRef.current = crypto.randomUUID();
    setError('');
    setMessages([INITIAL_MESSAGE]);
    storage.remove(KEYS.CHAT_HISTORY);
    storage.remove(KEYS.CHAT_CONVERSATION_ID);
  }, []);

  return {
    messages,
    error,
    input,
    setInput,
    isTyping,
    sendMessage,
    clearHistory,
    scrollRef,
  };
};
