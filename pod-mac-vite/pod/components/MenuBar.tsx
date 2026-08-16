
import React, { useState, useEffect } from 'react';
import { Z_INDEX } from '../src/config/zIndex';

interface MenuBarProps {
  activeAppTitle: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ activeAppTitle }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-3 md:px-4 py-1 bg-black/30 backdrop-blur-md border-b border-white/5 text-[12px] md:text-[13px] font-medium h-7 md:h-8 select-none" style={{ zIndex: Z_INDEX.HEADER }}>
      <div className="flex items-center gap-3 md:gap-5">
        <button className="flex items-center justify-center text-white hover:text-gray-200">
          <span className="material-symbols-outlined text-[16px] md:text-[18px] font-bold">token</span>
        </button>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="font-bold text-white truncate max-w-[120px] md:max-w-none">{activeAppTitle}</span>
          <span className="cursor-default hover:text-gray-200 text-white/90 hidden lg:block">File</span>
          <span className="cursor-default hover:text-gray-200 text-white/90 hidden lg:block">Edit</span>
          <span className="cursor-default hover:text-gray-200 text-white/90 hidden lg:block">View</span>
          <span className="cursor-default hover:text-gray-200 text-white/90 hidden lg:block">Window</span>
          <span className="cursor-default hover:text-gray-200 text-white/90 hidden xl:block">Help</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 text-white/90">
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">bluetooth</span>
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">wifi</span>
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">battery_full</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="material-symbols-outlined text-[14px] md:text-[16px] hidden sm:block">search</span>
          <span className="material-symbols-outlined text-[14px] md:text-[16px] hidden sm:block">control_point</span>
          <span className="text-[11px] md:text-[13px] tracking-wide">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
};
