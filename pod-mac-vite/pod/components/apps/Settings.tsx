
import React from 'react';

interface SettingsProps {
  wallpaper: string;
  setWallpaper: (url: string) => void;
  wallpapers: string[];
}

export const Settings: React.FC<SettingsProps> = ({ wallpaper, setWallpaper, wallpapers }) => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-64 bg-black/20 border-r border-white/10 flex flex-col pt-4 px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium leading-tight">Visitor</span>
            <span className="text-white/40 text-xs">Apple ID</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1">
          {[
            { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', color: 'bg-blue-500' },
            { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth', color: 'bg-blue-600' },
            { id: 'wallpaper', label: 'Wallpaper', icon: 'image', color: 'bg-sky-500', active: true },
            { id: 'appearance', label: 'Appearance', icon: 'visibility', color: 'bg-primary' },
          ].map(item => (
            <button 
              key={item.id}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-colors ${item.active ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-white/90'}`}
            >
              <div className={`${item.color} w-6 h-6 flex items-center justify-center rounded-md shadow-sm`}>
                <span className="material-symbols-outlined text-[14px] text-white">{item.icon}</span>
              </div>
              <span className="text-[13px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-transparent overflow-y-auto">
        <div className="sticky top-0 z-10 p-8 backdrop-blur-md">
          <h1 className="text-xl font-bold text-white">Wallpaper</h1>
        </div>
        
        <div className="px-8 pb-10 flex flex-col gap-8">
          <section>
            <p className="text-[11px] font-medium text-white/40 mb-4 uppercase tracking-wider">Dynamic Wallpapers</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {wallpapers.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setWallpaper(url)}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    wallpaper === url ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#1e1e1e]' : 'hover:scale-[1.02]'
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt={`Wallpaper ${i+1}`} />
                  <div className={`absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors`} />
                  {wallpaper === url && (
                    <div className="absolute bottom-2 right-2 bg-primary w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-white text-[16px]">check</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white/5 rounded-xl border border-white/5 p-5 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Automatic Mode</span>
                  <span className="text-[11px] text-white/40">Cycle through wallpapers every 30 minutes</span>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full p-0.5 relative cursor-pointer opacity-50">
                  <div className="w-4 h-4 bg-white/40 rounded-full" />
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
