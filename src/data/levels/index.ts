import type { LevelDef } from '../../core/types';
import { GoalType, ObstacleType } from '../../core/constants';
import { validateLevel } from '../../core/level';
import { ErrorCode } from '../../core/constants';

function iceLayout(
  width: number,
  height: number,
  iceCells: Array<[number, number, number?]>,
): LevelDef['layout'] {
  const layout = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({})),
  );
  for (const [r, c, layers = 1] of iceCells) {
    layout[r]![c] = {
      obstacle: ObstacleType.Ice,
      iceLayers: layers,
    };
  }
  return layout;
}

function buildLevels(): LevelDef[] {
  const levels: unknown[] = [];

  // 1–5: score tutorial
  for (let i = 1; i <= 5; i += 1) {
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 30 - i,
      gemTypes: Math.min(6, 4 + Math.floor((i - 1) / 2)),
      goal: { type: GoalType.Score, target: 800 + i * 200 },
      stars: [800 + i * 150, 1500 + i * 200, 2500 + i * 250],
      layout: null,
    });
  }

  // 6–10: ice intro
  for (let i = 6; i <= 10; i += 1) {
    const iceCount = 6 + (i - 6) * 2;
    const cells: Array<[number, number, number?]> = [];
    for (let n = 0; n < iceCount; n += 1) {
      const r = 1 + (n % 6);
      const c = 1 + Math.floor(n / 2) % 6;
      cells.push([r, c, i >= 9 ? 2 : 1]);
    }
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 28 - (i - 6),
      gemTypes: 5,
      goal: { type: GoalType.BreakIce, target: iceCount },
      stars: [1000, 2200, 3600],
      layout: iceLayout(8, 8, cells),
    });
  }

  // 11–15: collect color
  for (let i = 11; i <= 15; i += 1) {
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 26,
      gemTypes: 5,
      goal: {
        type: GoalType.CollectColor,
        target: 15 + (i - 11) * 3,
        color: (i - 11) % 5,
      },
      stars: [1200, 2500, 4000],
      layout: null,
    });
  }

  // 16–20: mixed score with more colors
  for (let i = 16; i <= 20; i += 1) {
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 24,
      gemTypes: 6,
      goal: { type: GoalType.Score, target: 2000 + (i - 16) * 400 },
      stars: [1800, 3200, 5000],
      layout: null,
    });
  }

  // 21–25: harder ice
  for (let i = 21; i <= 25; i += 1) {
    const iceCount = 12 + (i - 21) * 2;
    const cells: Array<[number, number, number?]> = [];
    for (let n = 0; n < iceCount; n += 1) {
      cells.push([1 + (n % 6), 1 + ((n * 3) % 6), n % 3 === 0 ? 2 : 1]);
    }
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 22,
      gemTypes: 6,
      goal: { type: GoalType.BreakIce, target: iceCount },
      stars: [1500, 3000, 4800],
      layout: iceLayout(8, 8, cells),
    });
  }

  // 26–30: collect + score challenge
  for (let i = 26; i <= 30; i += 1) {
    levels.push({
      id: i,
      width: 8,
      height: 8,
      moves: 20,
      gemTypes: 6,
      goal: {
        type: GoalType.CollectColor,
        target: 20 + (i - 26) * 2,
        color: (i - 26) % 6,
      },
      stars: [2000, 3500, 5500],
      layout: null,
    });
  }

  // Every 5th level is a timed challenge: no move limit, beat the clock instead.
  for (const raw of levels) {
    const o = raw as { id: number; moves: number; timeLimitSec?: number };
    if (o.id % 5 === 0) {
      o.moves = 999;
      o.timeLimitSec = 60 + (o.id / 5) * 10;
    }
  }

  return levels.map((raw) => {
    const result = validateLevel(raw);
    if (!result.ok) {
      throw new Error(`Bad level: ${result.message}`);
    }
    return result.level;
  });
}

export const LEVELS: LevelDef[] = buildLevels();

export function getLevel(id: number): LevelDef {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) {
    throw new Error(`${ErrorCode.InvalidLevel}: level ${id} not found`);
  }
  return level;
}
