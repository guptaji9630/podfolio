import React from 'react';
import { useChat } from '../../src/hooks/useChat';
import { formatRelativeTime } from '../../src/utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from '../../src/types/motion';

const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springNormal },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }
};

const typingVariants = {
  animate: { opacity: [0.4, 1, 0.4] }
};

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-white/10 bg-black/20"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <span className="text-xs md:text-sm text-white/70">AI Assistant Online</span>
        </div>
        <motion.button
          onClick={clearHistory}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          className="text-[11px] md:text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">delete</span>
          <span className="hidden sm:inline">Clear</span>
        </motion.button>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4"
        ref={scrollRef}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div
                className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                {m.timestamp && (
                  <div className="text-[9px] md:text-[10px] text-white/30 mt-1">
                    {formatRelativeTime(m.timestamp)}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div className="flex justify-start">
            <div className="bg-white/10 px-3 md:px-4 py-2 md:py-2.5 rounded-2xl rounded-tl-none border border-white/5">
              <motion.div
                className="flex gap-1"
                variants={typingVariants}
              >
                <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-white/40 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-3 md:p-4 border-t border-white/10 bg-black/20"
      >
        <div className="flex gap-2">
          <motion.input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isTyping}
            whileFocus={{ boxShadow: '0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 md:px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 md:w-9 md:h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-all shrink-0"
          >
            <motion.span
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="material-symbols-outlined text-[18px] md:text-[20px]"
            >
              send
            </motion.span>
          </motion.button>
        </div>
        <div className="text-[9px] md:text-[10px] text-white/30 mt-2 text-center">
          AI can make mistakes. Verify important information.
        </div>
      </motion.div>
    </div>
  );
};
