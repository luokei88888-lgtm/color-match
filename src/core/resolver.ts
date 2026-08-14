import {
  CASCADE_MULTIPLIER,
  SCORE_PER_GEM,
  SCORE_SPECIAL_BONUS,
  SpecialType,
} from './constants';
import type { GemColor } from './constants';
import {
  applyGravity,
  areAdjacent,
  getCell,
  hasAnyMatch,
  hasValidMove,
  refillBoard,
  shuffleBoard,
  swapGems,
} from './board';
import { allMatchedPositions, findMatchGroups } from './matcher';
import { damageIceFromClears } from './obstacles';
import { Rng } from './rng';
import {
  detectCombo,
  expandCombo,
  expandSpecial,
} from './specials';
import type {
  BoardState,
  CellPos,
  ClearEvent,
  ResolveResult,
  ResolveStep,
  SwapResult,
} from './types';

const posKey = (p: CellPos) => `${p.row},${p.col}`;

function mergeCollected(
  into: Partial<Record<GemColor, number>>,
  from: Partial<Record<GemColor, number>>,
): void {
  for (const [k, v] of Object.entries(from)) {
    const color = Number(k) as GemColor;
    into[color] = (into[color] ?? 0) + (v ?? 0);
  }
}

function collectColors(
  board: BoardState,
  positions: CellPos[],
): Partial<Record<GemColor, number>> {
  const out: Partial<Record<GemColor, number>> = {};
  for (const p of positions) {
    const gem = board.cells[p.row]![p.col]!.gem;
    if (!gem) continue;
    out[gem.color] = (out[gem.color] ?? 0) + 1;
  }
  return out;
}

function clearPositions(
  board: BoardState,
  positions: CellPos[],
  protect: Map<string, { special: SpecialType; color: GemColor }>,
): void {
  for (const p of positions) {
    const k = posKey(p);
    if (protect.has(k)) continue;
    board.cells[p.row]![p.col]!.gem = null;
  }
  for (const [k, spec] of protect) {
    const [r, c] = k.split(',').map(Number);
    const cell = board.cells[r!]![c!]!;
    cell.gem = {
      id: board.nextGemId++,
      color: spec.color,
      special: spec.special,
    };
  }
}

/**
 * Resolve one cascade wave: find matches, expand specials in matched set,
 * clear, damage ice, then gravity + refill happen in the outer loop.
 */
function resolveMatchWave(
  board: BoardState,
  swapFocus: CellPos | null,
  swapDir: { dr: number; dc: number } | null,
  cascadeIndex: number,
): ClearEvent | null {
  const groups = findMatchGroups(board, swapFocus, swapDir);
  if (groups.length === 0) return null;

  const matched = allMatchedPositions(groups);
  const clearMap = new Map<string, CellPos>();
  for (const p of matched) clearMap.set(posKey(p), p);

  // Chain-activate specials that are part of the match
  const queue = matched.slice();
  const activated = new Set<string>();
  while (queue.length) {
    const p = queue.shift()!;
    const k = posKey(p);
    if (activated.has(k)) continue;
    activated.add(k);
    const gem = board.cells[p.row]![p.col]!.gem;
    if (!gem || gem.special === SpecialType.None) continue;
    const before = clearMap.size;
    expandSpecial(board, p, clearMap);
    if (clearMap.size > before) {
      for (const np of clearMap.values()) {
        const nk = posKey(np);
        if (!activated.has(nk)) queue.push(np);
      }
    }
  }

  const positions = [...clearMap.values()];
  const createdSpecials = groups
    .filter((g) => g.specialToCreate !== SpecialType.None)
    .map((g) => ({
      pos: g.specialAt,
      special: g.specialToCreate,
      color: g.color,
    }));

  const protect = new Map<string, { special: SpecialType; color: GemColor }>();
  for (const s of createdSpecials) {
    protect.set(posKey(s.pos), { special: s.special, color: s.color });
  }

  const collectedByColor = collectColors(board, positions);
  const mult = 1 + cascadeIndex * CASCADE_MULTIPLIER;
  const score =
    Math.round(positions.length * SCORE_PER_GEM * mult) +
    createdSpecials.length * SCORE_SPECIAL_BONUS;

  const iceBroken = damageIceFromClears(board, positions);
  clearPositions(board, positions, protect);

  return {
    positions,
    cause: cascadeIndex === 0 ? 'match' : 'cascade',
    score,
    createdSpecials,
    iceBroken,
    collectedByColor,
  };
}

