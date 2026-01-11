import { useState, useCallback } from 'react';
import { AppId, AppWindow } from '../types';

export const useWindowManager = (initialWindows: AppWindow[]) => {
  const [windows, setWindows] = useState<AppWindow[]>(initialWindows);
  const [activeApp, setActiveApp] = useState<AppId>(
    initialWindows.find(w => w.isOpen)?.id || 'about'
  );

  const updateWindow = useCallback((id: AppId, updates: Partial<AppWindow>) => {
    setWindows(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const openApp = useCallback(
    (id: AppId) => {
      const maxZ = Math.max(...windows.map(w => w.zIndex)) + 1;
      updateWindow(id, { isOpen: true, isMinimized: false, zIndex: maxZ });
      setActiveApp(id);
    },
    [windows, updateWindow]
  );

  const closeApp = useCallback(
    (id: AppId) => {
      updateWindow(id, { isOpen: false });
    },
    [updateWindow]
  );

  const focusApp = useCallback(
    (id: AppId) => {
      const maxZ = Math.max(...windows.map(w => w.zIndex)) + 1;
      updateWindow(id, { zIndex: maxZ, isMinimized: false });
      setActiveApp(id);
    },
    [windows, updateWindow]
  );

  const minimizeApp = useCallback(
    (id: AppId) => {
      updateWindow(id, { isMinimized: true });
    },
    [updateWindow]
  );

  return {
    windows,
    activeApp,
    openApp,
    closeApp,
    focusApp,
    minimizeApp,
  };
};
