
import React from 'react';
import { AppWindow, AppId } from '../src/types';
import { WindowFrame } from './WindowFrame';
import { AboutMe } from './apps/AboutMe';
import { Finder } from './apps/Finder';
import { Mail } from './apps/Mail';
import { Resume } from './apps/Resume';
import { Settings } from './apps/Settings';
import { Terminal } from './apps/Terminal';
import { Chat } from './apps/Chat';

interface DesktopProps {
  windows: AppWindow[];
  activeApp: AppId;
  onFocus: (id: AppId) => void;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  wallpapers: string[];
}

export const Desktop: React.FC<DesktopProps> = ({
  windows,
  onFocus,
  onClose,
  onMinimize,
  wallpaper,
  setWallpaper,
  wallpapers
}) => {
  const renderAppContent = (id: AppId) => {
    switch (id) {
      case 'about': return <AboutMe />;
      case 'finder': return <Finder />;
      case 'mail': return <Mail />;
      case 'resume': return <Resume />;
      case 'chat': return <Chat />;
      case 'settings': return <Settings wallpaper={wallpaper} setWallpaper={setWallpaper} wallpapers={wallpapers} />;
      case 'terminal': return <Terminal />;
      default: return null;
    }
  };

  return (
    <main className="flex-1 relative mt-8 mb-24 overflow-hidden p-4">
      {windows.map((w) => (
        w.isOpen && !w.isMinimized && (
          <WindowFrame
            key={w.id}
            app={w}
            onFocus={() => onFocus(w.id)}
            onClose={() => onClose(w.id)}
            onMinimize={() => onMinimize(w.id)}
          >
            {renderAppContent(w.id)}
          </WindowFrame>
        )
      ))}
    </main>
  );
};
