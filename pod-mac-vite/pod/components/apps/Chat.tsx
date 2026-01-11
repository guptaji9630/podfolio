
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm Abhishek's AI assistant. Ask me anything about Abhishek's skills, experience, or projects!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `You are Abhishek’s personal AI assistant.
Abhishek is a fresher in Software Development and Testing, starting his professional journey in 2025. He specializes in the MERN stack, React Native, and modern web development. He has hands-on experience with testing frameworks like Playwright and is actively learning Generative AI and Agentic AI systems.

He is based in Delhi, India.
He is curious, fast-learning, and career-driven — always open to exploring new technologies and best practices.

Be helpful, practical, and slightly witty.
Keep responses concise like a chat message — no unnecessary lectures, just clear, actionable guidance.`,
        },
      });

      const reply = response.text || "I'm sorry, I'm having a bit of trouble connecting right now.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not reach the AI core. Check your connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
