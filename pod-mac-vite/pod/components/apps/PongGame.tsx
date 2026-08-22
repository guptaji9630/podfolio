import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../../src/utils/sound';
import { chatService } from '../../src/services/chatService';
import { transitions } from '../../src/types/motion';

type GameMode = 'classic' | 'survival';
type Difficulty = 'easy' | 'medium' | 'hard' | 'unbeatable';

interface DifficultyConfig {
  reactionDelay: number;
  errorMargin: number;
  predictionLevel: number;
  speedMultiplier: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { reactionDelay: 300, errorMargin: 0.3, predictionLevel: 0, speedMultiplier: 0.8 },
  medium: { reactionDelay: 150, errorMargin: 0.15, predictionLevel: 1, speedMultiplier: 1.0 },
  hard: { reactionDelay: 50, errorMargin: 0.05, predictionLevel: 2, speedMultiplier: 1.3 },
  unbeatable: { reactionDelay: 0, errorMargin: 0, predictionLevel: 3, speedMultiplier: 1.5 },
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_WIDTH = 16;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 16;
const PLAYER_X = 40;
const AI_X = GAME_WIDTH - 40 - PADDLE_WIDTH;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 18;
const WINNING_SCORE = 10;
const SURVIVAL_TIME = 60;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface AIState {
  lastDecisionTime: number;
  targetY: number;
  currentStrategy: 'aggressive' | 'defensive' | 'center' | null;
  strategyEndTime: number;
}

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springNormal },
  exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.15 } }
};

const buttonVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitions.springNormal },
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 }
};

const titleVariants = {
  initial: { opacity: 0, y: -30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springNormal }
};

