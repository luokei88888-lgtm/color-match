import {
  BoosterId,
  DEFAULT_BOOSTERS,
  ErrorCode,
  STORAGE_KEY,
  STORAGE_MAX_BYTES,
  STORAGE_VERSION,
  TOTAL_LEVELS,
} from '../core/constants';
import type { PlayerProgress } from '../core/types';

export interface ProgressRepository {
  load(): PlayerProgress;
  save(progress: PlayerProgress): { ok: boolean; error?: ErrorCode };
  reset(): void;
}

export function defaultProgress(): PlayerProgress {
  return {
    version: STORAGE_VERSION,
    maxUnlocked: 1,
    stars: Array.from({ length: TOTAL_LEVELS }, () => 0),
    boosters: { ...DEFAULT_BOOSTERS },
    settings: { volume: 0.7, reducedMotion: false },
  };
}

function sanitize(raw: unknown): PlayerProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<PlayerProgress>;
  if (o.version !== STORAGE_VERSION) return null;
  if (typeof o.maxUnlocked !== 'number') return null;
  if (!Array.isArray(o.stars) || o.stars.length !== TOTAL_LEVELS) return null;
  if (!o.boosters || !o.settings) return null;
  return {
    version: STORAGE_VERSION,
    maxUnlocked: Math.min(TOTAL_LEVELS, Math.max(1, o.maxUnlocked)),
    stars: o.stars.map((s) => (typeof s === 'number' ? Math.min(3, Math.max(0, s)) : 0)),
    boosters: {
      [BoosterId.Hammer]: Number(o.boosters[BoosterId.Hammer] ?? DEFAULT_BOOSTERS[BoosterId.Hammer]),
      [BoosterId.Shuffle]: Number(o.boosters[BoosterId.Shuffle] ?? DEFAULT_BOOSTERS[BoosterId.Shuffle]),
      [BoosterId.ExtraMoves]: Number(
        o.boosters[BoosterId.ExtraMoves] ?? DEFAULT_BOOSTERS[BoosterId.ExtraMoves],
      ),
    },
    settings: {
      volume: Math.min(1, Math.max(0, Number(o.settings.volume ?? 0.7))),
      reducedMotion: Boolean(o.settings.reducedMotion),
    },
  };
}

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(
    private readonly key = STORAGE_KEY,
    private readonly storage: Storage | null = typeof localStorage !== 'undefined'
      ? localStorage
      : null,
  ) {}

  load(): PlayerProgress {
    if (!this.storage) return defaultProgress();
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return defaultProgress();
      if (raw.length > STORAGE_MAX_BYTES) return defaultProgress();
      const parsed = sanitize(JSON.parse(raw));
      return parsed ?? defaultProgress();
    } catch {
      return defaultProgress();
    }
  }

  save(progress: PlayerProgress): { ok: boolean; error?: ErrorCode } {
    if (!this.storage) return { ok: false, error: ErrorCode.NoProgress };
    const payload: PlayerProgress = {
      version: STORAGE_VERSION,
      maxUnlocked: progress.maxUnlocked,
      stars: progress.stars.slice(0, TOTAL_LEVELS),
      boosters: progress.boosters,
      settings: progress.settings,
    };
    const text = JSON.stringify(payload);
    if (text.length > STORAGE_MAX_BYTES) {
      return { ok: false, error: ErrorCode.SaveTooLarge };
    }
    try {
      this.storage.setItem(this.key, text);
      return { ok: true };
    } catch {
      return { ok: false, error: ErrorCode.SaveCorrupt };
    }
  }

  reset(): void {
    this.storage?.removeItem(this.key);
  }
}

export function recordLevelWin(
  progress: PlayerProgress,
  levelId: number,
  stars: number,
): PlayerProgress {
  const next = {
    ...progress,
    stars: progress.stars.slice(),
    boosters: { ...progress.boosters },
    settings: { ...progress.settings },
  };
  const idx = levelId - 1;
  if (idx >= 0 && idx < next.stars.length) {
    next.stars[idx] = Math.max(next.stars[idx]!, stars);
  }
  if (levelId >= next.maxUnlocked && levelId < TOTAL_LEVELS) {
    next.maxUnlocked = levelId + 1;
  } else if (levelId === TOTAL_LEVELS) {
    next.maxUnlocked = TOTAL_LEVELS;
  }
  if (stars >= 2) {
    const ids: BoosterId[] = [BoosterId.Hammer, BoosterId.Shuffle, BoosterId.ExtraMoves];
    const id = ids[levelId % 3]!;
    next.boosters[id] = (next.boosters[id] ?? 0) + 1;
  }
  return next;
}
