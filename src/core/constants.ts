/** Centralized enums, IDs, and error codes — single source of truth. */

export const GAME_TITLE = '彩珠消消';

export const DEFAULT_BOARD_WIDTH = 8;
export const DEFAULT_BOARD_HEIGHT = 8;
export const DEFAULT_GEM_TYPES = 6;
export const CELL_SIZE = 56;
export const BOARD_PADDING = 16;

export enum GemColor {
  Red = 0,
  Orange = 1,
  Yellow = 2,
  Green = 3,
  Blue = 4,
  Purple = 5,
}

export const GEM_COLOR_HEX: Record<GemColor, number> = {
  [GemColor.Red]: 0xff4d6d,
  [GemColor.Orange]: 0xff8a3d,
  [GemColor.Yellow]: 0xffd23f,
  [GemColor.Green]: 0x3ecf7a,
  [GemColor.Blue]: 0x3da9fc,
  [GemColor.Purple]: 0xb56bff,
};

export enum SpecialType {
  None = 0,
  LineH = 1,
  LineV = 2,
  Bomb = 3,
  ColorBomb = 4,
}

export enum ObstacleType {
  None = 0,
  Ice = 1,
}

export enum GoalType {
  Score = 'score',
  CollectColor = 'collectColor',
  BreakIce = 'breakIce',
}

export enum BoosterId {
  Hammer = 'hammer',
  Shuffle = 'shuffle',
  ExtraMoves = 'extraMoves',
}

export enum ErrorCode {
  Ok = 'OK',
  InvalidLevel = 'INVALID_LEVEL',
  InvalidSwap = 'INVALID_SWAP',
  NoProgress = 'NO_PROGRESS',
  BoosterEmpty = 'BOOSTER_EMPTY',
  SaveCorrupt = 'SAVE_CORRUPT',
  SaveTooLarge = 'SAVE_TOO_LARGE',
}

export enum GamePhase {
  Idle = 'idle',
  Resolving = 'resolving',
  Won = 'won',
  Lost = 'lost',
}

export const SCORE_PER_GEM = 10;
export const SCORE_SPECIAL_BONUS = 50;
export const CASCADE_MULTIPLIER = 0.25;

export const STORAGE_KEY = 'color-match-progress-v1';
export const STORAGE_VERSION = 1;
export const STORAGE_MAX_BYTES = 32_768;

export const DEFAULT_BOOSTERS: Record<BoosterId, number> = {
  [BoosterId.Hammer]: 3,
  [BoosterId.Shuffle]: 3,
  [BoosterId.ExtraMoves]: 3,
};

export const EXTRA_MOVES_AMOUNT = 5;

export const TOTAL_LEVELS = 30;
