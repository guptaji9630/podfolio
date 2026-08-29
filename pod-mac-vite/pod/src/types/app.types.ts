export type AppId = 'about' | 'finder' | 'mail' | 'resume' | 'settings' | 'terminal' | 'chat' | 'games' | 'dino' | 'pong' | 'pdfify' | 'claude-proxy' | 'quickdabba' | 'fitforge' | 'trail-mgmt' | 'portfolio-os';

export interface AppWindow {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  date: string;
  image: string;
  description: string;
  techStack?: string[];
  githubUrl?: string;
  liveDemo?: string;
  featured?: boolean;
  highlights?: string[];
}
