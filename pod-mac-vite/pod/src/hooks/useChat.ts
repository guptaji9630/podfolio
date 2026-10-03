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
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage([...messages, userMessage], true, controller.signal);
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
      };
      setMessages(prev => [...prev, assistantMessage].slice(-CHAT_HISTORY_LIMIT));
    } catch (error) {
      if (!controller.signal.aborted) console.error('Chat request failed:', error);
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
    setMessages([INITIAL_MESSAGE]);
    storage.remove(KEYS.CHAT_HISTORY);
  }, []);

  return {
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    clearHistory,
    scrollRef,
  };
};
