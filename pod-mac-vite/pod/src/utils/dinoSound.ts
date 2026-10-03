export class DinoSoundManager {
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private nodes = new Set<() => void>();
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
      void ctx.resume().then(() => { if (this.ctx === ctx) this.unlocked = true; }).catch(() => {});
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
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    const disconnect = () => {
      osc.disconnect();
      gain.disconnect();
      this.nodes.delete(stop);
    };
    const stop = () => {
      osc.onended = null;
      try { osc.stop(); } catch { /* Already stopped. */ }
      disconnect();
    };
    this.nodes.add(stop);
    osc.onended = disconnect;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  dispose() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.nodes.forEach(stop => stop());
    this.nodes.clear();
    const ctx = this.ctx;
    this.ctx = null;
    this.unlocked = false;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
  }

  jump() { this.beep(600, 0.08, 'square', 0.05); }
  point() { this.beep(900, 0.06, 'square', 0.04); }
  milestone() { this.beep(1200, 0.15, 'sine', 0.08); }
  death() {
    this.beep(150, 0.15, 'sawtooth', 0.08);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.beep(100, 0.2, 'sawtooth', 0.07);
    }, 80);
    this.timers.add(timer);
  }
}
