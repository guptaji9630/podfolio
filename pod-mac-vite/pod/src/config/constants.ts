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
  },
  {
    id: '3',
    name: 'AI Test Case Generator',
    category: 'AI/ML Development',
    date: '2025',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070',
    description: 'Built an AI-powered tool that automatically generates comprehensive test cases from requirement documents using LLMs. Integrates with GitHub Actions for CI/CD pipeline test generation.',
    techStack: ['Python', 'FastAPI', 'OpenAI API', 'LangChain', 'GitHub Actions', 'Docker'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Automated test case generation from requirements', 'LLM prompt engineering for QA', 'CI/CD integration', 'Reduced test writing time by 60%']
  },
  {
    id: '4',
    name: 'Smart Bug Triage Assistant',
    category: 'AI/ML Development',
    date: '2025',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070',
    description: 'Developed an intelligent bug classification system using NLP and ML to automatically categorize, prioritize, and assign bugs to relevant teams. Integrated with Jira and Slack.',
    techStack: ['Python', 'scikit-learn', 'Transformers', 'Jira API', 'Slack Bot', 'FastAPI'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Auto bug classification & prioritization', 'NLP-based duplicate detection', 'Jira/Slack integration', 'Improved triage accuracy by 40%']
  },
  {
    id: '5',
    name: 'AI-Powered Test Data Generator',
    category: 'AI/ML Development',
    date: '2024',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=2070',
    description: 'Created a synthetic test data generation tool using GANs and LLMs to produce realistic test datasets for various domains (finance, healthcare, e-commerce). Supports schema-aware generation.',
    techStack: ['Python', 'PyTorch', 'LangChain', 'Faker.js', 'PostgreSQL', 'Docker'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Schema-aware synthetic data generation', 'GAN + LLM hybrid approach', 'Privacy-compliant test data', 'Supports multiple data domains']
  },
  {
    id: '6',
    name: 'Automated Code Review Bot',
    category: 'AI/ML Development',
    date: '2024',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2070',
    description: 'Built a GitHub App that uses LLMs to perform automated code reviews - checking for bugs, security issues, code style, and suggesting improvements. Integrated with GitHub Checks API.',
    techStack: ['TypeScript', 'Node.js', 'GitHub API', 'OpenAI API', 'Probot', 'ESLint'],
    githubUrl: '#',
    liveDemo: '#',
    featured: true,
    highlights: ['Automated PR code reviews', 'Security vulnerability detection', 'Style & best practice enforcement', 'GitHub Checks API integration']
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
