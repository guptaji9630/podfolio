import React, { useEffect, useRef, useState } from 'react';
import { WindowFrame } from '../WindowFrame';
import type { AppWindow, AppId } from '../../src/types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const container = canvasRef.current?.parentElement?.parentElement;
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
      <div
        className="relative w-full h-full"
        style={{ minWidth: '400px', minHeight: '300px' }}
      >
        <div className="absolute top-2 right-2 z-10 flex gap-1" style={{ pointerEvents: 'none' }}>
          <button
            onClick={toggleFullscreen}
            className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            title="Fullscreen (F11)"
            style={{ pointerEvents: 'auto' }}
          >
            <span className="material-symbols-outlined text-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
          </button>
        </div>
        {children}
      </div>
    </WindowFrame>
  );
};