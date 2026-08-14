import { SpecialType } from './constants';
import type { GemColor } from './constants';
import { getCell, inBounds } from './board';
import type { BoardState, CellPos } from './types';

const key = (p: CellPos) => `${p.row},${p.col}`;

export function addPos(set: Map<string, CellPos>, pos: CellPos): void {
  set.set(key(pos), pos);
}

export function lineClearPositions(
  board: BoardState,
  pos: CellPos,
  horizontal: boolean,
): CellPos[] {
  const out: CellPos[] = [];
  if (horizontal) {
    for (let c = 0; c < board.width; c += 1) {
      out.push({ row: pos.row, col: c });
    }
  } else {
    for (let r = 0; r < board.height; r += 1) {
      out.push({ row: r, col: pos.col });
    }
  }
  return out;
}

export function bombClearPositions(board: BoardState, pos: CellPos, radius = 1): CellPos[] {
  const out: CellPos[] = [];
  for (let r = pos.row - radius; r <= pos.row + radius; r += 1) {
    for (let c = pos.col - radius; c <= pos.col + radius; c += 1) {
      if (inBounds(board, r, c)) out.push({ row: r, col: c });
    }
  }
  return out;
}

export function colorBombPositions(board: BoardState, color: GemColor): CellPos[] {
  const out: CellPos[] = [];
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      const gem = board.cells[r]![c]!.gem;
      if (gem && gem.color === color) out.push({ row: r, col: c });
    }
  }
  return out;
}

export function allBoardPositions(board: BoardState): CellPos[] {
  const out: CellPos[] = [];
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      out.push({ row: r, col: c });
    }
  }
  return out;
}

export type ComboKind =
  | 'none'
  | 'doubleLine'
  | 'lineBomb'
  | 'doubleBomb'
  | 'colorWithGem'
  | 'colorWithLine'
  | 'colorWithBomb'
  | 'doubleColor';

export function detectCombo(
  aSpecial: SpecialType,
  bSpecial: SpecialType,
): ComboKind {
  const a = aSpecial;
  const b = bSpecial;
  const isLine = (s: SpecialType) => s === SpecialType.LineH || s === SpecialType.LineV;
  const isColor = (s: SpecialType) => s === SpecialType.ColorBomb;
  const isBomb = (s: SpecialType) => s === SpecialType.Bomb;

  if (isColor(a) && isColor(b)) return 'doubleColor';
  if (isColor(a) || isColor(b)) {
    const other = isColor(a) ? b : a;
    if (other === SpecialType.None) return 'colorWithGem';
    if (isLine(other)) return 'colorWithLine';
    if (isBomb(other)) return 'colorWithBomb';
  }
  if (isLine(a) && isLine(b)) return 'doubleLine';
  if ((isLine(a) && isBomb(b)) || (isBomb(a) && isLine(b))) return 'lineBomb';
  if (isBomb(a) && isBomb(b)) return 'doubleBomb';
  return 'none';
}

/** Expand special activation into positions to clear (does not mutate). */
export function expandSpecial(
  board: BoardState,
  pos: CellPos,
  already: Map<string, CellPos>,
): void {
  const cell = getCell(board, pos);
  if (!cell?.gem) return;
  const special = cell.gem.special;
  if (special === SpecialType.None) {
    addPos(already, pos);
    return;
  }
  let positions: CellPos[] = [];
  if (special === SpecialType.LineH) {
    positions = lineClearPositions(board, pos, true);
  } else if (special === SpecialType.LineV) {
    positions = lineClearPositions(board, pos, false);
  } else if (special === SpecialType.Bomb) {
    positions = bombClearPositions(board, pos, 1);
  } else if (special === SpecialType.ColorBomb) {
    // Alone: treat as no-op target; color chosen by partner elsewhere
    positions = [pos];
  }
  for (const p of positions) addPos(already, p);
}

export function expandCombo(
  board: BoardState,
  a: CellPos,
  b: CellPos,
  kind: ComboKind,
): CellPos[] {
  const map = new Map<string, CellPos>();
  const gemA = board.cells[a.row]![a.col]!.gem;
  const gemB = board.cells[b.row]![b.col]!.gem;

  switch (kind) {
    case 'doubleColor':
      for (const p of allBoardPositions(board)) addPos(map, p);
      break;
    case 'doubleLine':
      for (const p of lineClearPositions(board, a, true)) addPos(map, p);
      for (const p of lineClearPositions(board, a, false)) addPos(map, p);
      break;
    case 'lineBomb':
    case 'doubleBomb': {
      // Large plus / bigger bomb
      for (const p of bombClearPositions(board, a, 2)) addPos(map, p);
      for (const p of lineClearPositions(board, a, true)) addPos(map, p);
      for (const p of lineClearPositions(board, a, false)) addPos(map, p);
      break;
    }
    case 'colorWithGem': {
      const color = gemA?.special === SpecialType.ColorBomb ? gemB?.color : gemA?.color;
      if (color !== undefined) {
        for (const p of colorBombPositions(board, color)) addPos(map, p);
      }
      addPos(map, a);
      addPos(map, b);
      break;
    }
    case 'colorWithLine':
    case 'colorWithBomb': {
      // Turn all gems of partner color into the partner special, then clear them
      const colorGem = gemA?.special === SpecialType.ColorBomb ? gemB : gemA;
      const color = colorGem?.color;
      const special =
        gemA?.special === SpecialType.ColorBomb ? gemB?.special : gemA?.special;
      if (color !== undefined && special !== undefined) {
        const targets = colorBombPositions(board, color);
        for (const p of targets) {
          addPos(map, p);
          if (special === SpecialType.LineH || special === SpecialType.LineV) {
            const horiz = special === SpecialType.LineH;
            for (const q of lineClearPositions(board, p, horiz)) addPos(map, q);
          } else if (special === SpecialType.Bomb) {
            for (const q of bombClearPositions(board, p, 1)) addPos(map, q);
          }
        }
      }
      addPos(map, a);
      addPos(map, b);
      break;
    }
    default:
      addPos(map, a);
      addPos(map, b);
  }
  return [...map.values()];
}
