import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 400;
const GROUND_Y = 340;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 48;
const DINO_X = 60;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -11;
const DUCK_HEIGHT = 30;
const DUCK_WIDTH = 60;
const BASE_SPEED = 6;
const CACTUS_WIDTH = 18;
const CACTUS_HEIGHTS = [28, 38, 48];
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const BIRD_Y_OPTIONS = [85, 125, 150];
const DAY_NIGHT_CYCLE = 700;
const FIXED_TIMESTEP = 1000 / 60; // 60 FPS fixed timestep
const MAX_ACCUMULATED_TIME = 200; // Prevent spiral of death

type GameState = 'ready' | 'playing' | 'over';

interface Obstacle {
  x: number;
  type: 'cactus' | 'bird';
  variant: number;
  birdY: number;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const DINO_RUN_A = [
  '        XXXXXXXXXXXXXXXX  ',
  '        XXXXXXXXXXXXXXXXX ',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXX          ',
  '        XXXXXX            ',
  'XXXX    XXXXXX            ',
  'XXXX    XXXXXXX           ',
  'XXXXXX  XXXXXXX           ',
  'XXXXXXXXXXXXXXXX          ',
  'XXXXXXXXXXXXXXX           ',
  '  XXXXXXXXXXXXX           ',
  '   XXXXXXXXXX             ',
  '    XXXXXX                ',
  '    XX   XX               ',
  '         XX               ',
];

const DINO_RUN_B = [
  '        XXXXXXXXXXXXXXXX  ',
  '        XXXXXXXXXXXXXXXXX ',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXX          ',
  '        XXXXXX            ',
  'XXXX    XXXXXX            ',
  'XXXX    XXXXXXX           ',
  'XXXXXX  XXXXXXX           ',
  'XXXXXXXXXXXXXXXX          ',
  'XXXXXXXXXXXXXXX           ',
  '  XXXXXXXXXXXXX           ',
  '   XXXXXXXXXX             ',
  '    XXXXXX                ',
  '    XX                    ',
  '    XX                    ',
];

const DINO_JUMP = [
  '        XXXXXXXXXXXXXXXX  ',
  '        XXXXXXXXXXXXXXXXX ',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXXXXXXXXXXXX',
  '        XXXXXXXX          ',
  '        XXXXXX            ',
  'XXXX    XXXXXX            ',
  'XXXX    XXXXXXX           ',
  'XXXXXX  XXXXXXX           ',
  'XXXXXXXXXXXXXXXX          ',
  'XXXXXXXXXXXXXXX           ',
  '  XXXXXXXXXXXXX           ',
  '   XXXXXXXXXX             ',
  '    XXXXXX                ',
  '    XX   XX               ',
  '    XX   XX               ',
];

const DINO_DUCK_A: string[] = [];
const DINO_DUCK_B: string[] = [];

const buildDuckSprites = () => {
  const template = [
    '                              XXXXXXXXXX  ',
    '                              XXXXXXXXXXX ',
    '                              XXXXXXXXXXXX',
    '                              XXXXXXXXXXXX',
    '                              XXXXXX      ',
    '                              XXXX        ',
    '    XXXXXX                    XXXX        ',
    '    XXXXXXXX                  XXXXX       ',
    '    XXXXXXXXXX                XXXXX       ',
    '    XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX       ',
    '    XXXXXXXXXXXXXXXXXXXXXXXXXXXXX         ',
    '      XXXXXXXXXXXXXXXXXXXXXXX             ',
    '        XXXXXXXXXXXXX                     ',
    '           XX   XX                        ',
  ];
  const alt: string[] = template.map((r) => r);
  alt[12] = '           XX                             ';
  alt[13] = '           XX                             ';
  DINO_DUCK_A.push(...template);
  DINO_DUCK_B.push(...alt);
};
buildDuckSprites();

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: string[],
  color: string,
  px: number,
  py: number,
  scale: number,
  eyeColor: string
) {
  ctx.fillStyle = color;
  let eyeX = -1;
  let eyeY = -1;
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] === 'X') {
        ctx.fillRect(px + col * scale, py + row * scale, scale, scale);
      }
      if (line[col] === 'O') {
        eyeX = col;
        eyeY = row;
      }
    }
  }
  if (eyeX >= 0) {
    ctx.fillStyle = eyeColor;
    ctx.fillRect(px + eyeX * scale, py + eyeY * scale, scale, scale);
  }
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private unlocked = false;

  private ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        this.enabled = false;
      }
    }
    return this.ctx;
  }

  unlock() {
    if (this.unlocked) return;
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => { this.unlocked = true; });
    } else {
      this.unlocked = true;
    }
  }

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  isEnabled() {
    return this.enabled;
  }

  private beep(freq: number, duration: number, type: OscillatorType, vol: number) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  jump() { this.beep(600, 0.08, 'square', 0.05); }
  point() { this.beep(900, 0.06, 'square', 0.04); }
  milestone() { this.beep(1200, 0.15, 'sine', 0.08); }
  death() {
    this.beep(150, 0.15, 'sawtooth', 0.08);
    setTimeout(() => this.beep(100, 0.2, 'sawtooth', 0.07), 80);
  }
}

