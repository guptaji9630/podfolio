
export type AppId = 'about' | 'finder' | 'mail' | 'resume' | 'settings' | 'terminal' | 'chat';

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
}
