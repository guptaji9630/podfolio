import React, { useEffect, useRef, useState } from 'react';
import { storage } from '../../src/utils/storage';

interface GameCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  highScore: number;
  onPlay: () => void;
  comingSoon?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ 
  id, 
  name, 
  description, 
  icon, 
  highScore, 
  onPlay, 
  comingSoon = false 
}) => {
  return (
    <div className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 ${comingSoon ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-4 md:gap-6">
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${icon}`}>
          <span className="material-symbols-outlined text-3xl md:text-4xl text-white">sports_esports</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{name}</h3>
          <p className="text-white/70 text-sm md:text-base mb-4 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 text-sm md:text-base font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-base">emoji_events</span>
              High Score: {highScore.toLocaleString()}
            </span>
            <button
              onClick={onPlay}
              disabled={comingSoon}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${comingSoon 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95'
              }`}
            >
              {comingSoon ? 'Coming Soon' : 'Play'}
            </button>
          </div>
        </div>
      </div>
      {comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
          <span className="text-white/50 text-sm md:text-base px-4 py-2 bg-black/30 backdrop-blur rounded-lg border border-white/10">
             coming soon on this website stay tuned!
             </span>
        </div>
      )}
    </div>
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

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6"
      style={{ minWidth: '400px', minHeight: '300px' }}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-1" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={toggleFullscreen}
          className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
          title="Fullscreen (F11)"
        >
          <span className="material-symbols-outlined text-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
      </div>
      
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Games</h1>
        <p className="text-white/60">Select a game to play</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <GameCard
          id="dino"
          name="Dino Run"
          description="Endless runner inspired by Chrome's offline dinosaur game. Jump over cacti and duck under birds. How far can you go?"
          icon="bg-gradient-to-br from-amber-500 to-orange-600"
          highScore={dinoHighScore}
          onPlay={() => handleLaunchGame('dino')}
        />
        <GameCard
          id="pong"
          name="Pong vs AI"
          description="Classic Pong with an AI opponent. Choose from 4 difficulty levels and 2 game modes. Can you beat the Unbeatable AI?"
          icon="bg-gradient-to-br from-cyan-500 to-blue-600"
          highScore={Math.max(pongClassicHighScore, pongSurvivalHighScore)}
          onPlay={() => handleLaunchGame('pong')}
        />
        <GameCard
          id="snake"
          name="Snake"
          description="Classic snake game. Eat food, grow longer, don't hit walls or yourself. High score tracking included."
          icon="bg-gradient-to-br from-green-500 to-emerald-600"
          highScore={0}
          onPlay={() => {}}
          comingSoon
        />
        <GameCard
          id="tetris"
          name="Tetris"
          description="The timeless block-stacking puzzle. Clear lines, earn points, survive as long as possible. Multiple difficulty levels."
          icon="bg-gradient-to-br from-purple-500 to-violet-600"
          highScore={0}
          onPlay={() => {}}
          comingSoon
        />
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-lg font-medium text-white/70 mb-4">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white/5 p-3 rounded-lg"><kbd className="px-2 py-1 bg-black/50 rounded text-white/80">Space</kbd> / <kbd className="px-2 py-1 bg-black/50 rounded text-white/80">↑</kbd> <span className="ml-2 text-white/60">Jump (Dino)</span></div>
          <div className="bg-white/5 p-3 rounded-lg"><kbd className="px-2 py-1 bg-black/50 rounded text-white/80">W</kbd> / <kbd className="px-2 py-1 bg-black/50 rounded text-white/80">S</kbd> <span className="ml-2 text-white/60">Move Paddle (Pong)</span></div>
          <div className="bg-white/5 p-3 rounded-lg"><kbd className="px-2 py-1 bg-black/50 rounded text-white/80">P</kbd> <span className="ml-2 text-white/60">Pause/Resume</span></div>
          <div className="bg-white/5 p-3 rounded-lg"><kbd className="px-2 py-1 bg-black/50 rounded text-white/80">F11</kbd> <span className="ml-2 text-white/60">Fullscreen</span></div>
        </div>
      </div>
    </div>
  );
};