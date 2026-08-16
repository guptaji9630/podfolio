import React, { useState, useCallback, useEffect } from 'react';
import { Desktop } from '../components/Desktop';
import { MenuBar } from '../components/MenuBar';
import { Dock } from '../components/Dock';
import type { AppWindow, AppId } from './types';
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
  { id: 'games', title: 'Games', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'dino', title: 'Dino Run', isOpen: false, isMinimized: false, zIndex: 1 },
  { id: 'pong', title: 'Pong vs AI', isOpen: false, isMinimized: false, zIndex: 1 },
];

const App: React.FC = () => {
  const [wallpaper, setWallpaper] = useState<string>(
    storage.get(KEYS.WALLPAPER, WALLPAPERS[0]) || WALLPAPERS[0]
  );
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(
    storage.get(KEYS.WIFI_ENABLED, true)
  );
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(
    storage.get(KEYS.BLUETOOTH_ENABLED, true)
  );
  const [accentColor, setAccentColor] = useState<string>(
    storage.get(KEYS.ACCENT_COLOR, '#0a84ff') || '#0a84ff'
  );

  const { windows, activeApp, openApp, closeApp, focusApp, minimizeApp } =
    useWindowManager(INITIAL_WINDOWS);

  useEffect(() => {
    const ALLOWED_GAME_IDS: AppId[] = ['dino', 'pong'];
    const ALLOWED_PONG_MODES = ['classic', 'survival'];

    const handleMessage = (event: MessageEvent) => {
      // Validate origin - only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'LAUNCH_GAME' && event.data.payload) {
        const { gameId, mode } = event.data.payload;
        if (gameId && ALLOWED_GAME_IDS.includes(gameId as AppId)) {
          if (mode && gameId === 'pong' && ALLOWED_PONG_MODES.includes(mode)) {
            sessionStorage.setItem('pong_mode', mode);
          } else if (mode) {
            // Invalid mode for pong or mode for non-pong game
            return;
          }
          openApp(gameId as AppId);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [openApp]);

  const handleWallpaperChange = useCallback((url: string) => {
    setWallpaper(url);
    storage.set(KEYS.WALLPAPER, url);
  }, []);

  const handleWifiToggle = useCallback((enabled: boolean) => {
    setWifiEnabled(enabled);
    storage.set(KEYS.WIFI_ENABLED, enabled);
  }, []);

  const handleBluetoothToggle = useCallback((enabled: boolean) => {
    setBluetoothEnabled(enabled);
    storage.set(KEYS.BLUETOOTH_ENABLED, enabled);
  }, []);

  const handleAccentColorChange = useCallback((color: string) => {
    setAccentColor(color);
    storage.set(KEYS.ACCENT_COLOR, color);
  }, []);

  return (
    <div
      className="h-screen w-screen bg-cover bg-center relative overflow-hidden flex flex-col transition-all duration-1000"
      style={{ 
        backgroundImage: `url('${wallpaper}')`,
        '--accent-color': accentColor,
      } as React.CSSProperties & { '--accent-color': string }}
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
        wifiEnabled={wifiEnabled}
        setWifiEnabled={handleWifiToggle}
        bluetoothEnabled={bluetoothEnabled}
        setBluetoothEnabled={handleBluetoothToggle}
        accentColor={accentColor}
        setAccentColor={handleAccentColorChange}
      />

      <Dock openApp={openApp} activeApp={activeApp} windows={windows} />
    </div>
  );
};

export default App;
