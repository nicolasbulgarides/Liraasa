/**
 * Spaced repetition behind one interface (Learn Phase 4). FSRS is the
 * default; SM-2 is there to prove the interface swaps.
 *
 * Ratings: 1 again · 2 hard · 3 good · 4 easy (the grader maps correct →
 * good, or easy when fast; almost → hard; wrong → again).
 *
 * FSRS-4.5 with its published default weights:
 *   R(t, S) = (1 + F·t/S)^D,  D = −0.5, F = 19/81   (R = 0.9 when t = S)
 *   first review:   S = w[G−1],  D = w4 − (G−3)·w5
 *   difficulty:     D' = w7·D0(3) + (1−w7)·(D − w6·(G−3)),  clamped to 1–10
 *   recalled:       S' = S·(e^w8·(11−D)·S^−w9·(e^(w10·(1−R))−1)·hard·easy + 1)
 *   forgotten:      S' = w11·D^−w12·((S+1)^w13 − 1)·e^(w14·(1−R))
 *   interval:       S/F·(r^(1/D) − 1) days for the desired retention r
 */

export type Rating = 1 | 2 | 3 | 4;

export interface CardState {
  /** Days. 0 for a new card. */
  stability: number;
  /** 1–10 for FSRS; the ease factor for SM-2. */
  difficulty: number;
  /** When it is next due (ms since epoch). */
  due: number;
  /** When it was last reviewed; 0 if never. */
  last: number;
  reps: number;
  lapses: number;
  /** Consecutive successful reviews. */
  streak: number;
}

export interface Scheduler {
  readonly name: 'fsrs' | 'sm2';
  init(now: number): CardState;
  review(state: CardState, rating: Rating, now: number): CardState;
  /** The chance the learner still recalls the card now (0–1). */
  retrievability(state: CardState, now: number): number;
}

const DAY = 86_400_000;
const MINUTE = 60_000;

export const FSRS_WEIGHTS = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072,
  0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81;
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

export function fsrs(retention = 0.9, weights: readonly number[] = FSRS_WEIGHTS): Scheduler {
  const w = (i: number): number => weights[i] ?? 0;
  const d0 = (g: Rating): number => clamp(w(4) - (g - 3) * w(5), 1, 10);
  const interval = (s: number): number =>
    Math.max(1, Math.round((s / FACTOR) * (retention ** (1 / DECAY) - 1)));
  const r = (state: CardState, now: number): number =>
    state.last === 0 || state.stability <= 0
      ? 0
      : (1 + (FACTOR * (now - state.last)) / DAY / state.stability) ** DECAY;

  return {
    name: 'fsrs',
    init: (now) => ({
      stability: 0,
      difficulty: 0,
      due: now,
      last: 0,
      reps: 0,
      lapses: 0,
      streak: 0,
    }),
    retrievability: r,
    review(state, g, now) {
      if (state.reps === 0 || state.stability <= 0) {
        const stability = w(g - 1);
        const due = g === 1 ? now + 5 * MINUTE : now + interval(stability) * DAY;
        return {
          stability,
          difficulty: d0(g),
          due,
          last: now,
          reps: 1,
          lapses: g === 1 ? 1 : 0,
          streak: g === 1 ? 0 : 1,
        };
      }
      const R = r(state, now);
      const D = clamp(w(7) * d0(3) + (1 - w(7)) * (state.difficulty - w(6) * (g - 3)), 1, 10);
      let S: number;
      if (g === 1) {
        S =
          w(11) *
          state.difficulty ** -w(12) *
          ((state.stability + 1) ** w(13) - 1) *
          Math.exp(w(14) * (1 - R));
        S = Math.min(S, state.stability);
      } else {
        const hard = g === 2 ? w(15) : 1;
        const easy = g === 4 ? w(16) : 1;
        S =
          state.stability *
          (Math.exp(w(8)) *
            (11 - state.difficulty) *
            state.stability ** -w(9) *
            (Math.exp(w(10) * (1 - R)) - 1) *
            hard *
            easy +
            1);
      }
      return {
        stability: S,
        difficulty: D,
        due: g === 1 ? now + 10 * MINUTE : now + interval(S) * DAY,
        last: now,
        reps: state.reps + 1,
        lapses: state.lapses + (g === 1 ? 1 : 0),
        streak: g === 1 ? 0 : state.streak + 1,
      };
    },
  };
}

/** SM-2 (SuperMemo 2), mapping ratings 1–4 to its 0–5 quality scale. */
export function sm2(): Scheduler {
  const quality = { 1: 1, 2: 3, 3: 4, 4: 5 } as const;
  return {
    name: 'sm2',
    init: (now) => ({
      stability: 0,
      difficulty: 2.5,
      due: now,
      last: 0,
      reps: 0,
      lapses: 0,
      streak: 0,
    }),
    retrievability: (s, now) =>
      s.last === 0 || s.stability <= 0
        ? 0
        : Math.exp((Math.log(0.9) * (now - s.last)) / DAY / s.stability),
    review(state, g, now) {
      const q = quality[g];
      const ease = Math.max(1.3, state.difficulty + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      if (q < 3) {
        return {
          ...state,
          difficulty: ease,
          stability: 1,
          due: now + 10 * MINUTE,
          last: now,
          reps: state.reps + 1,
          lapses: state.lapses + 1,
          streak: 0,
        };
      }
      const streak = state.streak + 1;
      const days = streak === 1 ? 1 : streak === 2 ? 6 : Math.round(state.stability * ease);
      return {
        stability: days,
        difficulty: ease,
        due: now + days * DAY,
        last: now,
        reps: state.reps + 1,
        lapses: state.lapses,
        streak,
      };
    },
  };
}

export function schedulerFor(name: 'fsrs' | 'sm2', retention = 0.9): Scheduler {
  return name === 'sm2' ? sm2() : fsrs(retention);
}
