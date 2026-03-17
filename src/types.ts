export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
}

export interface PlayerState {
  lane: number; // -1, 0, 1
  isJumping: boolean;
  isSliding: boolean;
  y: number;
  velocity: number;
}
