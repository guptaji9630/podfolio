import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { transitions } from '../../src/types/motion';

interface GameCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconName: string;
  highScore: number;
  onPlay: () => void;
  comingSoon?: boolean;
  delay?: number;
}

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springNormal },
  exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.15 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const GameCard: React.FC<GameCardProps> = ({ 
  id, 
  name, 
  description, 
  icon, 
  iconName,
  highScore, 
  onPlay, 
  comingSoon = false,
  delay = 0
}) => {
  return (
    <motion.div
      style={{ animationDelay: `${delay}ms` }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)', borderColor: 'var(--color-accent-primary)' }}
      className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 ${comingSoon ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-4 md:gap-6">
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${icon}`}
        >
          <span className="material-symbols-outlined text-3xl md:text-4xl text-white">{iconName}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <motion.h3
            whileHover={{ color: 'var(--color-accent-primary)' }}
            className="text-lg md:text-xl font-semibold text-white mb-2"
          >
            {name}
          </motion.h3>
          <motion.p
            className="text-white/70 text-sm md:text-base mb-4 line-clamp-2"
          >
            {description}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <motion.span
              animate={{ 
                scale: [1, 1.05, 1],
                textShadow: ['0 0 0 transparent', '0 0 10px rgba(251, 191, 36, 0.8)', '0 0 0 transparent']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-yellow-400 text-sm md:text-base font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">emoji_events</span>
              High Score: {highScore.toLocaleString()}
            </motion.span>
            <motion.button
              onClick={onPlay}
              disabled={comingSoon}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${comingSoon 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
              }`}
            >
              {comingSoon ? 'Coming Soon' : 'Play'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      <AnimatePresence>
        {comingSoon && (
          <motion.div
            key="coming-soon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center"
          >
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="text-white/50 text-sm md:text-base px-4 py-2 bg-black/30 backdrop-blur rounded-lg border border-white/10"
            >
              Coming Soon — Stay Tuned!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const getHighScore = (key: string): number => {
  try {
    return Number(localStorage.getItem(key) || '0');
  } catch {
    return 0;
  }
};

export const GamesLauncher: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const dinoHighScore = getHighScore('guptaos_dino_highscore');
  const pongClassicHighScore = getHighScore('guptaos_pong_classic_highscore');
  const pongSurvivalHighScore = getHighScore('guptaos_pong_survival_highscore');

  const handleLaunchGame = (gameId: 'dino' | 'pong') => {
    window.parent.postMessage({ 
      type: 'LAUNCH_GAME', 
      payload: { gameId } 
    }, '*');
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen failed:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const games = [
    {
      id: 'dino',
      name: 'Dino Run',
      description: "Endless runner inspired by Chrome's offline dinosaur game. Jump over cacti and duck under birds. How far can you go?",
      icon: 'bg-gradient-to-br from-amber-500 to-orange-600',
      iconName: 'dinosaur',
      highScore: dinoHighScore,
      onPlay: () => handleLaunchGame('dino'),
    },
    {
      id: 'pong',
      name: 'Pong vs AI',
      description: 'Classic Pong with an AI opponent. Choose from 4 difficulty levels and 2 game modes. Can you beat the Unbeatable AI?',
      icon: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      iconName: 'sports_tennis',
      highScore: Math.max(pongClassicHighScore, pongSurvivalHighScore),
      onPlay: () => handleLaunchGame('pong'),
    },
    {
      id: 'snake',
      name: 'Snake',
      description: 'Classic snake game. Eat food, grow longer, don\'t hit walls or yourself. High score tracking included.',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconName: 'bug_report',
      highScore: 0,
      onPlay: () => {},
      comingSoon: true,
    },
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'The timeless block-stacking puzzle. Clear lines, earn points, survive as long as possible. Multiple difficulty levels.',
      icon: 'bg-gradient-to-br from-purple-500 to-violet-600',
      iconName: 'games',
      highScore: 0,
      onPlay: () => {},
      comingSoon: true,
    },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6"
      style={{ minWidth: '400px', minHeight: '300px' }}
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-2 right-2 z-10 flex gap-1"
        style={{ pointerEvents: 'auto' }}
      >
        <motion.button
          onClick={toggleFullscreen}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
          title="Fullscreen (F11)"
        >
          <motion.span
            animate={{ scale: isFullscreen ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="material-symbols-outlined text-sm"
          >
            fullscreen_exit
          </motion.span>
          <motion.span
            animate={{ scale: isFullscreen ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="material-symbols-outlined text-sm absolute"
          >
            fullscreen
          </motion.span>
        </motion.button>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 md:mb-8"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-2"
        >
          Games
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-white/60"
        >
          Select a game to play
        </motion.p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
      >
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            {...game}
            delay={index * 100}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 pt-6 border-t border-white/10"
      >
        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-medium text-white/70 mb-4"
        >
          Keyboard Shortcuts
        </motion.h3>
        <motion.div
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"
        >
          {[
            { keys: ['Space', '↑'], desc: 'Jump (Dino)' },
            { keys: ['W', 'S'], desc: 'Move Paddle (Pong)' },
            { keys: ['P'], desc: 'Pause/Resume' },
            { keys: ['F11'], desc: 'Fullscreen' },
          ].map((shortcut, i) => (
            <motion.div
              key={shortcut.desc}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="bg-white/5 p-3 rounded-lg"
            >
              {shortcut.keys.map((key, j) => (
                <motion.kbd
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: j * 0.05 }}
                  className="px-2 py-1 bg-black/50 rounded text-white/80 inline-block"
                >
                  {key}
                </motion.kbd>
              ))}
              <span className="ml-2 text-white/60">{shortcut.desc}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};