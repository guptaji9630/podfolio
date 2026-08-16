import { storage, KEYS } from './storage';

export type SoundType = 'jump' | 'score' | 'hit' | 'gameover' | 'win' | 'paddle_hit' | 'wall_hit';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUND_PRESETS: Record<SoundType, SoundConfig> = {
  jump: { frequency: 440, duration: 0.1, type: 'square', volume: 0.3 },
  score: { frequency: 880, duration: 0.15, type: 'sine', volume: 0.4 },
  hit: { frequency: 220, duration: 0.1, type: 'sawtooth', volume: 0.3 },
  gameover: { frequency: 110, duration: 0.3, type: 'triangle', volume: 0.4 },
  win: { frequency: 660, duration: 0.5, type: 'sine', volume: 0.5 },
  paddle_hit: { frequency: 330, duration: 0.08, type: 'square', volume: 0.25 },
  wall_hit: { frequency: 165, duration: 0.06, type: 'triangle', volume: 0.2 },
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private globalVolume: number = 0.5;
  private gameVolumes: Record<string, number> = {};
  private initialized: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    const savedGlobal = storage.get<number>(KEYS.GLOBAL_VOLUME);
    if (savedGlobal !== undefined) {
      this.globalVolume = savedGlobal;
    }

    const savedGameVolumes = storage.get<Record<string, number>>(KEYS.GAME_VOLUMES);
    if (savedGameVolumes) {
      this.gameVolumes = savedGameVolumes;
    }
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    storage.set(KEYS.GLOBAL_VOLUME, this.globalVolume);
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  setGameVolume(gameId: string, volume: number): void {
    this.gameVolumes[gameId] = Math.max(0, Math.min(1, volume));
    storage.set(KEYS.GAME_VOLUMES, this.gameVolumes);
  }

  getGameVolume(gameId: string): number | undefined {
    return this.gameVolumes[gameId];
  }

  getEffectiveVolume(gameId?: string): number {
    if (gameId && this.gameVolumes[gameId] !== undefined) {
      return this.gameVolumes[gameId];
    }
    return this.globalVolume;
  }

  playTone(frequency: number, duration: number, type: OscillatorType, gameId?: string): void {
    const ctx = this.getContext();
    const volume = this.getEffectiveVolume(gameId);
    
    if (volume <= 0) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = volume;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  play(soundType: SoundType, gameId?: string): void {
    const config = SOUND_PRESETS[soundType];
    this.playTone(config.frequency, config.duration, config.type, gameId);
  }

  playJump(gameId?: string): void { this.play('jump', gameId); }
  playScore(gameId?: string): void { this.play('score', gameId); }
  playHit(gameId?: string): void { this.play('hit', gameId); }
  playGameOver(gameId?: string): void { this.play('gameover', gameId); }
  playWin(gameId?: string): void { this.play('win', gameId); }
  playPaddleHit(gameId?: string): void { this.play('paddle_hit', gameId); }
  playWallHit(gameId?: string): void { this.play('wall_hit', gameId); }
}

export const soundManager = new SoundManager();

if (typeof window !== 'undefined') {
  soundManager.init();
}