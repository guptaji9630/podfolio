import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { chatService } from '../services/chatService';
import { toolExecutor } from '../services/toolExecutor';
import { storage, KEYS } from '../utils/storage';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm Abhishek's AI assistant. Ask me anything about Abhishek's skills, experience, or projects!",
  timestamp: new Date(),
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from storage
  useEffect(() => {
    const savedMessages = storage.get<ChatMessage[]>(KEYS.CHAT_HISTORY);
    if (savedMessages && savedMessages.length > 0) {
      // Convert timestamp strings back to Date objects
      const messagesWithDates = savedMessages.map(msg => ({
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
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setInput('');
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const response = await chatService.sendMessage([...messages, userMessage], true);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      toolCalls: response.toolCalls,
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Execute tool calls if present
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResultMessages: ChatMessage[] = [];
      
      for (const toolCall of response.toolCalls) {
        const toolResult = await toolExecutor.execute(toolCall);
        
        // Collect tool result message
        toolResultMessages.push({
          role: 'assistant',
          content: toolResult.success 
            ? toolResult.message || 'Action completed successfully'
            : `Error: ${toolResult.error || 'Action failed'}`,
          timestamp: new Date(),
        });
      }
      
      // Add all tool result messages at once
      setMessages(prev => [...prev, ...toolResultMessages]);
    }

    setIsTyping(false);
  }, [input, isTyping, messages]);

  const clearHistory = useCallback(() => {
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
