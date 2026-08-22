import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { WindowFrame } from '../WindowFrame';
import type { AppWindow } from '../../src/types';

interface GameWindowFrameProps {
  app: AppWindow;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
  gameId?: string;
}

export const GameWindowFrame: React.FC<GameWindowFrameProps> = ({
  app,
  onFocus,
  onClose,
  onMinimize,
  children,
  gameId,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        const container = containerRef.current;
        if (container) {
          await container.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.warn('Fullscreen failed:', err);
      }
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  };

  return (
    <WindowFrame
      app={app}
      onFocus={onFocus}
      onClose={() => {
        exitFullscreen();
        onClose();
      }}
      onMinimize={onMinimize}
    >
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35, delay: 0.1 }}
        className="relative w-full h-full"
        style={{ minWidth: '400px', minHeight: '300px' }}
      >
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-2 right-2 z-10 flex gap-1"
          style={{ pointerEvents: 'none' }}
        >
          <motion.button
            onClick={toggleFullscreen}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            title="Fullscreen (F11)"
            style={{ pointerEvents: 'auto' }}
          >
            <motion.span
              animate={{ scale: isFullscreen ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="material-symbols-outlined text-sm"
            >
              fullscreen_exit
            </motion.span>
            <motion.span
              animate={{ scale: isFullscreen ? 0 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="material-symbols-outlined text-sm absolute"
            >
              fullscreen
            </motion.span>
          </motion.button>
        </motion.div>
        {children}
      </motion.div>
    </WindowFrame>
  );
};