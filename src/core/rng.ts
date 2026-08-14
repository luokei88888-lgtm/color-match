/** Deterministic RNG for tests and reproducible boards. */
export class Rng {
  private state: number;

  constructor(seed = Date.now() % 2147483647) {
    this.state = seed <= 0 ? 1 : seed;
  }

  next(): number {
    this.state = (this.state * 48271) % 2147483647;
    return this.state / 2147483647;
  }

  int(min: number, maxExclusive: number): number {
    return Math.floor(this.next() * (maxExclusive - min)) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length)]!;
  }

  shuffle<T>(items: T[]): T[] {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = this.int(0, i + 1);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
}
