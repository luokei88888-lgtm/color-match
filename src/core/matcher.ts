import { SpecialType } from './constants';
import type { GemColor } from './constants';
import type { BoardState, CellPos, MatchGroup } from './types';

const key = (p: CellPos) => `${p.row},${p.col}`;

function collectRuns(
  board: BoardState,
  horizontal: boolean,
): Array<{ color: GemColor; positions: CellPos[] }> {
  const runs: Array<{ color: GemColor; positions: CellPos[] }> = [];
  const primary = horizontal ? board.height : board.width;
  const secondary = horizontal ? board.width : board.height;

  for (let i = 0; i < primary; i += 1) {
    let runPositions: CellPos[] = [];
    let runColor: GemColor | null = null;

    const flush = () => {
      if (runColor !== null && runPositions.length >= 3) {
        runs.push({ color: runColor, positions: runPositions.slice() });
      }
      runPositions = [];
      runColor = null;
    };

    for (let j = 0; j < secondary; j += 1) {
      const row = horizontal ? i : j;
      const col = horizontal ? j : i;
      const gem = board.cells[row]![col]!.gem;
      if (gem && runColor !== null && gem.color === runColor) {
        runPositions.push({ row, col });
      } else {
        flush();
        if (gem) {
          runColor = gem.color;
          runPositions = [{ row, col }];
        }
      }
    }
    flush();
  }
  return runs;
}

function pickSpecialAt(
  positions: CellPos[],
  preferred: CellPos | null,
): CellPos {
  if (preferred && positions.some((p) => p.row === preferred.row && p.col === preferred.col)) {
    return preferred;
  }
  return positions[Math.floor(positions.length / 2)]!;
}

/**
 * Find match groups and decide which specials to spawn.
 * swapFocus: the cell the player moved into (preferred special spawn).
 * swapDir: swap direction for line special orientation.
 */
export function findMatchGroups(
  board: BoardState,
  swapFocus: CellPos | null = null,
  swapDir: { dr: number; dc: number } | null = null,
): MatchGroup[] {
  const hRuns = collectRuns(board, true);
  const vRuns = collectRuns(board, false);

  const cellToRuns = new Map<string, { h?: CellPos[]; v?: CellPos[]; color: GemColor }>();

  for (const run of hRuns) {
    for (const p of run.positions) {
      const k = key(p);
      const entry = cellToRuns.get(k) ?? { color: run.color };
      entry.h = run.positions;
      entry.color = run.color;
      cellToRuns.set(k, entry);
    }
  }
  for (const run of vRuns) {
    for (const p of run.positions) {
      const k = key(p);
      const entry = cellToRuns.get(k) ?? { color: run.color };
      entry.v = run.positions;
      entry.color = run.color;
      cellToRuns.set(k, entry);
    }
  }

  // Union overlapping runs into groups
  const visited = new Set<string>();
  const groups: MatchGroup[] = [];

  for (const [startKey, info] of cellToRuns) {
    if (visited.has(startKey)) continue;
    const queue = [startKey];
    visited.add(startKey);
    const positions: CellPos[] = [];
    let maxH = 0;
    let maxV = 0;
    let hasCross = false;

    while (queue.length) {
      const k = queue.pop()!;
      const [rs, cs] = k.split(',').map(Number);
      positions.push({ row: rs!, col: cs! });
      const cellInfo = cellToRuns.get(k)!;
      if (cellInfo.h && cellInfo.v) hasCross = true;
      if (cellInfo.h) maxH = Math.max(maxH, cellInfo.h.length);
      if (cellInfo.v) maxV = Math.max(maxV, cellInfo.v.length);

      for (const run of [cellInfo.h, cellInfo.v]) {
        if (!run) continue;
        for (const p of run) {
          const pk = key(p);
          if (!visited.has(pk) && cellToRuns.has(pk)) {
            visited.add(pk);
            queue.push(pk);
          }
        }
      }
    }

    let special = SpecialType.None;
    if (maxH >= 5 || maxV >= 5) {
      special = SpecialType.ColorBomb;
    } else if (hasCross) {
      special = SpecialType.Bomb;
    } else if (maxH >= 4 || maxV >= 4) {
      if (swapDir && Math.abs(swapDir.dr) > Math.abs(swapDir.dc)) {
        special = SpecialType.LineH; // vertical swipe -> horizontal clear line gem
      } else if (swapDir && Math.abs(swapDir.dc) > Math.abs(swapDir.dr)) {
        special = SpecialType.LineV;
      } else if (maxH >= 4) {
        special = SpecialType.LineH;
      } else {
        special = SpecialType.LineV;
      }
    }

    groups.push({
      positions,
      color: info.color,
      specialToCreate: special,
      specialAt: pickSpecialAt(positions, swapFocus),
    });
  }

  return groups;
}

export function allMatchedPositions(groups: MatchGroup[]): CellPos[] {
  const seen = new Set<string>();
  const out: CellPos[] = [];
  for (const g of groups) {
    for (const p of g.positions) {
      const k = key(p);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    }
  }
  return out;
}
