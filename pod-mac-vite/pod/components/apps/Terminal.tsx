
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const lineVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.1 } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.1 } }
};

const cursorVariants = {
  animate: { opacity: [1, 0, 1], transition: { duration: 1, repeat: Infinity } }
};

export const Terminal: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['Welcome to GuptaOS Terminal', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('~');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCmd = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    const newHistory = [...history, `➜ ${currentPath} ${input}`];

    if (cmd === 'help') {
      newHistory.push('Available commands:');
      newHistory.push('  ls          - list directory contents');
      newHistory.push('  cd <dir>    - change directory (projects, skills, ~)');
      newHistory.push('  cat <file>  - display file contents');
      newHistory.push('  pwd         - print working directory');
      newHistory.push('  whoami      - display user info');
      newHistory.push('  contact     - show contact information');
      newHistory.push('  game        - launch games (dino, pong)');
      newHistory.push('  clear       - clear terminal screen');
    } 
    else if (cmd === 'pwd') {
      newHistory.push(currentPath === '~' ? '/home/abhishek' : `/home/abhishek/${currentPath.replace('~/', '')}`);
    }
    else if (cmd === 'ls') {
      if (currentPath === '~') {
        newHistory.push('projects/  skills/  resume.pdf  contact.txt');
      } else if (currentPath === '~/projects') {
        newHistory.push('trail-management-system/  fitforge/');
      } else if (currentPath === '~/skills') {
        newHistory.push('qa-testing.txt  development.txt  tools.txt');
      }
    }
    else if (cmd.startsWith('cd ')) {
      const dir = cmd.substring(3).trim();
      if (dir === '~' || dir === '/') {
        setCurrentPath('~');
        newHistory.push('');
      } else if (dir === 'projects' && currentPath === '~') {
        setCurrentPath('~/projects');
        newHistory.push('');
      } else if (dir === 'skills' && currentPath === '~') {
        setCurrentPath('~/skills');
        newHistory.push('');
      } else if (dir === '..') {
        if (currentPath !== '~') {
          setCurrentPath('~');
          newHistory.push('');
        }
      } else {
        newHistory.push(`cd: no such directory: ${dir}`);
      }
    }
    else if (cmd.startsWith('cat ')) {
      const file = cmd.substring(4).trim();
      
      if (file === 'resume.pdf' || file === 'resume') {
        newHistory.push('');
        newHistory.push('=== RESUME ===');
        newHistory.push('Abhishek Gupta');
        newHistory.push('Quality Assurance Engineer | Software Tester');
        newHistory.push('Email: abhishekg9630@gmail.com | Phone: +91-9560934582');
        newHistory.push('');
        newHistory.push('EXPERIENCE:');
        newHistory.push('• Associate Engineer (QA) - Successive Digital (May 2025 - Nov 2025)');
        newHistory.push('• Software Engineer Trainee - Successive Digital');
        newHistory.push('• Freelance Web Developer (May 2023 - Mar 2024)');
        newHistory.push('');
        newHistory.push('SKILLS: Manual Testing, Automated Testing, Jest, Playwright,');
        newHistory.push('Selenium, Cypress, API Testing, MERN Stack, React Native');
        newHistory.push('');
        newHistory.push('Use "cd projects" or "cd skills" for more details.');
      }
      else if (file === 'contact.txt' || file === 'contact') {
        newHistory.push('Email: abhishekg9630@gmail.com');
        newHistory.push('Phone: +91-9560934582');
        newHistory.push('LinkedIn: linkedin.com/in/abhishek');
        newHistory.push('Location: Delhi, India');
      }
      else if (file === 'qa-testing.txt' && currentPath === '~/skills') {
        newHistory.push('QA & Testing Skills:');
        newHistory.push('• Manual Testing');
        newHistory.push('• Automated Testing');
        newHistory.push('• Bug Reporting & Test Cases');
        newHistory.push('• Jest, Playwright, Selenium, Cypress');
        newHistory.push('• API Testing');
        newHistory.push('• Regression Testing, Smoke Testing');
      }
      else if (file === 'development.txt' && currentPath === '~/skills') {
        newHistory.push('Development Skills:');
        newHistory.push('• JavaScript, React Native, Node.js');
        newHistory.push('• HTML, CSS, TypeScript');
        newHistory.push('• MERN Stack (MongoDB, Express, React, Node)');
        newHistory.push('• Next.js, GraphQL');
      }
      else if (file === 'tools.txt' && currentPath === '~/skills') {
        newHistory.push('Tools & Technologies:');
        newHistory.push('• Git, GitHub');
        newHistory.push('• MongoDB, MySQL');
        newHistory.push('• Postman, VS Code');
        newHistory.push('• Android Development');
        newHistory.push('• C++, Python');
      }
      else if (file === 'trail-management-system' || file === 'trail-management-system/' && currentPath === '~/projects') {
        newHistory.push('');
        newHistory.push('Project: Trail Management System - Agmatix');
        newHistory.push('Role: QA Tester');
        newHistory.push('');
        newHistory.push('Description:');
        newHistory.push('• Tested core features to ensure smooth data flow');
        newHistory.push('• Reported bugs with clear reproduction steps');
        newHistory.push('• Improved system quality and stability');
        newHistory.push('• Validated functionality after each update');
      }
      else if (file === 'fitforge' || file === 'fitforge/' && currentPath === '~/projects') {
        newHistory.push('');
        newHistory.push('Project: FitForge - The Fitness Tracker');
        newHistory.push('Role: Full Stack Developer');
        newHistory.push('');
        newHistory.push('Description:');
        newHistory.push('• Developed full stack web app using MERN stack');
        newHistory.push('• Analytical workout data with progress photos');
        newHistory.push('• Technologies: MongoDB, Express, React, Node.js, GraphQL');
      }
      else {
        newHistory.push(`cat: ${file}: No such file or directory`);
      }
    }
    else if (cmd === 'whoami') {
      newHistory.push('Abhishek Gupta: Quality Assurance Engineer | Software Tester');
    }
    else if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    }
    else if (cmd === 'contact') {
      newHistory.push('Contact me at abhishekg9630@gmail.com');
      newHistory.push('Phone: +91-9560934582');
    }
    else if (cmd === 'game') {
      newHistory.push('Usage: game <command>');
      newHistory.push('  game list                 - Show available games with high scores');
      newHistory.push('  game dino                 - Launch Dino Run');
      newHistory.push('  game pong [classic|survival] - Launch Pong with mode');
      newHistory.push('  game help                 - Show this help');
    }
    else if (cmd.startsWith('game ')) {
      const gameCmd = cmd.substring(5).trim();
      if (gameCmd === 'list') {
        const dinoHighScore = Number(localStorage.getItem('guptaos_dino_highscore') || '0');
        const pongClassicHighScore = Number(localStorage.getItem('guptaos_pong_classic_highscore') || '0');
        const pongSurvivalHighScore = Number(localStorage.getItem('guptaos_pong_survival_highscore') || '0');
        newHistory.push('Available games:');
        newHistory.push(`  dino        - Dino Run (endless runner)          High: ${dinoHighScore.toLocaleString()}`);
        newHistory.push(`  pong        - Pong vs AI (classic/survival)     High: ${pongClassicHighScore} / ${pongSurvivalHighScore}`);
        newHistory.push('');
        newHistory.push('Usage: game <name> [mode]');
        newHistory.push('  game dino                  - Launch Dino Run');
        newHistory.push('  game pong                  - Launch Pong (classic mode)');
        newHistory.push('  game pong classic          - Launch Pong Classic (first to 10)');
        newHistory.push('  game pong survival         - Launch Pong Survival (60s)');
      } else if (gameCmd === 'dino') {
        newHistory.push('Launching Dino Run...');
        window.parent.postMessage({ type: 'LAUNCH_GAME', payload: { gameId: 'dino' } }, '*');
      } else if (gameCmd === 'pong' || gameCmd.startsWith('pong ')) {
        const mode = gameCmd === 'pong' ? 'classic' : gameCmd.substring(5).trim();
        const validMode = ['classic', 'survival'].includes(mode) ? mode : 'classic';
        newHistory.push(`Launching Pong (${validMode} mode)...`);
        window.parent.postMessage({ type: 'LAUNCH_GAME', payload: { gameId: 'pong', mode: validMode } }, '*');
      } else if (gameCmd === 'help') {
        newHistory.push('Game commands:');
        newHistory.push('  game list                 - Show available games with high scores');
        newHistory.push('  game dino                 - Launch Dino Run');
        newHistory.push('  game pong [classic|survival] - Launch Pong with mode');
        newHistory.push('  game help                 - Show this help');
      } else {
        newHistory.push(`Unknown game: ${gameCmd}. Type "game list" for available games.`);
      }
    }
    else if (cmd) {
      newHistory.push(`Command not found: ${cmd}. Type "help" for available commands.`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 bg-black/95 p-3 md:p-4 font-mono text-xs md:text-sm overflow-y-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <AnimatePresence mode="popLayout">
        {history.map((l, i) => (
          <motion.div
            key={`${i}-${l}`}
            variants={lineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-gray-300 mb-0.5 whitespace-pre-wrap break-all"
          >
            {l}
          </motion.div>
        ))}
      </AnimatePresence>
      <form onSubmit={handleCmd} className="flex gap-2">
        <motion.span
          variants={cursorVariants}
          className="text-green-500 font-bold shrink-0"
        >
          ➜
        </motion.span>
        <span className="text-blue-400 font-bold shrink-0">{currentPath}</span>
        <input 
          ref={inputRef}
          autoFocus 
          className="bg-transparent border-none outline-none flex-1 text-white caret-primary min-w-0" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          spellCheck="false" 
          autoComplete="off"
        />
      </form>
      <div ref={endRef} />
    </motion.div>
  );
};
