export type GameStateType = 'welcome' | 'instructions' | 'countdown' | 'playing' | 'paused' | 'gameover';

export interface Bubble {
  id: string;
  x: number; // calculated in canvas pixels or relative units. Relative is safer for resizing, but physical X & Y in pixels computed relative to canvas width/height is direct. We will use relative (0 to 100) to design it perfectly and then map it to canvas coordinates, OR store pixel coordinates directly and map them. Relative coordinate (x: 0-1, y: 0-1) is incredibly elegant because it automatically handles canvas scaling perfectly on responsive screens!
  y: number; // 0 to 1 (starts above screen, e.g. -0.1, falls down to 1.1)
  radius: number; // relative size (e.g. 0.03 to 0.06 of canvas width) or absolute size at creation (e.g. 20 to 50 pixels)
  speedY: number; // relative speed per frame
  color: string;
  type: 'normal' | 'golden' | 'poison' | 'bubble'; // different values & rules
  popped: boolean;
  scoreValue: number;
}

export interface Particle {
  id: string;
  x: number; // absolute canvas pixels
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number; // starts at 1.0, decays to 0
  maxLife: number;
}

export interface HandPointer {
  x: number; // 0 to 1 relative
  y: number; // 0 to 1 relative
  px: number; // absolute X in canvas pixels
  py: number; // absolute Y in canvas pixels
  label: 'Left' | 'Right';
  landmarkType: 'index' | 'middle'; // Point 8 (index), Point 12 (middle)
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  cameraMirrored: boolean;
}
