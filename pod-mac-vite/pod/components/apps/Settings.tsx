
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from '../../src/types/motion';

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

const menuItems = [
  { id: 'wifi' as const, label: 'Wi-Fi', icon: 'wifi', color: 'bg-blue-500' },
  { id: 'bluetooth' as const, label: 'Bluetooth', icon: 'bluetooth', color: 'bg-blue-600' },
  { id: 'wallpaper' as const, label: 'Wallpaper', icon: 'image', color: 'bg-sky-500' },
] as const;

const accentColors = [
  { name: 'Blue', value: '#0a84ff', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Purple', value: '#bf5af2', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Pink', value: '#ff2d55', gradient: 'from-pink-500 to-pink-600' },
  { name: 'Red', value: '#ff3b30', gradient: 'from-red-500 to-red-600' },
  { name: 'Orange', value: '#ff9500', gradient: 'from-orange-500 to-orange-600' },
  { name: 'Green', value: '#34c759', gradient: 'from-green-500 to-green-600' },
];

const tabVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.springNormal },
  exit: { opacity: 0, x: 20, transition: transitions.springNormal }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: transitions.springNormal }
};

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

  const renderContent = () => {
    switch (activeTab) {
      case 'wifi':
        return (
          <motion.div
            key="wifi"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <motion.div
              className="sticky top-0 z-10 p-4 md:p-8 backdrop-blur-md"
              whileHover={{ scale: 1.02 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white"
              >
                Wi-Fi
              </motion.h1>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              className="px-4 md:px-8 pb-10 flex flex-col gap-6"
            >
              <motion.section
                variants={itemVariants}
                className="glass-card rounded-xl border border-white/5 p-5"
                whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center mb-6"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Wi-Fi</span>
                    <span className="text-[11px] text-white/40">
                      {wifiEnabled ? 'Connected to Network' : 'Disabled'}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setWifiEnabled(!wifiEnabled)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-colors ${
                      wifiEnabled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: wifiEnabled ? 14 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="w-5 h-5 bg-white rounded-full"
                    />
                  </motion.button>
                </motion.div>
                <AnimatePresence mode="popLayout">
                  {wifiEnabled && (
                    <motion.div
                      key="network"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      className="space-y-2"
                    >
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-primary">wifi</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">Portfolio Network</div>
                          <div className="text-xs text-white/40">Connected</div>
                        </div>
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="material-symbols-outlined text-white/60"
                        >
                          check_circle
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </motion.div>
          </motion.div>
        );

      case 'bluetooth':
        return (
          <motion.div
            key="bluetooth"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <motion.div
              className="sticky top-0 z-10 p-4 md:p-8 backdrop-blur-md"
            >
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white"
              >
                Bluetooth
              </motion.h1>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              className="px-4 md:px-8 pb-10 flex flex-col gap-6"
            >
              <motion.section
                variants={itemVariants}
                className="glass-card rounded-xl border border-white/5 p-5"
                whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center mb-6"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">Bluetooth</span>
                    <span className="text-[11px] text-white/40">
                      {bluetoothEnabled ? 'Discoverable as "Portfolio Mac"' : 'Disabled'}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-colors ${
                      bluetoothEnabled ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <motion.div
                      animate={{ x: bluetoothEnabled ? 14 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="w-5 h-5 bg-white rounded-full"
                    />
                  </motion.button>
                </motion.div>
                <AnimatePresence mode="popLayout">
                  {bluetoothEnabled && (
                    <motion.div
                      key="devices"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    >
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] font-medium text-white/40 mb-3 uppercase tracking-wider"
                      >
                        Nearby Devices
                      </motion.p>
                      {BLUETOOTH_DEVICES.map((device, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                        >
                          <motion.span
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="material-symbols-outlined text-primary"
                          >
                            {device.icon}
                          </motion.span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{device.name}</div>
                            <div className="text-xs text-white/40">{device.status}</div>
                          </div>
                          {device.status === 'Connected' && (
                            <motion.span
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                              className="material-symbols-outlined text-white/60"
                            >
                              check_circle
                            </motion.span>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </motion.div>
          </motion.div>
        );

      case 'wallpaper':
        return (
          <motion.div
            key="wallpaper"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <motion.div
              className="sticky top-0 z-10 p-4 md:p-8 backdrop-blur-md"
            >
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white"
              >
                Wallpaper
              </motion.h1>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              className="px-4 md:px-8 pb-10 flex flex-col gap-6 md:gap-8"
            >
              <motion.section
                variants={itemVariants}
              >
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-medium text-white/40 mb-4 uppercase tracking-wider"
                >
                  Dynamic Wallpapers
                </motion.p>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                  {wallpapers.map((url, i) => (
                    <motion.div
                      key={i}
                      onClick={() => setWallpaper(url)}
                      whileHover={{ scale: 1.03, y: -4, boxShadow: 'var(--shadow-xl)' }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group ${
                        wallpaper === url
                          ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#1e1e1e]'
                          : ''
                      }`}
                    >
                      <motion.img
                        src={url}
                        className="w-full h-full object-cover transition-transform duration-700"
                        whileHover={{ scale: 1.08 }}
                        alt=""
                      />
                      <motion.div
                        animate={{ opacity: wallpaper === url ? 1 : 0 }}
                        className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"
                      />
                      <AnimatePresence>
                        {wallpaper === url && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute bottom-2 right-2 bg-primary w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="material-symbols-outlined text-white text-[16px]">check</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            </motion.div>
          </motion.div>
        );

      case 'appearance':
        return (
          <motion.div
            key="appearance"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <motion.div
              className="sticky top-0 z-10 p-4 md:p-8 backdrop-blur-md"
            >
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-white"
              >
                Appearance
              </motion.h1>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              className="px-4 md:px-8 pb-10 flex flex-col gap-6 md:gap-8"
            >
              <motion.section
                variants={itemVariants}
              >
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-medium text-white/40 mb-4 uppercase tracking-wider"
                >
                  Accent Color
                </motion.p>
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4"
                >
                  {accentColors.map((color) => (
                    <motion.button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      whileHover={{ scale: 1.08, y: -3, boxShadow: 'var(--shadow-lg)' }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all ${
                        accentColor === color.value ? 'ring-2 ring-white/40' : ''
                      }`}
                    >
                      <motion.div
                        animate={{ scale: accentColor === color.value ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.gradient} mx-auto mb-2`}
                      />
                      <motion.div
                        className="text-sm font-medium text-white text-center"
                      >
                        {color.name}
                      </motion.div>
                      <AnimatePresence>
                        {accentColor === color.value && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-2 right-2 bg-white w-5 h-5 rounded-full flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-black text-[14px]">check</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.section>
              <motion.section
                variants={itemVariants}
                className="glass-card rounded-xl border border-white/5 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-white/60">info</span>
                  <span className="text-sm font-medium text-white">About Appearance</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  The accent color is used throughout the system for highlights, buttons, and interactive elements.
                  Changes will be applied immediately.
                </p>
              </motion.section>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-16 md:w-64 bg-black/20 border-r border-white/10 flex flex-col pt-4 px-2 md:px-4 gap-4 shrink-0"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 px-2 md:px-3 py-3 mb-4 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
          whileHover={{ x: 5 }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-white text-sm font-medium leading-tight">Visitor</span>
            <span className="text-white/40 text-xs">Apple ID</span>
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, staggerChildren: 0.05 }}
          className="flex flex-col gap-1"
        >
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ x: 5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-1.5 rounded-lg text-left transition-colors ${
                activeTab === item.id ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-white/90'
              }`}
              title={item.label}
            >
              <motion.div
                animate={{ 
                  scale: activeTab === item.id ? 1.1 : 1,
                  rotate: activeTab === item.id ? [0, -5, 5, 0] : 0
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`${item.color} w-6 h-6 flex items-center justify-center rounded-md shadow-sm shrink-0`}
              >
                <span className="material-symbols-outlined text-[14px] text-white">{item.icon}</span>
              </motion.div>
              <span className="hidden md:inline text-[13px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </motion.nav>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-transparent overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