export const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const aiFrameCounterRef = useRef<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [gameState, setGameState] = useState<'setup' | 'menu' | 'playing' | 'paused' | 'gameover'>('setup');
  const [mode, setMode] = useState<GameMode>(() => 
    (sessionStorage.getItem('pong_mode') as GameMode) || 'classic'
  );
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [highScoreClassic, setHighScoreClassic] = useState(() => 
    Number(localStorage.getItem('guptaos_pong_classic_highscore') || '0')
  );
  const [highScoreSurvival, setHighScoreSurvival] = useState(() => 
    Number(localStorage.getItem('guptaos_pong_survival_highscore') || '0')
  );
  const [timeLeft, setTimeLeft] = useState(SURVIVAL_TIME);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileBanner, setShowMobileBanner] = useState(false);
  const [aiPersonalityActive, setAiPersonalityActive] = useState(false);
  const [canvasHovered, setCanvasHovered] = useState(false);
  
  const paddlePlayerRef = useRef(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const paddleAIRef = useRef(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ballRef = useRef<Ball>({
    x: GAME_WIDTH / 2 - BALL_SIZE / 2,
    y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
    vx: INITIAL_BALL_SPEED,
    vy: 0,
    speed: INITIAL_BALL_SPEED,
  });
  const particlesRef = useRef<Particle[]>([]);
  const aiStateRef = useRef<AIState>({
    lastDecisionTime: 0,
    targetY: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    currentStrategy: null,
    strategyEndTime: 0,
  });

  const FIXED_TIMESTEP = 1000 / 60;
  const MAX_ACCUMULATOR = 200;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
      setIsMobile(mobile);
      if (mobile) setShowMobileBanner(true);
    };
    checkMobile();
  }, []);

  const resetBall = useCallback((towardsPlayer: boolean) => {
    ballRef.current = {
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
      vx: (towardsPlayer ? -1 : 1) * INITIAL_BALL_SPEED,
      vy: (Math.random() - 0.5) * 4,
      speed: INITIAL_BALL_SPEED,
    };
  }, []);

  const resetGame = useCallback(() => {
    paddlePlayerRef.current = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    paddleAIRef.current = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(Math.random() > 0.5);
    setPlayerScore(0);
    setAiScore(0);
    setTimeLeft(SURVIVAL_TIME);
    aiStateRef.current = {
      lastDecisionTime: 0,
      targetY: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      currentStrategy: null,
      strategyEndTime: 0,
    };
    particlesRef.current = [];
    setGameState('playing');
  }, [resetBall]);

  const createParticles = useCallback((x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 5 + 2,
      });
    }
  }, []);

  const updateParticles = useCallback((dt: number) => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.life -= dt / 1000;
      p.x += p.vx * dt / 16;
      p.y += p.vy * dt / 16;
      p.vx *= 0.98;
      p.vy *= 0.98;
      return p.life > 0;
    });
  }, []);

  const predictBallY = useCallback((ball: Ball, predictionLevel: number): number => {
    let simX = ball.x;
    let simY = ball.y;
    let simVx = ball.vx;
    let simVy = ball.vy;

    while (simX > 0 && simX < GAME_WIDTH) {
      simX += simVx;
      simY += simVy;

      if (simY <= 0) {
        simY = -simY;
        simVy = -simVy;
      } else if (simY + BALL_SIZE >= GAME_HEIGHT) {
        simY = 2 * (GAME_HEIGHT - BALL_SIZE) - simY;
        simVy = -simVy;
      }

      if (predictionLevel >= 2 && simX <= AI_X + PADDLE_WIDTH && simX >= AI_X) {
        const paddleCenter = paddleAIRef.current + PADDLE_HEIGHT / 2;
        if (Math.abs(simY + BALL_SIZE / 2 - paddleCenter) < PADDLE_HEIGHT / 2) {
          simVx = -simVx * 1.02;
          simX = AI_X + PADDLE_WIDTH;
        }
      }
    }

    return Math.max(0, Math.min(GAME_HEIGHT, simY));
  }, []);

  const getAIMove = useCallback((dt: number) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const ball = ballRef.current;
    const ai = aiStateRef.current;
    const now = Date.now();

    if (ball.vx > 0) {
      if (now - ai.lastDecisionTime >= config.reactionDelay) {
        let targetY: number;
        
        if (config.predictionLevel >= 1) {
          targetY = predictBallY(ball, config.predictionLevel);
        } else {
          targetY = ball.y + BALL_SIZE / 2;
        }

        const error = (Math.random() - 0.5) * 2 * config.errorMargin * GAME_HEIGHT;
        targetY += error;

        if (ai.currentStrategy === 'aggressive') {
          targetY -= 30;
        } else if (ai.currentStrategy === 'defensive') {
          targetY += 30;
        } else if (ai.currentStrategy === 'center') {
          targetY = GAME_HEIGHT / 2;
        }

        ai.targetY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, targetY - PADDLE_HEIGHT / 2));
        ai.lastDecisionTime = now;
      }
    } else {
      ai.targetY = GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2;
      ai.lastDecisionTime = now;
    }

    const diff = ai.targetY - paddleAIRef.current;
    const maxMove = config.speedMultiplier * 8 * dt / 16;
    
    if (Math.abs(diff) > maxMove) {
      paddleAIRef.current += Math.sign(diff) * maxMove;
    } else {
      paddleAIRef.current = ai.targetY;
    }

    paddleAIRef.current = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, paddleAIRef.current));
  }, [difficulty, predictBallY]);

  const requestAIPersonality = useCallback(async () => {
    if (aiPersonalityActive) return;
    
    setAiPersonalityActive(true);
    try {
      const prompt = `You are a Pong AI opponent. Current game state:
- Ball position: (${ballRef.current.x.toFixed(0)}, ${ballRef.current.y.toFixed(0)})
- Ball velocity: (${ballRef.current.vx.toFixed(1)}, ${ballRef.current.vy.toFixed(1)})
- Ball speed: ${ballRef.current.speed.toFixed(1)}
- Your paddle Y: ${paddleAIRef.current.toFixed(0)} (center: ${(paddleAIRef.current + PADDLE_HEIGHT / 2).toFixed(0)})
- Player paddle Y: ${paddlePlayerRef.current.toFixed(0)} (center: ${(paddlePlayerRef.current + PADDLE_HEIGHT / 2).toFixed(0)})
- Score: AI ${aiScore} - Player ${playerScore}
- Mode: ${mode}${mode === 'survival' ? `, Time: ${timeLeft}s` : `, First to ${WINNING_SCORE}`}
- Difficulty: ${difficulty}

Suggest a brief strategy for the next few seconds: "aggressive" (attack), "defensive" (block), or "center" (control middle). Reply with ONLY one word.`;

      const response = await chatService.sendMessage([{ role: 'user', content: prompt }]);
      const strategy = response.message.toLowerCase().trim();
      
      const ai = aiStateRef.current;
      if (strategy.includes('aggressive')) ai.currentStrategy = 'aggressive';
      else if (strategy.includes('defensive')) ai.currentStrategy = 'defensive';
      else if (strategy.includes('center')) ai.currentStrategy = 'center';
      else ai.currentStrategy = null;
      
      ai.strategyEndTime = Date.now() + 3000;
    } catch (err) {
      console.warn('AI personality request failed:', err);
      aiStateRef.current.currentStrategy = null;
    } finally {
      setAiPersonalityActive(false);
    }
  }, [mode, difficulty, aiScore, playerScore, timeLeft, aiPersonalityActive]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    accumulatorRef.current = Math.min(accumulatorRef.current + dt, MAX_ACCUMULATOR);

    while (accumulatorRef.current >= FIXED_TIMESTEP) {
      if (gameState === 'playing') {
        const ball = ballRef.current;
        const config = DIFFICULTY_CONFIGS[difficulty];

        ball.x += ball.vx * FIXED_TIMESTEP / 16;
        ball.y += ball.vy * FIXED_TIMESTEP / 16;

        if (ball.y <= 0) {
          ball.y = 0;
          ball.vy = -ball.vy;
          soundManager.playWallHit('pong');
          createParticles(ball.x + BALL_SIZE / 2, 0, 5, '#fff');
        } else if (ball.y + BALL_SIZE >= GAME_HEIGHT) {
          ball.y = GAME_HEIGHT - BALL_SIZE;
          ball.vy = -ball.vy;
          soundManager.playWallHit('pong');
          createParticles(ball.x + BALL_SIZE / 2, GAME_HEIGHT, 5, '#fff');
        }

        if (ball.vx < 0 && 
            ball.x <= PLAYER_X + PADDLE_WIDTH &&
            ball.x + BALL_SIZE >= PLAYER_X &&
            ball.y + BALL_SIZE >= paddlePlayerRef.current &&
            ball.y <= paddlePlayerRef.current + PADDLE_HEIGHT) {
          ball.x = PLAYER_X + PADDLE_WIDTH;
          ball.vx = -ball.vx;
          const hitPos = (ball.y + BALL_SIZE / 2 - paddlePlayerRef.current) / PADDLE_HEIGHT - 0.5;
          ball.vy = hitPos * 8;
          ball.speed = Math.min(ball.speed * 1.05, MAX_BALL_SPEED);
          const speedRatio = ball.speed / Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx *= speedRatio;
          ball.vy *= speedRatio;
          soundManager.playPaddleHit('pong');
          createParticles(PLAYER_X + PADDLE_WIDTH, ball.y + BALL_SIZE / 2, 8, '#00ffff');
        }

        if (ball.vx > 0 &&
            ball.x + BALL_SIZE >= AI_X &&
            ball.x <= AI_X + PADDLE_WIDTH &&
            ball.y + BALL_SIZE >= paddleAIRef.current &&
            ball.y <= paddleAIRef.current + PADDLE_HEIGHT) {
          ball.x = AI_X - BALL_SIZE;
          ball.vx = -ball.vx;
          const hitPos = (ball.y + BALL_SIZE / 2 - paddleAIRef.current) / PADDLE_HEIGHT - 0.5;
          ball.vy = hitPos * 8;
          ball.speed = Math.min(ball.speed * 1.05, MAX_BALL_SPEED);
          const speedRatio = ball.speed / Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx *= speedRatio;
          ball.vy *= speedRatio;
          soundManager.playPaddleHit('pong');
          createParticles(AI_X, ball.y + BALL_SIZE / 2, 8, '#ff6600');
        }

        if (ball.x < -BALL_SIZE) {
          setAiScore(s => {
            const newScore = s + 1;
            soundManager.playScore('pong');
            createParticles(0, GAME_HEIGHT / 2, 15, '#ff4444');
            if (mode === 'classic' && newScore >= WINNING_SCORE) {
              if (newScore > highScoreClassic) {
                setHighScoreClassic(newScore);
                localStorage.setItem('guptaos_pong_classic_highscore', String(newScore));
              }
              setGameState('gameover');
            }
            return newScore;
          });
          resetBall(true);
        } else if (ball.x > GAME_WIDTH) {
          setPlayerScore(s => {
            const newScore = s + 1;
            soundManager.playScore('pong');
            createParticles(GAME_WIDTH, GAME_HEIGHT / 2, 15, '#00ffff');
            if (mode === 'classic' && newScore >= WINNING_SCORE) {
              if (newScore > highScoreClassic) {
                setHighScoreClassic(newScore);
                localStorage.setItem('guptaos_pong_classic_highscore', String(newScore));
              }
              setGameState('gameover');
            }
            return newScore;
          });
          resetBall(false);
        }

        getAIMove(FIXED_TIMESTEP);

        aiFrameCounterRef.current++;
        if (aiFrameCounterRef.current % 300 === 0 && Math.random() < 0.05) {
          requestAIPersonality();
        }

        if (aiStateRef.current.currentStrategy && Date.now() > aiStateRef.current.strategyEndTime) {
          aiStateRef.current.currentStrategy = null;
        }

        if (mode === 'survival') {
          setTimeLeft(prev => {
            const newTime = Math.max(0, prev - FIXED_TIMESTEP / 1000);
            if (newTime <= 0) {
              soundManager.playWin('pong');
              if (playerScore > highScoreSurvival) {
                setHighScoreSurvival(playerScore);
                localStorage.setItem('guptaos_pong_survival_highscore', String(playerScore));
              }
              setGameState('gameover');
            }
            return newTime;
          });
        }
      }

      updateParticles(FIXED_TIMESTEP);
      accumulatorRef.current -= FIXED_TIMESTEP;
    }

    if (canvasRef.current) {
      render(canvasRef.current);
    }

    if (gameState !== 'menu') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, difficulty, mode, playerScore, aiScore, highScoreClassic, highScoreSurvival, timeLeft, getAIMove, createParticles, updateParticles, resetBall]);

  const render = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scaleX = width / GAME_WIDTH;
    const scaleY = height / GAME_HEIGHT;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(scaleX, scaleY);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a0a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(PLAYER_X, paddlePlayerRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.fillRect(AI_X, paddleAIRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.shadowBlur = 0;

    const ball = ballRef.current;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x + BALL_SIZE / 2, ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerScore}`, GAME_WIDTH / 2 - 80, 80);
    ctx.fillText(`${aiScore}`, GAME_WIDTH / 2 + 80, 80);

    if (mode === 'survival') {
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = timeLeft < 10 ? '#ff4444' : '#fff';
      ctx.fillText(`${Math.ceil(timeLeft)}s`, GAME_WIDTH / 2, 80);
    }

    ctx.restore();
  }, [playerScore, aiScore, mode, timeLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resize = () => {
        const container = canvas.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      };
      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }
  }, []);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'paused') {
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState === 'setup' || gameState === 'menu') return;

    if (e.key === 'p' || e.key === 'P') {
      setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
      return;
    }

    if (gameState === 'gameover') {
      if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
        resetGame();
      }
      return;
    }

    if (gameState === 'playing') {
      const moveAmount = 30;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        paddlePlayerRef.current = Math.max(0, paddlePlayerRef.current - moveAmount);
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        e.preventDefault();
        paddlePlayerRef.current = Math.min(GAME_HEIGHT - PADDLE_HEIGHT, paddlePlayerRef.current + moveAmount);
      }
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    if (!canvasHovered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height * GAME_HEIGHT;
    paddlePlayerRef.current = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2));
  }, [gameState, canvasHovered]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const y = (touch.clientY - rect.top) / rect.height * GAME_HEIGHT;
    paddlePlayerRef.current = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2));
  }, [gameState]);

  const handleFullscreenToggle = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreenToggle();
      } else if (e.key === 'Escape' && isFullscreen) {
        handleFullscreenToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleFullscreenToggle]);

  const handlePauseAction = useCallback((action: 'resume' | 'restart' | 'quit') => {
    if (action === 'resume') {
      setGameState('playing');
    } else if (action === 'restart') {
      resetGame();
    } else if (action === 'quit') {
      setGameState('setup');
    }
  }, [resetGame]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full flex flex-col"
      style={{ minWidth: '400px', minHeight: '300px' }}
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-2 right-2 z-10 flex gap-1"
        style={{ pointerEvents: 'auto' }}
      >
        <motion.button
          onClick={handleFullscreenToggle}
          whileHover={{ scale: 1.1 }}
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

      <canvas
        ref={canvasRef}
        className="flex-1 cursor-none"
        style={{ touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setCanvasHovered(true)}
        onMouseLeave={() => setCanvasHovered(false)}
        onTouchMove={handleTouchMove}
        onContextMenu={e => e.preventDefault()}
      />
      
      {isMobile && showMobileBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0.7, 1, 0.7], y: [20, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg text-sm z-10"
        >
          Drag to move paddle • Mobile version coming soon
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'setup' && (
          <motion.div
            key="setup"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur z-20"
          >
            <motion.h2
              variants={titleVariants}
              className="text-4xl md:text-6xl font-bold text-white mb-2"
            >
              PONG VS AI
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-lg mb-8 max-w-md text-center"
            >
              Configure your game settings, then press Start
            </motion.p>
            
            <motion.div
              variants={cardVariants}
              className="bg-white/5 backdrop-blur rounded-2xl p-8 md:p-12 w-full max-w-md border border-white/10 space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-3">Game Mode</label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as GameMode)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="classic">Classic - First to 10 points</option>
                  <option value="survival">Survival - 60 seconds, max score wins</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-white/80 text-sm font-medium mb-3">AI Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="easy">Easy - Slow reaction, high error margin</option>
                  <option value="medium">Medium - Balanced challenge</option>
                  <option value="hard">Hard - Fast reaction, low error</option>
                  <option value="unbeatable">Unbeatable - Perfect tracking, zero error</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4 border-t border-white/10"
              >
                <motion.button
                  onClick={() => {
                    sessionStorage.setItem('pong_mode', mode);
                    resetGame();
                  }}
                  variants={buttonVariants}
                  className="w-full px-8 py-4 bg-primary text-white text-lg font-bold rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Start Game
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4 text-white/50 text-sm"
              >
                <motion.div
                  whileHover={{ color: '#fff' }}
                  className="text-center"
                >
                  Classic High: <span className="text-yellow-400 font-bold">{highScoreClassic}</span>
                </motion.div>
                <motion.div
                  whileHover={{ color: '#fff' }}
                  className="text-center"
                >
                  Survival High: <span className="text-yellow-400 font-bold">{highScoreSurvival}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div
            key="menu"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur z-20"
          >
            <motion.h2
              variants={titleVariants}
              className="text-4xl md:text-6xl font-bold text-white mb-2"
            >
              PONG VS AI
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-lg mb-8 max-w-md text-center"
            >
              Use <kbd className="px-3 py-1 bg-white/10 rounded mx-1">Mouse</kbd> or <kbd className="px-3 py-1 bg-white/10 rounded mx-1">Touch</kbd> to move paddle<br/>
              Press <kbd className="px-3 py-1 bg-white/10 rounded mx-1">P</kbd> to pause
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <label className="text-white/80 text-sm">Mode: Classic (First to 10) / Survival (60s)</label>
              <label className="text-white/80 text-sm">Difficulty: Easy → Unbeatable</label>
            </motion.div>
            <motion.button
              onClick={resetGame}
              variants={buttonVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 px-8 py-3 bg-primary text-white text-lg font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Game
            </motion.button>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 grid grid-cols-2 gap-4 text-white/50 text-sm"
            >
              <div>Classic High: <span className="text-yellow-400 font-bold">{highScoreClassic}</span></div>
              <div>Survival High: <span className="text-yellow-400 font-bold">{highScoreSurvival}</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'paused' && (
          <motion.div
            key="paused"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur z-20"
          >
            <motion.div
              variants={cardVariants}
              className="bg-white/5 backdrop-blur rounded-2xl p-8 md:p-12 text-center border border-white/10"
            >
              <motion.h3
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white mb-6"
              >
                PAUSED
              </motion.h3>
              <motion.div
                variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                className="flex flex-col gap-3"
              >
                <motion.button
                  onClick={() => handlePauseAction('resume')}
                  variants={buttonVariants}
                  className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Resume
                </motion.button>
                <motion.button
                  onClick={() => handlePauseAction('restart')}
                  variants={buttonVariants}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                >
                  Restart
                </motion.button>
                <motion.button
                  onClick={() => { setGameState('setup'); }}
                  variants={buttonVariants}
                  className="px-6 py-3 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Quit to Setup
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'gameover' && (
          <motion.div
            key="gameover"
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur z-20"
          >
            <motion.h2
              variants={titleVariants}
              className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4"
            >
              {mode === 'survival' ? 'TIME UP!' : playerScore > aiScore ? 'YOU WIN!' : 'AI WINS!'}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-xl mb-6"
            >
              Final Score: <span className="text-yellow-400 font-bold">{playerScore}</span> - <span className="text-orange-400 font-bold">{aiScore}</span>
            </motion.div>
            <AnimatePresence>
              {mode === 'survival' && (
                <motion.div
                  key="survival-score"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/60 mb-8"
                >
                  Survival Score: <span className="text-yellow-400 font-bold">{playerScore}</span>
                  {playerScore >= highScoreSurvival && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="text-green-400 ml-2"
                    >
                      NEW RECORD!
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <motion.button
                onClick={() => handlePauseAction('restart')}
                variants={buttonVariants}
                className="px-8 py-3 bg-primary text-white text-lg font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Play Again
              </motion.button>
              <motion.button
                onClick={() => { setGameState('setup'); }}
                variants={buttonVariants}
                className="px-8 py-3 bg-white/10 text-white text-lg font-medium rounded-lg hover:bg-white/20 transition-colors"
              >
                Change Settings
              </motion.button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-white/50 text-sm"
            >
              Press <kbd className="px-2 py-1 bg-white/10 rounded mx-1">R</kbd> or <kbd className="px-2 py-1 bg-white/10 rounded mx-1">Space</kbd> to restart
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};