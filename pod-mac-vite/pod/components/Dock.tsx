
import React from 'react';
import type { AppId, AppWindow } from '../src/types';

interface DockProps {
  openApp: (id: AppId) => void;
  activeApp: AppId;
  windows: AppWindow[];
}

export const Dock: React.FC<DockProps> = ({ openApp, activeApp, windows }) => {
  const dockItems = [
    // { id: 'finder' as AppId, icon: 'face_2', label: 'Finder', color: 'bg-blue-500', iconColor: 'text-white' },
    { id: 'about' as AppId, icon: 'person', label: 'About Me', color: 'bg-indigo-500', iconColor: 'text-white' },
    { id: 'chat' as AppId, icon: 'smart_toy', label: 'AI Assistant', color: 'bg-gradient-to-tr from-cyan-500 to-blue-500', iconColor: 'text-white' },
    { id: 'mail' as AppId, icon: 'mail', label: 'Mail', color: 'bg-sky-500', badge: 1, iconColor: 'text-white' },
    { id: 'terminal' as AppId, icon: 'terminal', label: 'Terminal', color: 'bg-gray-800', iconColor: 'text-white' },
    { id: 'resume' as AppId, icon: 'description', label: 'Resume', color: 'bg-white', iconColor: 'text-gray-800' },
    { id: 'settings' as AppId, icon: 'settings', label: 'Settings', color: 'bg-gray-400', iconColor: 'text-white' },
  ];

  return (
    <div className="fixed bottom-2 md:bottom-4 left-1/2 -translate-x-1/4 z-[1000]">
      <div className="dock-glass flex items-end gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-[20px] md:rounded-[24px] shadow-2xl h-14 md:h-[72px] transition-all duration-300 ease-out hover:px-3 md:hover:px-6">
        {dockItems.map((item) => {
          const appState = windows.find(w => w.id === item.id);
          const isOpen = appState?.isOpen;
          const isActive = activeApp === item.id;

          return (
            <button
              key={item.id}
              onClick={() => openApp(item.id)}
              className={`group relative w-10 h-10 md:w-12 md:h-12 rounded-xl ${item.color} flex items-center justify-center hover:-translate-y-2 md:hover:-translate-y-4 hover:scale-110 md:hover:scale-125 transition-all duration-200 ease-out shadow-lg`}
            >
              <span className={`material-symbols-outlined ${item.iconColor || 'text-white'} text-[24px] md:text-[30px] drop-shadow-md`}>
                {item.icon}
              </span>

              <span className="absolute -top-8 md:-top-12 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur text-white text-[11px] md:text-[12px] py-1 px-2 md:px-3 rounded-md transition-opacity duration-200 whitespace-nowrap border border-white/10 shadow-lg pointer-events-none">
                {item.label}
              </span>

              {isOpen && (
                <div className={`absolute -bottom-1.5 md:-bottom-2 w-1 h-1 rounded-full ${isActive ? 'bg-white shadow-[0_0_5px_white]' : 'bg-white/40'}`} />
              )}

              {item.badge && (
                <div className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full border-2 border-white/20 text-[9px] md:text-[10px] flex items-center justify-center font-bold shadow-sm">
                  {item.badge}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
