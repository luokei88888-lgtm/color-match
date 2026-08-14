import { describe, expect, it } from 'vitest';
import { GoalType, ObstacleType, GemColor } from '../../src/core/constants';
import { createSession, isGoalMet, starCount, validateLevel } from '../../src/core/level';
import { damageIceFromClears, countIce } from '../../src/core/obstacles';
import { createEmptyBoard, createGem } from '../../src/core/board';
import { LEVELS, getLevel } from '../../src/data/levels';
import { defaultProgress, recordLevelWin } from '../../src/storage/progress';

describe('levels', () => {
  it('has 30 valid levels', () => {
    expect(LEVELS.length).toBe(30);
    expect(getLevel(1).id).toBe(1);
    expect(getLevel(30).id).toBe(30);
  });

  it('rejects invalid level payload', () => {
    const result = validateLevel({ id: 1, moves: 10 });
    expect(result.ok).toBe(false);
  });

  it('computes stars and win progress', () => {
    const p = defaultProgress();
    const next = recordLevelWin(p, 1, 2);
    expect(next.maxUnlocked).toBe(2);
    expect(next.stars[0]).toBe(2);
    expect(starCount(5000, [1000, 2000, 4000])).toBe(3);
  });
});

describe('ice and goals', () => {
  it('damages ice on and adjacent to clears', () => {
    const board = createEmptyBoard(5, 5, 4);
    board.cells[2]![2]!.obstacle = ObstacleType.Ice;
    board.cells[2]![2]!.iceLayers = 2;
    board.cells[2]![2]!.gem = createGem(1, GemColor.Red);
    const broken = damageIceFromClears(board, [{ row: 2, col: 1 }]);
    expect(board.cells[2]![2]!.iceLayers).toBe(1);
    expect(broken.length).toBe(0);
    const broken2 = damageIceFromClears(board, [{ row: 2, col: 2 }]);
    expect(countIce(board)).toBe(0);
    expect(broken2.length).toBe(1);
  });

  it('session goal score met', () => {
    const level = getLevel(1);
    const session = createSession(level, 1);
    session.progress.score = level.goal.target;
    session.progress.goalProgress = level.goal.target;
    expect(level.goal.type).toBe(GoalType.Score);
    expect(isGoalMet(session.progress, level)).toBe(true);
  });
});
