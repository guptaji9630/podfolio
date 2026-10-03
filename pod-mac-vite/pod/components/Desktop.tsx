
import React, { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppLoadBoundary } from './AppLoadBoundary';
import { AppWindow, AppId } from '../src/types';
import { WindowFrame } from './WindowFrame';
import { AboutMe } from './apps/AboutMe';
const Finder = lazy(() => import('./apps/Finder').then(module => ({ default: module.Finder })));
const Mail = lazy(() => import('./apps/Mail').then(module => ({ default: module.Mail })));
const Resume = lazy(() => import('./apps/Resume').then(module => ({ default: module.Resume })));
const Settings = lazy(() => import('./apps/Settings').then(module => ({ default: module.Settings })));
const Terminal = lazy(() => import('./apps/Terminal').then(module => ({ default: module.Terminal })));
const Chat = lazy(() => import('./apps/Chat').then(module => ({ default: module.Chat })));
const GamesLauncher = lazy(() => import('./apps/GamesLauncher').then(module => ({ default: module.GamesLauncher })));
const DinoGame = lazy(() => import('./apps/DinoGame').then(module => ({ default: module.DinoGame })));
const PongGame = lazy(() => import('./apps/PongGame').then(module => ({ default: module.PongGame })));

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
              <AppLoadBoundary>
                <Suspense fallback={<div role="status" className="p-6 text-white/70">Loading app…</div>}>
                  {renderAppContent(w.id)}
                </Suspense>
              </AppLoadBoundary>
            </WindowFrame>
          </motion.div>
        ))}
      </AnimatePresence>
    </main>
  );
};
