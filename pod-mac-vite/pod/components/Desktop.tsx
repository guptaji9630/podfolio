
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
import { PROJECTS } from '../constants';
import { AnimatePresence, motion } from 'motion/react';

const ProjectShowcase: React.FC<{ project: typeof PROJECTS[0] }> = ({ project }) => (
  <div className="flex flex-col h-full overflow-y-auto p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full uppercase tracking-wider">{project.category}</span>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold text-white mt-3 mb-2">{project.name}</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-400 text-lg max-w-2xl mx-auto">{project.description}</motion.p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex gap-3 justify-center">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all">
              <span className="material-symbols-outlined">code</span>
              <span>View Code</span>
            </a>
          )}
          {project.liveDemo && (
            <a href={project.liveDemo} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur rounded-lg border border-primary/30 text-primary hover:bg-primary/30 transition-all">
              <span className="material-symbols-outlined">launch</span>
              <span>Live Demo</span>
            </a>
          )}
        </div>
      </motion.div>

      {project.techStack && project.techStack.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech, i) => (
              <motion.span key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.05 }} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-primary/20 hover:border-primary hover:text-primary transition-all">
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Project Highlights</h3>
        <div className="space-y-3">
          {project.highlights?.map((highlight, i) => (
            <motion.div key={highlight} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
              <p className="text-gray-300 text-sm leading-relaxed">{highlight}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

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
    const project = PROJECTS.find(p => p.id === id.replace('pdfify', '1').replace('claude-proxy', '2').replace('quickdabba', '3').replace('fitforge', '4').replace('trail-mgmt', '5').replace('portfolio-os', '6'));
    
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
      case 'pdfify': return project ? <ProjectShowcase project={project} /> : null;
      case 'claude-proxy': return project ? <ProjectShowcase project={project} /> : null;
      case 'quickdabba': return project ? <ProjectShowcase project={project} /> : null;
      case 'fitforge': return project ? <ProjectShowcase project={project} /> : null;
      case 'trail-mgmt': return project ? <ProjectShowcase project={project} /> : null;
      case 'portfolio-os': return project ? <ProjectShowcase project={project} /> : null;
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
