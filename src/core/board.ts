import {
  DEFAULT_BOARD_HEIGHT,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_GEM_TYPES,
  ObstacleType,
  SpecialType,
} from './constants';
import type { GemColor } from './constants';
import { Rng } from './rng';
import type { BoardState, Cell, CellPos, Gem, LevelCellLayout } from './types';

export function emptyCell(): Cell {
  return { gem: null, obstacle: ObstacleType.None, iceLayers: 0 };
}

export function createGem(id: number, color: GemColor, special = SpecialType.None): Gem {
  return { id, color, special };
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    width: board.width,
    height: board.height,
    gemTypes: board.gemTypes,
    nextGemId: board.nextGemId,
    cells: board.cells.map((row) =>
      row.map((cell) => ({
        gem: cell.gem ? { ...cell.gem } : null,
        obstacle: cell.obstacle,
        iceLayers: cell.iceLayers,
      })),
    ),
  };
}

export function inBounds(board: BoardState, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < board.height && col < board.width;
}

export function getCell(board: BoardState, pos: CellPos): Cell | null {
  if (!inBounds(board, pos.row, pos.col)) return null;
  return board.cells[pos.row]![pos.col]!;
}

export function areAdjacent(a: CellPos, b: CellPos): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swapGems(board: BoardState, a: CellPos, b: CellPos): void {
  const cellA = board.cells[a.row]![a.col]!;
  const cellB = board.cells[b.row]![b.col]!;
  const tmp = cellA.gem;
  cellA.gem = cellB.gem;
  cellB.gem = tmp;
}

export function randomColor(board: BoardState, rng: Rng): GemColor {
  return rng.int(0, board.gemTypes) as GemColor;
}

export function createEmptyBoard(
  width = DEFAULT_BOARD_WIDTH,
  height = DEFAULT_BOARD_HEIGHT,
  gemTypes = DEFAULT_GEM_TYPES,
): BoardState {
  const cells: Cell[][] = [];
  for (let r = 0; r < height; r += 1) {
    const row: Cell[] = [];
    for (let c = 0; c < width; c += 1) {
      row.push(emptyCell());
    }
    cells.push(row);
  }
  return { width, height, gemTypes, cells, nextGemId: 1 };
}

function wouldCreateMatch(
  board: BoardState,
  row: number,
  col: number,
  color: GemColor,
): boolean {
  // Horizontal: look left
  let left = 0;
  for (let c = col - 1; c >= 0; c -= 1) {
    const g = board.cells[row]![c]!.gem;
    if (g && g.color === color) left += 1;
    else break;
  }
  if (left >= 2) return true;

  // Vertical: look up
  let up = 0;
  for (let r = row - 1; r >= 0; r -= 1) {
    const g = board.cells[r]![col]!.gem;
    if (g && g.color === color) up += 1;
    else break;
  }
  return up >= 2;
}

export function applyLayout(
  board: BoardState,
  layout: LevelCellLayout[][],
  rng: Rng,
): void {
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const spec = layout[r]?.[c];
      const cell = board.cells[r]![c]!;
      if (!spec || spec.empty) {
        cell.gem = null;
        cell.obstacle = ObstacleType.None;
        cell.iceLayers = 0;
        continue;
      }
      cell.obstacle = spec.obstacle ?? ObstacleType.None;
      cell.iceLayers =
        spec.iceLayers ?? (cell.obstacle === ObstacleType.Ice ? 1 : 0);
      if (cell.obstacle === ObstacleType.Ice && cell.iceLayers <= 0) {
        cell.iceLayers = 1;
      }
      const color =
        spec.color === null || spec.color === undefined
          ? randomColor(board, rng)
          : spec.color;
      cell.gem = createGem(board.nextGemId++, color, spec.special ?? SpecialType.None);
    }
  }
}

/** Fill board without immediate matches; retries until a legal move exists. */
export function generateBoard(
  width = DEFAULT_BOARD_WIDTH,
  height = DEFAULT_BOARD_HEIGHT,
  gemTypes = DEFAULT_GEM_TYPES,
  rng: Rng = new Rng(),
  layout?: LevelCellLayout[][] | null,
): BoardState {
  const board = createEmptyBoard(width, height, gemTypes);
  if (layout) {
    applyLayout(board, layout, rng);
    // Fill any null gems that layout left empty intentionally stay empty;
    // fill missing colors that were random-requested already done.
    for (let r = 0; r < height; r += 1) {
      for (let c = 0; c < width; c += 1) {
        const cell = board.cells[r]![c]!;
        if (!cell.gem && !(layout[r]?.[c]?.empty)) {
          // Shouldn't happen with applyLayout; safety fill
          let color = randomColor(board, rng);
          let attempts = 0;
          while (wouldCreateMatch(board, r, c, color) && attempts < 20) {
            color = randomColor(board, rng);
            attempts += 1;
          }
          cell.gem = createGem(board.nextGemId++, color);
        }
      }
    }
    return board;
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    board.nextGemId = 1;
    for (let r = 0; r < height; r += 1) {
      for (let c = 0; c < width; c += 1) {
        let color = randomColor(board, rng);
        let tries = 0;
        while (wouldCreateMatch(board, r, c, color) && tries < 30) {
          color = randomColor(board, rng);
          tries += 1;
        }
        board.cells[r]![c]!.gem = createGem(board.nextGemId++, color);
        board.cells[r]![c]!.obstacle = ObstacleType.None;
        board.cells[r]![c]!.iceLayers = 0;
      }
    }
    if (hasValidMove(board)) return board;
  }
  return board;
}