function getSkyColor(score: number): string {
  const cycle = Math.floor(score / DAY_NIGHT_CYCLE) % 2;
  const phase = (score % DAY_NIGHT_CYCLE) / DAY_NIGHT_CYCLE;
  if (cycle === 0) {
    if (phase > 0.8) {
      const t = (phase - 0.8) / 0.2;
      return lerpColor('#f7f7f7', '#1a1a2e', t);
    }
    return '#f7f7f7';
  } else {
    if (phase > 0.8) {
      const t = (phase - 0.8) / 0.2;
      return lerpColor('#1a1a2e', '#f7f7f7', t);
    }
    return '#1a1a2e';
  }
}

function getTextColor(score: number): string {
  const cycle = Math.floor(score / DAY_NIGHT_CYCLE) % 2;
  const phase = (score % DAY_NIGHT_CYCLE) / DAY_NIGHT_CYCLE;
  if (cycle === 0) {
    if (phase > 0.8) {
      const t = (phase - 0.8) / 0.2;
      return lerpColor('#333333', '#e0e0e0', t);
    }
    return '#333333';
  } else {
    if (phase > 0.8) {
      const t = (phase - 0.8) / 0.2;
      return lerpColor('#e0e0e0', '#333333', t);
    }
    return '#e0e0e0';
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

export const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('guptaos_dino_highscore') || '0', 10) || 0; }
    catch { return 0; }
  });
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT });
  const soundRef = useRef(new SoundManager());
  const [isNight, setIsNight] = useState(false);

  const stateRef = useRef({
    dinoY: GROUND_Y - DINO_HEIGHT,
    velocity: 0,
    isJumping: false,
    isDucking: false,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    speed: BASE_SPEED,
    groundOffset: 0,
    hillOffset: 0,
    frameCount: 0,
    runFrame: 0,
    cloudOffset: 0,
    score: 0,
    gameState: 'ready' as GameState,
    obstacleTimer: 0,
    nextObstacleIn: 60,
    shake: 0,
    flash: 0,
    lastMilestone: 0,
  });

  // --- Fullscreen handling ---
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) { console.warn('Fullscreen failed:', err); }
    } else {
      try { await document.exitFullscreen(); setIsFullscreen(false); }
      catch (err) { console.warn('Exit fullscreen failed:', err); }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === 'Escape' && isFullscreen) { toggleFullscreen(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // --- Container resize observer ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // --- Game logic with fixed timestep ---
  const resetGame = useCallback(() => {
    stateRef.current = {
      dinoY: GROUND_Y - DINO_HEIGHT,
      velocity: 0,
      isJumping: false,
      isDucking: false,
      obstacles: [],
      particles: [],
      speed: BASE_SPEED,
      groundOffset: 0,
      hillOffset: 0,
      frameCount: 0,
      runFrame: 0,
      cloudOffset: 0,
      score: 0,
      gameState: 'playing',
      obstacleTimer: 0,
      nextObstacleIn: 60,
      shake: 0,
      flash: 0,
      lastMilestone: 0,
    };
    setScore(0);
    setGameState('playing');
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    soundRef.current.unlock();
    if (s.gameState === 'ready') { resetGame(); return; }
    if (s.gameState === 'over') { resetGame(); return; }
    if (!s.isJumping) {
      s.velocity = JUMP_VELOCITY;
      s.isJumping = true;
      soundRef.current.jump();
      for (let i = 0; i < 6; i++) {
        s.particles.push({ x: DINO_X + 20, y: GROUND_Y, vx: -Math.random() * 3 - 1, vy: -Math.random() * 2, life: 20, size: 2 + Math.random() * 2 });
      }
    }
  }, [resetGame]);

  const startDuck = useCallback(() => {
    const s = stateRef.current;
    soundRef.current.unlock();
    if (s.gameState === 'playing' && !s.isJumping) s.isDucking = true;
  }, []);

  const stopDuck = useCallback(() => { stateRef.current.isDucking = false; }, []);

  // Input handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); soundRef.current.unlock(); jump(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); soundRef.current.unlock(); startDuck(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'ArrowDown') { e.preventDefault(); stopDuck(); } };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('keyup', handleKeyUp); };
  }, [jump, startDuck, stopDuck]);

  useEffect(() => { soundRef.current.setEnabled(soundOn); }, [soundOn]);

  // --- Main render loop with fixed timestep ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    let accumulator = 0;

    const spawnObstacle = () => {
      const s = stateRef.current;
      const isBird = s.score > 200 && Math.random() < 0.3;
      if (isBird) {
        const birdY = BIRD_Y_OPTIONS[Math.floor(Math.random() * BIRD_Y_OPTIONS.length)];
        s.obstacles.push({ x: LOGICAL_WIDTH, type: 'bird', variant: 0, birdY, width: BIRD_WIDTH, height: BIRD_HEIGHT });
      } else {
        const variant = Math.floor(Math.random() * CACTUS_HEIGHTS.length);
        s.obstacles.push({ x: LOGICAL_WIDTH, type: 'cactus', variant, birdY: 0, width: CACTUS_WIDTH, height: CACTUS_HEIGHTS[variant] });
      }
    };

    const drawDino = (s: typeof stateRef.current, color: string, eyeColor: string) => {
      const x = DINO_X;
      const scale = 3;
      if (s.isJumping) { drawSprite(ctx, DINO_JUMP, color, x, s.dinoY, scale, eyeColor); return; }
      if (s.isDucking) { drawSprite(ctx, s.runFrame % 2 === 0 ? DINO_DUCK_A : DINO_DUCK_B, color, x, GROUND_Y - DUCK_HEIGHT, scale, eyeColor); return; }
      drawSprite(ctx, s.runFrame % 2 === 0 ? DINO_RUN_A : DINO_RUN_B, color, x, s.dinoY, scale, eyeColor);
    };

    const drawCactus = (o: Obstacle, color: string) => {
      ctx.fillStyle = color;
      const y = GROUND_Y - o.height;
      ctx.fillRect(o.x + o.width / 2 - 4, y, 8, o.height);
      if (o.variant >= 1) { ctx.fillRect(o.x, y + 8, 6, 12); ctx.fillRect(o.x + o.width - 6, y + 14, 6, 10); }
      if (o.variant >= 2) { ctx.fillRect(o.x, y + 24, 6, 10); }
    };

    const drawBird = (o: Obstacle, frame: number, color: string) => {
      ctx.fillStyle = color;
      const y = o.birdY; const x = o.x;
      ctx.fillRect(x + 8, y + 6, 18, 8);
      ctx.fillRect(x + 22, y + 2, 10, 8);
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x + 27, y + 4, 3, 3);
      ctx.fillStyle = color;
      if (frame % 2 === 0) ctx.fillRect(x + 10, y, 12, 6); else ctx.fillRect(x + 10, y + 12, 12, 6);
    };

    const drawGround = (s: typeof stateRef.current, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(LOGICAL_WIDTH, GROUND_Y); ctx.stroke();
      ctx.fillStyle = color;
      for (let i = 0; i < 20; i++) {
        const dotX = (i * 40 - s.groundOffset) % LOGICAL_WIDTH;
        ctx.fillRect(dotX < 0 ? dotX + LOGICAL_WIDTH : dotX, GROUND_Y + 3, 3, 2);
      }
    };

    const drawClouds = (s: typeof stateRef.current, color: string) => {
      ctx.fillStyle = color;
      const clouds = [80, 300, 520, 700];
      for (const base of clouds) {
        const cx = (base - s.cloudOffset * 0.3) % (LOGICAL_WIDTH + 100);
        const x = cx < -50 ? cx + LOGICAL_WIDTH + 100 : cx;
        ctx.fillRect(x, 40, 30, 8); ctx.fillRect(x + 8, 35, 16, 6);
      }
    };

    const drawHills = (s: typeof stateRef.current, color: string) => {
      ctx.fillStyle = color;
      for (let i = 0; i < 3; i++) {
        const baseX = i * 220;
        const cx = (baseX - s.hillOffset * 0.4) % (LOGICAL_WIDTH + 220);
        const x = cx < -120 ? cx + LOGICAL_WIDTH + 220 : cx;
        ctx.beginPath(); ctx.moveTo(x, GROUND_Y); ctx.lineTo(x + 50, GROUND_Y - 35); ctx.lineTo(x + 100, GROUND_Y); ctx.closePath(); ctx.fill();
      }
    };

    const drawStars = (s: typeof stateRef.current, opacity: number) => {
      if (opacity <= 0) return;
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      const stars = [{ x: 50, y: 30 }, { x: 150, y: 60 }, { x: 300, y: 25 }, { x: 450, y: 50 }, { x: 650, y: 35 }, { x: 750, y: 70 }];
      for (const star of stars) {
        ctx.fillRect(star.x, star.y, 2, 2);
        if (Math.sin(s.frameCount * 0.05 + star.x) * 0.5 + 0.5 > 0.7) {
          ctx.fillRect(star.x - 1, star.y, 1, 1); ctx.fillRect(star.x + 2, star.y, 1, 1);
        }
      }
    };

    const drawMoon = (s: typeof stateRef.current, opacity: number) => {
      if (opacity <= 0) return;
      ctx.fillStyle = `rgba(240,240,220,${opacity})`;
      const x = 650, y = 40;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(200,200,180,${opacity})`;
      ctx.beginPath(); ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y + 3, 2, 0, Math.PI * 2); ctx.fill();
    };

    const drawParticles = (s: typeof stateRef.current, color: string) => {
      ctx.fillStyle = color;
      for (const p of s.particles) ctx.fillRect(p.x, p.y, p.size, p.size);
    };

    const checkCollision = (s: typeof stateRef.current): boolean => {
      const dinoW = s.isDucking && !s.isJumping ? DUCK_WIDTH : DINO_WIDTH;
      const dinoH = s.isDucking && !s.isJumping ? DUCK_HEIGHT : DINO_HEIGHT;
      const dinoY = s.isDucking && !s.isJumping ? GROUND_Y - DUCK_HEIGHT : s.dinoY;
      const dx1 = DINO_X + 6, dy1 = dinoY + 4, dx2 = dx1 + dinoW - 12, dy2 = dy1 + dinoH - 6;
      for (const o of s.obstacles) {
        const oy = o.type === 'bird' ? o.birdY : GROUND_Y - o.height;
        const ox1 = o.x + 3, oy1 = oy + 3, ox2 = o.x + o.width - 3, oy2 = oy + o.height - 3;
        if (dx1 < ox2 && dx2 > ox1 && dy1 < oy2 && dy2 > oy1) return true;
      }
      return false;
    };

    // Fixed timestep game loop
    const update = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      accumulator = Math.min(accumulator + deltaTime, MAX_ACCUMULATED_TIME);

      // Process fixed timestep updates
      while (accumulator >= FIXED_TIMESTEP) {
        fixedUpdate(FIXED_TIMESTEP);
        accumulator -= FIXED_TIMESTEP;
      }

      // Render
      render();

      animationId = requestAnimationFrame(update);
    };

    const fixedUpdate = (dt: number) => {
      const s = stateRef.current;
      if (s.gameState !== 'playing') return;

      s.frameCount++;
      if (s.frameCount % 6 === 0) s.runFrame++;

      // Physics - using fixed timestep
      if (s.isJumping) {
        s.velocity += GRAVITY;
        s.dinoY += s.velocity;
        if (s.dinoY >= GROUND_Y - DINO_HEIGHT) {
          s.dinoY = GROUND_Y - DINO_HEIGHT;
          s.velocity = 0;
          s.isJumping = false;
          for (let i = 0; i < 8; i++) s.particles.push({ x: DINO_X + 20, y: GROUND_Y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 2, life: 15, size: 2 + Math.random() * 2 });
        }
      }
      if (s.isDucking && s.isJumping && s.velocity < 8) s.velocity += 0.8;
      if (s.frameCount % 10 === 0 && !s.isJumping) s.particles.push({ x: DINO_X + 10, y: GROUND_Y, vx: -s.speed * 0.5, vy: -Math.random(), life: 12, size: 1 + Math.random() });

      s.groundOffset += s.speed; s.hillOffset += s.speed; s.cloudOffset += s.speed;

      s.obstacleTimer++;
      if (s.obstacleTimer >= s.nextObstacleIn) {
        spawnObstacle(); s.obstacleTimer = 0;
        const minGap = Math.max(45, 80 - s.score / 20);
        const maxGap = Math.max(70, 130 - s.score / 15);
        s.nextObstacleIn = Math.floor(minGap + Math.random() * (maxGap - minGap));
      }

      for (const o of s.obstacles) o.x -= s.speed;
      s.obstacles = s.obstacles.filter((o) => o.x + o.width > 0);

      for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; }
      s.particles = s.particles.filter((p) => p.life > 0);

      s.score += 0.1;
      const intScore = Math.floor(s.score);
      if (intScore !== score) {
        setScore(intScore);
        if (intScore > 0 && intScore % 100 === 0) { soundRef.current.point(); s.flash = 10; }
      }
      if (intScore > 0 && intScore % 100 === 0 && intScore !== s.lastMilestone) {
        s.lastMilestone = intScore; soundRef.current.milestone(); s.flash = 15;
      }

      s.speed = BASE_SPEED + Math.min(s.score / 100, 7);

      if (checkCollision(s)) {
        s.gameState = 'over'; s.shake = 8; soundRef.current.death(); setGameState('over');
        setHighScore((prev) => { const hs = Math.max(prev, Math.floor(s.score)); try { localStorage.setItem('guptaos_dino_highscore', String(hs)); } catch {} return hs; });
      }

      const night = Math.floor(s.score / DAY_NIGHT_CYCLE) % 2 === 1;
      if (night !== isNight) setIsNight(night);
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;
      const skyColor = getSkyColor(s.score);
      const objColor = getTextColor(s.score);
      const nightPhase = Math.floor(s.score / DAY_NIGHT_CYCLE) % 2 === 1;
      const phase = (s.score % DAY_NIGHT_CYCLE) / DAY_NIGHT_CYCLE;
      const transitionT = phase > 0.8 ? (phase - 0.8) / 0.2 : phase < 0.2 ? 1 - phase / 0.2 : 0;
      const realStarOpacity = nightPhase ? 1 - transitionT : transitionT;

      let shakeX = 0, shakeY = 0;
      if (s.shake > 0) {
        shakeX = (Math.random() - 0.5) * s.shake;
        shakeY = (Math.random() - 0.5) * s.shake;
        s.shake *= 0.9;
        if (s.shake < 0.3) s.shake = 0;
      }

      // Calculate scale to fit container while maintaining aspect ratio
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || LOGICAL_WIDTH;
      const containerHeight = container?.clientHeight || LOGICAL_HEIGHT;
      const scaleX = containerWidth / LOGICAL_WIDTH;
      const scaleY = containerHeight / LOGICAL_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      // Center the game
      const offsetX = (containerWidth - LOGICAL_WIDTH * scale) / 2;
      const offsetY = (containerHeight - LOGICAL_HEIGHT * scale) / 2;

      // Resize canvas to container size
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      ctx.save();
      ctx.translate(offsetX + shakeX, offsetY + shakeY);
      ctx.scale(scale, scale);

      ctx.clearRect(-10, -10, LOGICAL_WIDTH + 20, LOGICAL_HEIGHT + 20);
      ctx.fillStyle = skyColor; ctx.fillRect(-10, -10, LOGICAL_WIDTH + 20, LOGICAL_HEIGHT + 20);

      drawStars(s, realStarOpacity); drawMoon(s, realStarOpacity);
      drawHills(s, objColor + '33'); drawClouds(s, nightPhase ? '#555566' : '#cccccc');
      drawGround(s, objColor);

      if (s.gameState === 'playing') { /* logic handled in fixedUpdate */ }

      for (const o of s.obstacles) { if (o.type === 'cactus') drawCactus(o, objColor); else drawBird(o, s.runFrame, objColor); }
      drawParticles(s, objColor + '88');

      if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${s.flash / 30})`; ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT); s.flash--; }
      drawDino(s, objColor, '#f4f4f4');

      ctx.restore();

      // UI overlays (not scaled)
      if (s.gameState !== 'playing') {
        ctx.fillStyle = objColor; ctx.font = '20px monospace'; ctx.textAlign = 'center';
        if (s.gameState === 'ready') {
          ctx.fillText('Press SPACE or tap to start', LOGICAL_WIDTH / 2, 100);
          ctx.font = '12px monospace'; ctx.fillText('Jump cacti, duck under birds', LOGICAL_WIDTH / 2, 120);
        } else if (s.gameState === 'over') {
          ctx.font = '22px monospace'; ctx.fillText('G A M E   O V E R', LOGICAL_WIDTH / 2, 80);
          ctx.font = '14px monospace'; ctx.fillText(`Score: ${Math.floor(s.score)}`, LOGICAL_WIDTH / 2, 105);
          ctx.fillText('Press SPACE or tap to restart', LOGICAL_WIDTH / 2, 125);
        }
      }
    };

    // Initialize canvas size
    const resize = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    lastTime = performance.now();
    animationId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [score, isNight]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full max-w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-2">
          <h1 className="text-lg font-semibold tracking-tight text-gray-800">Dino Run</h1>
          <div className="flex items-center gap-4 font-mono text-sm">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Score</span>
              <span className="text-gray-700 tabular-nums">{String(score).padStart(5, '0')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Best</span>
              <span className="text-gray-700 tabular-nums">{String(highScore).padStart(5, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundOn((v) => !v)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 -m-1"
                aria-label={soundOn ? 'Mute' : 'Unmute'}
              >{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
              <button
                onClick={toggleFullscreen}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 -m-1"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >{isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}</button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden cursor-pointer select-none flex-1"
          style={{ 
            width: '100%', 
            aspectRatio: `${LOGICAL_WIDTH} / ${LOGICAL_HEIGHT}`,
            minHeight: 0,
          }}
          onPointerDown={(e) => { e.preventDefault(); soundRef.current.unlock(); jump(); }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 font-mono">Space / tap to jump &middot; hold Down to duck &middot; F11 fullscreen</p>
          <div className="flex gap-2 md:hidden">
            <button
              className="px-4 py-2 rounded bg-gray-800 text-white text-xs font-mono active:bg-gray-600 select-none touch-none"
              onPointerDown={(e) => { e.preventDefault(); startDuck(); }}
              onPointerUp={stopDuck} onPointerLeave={stopDuck}
            >DUCK</button>
          </div>
        </div>
      </div>
    </div>
  );
};