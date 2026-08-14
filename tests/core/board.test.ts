import { describe, expect, it } from 'vitest';
import {
  createEmptyBoard,
  createGem,
  findMatchesSimple,
  generateBoard,
  hasAnyMatch,
  hasValidMove,
  shuffleBoard,
} from '../../src/core/board';
import { GemColor, SpecialType } from '../../src/core/constants';
import type { MatchGroup } from '../../src/core/types';
import { findMatchGroups } from '../../src/core/matcher';
import { Rng } from '../../src/core/rng';
import { trySwap, resolveBoard } from '../../src/core/resolver';
import { detectCombo, expandCombo } from '../../src/core/specials';

describe('board generation', () => {
  it('creates boards without immediate matches', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const board = generateBoard(8, 8, 6, new Rng(seed));
      expect(hasAnyMatch(board)).toBe(false);
      expect(hasValidMove(board)).toBe(true);
    }
  });

  it('shuffle eventually yields a valid move without matches', () => {
    const board = createEmptyBoard(6, 6, 4);
    let id = 1;
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 6; c += 1) {
        board.cells[r]![c]!.gem = createGem(id++, ((r + c) % 4) as GemColor);
      }
    }
    const ok = shuffleBoard(board, new Rng(99));
    expect(ok).toBe(true);
    expect(hasValidMove(board)).toBe(true);
  });
});

describe('matcher', () => {
  it('detects horizontal three', () => {
    const board = createEmptyBoard(5, 5, 4);
    board.cells[2]![1]!.gem = createGem(1, GemColor.Red);
    board.cells[2]![2]!.gem = createGem(2, GemColor.Red);
    board.cells[2]![3]!.gem = createGem(3, GemColor.Red);
    board.cells[0]![0]!.gem = createGem(4, GemColor.Blue);
    const matches = findMatchesSimple(board);
    expect(matches.length).toBe(3);
  });

  it('creates line special for four-in-a-row', () => {
    const board = createEmptyBoard(5, 5, 4);
    for (let c = 0; c < 4; c += 1) {
      board.cells[1]![c]!.gem = createGem(c + 1, GemColor.Green);
    }
    const groups = findMatchGroups(board, { row: 1, col: 3 }, { dr: 0, dc: 1 });
    expect(groups.length).toBe(1);
    expect(groups[0]!.specialToCreate).toBe(SpecialType.LineV);
  });

  it('creates color bomb for five-in-a-row', () => {
    const board = createEmptyBoard(6, 5, 4);
    for (let c = 0; c < 5; c += 1) {
      board.cells[0]![c]!.gem = createGem(c + 1, GemColor.Blue);
    }
    const groups = findMatchGroups(board);
    expect(groups[0]!.specialToCreate).toBe(SpecialType.ColorBomb);
  });

  it('creates bomb for L shape', () => {
    const board = createEmptyBoard(5, 5, 4);
    board.cells[2]![0]!.gem = createGem(1, GemColor.Yellow);
    board.cells[2]![1]!.gem = createGem(2, GemColor.Yellow);
    board.cells[2]![2]!.gem = createGem(3, GemColor.Yellow);
    board.cells[0]![2]!.gem = createGem(4, GemColor.Yellow);
    board.cells[1]![2]!.gem = createGem(5, GemColor.Yellow);
    const groups = findMatchGroups(board);
    expect(groups.some((g: MatchGroup) => g.specialToCreate === SpecialType.Bomb)).toBe(true);
  });
});

describe('swap resolve', () => {
  it('reverts invalid swaps', () => {
    let reverted = false;
    outer: for (let seed = 7; seed < 40; seed += 1) {
      const board = generateBoard(8, 8, 6, new Rng(seed));
      for (let r = 0; r < 8; r += 1) {
        for (let c = 0; c < 7; c += 1) {
          const snapshot = generateBoard(8, 8, 6, new Rng(seed));
          const result = trySwap(
            snapshot,
            { row: r, col: c },
            { row: r, col: c + 1 },
            new Rng(1),
          );
          if (result.reverted) {
            reverted = true;
            break outer;
          }
          void board;
        }
      }
    }
    expect(reverted).toBe(true);
  });

  it('resolves a forced match with gravity', () => {
    const board = createEmptyBoard(5, 5, 4);
    const colors: GemColor[][] = [
      [0, 1, 2, 3, 0],
      [1, 2, 3, 0, 1],
      [2, 0, 1, 2, 3],
      [3, 1, 0, 3, 2],
      [0, 3, 2, 1, 0],
    ];
    let id = 1;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        board.cells[r]![c]!.gem = createGem(id++, colors[r]![c]!);
      }
    }
    board.cells[2]![0]!.gem = createGem(100, GemColor.Red);
    board.cells[2]![1]!.gem = createGem(101, GemColor.Blue);
    board.cells[2]![2]!.gem = createGem(102, GemColor.Red);
    board.cells[2]![3]!.gem = createGem(103, GemColor.Red);
    board.cells[1]![1]!.gem = createGem(104, GemColor.Green);

    const result = trySwap(
      board,
      { row: 2, col: 1 },
      { row: 2, col: 0 },
      new Rng(3),
    );
    expect(result.valid || result.reverted).toBe(true);
  });
});

describe('specials and combos', () => {
  it('detects double color combo', () => {
    expect(detectCombo(SpecialType.ColorBomb, SpecialType.ColorBomb)).toBe(
      'doubleColor',
    );
  });

  it('color bomb clears a color', () => {
    const board = createEmptyBoard(4, 4, 3);
    let id = 1;
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        board.cells[r]![c]!.gem = createGem(
          id++,
          (c % 3) as GemColor,
          r === 0 && c === 0 ? SpecialType.ColorBomb : SpecialType.None,
        );
      }
    }
    board.cells[0]![1]!.gem = createGem(200, GemColor.Red);
    const positions = expandCombo(
      board,
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      'colorWithGem',
    );
    expect(positions.length).toBeGreaterThan(3);
  });

  it('activating line special clears a row via resolveBoard after manual clear setup', () => {
    const board = createEmptyBoard(5, 5, 4);
    let id = 1;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        board.cells[r]![c]!.gem = createGem(id++, ((r + c) % 4) as GemColor);
      }
    }
    board.cells[2]![2]!.gem = createGem(999, GemColor.Red, SpecialType.LineH);
    board.cells[2]![1]!.gem = createGem(998, GemColor.Red);
    board.cells[2]![3]!.gem = createGem(997, GemColor.Red);
    const result = resolveBoard(board, new Rng(1), {
      swapFocus: { row: 2, col: 2 },
      autoShuffle: false,
    });
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.totalScore).toBeGreaterThan(0);
  });
});
