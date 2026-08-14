import { BoosterId, ErrorCode, EXTRA_MOVES_AMOUNT } from './constants';
import { shuffleBoard } from './board';
import { activateHammer } from './resolver';
import { Rng } from './rng';
import type { BoardState, CellPos, PlayerProgress, ResolveResult } from './types';

export interface BoosterUseResult {
  ok: boolean;
  error: ErrorCode;
  resolve?: ResolveResult | null;
  movesAdded?: number;
  progress: PlayerProgress;
}

function consume(
  progress: PlayerProgress,
  id: BoosterId,
): { ok: true; progress: PlayerProgress } | { ok: false; progress: PlayerProgress } {
  const count = progress.boosters[id] ?? 0;
  if (count <= 0) return { ok: false, progress };
  return {
    ok: true,
    progress: {
      ...progress,
      boosters: { ...progress.boosters, [id]: count - 1 },
    },
  };
}

export function useHammer(
  progress: PlayerProgress,
  board: BoardState,
  pos: CellPos,
  rng: Rng,
): BoosterUseResult {
  const consumed = consume(progress, BoosterId.Hammer);
  if (!consumed.ok) {
    return { ok: false, error: ErrorCode.BoosterEmpty, progress };
  }
  const resolve = activateHammer(board, pos, rng);
  if (!resolve) {
    return { ok: false, error: ErrorCode.InvalidSwap, progress };
  }
  return {
    ok: true,
    error: ErrorCode.Ok,
    resolve,
    progress: consumed.progress,
  };
}

export function useShuffle(
  progress: PlayerProgress,
  board: BoardState,
  rng: Rng,
): BoosterUseResult {
  const consumed = consume(progress, BoosterId.Shuffle);
  if (!consumed.ok) {
    return { ok: false, error: ErrorCode.BoosterEmpty, progress };
  }
  shuffleBoard(board, rng);
  return {
    ok: true,
    error: ErrorCode.Ok,
    resolve: null,
    progress: consumed.progress,
  };
}

export function useExtraMoves(progress: PlayerProgress): BoosterUseResult {
  const consumed = consume(progress, BoosterId.ExtraMoves);
  if (!consumed.ok) {
    return { ok: false, error: ErrorCode.BoosterEmpty, progress };
  }
  return {
    ok: true,
    error: ErrorCode.Ok,
    movesAdded: EXTRA_MOVES_AMOUNT,
    progress: consumed.progress,
  };
}
