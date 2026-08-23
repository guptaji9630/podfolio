# Terminal Games System - Implementation Plan

## Overview
Add a Games system to the GuptaOS desktop environment with:
- **Games Launcher** window (Dock icon 🎮)
- **Dino Run** - Canvas-based endless runner (Chrome offline game clone)
- **Pong vs AI** - Canvas-based Pong with 4 AI difficulties, 2 game modes, AI opponent with personality
- **AI Integration** - Chat assistant suggests games when user says "I'm bored", launches via tool calls
- **Terminal Command** - `game list`, `game dino`, `game pong [mode]`
- **Persistence** - localStorage high scores per game per mode
- **Window Features** - Resizable, F11 fullscreen, pause overlay, sound with global/per-game volume

---

## Architecture

```
Dock (Games icon) → Games Launcher Window → Dino Run Window / Pong Window
                                    ↑
                        Terminal `game` command
                                    ↑
                        AI Chat: "I'm bored" → get_game_list → launch_game tool
```

---

## File Changes (11 files: 4 existing + 7 new)

### Phase 1: Foundation

| File | Action | Changes |
|------|--------|---------|
| `pod/src/types/app.types.ts` | Edit | Add `'games' \| 'dino' \| 'pong'` to `AppId` union |
| `pod/src/App.tsx` | Edit | Add 3 windows to `INITIAL_WINDOWS`, add `message` event listener for `LAUNCH_GAME` |
| `pod/components/Dock.tsx` | Edit | Add Games dock item: `{ id: 'games', icon: 'sports_esports', label: 'Games', color: 'bg-gradient-to-r from-orange-500 to-red-500' }` |
| `pod/components/Desktop.tsx` | Edit | Import and render `GamesLauncher`, `DinoGame`, `PongGame` in `renderAppContent` |

### Phase 2: Shared Utilities & Components

| File | Action | Description |
|------|--------|-------------|
| `pod/src/utils/sound.ts` | New | Web Audio API singleton: `AudioContext`, `playTone(freq, duration, type, volume)`, preload game sounds (jump, score, hit, gameover, win). Global volume from Settings, per-game override. |
| `pod/components/apps/GameWindowFrame.tsx` | New | Wrapper extending WindowFrame: F11 fullscreen toggle (prevent default), Escape exits fullscreen, passes `isFullscreen` to children, handles resize. |

### Phase 3: Game Components

| File | Action | Description |
|------|--------|-------------|
| `pod/components/apps/GamesLauncher.tsx` | New | Grid of game cards (Dino, Pong). Shows high scores from localStorage. "Play" button → `openApp('dino'/'pong')`. Default entry point. |
| `pod/components/apps/DinoGame.tsx` | New | **Canvas 2D** (800×400 responsive). Physics: gravity, jump velocity. Obstacles: cactus (3 sizes), birds (2 heights). Spawning: increasing frequency/speed. Scoring: 1pt/frame, 100pt/obstacle. Controls: Space/↑=Jump, P=Pause, R=Restart. Sounds: jump, score, gameover. High score: `guptaos_dino_highscore`. Mobile: "Tap to Jump" overlay + "Coming Soon" banner. Particles on score. Pause overlay: Resume/Restart/Quit. |
| `pod/components/apps/PongGame.tsx` | New | **Canvas 2D** (800×500 responsive). **Modes**: Classic (first to 10), Survival (60s max points). **AI Difficulties** (dropdown in window): Easy (300ms/30%), Medium (150ms/15%), Hard (50ms/5%), Unbeatable (0ms/0%). AI: 95% heuristic (track ball Y with delay/error/prediction), 5% chatService personality calls with game context (score, time, difficulty). Controls: W/S or ↑/↓. Sounds: paddle_hit, wall_hit, score, win. High scores: `guptaos_pong_classic_highscore` (win streak), `guptaos_pong_survival_highscore` (max points). Mobile: touch drag paddle + banner. Particles on score. Pause overlay: Resume/Restart/Quit. |

### Phase 4: AI Integration

| File | Action | Changes |
|------|--------|---------|
| `pod/src/services/chatService.ts` | Edit | Add tools: `get_game_list` (returns game metadata + high scores), `launch_game` (params: `gameId: 'dino'|'pong', mode?: 'classic'|'survival'`). `detectToolIntent`: "bored/game/play/fun" → `get_game_list`; "dino" → `launch_game(dino)`; "pong [survival]" → `launch_game(pong, mode)`. `executeToolCall(launch_game)`: `window.parent.postMessage({ type: 'LAUNCH_GAME', payload }, '*')`. |

### Phase 5: Terminal Command

| File | Action | Changes |
|------|--------|---------|
| `pod/components/apps/Terminal.tsx` | Edit | Add `game` command handler: `game list` (shows games + high scores), `game dino` (launch), `game pong [classic|survival]` (launch), `game help` (usage). Uses `postMessage` to launch. |

---

## Technical Specifications

### Sound System (`sound.ts`)
```typescript
// Web Audio API - Zero asset files
class SoundManager {
  private ctx: AudioContext;
  private globalVolume: number = 0.5; // From Settings
  private gameVolumes: Record<string, number> = {}; // Per-game override
  
  playTone(frequency: number, duration: number, type: OscillatorType, gameId?: string) {
    const vol = this.gameVolumes[gameId] ?? this.globalVolume;
    // OscillatorNode + GainNode
  }
  
  // Presets
  jump() { this.playTone(440, 0.1, 'square', 'dino'); }
  score() { this.playTone(880, 0.15, 'sine', 'dino'); }
  hit() { this.playTone(220, 0.1, 'sawtooth', 'pong'); }
  gameover() { this.playTone(110, 0.3, 'triangle', 'dino'); }
  win() { this.playTone(660, 0.5, 'sine', 'pong'); }
  paddle_hit() { this.playTone(330, 0.08, 'square', 'pong'); }
  wall_hit() { this.playTone(165, 0.06, 'triangle', 'pong'); }
}
```

