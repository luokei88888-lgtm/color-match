import {
  DEFAULT_BOARD_HEIGHT,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_GEM_TYPES,
  ErrorCode,
  GamePhase,
  GoalType,
} from './constants';
import type { GemColor } from './constants';
import { countIce } from './obstacles';
import type {
  LevelDef,
  LevelGoal,
  LevelProgress,
  SessionState,
} from './types';
import { generateBoard } from './board';
import { Rng } from './rng';

export function validateLevel(raw: unknown): { ok: true; level: LevelDef } | { ok: false; error: ErrorCode; message: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'Level must be an object' };
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'number' || o.id < 1) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'Invalid id' };
  }
  const width = typeof o.width === 'number' ? o.width : DEFAULT_BOARD_WIDTH;
  const height = typeof o.height === 'number' ? o.height : DEFAULT_BOARD_HEIGHT;
  const moves = typeof o.moves === 'number' ? o.moves : 20;
  const gemTypes = typeof o.gemTypes === 'number' ? o.gemTypes : DEFAULT_GEM_TYPES;
  if (width < 4 || height < 4 || width > 10 || height > 10) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'Board size out of range' };
  }
  if (moves < 1 || gemTypes < 3 || gemTypes > 6) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'Invalid moves/gemTypes' };
  }
  const goalRaw = o.goal as Record<string, unknown> | undefined;
  if (!goalRaw || typeof goalRaw.type !== 'string' || typeof goalRaw.target !== 'number') {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'Invalid goal' };
  }
  if (!Object.values(GoalType).includes(goalRaw.type as GoalType)) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: `Unknown goal type ${goalRaw.type}` };
  }
  const stars = o.stars;
  if (
    !Array.isArray(stars) ||
    stars.length !== 3 ||
    stars.some((s) => typeof s !== 'number')
  ) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'stars must be [n,n,n]' };
  }

  const goal: LevelGoal = {
    type: goalRaw.type as GoalType,
    target: goalRaw.target as number,
    color: typeof goalRaw.color === 'number' ? (goalRaw.color as GemColor) : undefined,
  };

  if (goal.type === GoalType.CollectColor && goal.color === undefined) {
    return { ok: false, error: ErrorCode.InvalidLevel, message: 'collectColor needs color' };
  }

  const timeLimitSec = o.timeLimitSec;
  if (timeLimitSec !== undefined && timeLimitSec !== null) {
    if (typeof timeLimitSec !== 'number' || timeLimitSec < 10 || timeLimitSec > 600) {
      return { ok: false, error: ErrorCode.InvalidLevel, message: 'timeLimitSec out of range' };
    }
  }

  return {
    ok: true,
    level: {
      id: o.id as number,
      width,
      height,
      moves,
      gemTypes,
      goal,
      stars: stars as [number, number, number],
      layout: (o.layout as LevelDef['layout']) ?? null,
      timeLimitSec: (timeLimitSec as number | undefined) ?? null,
    },
  };
}

export function createSession(level: LevelDef, seed?: number): SessionState {
  const rng = new Rng(seed ?? level.id * 9973 + 42);
  const board = generateBoard(
    level.width,
    level.height,
    level.gemTypes,
    rng,
    level.layout,
  );
  return {
    level,
    board,
    progress: {
      score: 0,
      movesLeft: level.moves,
      goalProgress: 0,
      collectedByColor: {},
      iceBroken: 0,
      phase: GamePhase.Idle,
    },
  };
}

export function computeGoalProgress(
  progress: LevelProgress,
  level: LevelDef,
  boardIceCount?: number,
): number {
  switch (level.goal.type) {
    case GoalType.Score:
      return progress.score;
    case GoalType.CollectColor: {
      const color = level.goal.color!;
      return progress.collectedByColor[color] ?? 0;
    }
    case GoalType.BreakIce:
      return progress.iceBroken;
    default:
      return boardIceCount ?? 0;
  }
}

export function isGoalMet(progress: LevelProgress, level: LevelDef): boolean {
  return computeGoalProgress(progress, level) >= level.goal.target;
}

export function starCount(score: number, stars: [number, number, number]): number {
  let n = 0;
  for (const t of stars) {
    if (score >= t) n += 1;
  }
  return n;
}

export function applyResolveToProgress(
  session: SessionState,
  delta: {
    score: number;
    iceBroken: number;
    collectedByColor: Partial<Record<GemColor, number>>;
  },
  spentMove: boolean,
): void {
  const { progress, level, board } = session;
  progress.score += delta.score;
  progress.iceBroken += delta.iceBroken;
  for (const [k, v] of Object.entries(delta.collectedByColor)) {
    const color = Number(k) as GemColor;
    progress.collectedByColor[color] =
      (progress.collectedByColor[color] ?? 0) + (v ?? 0);
  }
  if (spentMove) progress.movesLeft = Math.max(0, progress.movesLeft - 1);

  progress.goalProgress = computeGoalProgress(progress, level, countIce(board));

  if (isGoalMet(progress, level)) {
    progress.phase = GamePhase.Won;
  } else if (progress.movesLeft <= 0) {
    progress.phase = GamePhase.Lost;
  } else {
    progress.phase = GamePhase.Idle;
  }
}
