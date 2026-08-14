import type {
  BoosterId,
  GamePhase,
  GemColor,
  GoalType,
  ObstacleType,
  SpecialType,
} from './constants';

export interface CellPos {
  row: number;
  col: number;
}

export interface Gem {
  id: number;
  color: GemColor;
  special: SpecialType;
}

export interface Cell {
  gem: Gem | null;
  obstacle: ObstacleType;
  iceLayers: number;
}

export interface BoardState {
  width: number;
  height: number;
  gemTypes: number;
  cells: Cell[][];
  nextGemId: number;
}

export interface LevelGoal {
  type: GoalType;
  target: number;
  color?: GemColor;
}

export interface LevelCellLayout {
  color?: GemColor | null;
  special?: SpecialType;
  obstacle?: ObstacleType;
  iceLayers?: number;
  empty?: boolean;
}

export interface LevelDef {
  id: number;
  width: number;
  height: number;
  moves: number;
  gemTypes: number;
  goal: LevelGoal;
  stars: [number, number, number];
  layout?: LevelCellLayout[][] | null;
  /** When set, the level is time-limited (seconds); moves are not the fail condition. */
  timeLimitSec?: number | null;
}

export type ClearCause =
  | 'match'
  | 'line'
  | 'bomb'
  | 'colorBomb'
  | 'combo'
  | 'hammer'
  | 'cascade';

export interface ClearEvent {
  positions: CellPos[];
  cause: ClearCause;
  score: number;
  createdSpecials: Array<{ pos: CellPos; special: SpecialType; color: GemColor }>;
  iceBroken: CellPos[];
  collectedByColor: Partial<Record<GemColor, number>>;
}

export interface FallEvent {
  from: CellPos;
  to: CellPos;
  gemId: number;
}

export interface SpawnEvent {
  pos: CellPos;
  gem: Gem;
}

export interface ResolveStep {
  clears: ClearEvent[];
  falls: FallEvent[];
  spawns: SpawnEvent[];
}

export interface ResolveResult {
  steps: ResolveStep[];
  totalScore: number;
  iceBrokenTotal: number;
  collectedByColor: Partial<Record<GemColor, number>>;
  shuffled: boolean;
}

export interface SwapResult {
  valid: boolean;
  reverted: boolean;
  resolve: ResolveResult | null;
}

export interface MatchGroup {
  positions: CellPos[];
  color: GemColor;
  specialToCreate: SpecialType;
  specialAt: CellPos;
}

export interface LevelProgress {
  score: number;
  movesLeft: number;
  goalProgress: number;
  collectedByColor: Partial<Record<GemColor, number>>;
  iceBroken: number;
  phase: GamePhase;
}

export interface SessionState {
  level: LevelDef;
  board: BoardState;
  progress: LevelProgress;
}

export interface ProgressSettings {
  volume: number;
  reducedMotion: boolean;
}

export interface PlayerProgress {
  version: number;
  maxUnlocked: number;
  stars: number[];
  boosters: Record<BoosterId, number>;
  settings: ProgressSettings;
}
