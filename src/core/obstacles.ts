import { ObstacleType } from './constants';
import type { BoardState, CellPos } from './types';

/** Damage ice adjacent to cleared cells (or on cleared cells). Returns broken positions. */
export function damageIceFromClears(
  board: BoardState,
  cleared: CellPos[],
): CellPos[] {
  const broken: CellPos[] = [];
  const hit = new Set<string>();

  const damage = (row: number, col: number) => {
    if (row < 0 || col < 0 || row >= board.height || col >= board.width) return;
    const k = `${row},${col}`;
    if (hit.has(k)) return;
    hit.add(k);
    const cell = board.cells[row]![col]!;
    if (cell.obstacle !== ObstacleType.Ice || cell.iceLayers <= 0) return;
    cell.iceLayers -= 1;
    if (cell.iceLayers <= 0) {
      cell.obstacle = ObstacleType.None;
      cell.iceLayers = 0;
      broken.push({ row, col });
    }
  };

  for (const p of cleared) {
    // Ice on the cleared cell itself is hit
    damage(p.row, p.col);
    // Adjacent ice also takes damage (classic candy-style)
    damage(p.row - 1, p.col);
    damage(p.row + 1, p.col);
    damage(p.row, p.col - 1);
    damage(p.row, p.col + 1);
  }
  return broken;
}

export function countIce(board: BoardState): number {
  let n = 0;
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const cell = board.cells[r]![c]!;
      if (cell.obstacle === ObstacleType.Ice && cell.iceLayers > 0) n += 1;
    }
  }
  return n;
}

export function totalIceLayers(board: BoardState): number {
  let n = 0;
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      n += board.cells[r]![c]!.iceLayers;
    }
  }
  return n;
}
