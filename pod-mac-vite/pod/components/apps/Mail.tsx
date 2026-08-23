import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMailComposer } from '../../src/hooks/useMailComposer';
import { transitions } from '../../src/types/motion';

const messageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.springNormal },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } }
};

const toastVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springFast },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }
};

export const Mail: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'composer'>(
    window.innerWidth < 1024 ? 'list' : 'composer'
  );
  const { formState, updateField, sendEmail, reset } = useMailComposer();

  // Show success notification
  useEffect(() => {
    if (formState.success) {
      setTimeout(() => reset(), 3000);
    }
  }, [formState.success, reset]);

  const handleSend = async () => {
    if (formState.isSubmitting) return;
    await sendEmail();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 overflow-hidden"
    >
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-12 md:w-56 bg-black/20 border-r border-white/5 flex flex-col pt-4 shrink-0"
      >
        <motion.nav
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-0.5 px-1 md:px-2"
        >
          <motion.button
            variants={messageVariants}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-2 md:px-3 py-1.5 rounded-md bg-primary text-white w-full"
          >
            <motion.span
              animate={{ rotate: [0, 0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="material-symbols-outlined text-[20px] fill-current"
            >
              inbox
            </motion.span>
            <span className="text-sm font-medium hidden md:block">Inbox</span>
          </motion.button>
          <motion.button
            variants={messageVariants}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-2 md:px-3 py-1.5 rounded-md text-white/70 hover:bg-white/5 w-full"
          >
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="material-symbols-outlined text-[20px]"
            >
              send
            </motion.span>
            <span className="text-sm font-medium hidden md:block">Sent</span>
          </motion.button>
        </motion.nav>
      </motion.div>

      {/* Message List */}
      <AnimatePresence mode="wait">
        {currentView !== 'composer' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-72 bg-black/10 border-r border-white/5 flex-col shrink-0"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 border-b border-white/5 flex justify-between items-end"
            >
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">Inbox</span>
                <span className="text-xs text-white/50">2 messages</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="overflow-y-auto flex-1"
            >
              <motion.div
                onClick={() => setCurrentView('composer')}
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                variants={messageVariants}
                className="px-4 py-3 border-b border-white/5 bg-white/5 border-l-[3px] border-l-primary cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-semibold text-sm truncate pr-2">Contact Abhishek</h3>
                  <span className="text-xs text-white/40">Now</span>
                </div>
                <p className="text-xs text-white/80 font-medium truncate">New Message</p>
                <p className="text-xs text-white/50 line-clamp-2">Send a message to Abhishek</p>
              </motion.div>
              <motion.div
                variants={messageVariants}
                className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-medium text-sm">Sid Pandey</h3>
                  <span className="text-xs text-white/40">Yesterday</span>
                </div>
                <p className="text-xs text-white/70 mb-1 truncate">Feedback: Great Work</p>
                <p className="text-xs text-white/50 line-clamp-2">
                  The work exceeded our expectations...
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <AnimatePresence mode="wait">
        {currentView !== 'list' && (
          <motion.div
            key="composer"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-[#1e1e1e] flex flex-col"
          >
            {/* Success/Error Messages */}
            <AnimatePresence>
              {formState.success && (
                <motion.div
                  key="success"
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-green-500/20 border-b border-green-500/30 px-4 py-2 text-green-300 text-sm flex items-center gap-2"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="material-symbols-outlined text-[18px]"
                  >
                    check_circle
                  </motion.span>
                  Message sent successfully!
                </motion.div>
              )}
              {formState.error && (
                <motion.div
                  key="error"
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 text-red-300 text-sm flex items-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="material-symbols-outlined text-[18px]"
                  >
                    error
                  </motion.span>
                  {formState.error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col shrink-0"
            >
              <div className="flex items-center px-4 py-2 border-b border-white/5">
                {window.innerWidth < 1024 && (
                  <motion.button
                    onClick={() => setCurrentView('list')}
                    whileHover={{ rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
                    className="mr-4 text-primary"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </motion.button>
                )}
                <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
                  To:
                </label>
                <span className="bg-primary/20 text-blue-300 px-2 py-0.5 rounded text-xs md:text-sm border border-primary/30 flex items-center gap-1">
                  abhishekg9630@gmail.com
                </span>
              </div>

              {/* Optional Sender Info */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center px-4 py-2 border-b border-white/5"
              >
                <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
                  From:
                </label>
                <motion.input
                  whileFocus={{ boxShadow: '0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
                  className="bg-transparent border-none p-0 text-sm text-white focus:ring-0 placeholder-white/30 flex-1 mr-2"
                  placeholder="Your email (optional)"
                  value={formState.senderEmail}
                  onChange={e => updateField('senderEmail', e.target.value)}
                  disabled={formState.isSubmitting}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center px-4 py-2 border-b border-white/5"
              >
                <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
                  Subject:
                </label>
                <motion.input
                  whileFocus={{ boxShadow: '0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
                  className="bg-transparent border-none p-0 text-sm font-medium text-white focus:ring-0 placeholder-white/20 w-full"
                  placeholder="Project Inquiry"
                  value={formState.subject}
                  onChange={e => updateField('subject', e.target.value)}
                  disabled={formState.isSubmitting}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex-1 relative"
            >
              <motion.textarea
                whileFocus={{ boxShadow: 'inset 0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
                className="w-full h-full bg-transparent border-none p-4 md:p-6 text-sm md:text-base leading-relaxed text-white/90 placeholder-white/30 resize-none focus:ring-0"
                placeholder="Hi Abhishek, I'd like to talk about..."
                value={formState.message}
                onChange={e => updateField('message', e.target.value)}
                disabled={formState.isSubmitting}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="h-10 border-t border-white/5 bg-[#252525] flex items-center px-4 gap-4 shrink-0"
            >
              <motion.span
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                className="material-symbols-outlined text-[18px] text-white/40 cursor-pointer hover:text-white"
              >
                format_bold
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.2, rotate: -15 }}
                whileTap={{ scale: 0.9 }}
                className="material-symbols-outlined text-[18px] text-white/40 cursor-pointer hover:text-white shrink-0"
              >
                attach_file
              </motion.span>
              <div className="flex-1" />
              <motion.button
                onClick={handleSend}
                disabled={formState.isSubmitting || !formState.subject || !formState.message}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 rounded shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formState.isSubmitting && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="material-symbols-outlined text-[14px]"
                  >
                    refresh
                  </motion.span>
                )}
                {formState.isSubmitting ? 'Sending...' : 'Send'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
