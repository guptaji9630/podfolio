import React, { useState, useCallback } from 'react';
import { Desktop } from '../components/Desktop';
import { MenuBar } from '../components/MenuBar';
import { Dock } from '../components/Dock';
import type { AppWindow } from './types';
import { useWindowManager } from './hooks/useWindowManager';
import { WALLPAPERS } from './config/constants';
import { storage, KEYS } from './utils/storage';

const INITIAL_WINDOWS: AppWindow[] = [
  { id: 'about', title: 'About Abhishek', isOpen: true, isMinimized: false, zIndex: 10 },
  { id: 'chat', title: 'AI Assistant', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'finder', title: 'Finder', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'mail', title: 'Mail', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'resume', title: 'Resume.pdf', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'settings', title: 'System Settings', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'terminal', title: 'Terminal', isOpen: false, isMinimized: false, zIndex: 1 },
];

const App: React.FC = () => {
  const [wallpaper, setWallpaper] = useState<string>(
    storage.get(KEYS.WALLPAPER, WALLPAPERS[0]) || WALLPAPERS[0]
  );

  const { windows, activeApp, openApp, closeApp, focusApp, minimizeApp } =
    useWindowManager(INITIAL_WINDOWS);

  const handleWallpaperChange = useCallback((url: string) => {
    setWallpaper(url);
    storage.set(KEYS.WALLPAPER, url);
  }, []);

  return (
    <div
      className="h-screen w-screen bg-cover bg-center relative overflow-hidden flex flex-col transition-all duration-1000"
      style={{ backgroundImage: `url('${wallpaper}')` }}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none" />

      <MenuBar activeAppTitle={windows.find(w => w.id === activeApp)?.title || 'Finder'} />

      <Desktop
        windows={windows}
        activeApp={activeApp}
        onFocus={focusApp}
        onClose={closeApp}
        onMinimize={minimizeApp}
        wallpaper={wallpaper}
        setWallpaper={handleWallpaperChange}
        wallpapers={WALLPAPERS}
      />

      <Dock openApp={openApp} activeApp={activeApp} windows={windows} />
    </div>
  );
};

export default App;
