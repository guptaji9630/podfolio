export type AppId = 'about' | 'finder' | 'mail' | 'resume' | 'settings' | 'terminal' | 'chat' | 'games' | 'dino' | 'pong';

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
