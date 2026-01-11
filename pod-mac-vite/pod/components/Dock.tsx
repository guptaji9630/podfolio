
import React from 'react';
import { AppId, AppWindow } from '../types';

interface DockProps {
  openApp: (id: AppId) => void;
  activeApp: AppId;
  windows: AppWindow[];
}

export const Dock: React.FC<DockProps> = ({ openApp, activeApp, windows }) => {
  const dockItems = [
    { id: 'finder' as AppId, icon: 'face_2', label: 'Finder', color: 'bg-blue-500' },
    { id: 'about' as AppId, icon: 'person', label: 'About Me', color: 'bg-indigo-500' },
    { id: 'chat' as AppId, icon: 'smart_toy', label: 'AI Assistant', color: 'bg-gradient-to-tr from-cyan-500 to-blue-500' },
    { id: 'mail' as AppId, icon: 'mail', label: 'Mail', color: 'bg-sky-500', badge: 1 },
    { id: 'terminal' as AppId, icon: 'terminal', label: 'Terminal', color: 'bg-gray-800' },
    // { id: 'resume' as AppId, icon: 'description', label: 'Resume', color: 'bg-white', iconColor: 'text-gray-800' },
    { id: 'settings' as AppId, icon: 'settings', label: 'Settings', color: 'bg-gray-400' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="dock-glass flex items-end gap-3 px-3 py-2.5 rounded-[24px] shadow-2xl h-[72px] transition-all duration-300 ease-out hover:px-6">
        {dockItems.map((item) => {
          const appState = windows.find(w => w.id === item.id);
          const isOpen = appState?.isOpen;
          const isActive = activeApp === item.id;
          
          return (
            <button 
              key={item.id}
              onClick={() => openApp(item.id)}
              className={`group relative w-12 h-12 rounded-xl ${item.color} flex items-center justify-center hover:-translate-y-4 hover:scale-125 transition-all duration-200 ease-out shadow-lg`}
            >
              {/* <span className={`material-symbols-outlined ${item.iconColor || 'text-white'} text-[30px] drop-shadow-md`}>
                {item.icon}
              </span> */}
              
              <span className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur text-white text-[12px] py-1 px-3 rounded-md transition-opacity duration-200 whitespace-nowrap border border-white/10 shadow-lg pointer-events-none">
                {item.label}
              </span>

              {isOpen && (
                <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${isActive ? 'bg-white shadow-[0_0_5px_white]' : 'bg-white/40'}`} />
              )}

              {item.badge && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full border-2 border-white/20 text-[10px] flex items-center justify-center font-bold shadow-sm">
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
