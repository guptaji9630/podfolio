import React from 'react';
import { useChat } from '../../src/hooks/useChat';
import { formatRelativeTime } from '../../src/utils/formatters';

export const Chat: React.FC = () => {
  const { messages, input, setInput, isTyping, sendMessage, clearHistory, scrollRef } = useChat();

  const handleSend = () => {
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-white/70">AI Assistant Online</span>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-1">🛠️ Tool used:</div>
                  {m.toolCalls.map((tool, idx) => (
                    <div key={idx} className="text-xs text-blue-300 font-mono">
                      {tool.name}()
                    </div>
                  ))}
                </div>
              )}
              {m.timestamp && (
                <div className="text-[10px] text-white/30 mt-1">
                  {formatRelativeTime(m.timestamp)}
                </div>
              )}
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

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isTyping}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <div className="text-[10px] text-white/30 mt-2 text-center">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
};