export function findMatchesSimple(board: BoardState): CellPos[] {
  const marked = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < board.height; r += 1) {
    let run = 1;
    for (let c = 1; c <= board.width; c += 1) {
      const prev = board.cells[r]![c - 1]!.gem;
      const cur = c < board.width ? board.cells[r]![c]!.gem : null;
      if (prev && cur && prev.color === cur.color) {
        run += 1;
      } else {
        if (prev && run >= 3) {
          for (let k = 0; k < run; k += 1) marked.add(key(r, c - 1 - k));
        }
        run = 1;
      }
    }
  }

  for (let c = 0; c < board.width; c += 1) {
    let run = 1;
    for (let r = 1; r <= board.height; r += 1) {
      const prev = board.cells[r - 1]![c]!.gem;
      const cur = r < board.height ? board.cells[r]![c]!.gem : null;
      if (prev && cur && prev.color === cur.color) {
        run += 1;
      } else {
        if (prev && run >= 3) {
          for (let k = 0; k < run; k += 1) marked.add(key(r - 1 - k, c));
        }
        run = 1;
      }
    }
  }

  return [...marked].map((s) => {
    const [row, col] = s.split(',').map(Number);
    return { row: row!, col: col! };
  });
}

export function hasAnyMatch(board: BoardState): boolean {
  return findMatchesSimple(board).length > 0;
}

export function hasValidMove(board: BoardState): boolean {
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const a = { row: r, col: c };
      const neighbors = [
        { row: r, col: c + 1 },
        { row: r + 1, col: c },
      ];
      for (const b of neighbors) {
        if (!inBounds(board, b.row, b.col)) continue;
        const cellA = board.cells[r]![c]!;
        const cellB = board.cells[b.row]![b.col]!;
        if (!cellA.gem || !cellB.gem) continue;
        // Specials can always be activated by swapping with anything
        if (
          cellA.gem.special !== SpecialType.None ||
          cellB.gem.special !== SpecialType.None
        ) {
          return true;
        }
        swapGems(board, a, b);
        const ok = hasAnyMatch(board);
        swapGems(board, a, b);
        if (ok) return true;
      }
    }
  }
  return false;
}

/** Shuffle gem colors/specials in place until a valid move exists (or max tries). */
export function shuffleBoard(board: BoardState, rng: Rng = new Rng()): boolean {
  const gems: Gem[] = [];
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const g = board.cells[r]![c]!.gem;
      if (g) gems.push(g);
    }
  }
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const shuffled = rng.shuffle(gems);
    let i = 0;
    for (let r = 0; r < board.height; r += 1) {
      for (let c = 0; c < board.width; c += 1) {
        if (board.cells[r]![c]!.gem) {
          board.cells[r]![c]!.gem = shuffled[i++]!;
        }
      }
    }
    if (!hasAnyMatch(board) && hasValidMove(board)) return true;
  }
  return hasValidMove(board);
}

export function applyGravity(board: BoardState): {
  falls: { from: CellPos; to: CellPos; gemId: number }[];
} {
  const falls: { from: CellPos; to: CellPos; gemId: number }[] = [];
  for (let c = 0; c < board.width; c += 1) {
    let write = board.height - 1;
    for (let r = board.height - 1; r >= 0; r -= 1) {
      const cell = board.cells[r]![c]!;
      if (cell.gem) {
        if (r !== write) {
          falls.push({
            from: { row: r, col: c },
            to: { row: write, col: c },
            gemId: cell.gem.id,
          });
          board.cells[write]![c]!.gem = cell.gem;
          cell.gem = null;
        }
        write -= 1;
      }
    }
  }
  return { falls };
}

export function refillBoard(
  board: BoardState,
  rng: Rng,
): { spawns: { pos: CellPos; gem: Gem }[] } {
  const spawns: { pos: CellPos; gem: Gem }[] = [];
  for (let c = 0; c < board.width; c += 1) {
    for (let r = 0; r < board.height; r += 1) {
      const cell = board.cells[r]![c]!;
      if (!cell.gem) {
        const gem = createGem(board.nextGemId++, randomColor(board, rng));
        cell.gem = gem;
        spawns.push({ pos: { row: r, col: c }, gem: { ...gem } });
      }
    }
  }
  return { spawns };
}
