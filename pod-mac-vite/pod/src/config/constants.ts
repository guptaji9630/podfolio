import { Project } from '../types';

export const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Trail Management System - Agmatix',
    category: 'QA Testing',
    date: '2025',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070',
    description: 'Tested core features to ensure smooth data flow and reliable performance. Reported bugs with clear steps and improved system quality. Validated stability and usability after each update.',
    techStack: ['Manual Testing', 'Bug Reporting', 'Regression Testing', 'Test Cases'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Core feature testing', 'Bug reporting', 'Stability validation', 'Usability testing']
  },
  {
    id: '2',
    name: 'FitForge - The Fitness Tracker',
    category: 'Full Stack Development',
    date: '2025',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2070',
    description: 'Developed full stack web app using MERN stack. Shows analytical workout data with progress photo feature.',
    techStack: ['MERN', 'GraphQL', 'MongoDB', 'React', 'Node.js'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Full stack MERN development', 'Workout analytics', 'Progress photo tracking', 'GraphQL API']
  }
];

export const WALLPAPERS = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2064',
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2029'
];

export const CONTACT_EMAIL = 'abhishekg9630@gmail.com';

export const TERMINAL_COMMANDS = {
  HELP: 'ls, whoami, clear, contact, projects, skills',
  LS: 'projects/  skills/  resume.pdf',
  WHOAMI: 'Abhishek Gupta: Software Engineer & Tester',
  CONTACT: `Contact me at ${CONTACT_EMAIL}`,
  PROJECTS: 'Loading projects...\n' + PROJECTS.map(p => `  ${p.name} (${p.category})`).join('\n'),
  SKILLS: 'React, TypeScript, Node.js, Testing, UI/UX',
} as const;
