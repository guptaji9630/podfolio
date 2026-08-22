
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface MenuBarProps {
  activeAppTitle: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ activeAppTitle }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-3 md:px-4 py-1 bg-black/30 backdrop-blur-md border-b border-white/5 text-[12px] md:text-[13px] font-medium h-7 md:h-8 select-none"
    >
      <div className="flex items-center gap-3 md:gap-5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center text-white hover:text-gray-200"
        >
          <motion.span
            animate={{ rotate: [0, 0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="material-symbols-outlined text-[16px] md:text-[18px] font-bold"
          >
            token
          </motion.span>
        </motion.button>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 35 }}
          className="flex items-center gap-2 md:gap-4"
        >
          <motion.span
            key={activeAppTitle}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="font-bold text-white truncate max-w-[120px] md:max-w-none"
          >
            {activeAppTitle}
          </motion.span>
          {['File', 'Edit', 'View', 'Window', 'Help'].map((menu, i) => (
            <motion.span
              key={menu}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05, type: 'spring', stiffness: 400, damping: 35 }}
              className="cursor-default hover:text-gray-200 text-white/90 hidden lg:block"
              whileHover={{ color: '#fff' }}
            >
              {menu}
            </motion.span>
          ))}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 35 }}
        className="flex items-center gap-2 md:gap-4 text-white/90"
      >
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="material-symbols-outlined text-[14px] md:text-[16px]"
          >
            bluetooth
          </motion.span>
          <motion.span
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="material-symbols-outlined text-[14px] md:text-[16px]"
          >
            wifi
          </motion.span>
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">battery_full</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="material-symbols-outlined text-[14px] md:text-[16px] hidden sm:block">search</span>
          <span className="material-symbols-outlined text-[14px] md:text-[16px] hidden sm:block">control_point</span>
          <motion.span
            key={formattedTime}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[11px] md:text-[13px] tracking-wide font-variant-numeric tabular-nums"
          >
            {formattedTime}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
};