### AI Opponent (Pong)
```typescript
// Heuristic (95% of frames)
function heuristicMove(state: PongState, difficulty: Difficulty): 'up' | 'down' | 'stay' {
  const targetY = predictBallY(state.ball, state.aiPaddle);
  const error = (Math.random() - 0.5) * 2 * difficulty.errorMargin;
  const delayedTarget = targetY + error;
  // Apply reaction delay via setTimeout or frame counter
}

// Personality (5% chance per second)
async function getAIPersonalityMove(state: PongState): Promise<'aggressive' | 'defensive' | 'center'> {
  const prompt = `Pong AI: Ball at (${state.ball.x}, ${state.ball.y}) vel(${state.ball.dx}, ${state.ball.dy}). 
    My paddle: ${state.aiPaddle.y}. Player: ${state.playerPaddle.y}. Score: ${state.aiScore}-${state.playerScore}. 
    Time: ${state.timeLeft}s. Difficulty: ${state.difficulty}. Suggest strategy.`;
  const response = await chatService.sendMessage([{ role: 'user', content: prompt }]);
  // Parse response for strategy bias
}
```

### Window Message Protocol
```typescript
// From Terminal/Chat → App.tsx
window.parent.postMessage({ 
  type: 'LAUNCH_GAME', 
  payload: { gameId: 'dino' | 'pong', mode?: 'classic' | 'survival' } 
}, '*');

// App.tsx listener
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data.type === 'LAUNCH_GAME') {
      openApp(e.data.payload.gameId);
      // Store mode for Pong via sessionStorage or context
      if (e.data.payload.mode) sessionStorage.setItem('pong_mode', e.data.payload.mode);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [openApp]);
```

### High Score Keys
| Game | Mode | Key |
|------|------|-----|
| Dino | - | `guptaos_dino_highscore` |
| Pong | Classic | `guptaos_pong_classic_highscore` |
| Pong | Survival | `guptaos_pong_survival_highscore` |

### Global Volume (Settings Integration)
- Settings app: Add "Sound Volume" slider (0-100%) → stores in localStorage `guptaos_global_volume`
- SoundManager reads on init, subscribes to storage changes
- Per-game volume: UI in pause menu (slider) → stores `guptaos_<game>_volume`
- Effective volume = `gameVolume ?? globalVolume`

---

## Implementation Order

```
1. types/app.types.ts
2. App.tsx (windows + message listener)
3. Dock.tsx
4. Desktop.tsx
5. src/utils/sound.ts
6. components/apps/GameWindowFrame.tsx
7. components/apps/GamesLauncher.tsx
8. components/apps/DinoGame.tsx
9. components/apps/PongGame.tsx
10. services/chatService.ts (tools + detection)
11. components/apps/Terminal.tsx (game command)
```

---

## Estimated Effort

| Component | Lines | Complexity |
|-----------|-------|------------|
| Foundation (4 files) | ~100 | Low |
| Sound Utility | ~80 | Low |
| GameWindowFrame | ~100 | Low |
| GamesLauncher | ~120 | Low |
| DinoGame | ~300 | Medium |
| PongGame | ~450 | Medium-High |
| AI Tools + Terminal | ~120 | Medium |
| **Total** | **~1,270** | **Medium** |

---

## Open Questions Resolved

1. **Pong AI Personality**: ✅ Yes - includes game context (score, time, difficulty)
2. **Difficulty Selection**: ✅ UI dropdown in Pong window
3. **Sound Volume**: ✅ Global (Settings) + Per-game (Pause menu), per-game overrides global
4. **Pause Menu**: ✅ Overlay with Resume/Restart/Quit for both games
5. **Particle Effects**: ✅ Simple canvas particles on score events

---

## Dependencies

- No new npm packages (Canvas 2D, Web Audio API, localStorage, postMessage are native)
- Uses existing: `useWindowManager`, `WindowFrame`, `chatService`, `storage` utility
- Settings app needs volume slider addition (minor)

---

## Testing Checklist

- [ ] Games icon appears in Dock, opens Games Launcher
- [ ] Games Launcher shows high scores from localStorage
- [ ] Dino Run: Jump physics, obstacles spawn, score increments, high score saves
- [ ] Dino Run: Pause (P), Restart (R), Fullscreen (F11), Mobile banner
- [ ] Pong: Classic mode (first to 10), Survival mode (60s)
- [ ] Pong: 4 difficulties behave differently (Easy → Unbeatable)
- [ ] Pong: AI personality occasionally triggers (console log for debugging)
- [ ] Pong: Difficulty dropdown works, persists during session
- [ ] Sound: Global volume in Settings affects both games
- [ ] Sound: Per-game volume in pause menu overrides global
- [ ] AI Chat: "I'm bored" → lists games with high scores
- [ ] AI Chat: "Play dino" → launches Dino Run window
- [ ] AI Chat: "Play pong survival" → launches Pong in survival mode
- [ ] Terminal: `game list`, `game dino`, `game pong classic`, `game pong survival`
- [ ] High scores persist across page reloads
- [ ] Window resize works, F11 fullscreen works, Escape exits fullscreen
- [ ] Pause overlay: Resume/Restart/Quit all functional

---

*Plan saved: 2026-08-16*
*Status: Implementation Complete*
