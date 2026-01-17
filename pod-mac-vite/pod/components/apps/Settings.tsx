
import React, { useState } from 'react';

interface SettingsProps {
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

type SettingsTab = 'wifi' | 'bluetooth' | 'wallpaper' | 'appearance';

const BLUETOOTH_DEVICES = [
  { name: 'AirPods Pro', icon: 'headphones', status: 'Connected' },
  { name: 'Magic Mouse', icon: 'mouse', status: 'Connected' },
  { name: 'iPhone', icon: 'smartphone', status: 'Paired' },
] as const;

export const Settings: React.FC<SettingsProps> = ({ 
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
  const [activeTab, setActiveTab] = useState<SettingsTab>('wallpaper');

  const menuItems = [
    { id: 'wifi' as const, label: 'Wi-Fi', icon: 'wifi', color: 'bg-blue-500' },
    { id: 'bluetooth' as const, label: 'Bluetooth', icon: 'bluetooth', color: 'bg-blue-600' },
    { id: 'wallpaper' as const, label: 'Wallpaper', icon: 'image', color: 'bg-sky-500' },
    { id: 'appearance' as const, label: 'Appearance', icon: 'visibility', color: 'bg-primary' },
  ];

  const accentColors = [
    { name: 'Blue', value: '#0a84ff', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Purple', value: '#bf5af2', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Pink', value: '#ff2d55', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Red', value: '#ff3b30', gradient: 'from-red-500 to-red-600' },
    { name: 'Orange', value: '#ff9500', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Green', value: '#34c759', gradient: 'from-green-500 to-green-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'wifi':
        return (
          <>
            <div className="sticky top-0 z-10 p-8 backdrop-blur-md">
              <h1 className="text-xl font-bold text-white">Wi-Fi</h1>
            </div>
            <div className="px-8 pb-10 flex flex-col gap-6">
              <section className="bg-white/5 rounded-xl border border-white/5 p-5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Wi-Fi</span>
                    <span className="text-[11px] text-white/40">
                      {wifiEnabled ? 'Connected to Network' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => setWifiEnabled(!wifiEnabled)}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-colors ${
                      wifiEnabled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        wifiEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {wifiEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <span className="material-symbols-outlined text-primary">wifi</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">Portfolio Network</div>
                        <div className="text-xs text-white/40">Connected</div>
                      </div>
                      <span className="material-symbols-outlined text-white/60">check_circle</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        );

      case 'bluetooth':
        return (
          <>
            <div className="sticky top-0 z-10 p-8 backdrop-blur-md">
              <h1 className="text-xl font-bold text-white">Bluetooth</h1>
            </div>
            <div className="px-8 pb-10 flex flex-col gap-6">
              <section className="bg-white/5 rounded-xl border border-white/5 p-5">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Bluetooth</span>
                    <span className="text-[11px] text-white/40">
                      {bluetoothEnabled ? 'Discoverable as "Portfolio Mac"' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-colors ${
                      bluetoothEnabled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        bluetoothEnabled ? 'translate-x-[22px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {bluetoothEnabled && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-white/40 mb-3 uppercase tracking-wider">
                      Nearby Devices
                    </p>
                    {BLUETOOTH_DEVICES.map((device, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <span className="material-symbols-outlined text-primary">{device.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{device.name}</div>
                          <div className="text-xs text-white/40">{device.status}</div>
                        </div>
                        {device.status === 'Connected' && (
                          <span className="material-symbols-outlined text-white/60">check_circle</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        );

      case 'wallpaper':
        return (
          <>
            <div className="sticky top-0 z-10 p-8 backdrop-blur-md">
              <h1 className="text-xl font-bold text-white">Wallpaper</h1>
            </div>
            <div className="px-8 pb-10 flex flex-col gap-8">
              <section>
                <p className="text-[11px] font-medium text-white/40 mb-4 uppercase tracking-wider">
                  Dynamic Wallpapers
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {wallpapers.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setWallpaper(url)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                        wallpaper === url
                          ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#1e1e1e]'
                          : 'hover:scale-[1.02]'
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
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
            </div>
          </>
        );

      case 'appearance':
        return (
          <>
            <div className="sticky top-0 z-10 p-8 backdrop-blur-md">
              <h1 className="text-xl font-bold text-white">Appearance</h1>
            </div>
            <div className="px-8 pb-10 flex flex-col gap-8">
              <section>
                <p className="text-[11px] font-medium text-white/40 mb-4 uppercase tracking-wider">
                  Accent Color
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      className={`relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all ${
                        accentColor === color.value ? 'ring-2 ring-white/40' : ''
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.gradient} mx-auto mb-2`} />
                      <div className="text-sm font-medium text-white text-center">{color.name}</div>
                      {accentColor === color.value && (
                        <div className="absolute top-2 right-2 bg-white w-5 h-5 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-black text-[14px]">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
              <section className="bg-white/5 rounded-xl border border-white/5 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-white/60">info</span>
                  <span className="text-sm font-medium text-white">About Appearance</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  The accent color is used throughout the system for highlights, buttons, and interactive elements.
                  Changes will be applied immediately.
                </p>
              </section>
            </div>
          </>
        );

      default:
        return null;
    }
  };

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
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-left transition-colors ${
                activeTab === item.id ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-white/90'
              }`}
            >
              <div className={`${item.color} w-6 h-6 flex items-center justify-center rounded-md shadow-sm`}>
                <span className="material-symbols-outlined text-[14px] text-white">{item.icon}</span>
              </div>
              <span className="text-[13px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 bg-transparent overflow-y-auto">{renderContent()}</div>
    </div>
  );
};
