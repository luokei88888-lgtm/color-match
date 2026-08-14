import { LEVELS } from './index';

/** Serialize validated levels for tooling / inspection. */
export function levelsToJson(): string {
  return JSON.stringify(
    LEVELS.map((l) => ({
      id: l.id,
      width: l.width,
      height: l.height,
      moves: l.moves,
      gemTypes: l.gemTypes,
      goal: l.goal,
      stars: l.stars,
      layout: l.layout,
    })),
    null,
    2,
  );
}
