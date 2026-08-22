
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { AppWindow } from '../src/types';
import { transitions } from '../src/types/motion';

interface WindowFrameProps {
  app: AppWindow;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  children: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'se' | 'sw' | 'ne' | 'nw' | null;

const springConfig = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };
const springConfig400 = { type: 'spring' as const, stiffness: 400, damping: 40 };

// Module-level Set to track which windows have been opened globally
const openedWindows = new Set<AppWindow['id']>();

export const WindowFrame: React.FC<WindowFrameProps> = ({
  app,
  onFocus,
  onClose,
  onMinimize,
  children
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [size, setSize] = useState({
    width: app.id === 'terminal' ? 650 : app.id === 'dino' ? 960 : 850,
    height: app.id === 'terminal' ? 400 : app.id === 'dino' ? 540 : 550
  });

  const [position, setPosition] = useState({
    x: 40 + (app.zIndex * 5),
    y: 40 + (app.zIndex * 5)
  });

  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [isFocused, setIsFocused] = useState(false);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // Check if this window has been opened before (globally)
  const hasOpenedBefore = openedWindows.has(app.id);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    onFocus();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleResizeDown = (e: React.MouseEvent, dir: ResizeDirection) => {
    if (isMobile) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus();
    setResizeDir(dir);
    resizeStartSize.current = {
      w: size.width,
      h: size.height,
      x: e.clientX,
      y: e.clientY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      } else if (resizeDir) {
        const deltaX = e.clientX - resizeStartSize.current.x;
        const deltaY = e.clientY - resizeStartSize.current.y;

        setSize(prev => ({
          width: (resizeDir === 'e' || resizeDir === 'se') ? Math.max(350, resizeStartSize.current.w + deltaX) : prev.width,
          height: (resizeDir === 's' || resizeDir === 'se') ? Math.max(250, resizeStartSize.current.h + deltaY) : prev.height,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDir(null);
    };

    if (isDragging || resizeDir) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDir]);

  const containerStyle: React.CSSProperties = isMobile ? {
    left: 0,
    top: 0,
    width: '100vw',
    height: 'calc(100vh - 120px)',
    zIndex: app.zIndex,
  } : {
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: app.zIndex,
  };

  return (
    <motion.div
      initial={hasOpenedBefore ? false : { opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={springConfig}
      style={containerStyle}
      className={`absolute glass-panel overflow-hidden border border-white/10 flex flex-col shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] ${isMobile ? 'rounded-none' : 'rounded-xl'}`}
      onMouseDown={() => { 
        onFocus(); 
        setIsFocused(true);
        // Mark this window as opened for future renders
        openedWindows.add(app.id);
      }}
      onMouseLeave={() => setIsFocused(false)}
    >
      {/* Invisible Resize Handles (Desktop Only) */}
      {!isMobile && (
        <>
          <div
            className="absolute right-0 top-0 w-1.5 h-full cursor-e-resize z-[60] hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeDown(e, 'e')}
          />
          <div
            className="absolute bottom-0 left-0 h-1.5 w-full cursor-s-resize z-[60] hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeDown(e, 's')}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-[70] flex items-end justify-end p-0.5 group"
            onMouseDown={(e) => handleResizeDown(e, 'se')}
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 rounded-br-sm group-hover:border-primary/60" />
          </div>
        </>
      )}

      {/* Title Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig400, delay: 0.1 }}
        className="h-10 bg-[#2c2c2e]/60 border-b border-black/40 flex items-center px-4 shrink-0 cursor-move select-none relative z-50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 absolute left-4">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-3 h-3 rounded-full bg-[#FF453A] border border-[#FF3B30] flex items-center justify-center group/btn"
          >
            <span className="material-symbols-outlined text-[8px] opacity-0 group-hover/btn:opacity-100 text-black font-bold">close</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-3 h-3 rounded-full bg-[#FFD60A] border border-[#FFCC00] flex items-center justify-center group/btn"
          >
            <span className="material-symbols-outlined text-[8px] opacity-0 group-hover/btn:opacity-100 text-black font-bold">remove</span>
          </motion.button>
          {!isMobile && <button className="w-3 h-3 rounded-full bg-[#30D158] border border-[#28CD41]" />}
        </div>
        <div className="flex-1 text-center pointer-events-none">
          <span className="text-xs font-semibold text-white/80">{app.title}</span>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        className="flex-1 overflow-hidden flex flex-col bg-[#1c1c1e]/90 backdrop-blur-xl relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
