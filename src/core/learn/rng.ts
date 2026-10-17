/**
 * A seedable random number generator (mulberry32), so exercise generation is
 * reproducible: the same seed gives the same exercises, which is what the
 * tests pin and what lets a learner retry the exact same drill.
 */
export interface Rng {
  /** A float in [0, 1). */
  next(): number;
  /** An integer in [0, n). */
  int(n: number): number;
  pick<T>(list: readonly T[]): T | undefined;
  shuffle<T>(list: readonly T[]): T[];
}

/** A 32-bit seed from a string or number. */
export function seedOf(seed: string | number): number {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function createRng(seed: string | number): Rng {
  let a = seedOf(seed);
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number): number => Math.floor(next() * n);
  return {
    next,
    int,
    pick: (list) => (list.length === 0 ? undefined : list[int(list.length)]),
    shuffle: (list) => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(i + 1);
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
  };
}
