
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
import { GamesLauncher } from './apps/GamesLauncher';
import { DinoGame } from './apps/DinoGame';
import { PongGame } from './apps/PongGame';
import { AnimatePresence, motion } from 'motion/react';

interface DesktopProps {
  windows: AppWindow[];
  activeApp: AppId;
  onFocus: (id: AppId) => void;
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
  wallpapers: string[];
  wifiEnabled: boolean;
  setWifiEnabled: (enabled: boolean) => void;
  bluetoothEnabled: boolean;
  setBluetoothEnabled: (enabled: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

export const Desktop: React.FC<DesktopProps> = ({
  windows,
  onFocus,
  onClose,
  onMinimize,
  wallpaper,
  setWallpaper,
  wallpapers,
  wifiEnabled,
  setWifiEnabled,
  bluetoothEnabled,
  setBluetoothEnabled,
  accentColor,
  setAccentColor
}) => {
  const renderAppContent = (id: AppId) => {
    switch (id) {
      case 'about': return <AboutMe />;
      case 'finder': return <Finder />;
      case 'mail': return <Mail />;
      case 'resume': return <Resume />;
      case 'chat': return <Chat />;
      case 'settings': 
        return (
          <Settings 
            wallpaper={wallpaper} 
            setWallpaper={setWallpaper} 
            wallpapers={wallpapers}
            wifiEnabled={wifiEnabled}
            setWifiEnabled={setWifiEnabled}
            bluetoothEnabled={bluetoothEnabled}
            setBluetoothEnabled={setBluetoothEnabled}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
          />
        );
      case 'terminal': return <Terminal />;
      case 'games': return <GamesLauncher />;
      case 'dino': return <DinoGame />;
      case 'pong': return <PongGame />;
      default: return null;
    }
  };

  const openWindows = windows.filter(w => w.isOpen && !w.isMinimized);
  const sortedWindows = [...openWindows].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <main className="flex-1 relative mt-8 mb-24 overflow-hidden p-4">
      <AnimatePresence mode="popLayout">
        {sortedWindows.map((w, index) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <WindowFrame
              app={w}
              onFocus={() => onFocus(w.id)}
              onClose={() => onClose(w.id)}
              onMinimize={() => onMinimize(w.id)}
            >
              {renderAppContent(w.id)}
            </WindowFrame>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
};
