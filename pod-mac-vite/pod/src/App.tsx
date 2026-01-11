
import React, { useState, useCallback } from 'react';
import { Desktop } from '../components/Desktop';
import { MenuBar } from '../components/MenuBar';
import { Dock } from '../components/Dock';
import { AppId, AppWindow } from '../types';

const WALLPAPERS = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2064',
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2029'
];

const App: React.FC = () => {
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0]);
  const [windows, setWindows] = useState<AppWindow[]>([
    { id: 'about', title: 'About Abhishek', isOpen: true, isMinimized: false, zIndex: 10 },
    { id: 'chat', title: 'AI Assistant', isOpen: false, isMinimized: false, zIndex: 1 },
    { id: 'finder', title: 'Finder', isOpen: false, isMinimized: false, zIndex: 1 },
    { id: 'mail', title: 'Mail', isOpen: false, isMinimized: false, zIndex: 1 },
    { id: 'resume', title: 'Resume.pdf', isOpen: false, isMinimized: false, zIndex: 1 },
    { id: 'settings', title: 'System Settings', isOpen: false, isMinimized: false, zIndex: 1 },
    { id: 'terminal', title: 'Terminal', isOpen: false, isMinimized: false, zIndex: 1 },
  ]);

  const [activeApp, setActiveApp] = useState<AppId>('about');

  const updateWindow = useCallback((id: AppId, updates: Partial<AppWindow>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const openApp = useCallback((id: AppId) => {
    const maxZ = Math.max(...windows.map(w => w.zIndex)) + 1;
    updateWindow(id, { isOpen: true, isMinimized: false, zIndex: maxZ });
    setActiveApp(id);
  }, [windows, updateWindow]);

  const closeApp = useCallback((id: AppId) => {
    updateWindow(id, { isOpen: false });
  }, [updateWindow]);

  const focusApp = useCallback((id: AppId) => {
    const maxZ = Math.max(...windows.map(w => w.zIndex)) + 1;
    updateWindow(id, { zIndex: maxZ, isMinimized: false });
    setActiveApp(id);
  }, [windows, updateWindow]);

  const minimizeApp = useCallback((id: AppId) => {
    updateWindow(id, { isMinimized: true });
  }, [updateWindow]);

  return (
    <div className="h-screen w-screen bg-cover bg-center relative overflow-hidden flex flex-col transition-all duration-1000"
      style={{ backgroundImage: `url('${wallpaper}')` }}>
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none" />

      <MenuBar activeAppTitle={windows.find(w => w.id === activeApp)?.title || 'Finder'} />

      <Desktop
        windows={windows}
        activeApp={activeApp}
        onFocus={focusApp}
        onClose={closeApp}
        onMinimize={minimizeApp}
        wallpaper={wallpaper}
        setWallpaper={setWallpaper}
        wallpapers={WALLPAPERS}
      />

      <Dock
        openApp={openApp}
        activeApp={activeApp}
        windows={windows}
      />
    </div>
  );
};

export default App;