function resolveSpecialSwap(
  board: BoardState,
  a: CellPos,
  b: CellPos,
): ClearEvent {
  const gemA = board.cells[a.row]![a.col]!.gem!;
  const gemB = board.cells[b.row]![b.col]!.gem!;
  const combo = detectCombo(gemA.special, gemB.special);

  let positions: CellPos[];
  let cause: ClearEvent['cause'] = 'combo';

  if (combo !== 'none') {
    positions = expandCombo(board, a, b, combo);
  } else if (gemA.special !== SpecialType.None || gemB.special !== SpecialType.None) {
    const map = new Map<string, CellPos>();
    if (gemA.special === SpecialType.ColorBomb && gemB.special === SpecialType.None) {
      positions = expandCombo(board, a, b, 'colorWithGem');
      cause = 'colorBomb';
    } else if (gemB.special === SpecialType.ColorBomb && gemA.special === SpecialType.None) {
      positions = expandCombo(board, b, a, 'colorWithGem');
      cause = 'colorBomb';
    } else {
      if (gemA.special !== SpecialType.None) expandSpecial(board, a, map);
      if (gemB.special !== SpecialType.None) expandSpecial(board, b, map);
      if (map.size === 0) {
        map.set(posKey(a), a);
        map.set(posKey(b), b);
      }
      positions = [...map.values()];
      cause =
        gemA.special === SpecialType.Bomb || gemB.special === SpecialType.Bomb
          ? 'bomb'
          : 'line';
    }
  } else {
    positions = [a, b];
  }

  const collectedByColor = collectColors(board, positions);
  const score =
    positions.length * SCORE_PER_GEM + SCORE_SPECIAL_BONUS * 2;
  const iceBroken = damageIceFromClears(board, positions);
  clearPositions(board, positions, new Map());

  return {
    positions,
    cause,
    score,
    createdSpecials: [],
    iceBroken,
    collectedByColor,
  };
}

/** Run gravity + refill + cascade until stable. Optionally shuffle if dead. */
export function resolveBoard(
  board: BoardState,
  rng: Rng,
  options: {
    initialClear?: ClearEvent | null;
    swapFocus?: CellPos | null;
    swapDir?: { dr: number; dc: number } | null;
    autoShuffle?: boolean;
  } = {},
): ResolveResult {
  const steps: ResolveStep[] = [];
  let totalScore = 0;
  let iceBrokenTotal = 0;
  const collectedByColor: Partial<Record<GemColor, number>> = {};
  let shuffled = false;

  let cascadeIndex = 0;
  let pending: ClearEvent | null = options.initialClear ?? null;

  // If no initial clear, try match wave first
  if (!pending) {
    pending = resolveMatchWave(
      board,
      options.swapFocus ?? null,
      options.swapDir ?? null,
      0,
    );
  }

  while (pending) {
    totalScore += pending.score;
    iceBrokenTotal += pending.iceBroken.length;
    mergeCollected(collectedByColor, pending.collectedByColor);

    const { falls } = applyGravity(board);
    const { spawns } = refillBoard(board, rng);
    steps.push({ clears: [pending], falls, spawns });

    cascadeIndex += 1;
    pending = resolveMatchWave(board, null, null, cascadeIndex);
  }

  if (options.autoShuffle !== false && !hasValidMove(board)) {
    shuffleBoard(board, rng);
    shuffled = true;
  }

  return { steps, totalScore, iceBrokenTotal, collectedByColor, shuffled };
}

export function trySwap(
  board: BoardState,
  a: CellPos,
  b: CellPos,
  rng: Rng,
): SwapResult {
  if (!areAdjacent(a, b)) {
    return { valid: false, reverted: false, resolve: null };
  }
  const cellA = getCell(board, a);
  const cellB = getCell(board, b);
  if (!cellA?.gem || !cellB?.gem) {
    return { valid: false, reverted: false, resolve: null };
  }

  const specialSwap =
    cellA.gem.special !== SpecialType.None ||
    cellB.gem.special !== SpecialType.None;

  swapGems(board, a, b);

  if (specialSwap) {
    // Color bomb + anything or any two specials / special+gem that activates
    const bothNormalMatch =
      cellA.gem.special === SpecialType.None &&
      cellB.gem.special === SpecialType.None;
    if (!bothNormalMatch) {
      // After swap, gems moved: use current positions
      const clear = resolveSpecialSwap(board, a, b);
      const resolve = resolveBoard(board, rng, {
        initialClear: clear,
        autoShuffle: true,
      });
      return { valid: true, reverted: false, resolve };
    }
  }

  if (!hasAnyMatch(board)) {
    swapGems(board, a, b);
    return { valid: false, reverted: true, resolve: null };
  }

  const swapDir = { dr: b.row - a.row, dc: b.col - a.col };
  const resolve = resolveBoard(board, rng, {
    swapFocus: b,
    swapDir,
    autoShuffle: true,
  });
  return { valid: true, reverted: false, resolve };
}

export function activateHammer(
  board: BoardState,
  pos: CellPos,
  rng: Rng,
): ResolveResult | null {
  const cell = getCell(board, pos);
  if (!cell?.gem) return null;

  const map = new Map<string, CellPos>();
  if (cell.gem.special !== SpecialType.None) {
    expandSpecial(board, pos, map);
  } else {
    map.set(posKey(pos), pos);
  }
  const positions = [...map.values()];
  const collectedByColor = collectColors(board, positions);
  const iceBroken = damageIceFromClears(board, positions);
  clearPositions(board, positions, new Map());

  const clear: ClearEvent = {
    positions,
    cause: 'hammer',
    score: positions.length * SCORE_PER_GEM,
    createdSpecials: [],
    iceBroken,
    collectedByColor,
  };
  return resolveBoard(board, rng, { initialClear: clear, autoShuffle: true });
}
