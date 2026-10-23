/**
 * The Grammar in Lessons as a Learn course: twenty hand-written lessons,
 * written and checked in scripts/lessons/ (npm run build:lessons) and carried
 * to the browser in learn-data.js as `course`. The text is data; this module
 * only reads it, keeps which lessons the learner has studied (on the Hall
 * state, so it travels with export and import), and compares a typed answer
 * with the lesson's.
 */
import { hallOf, setHall } from './hall';
import type { Profile } from './progress';

export interface CourseLesson {
  title: string;
  welcome: string;
  points: string[];
  /** Liraasa, English. */
  examples: [string, string][];
  /** The wrong sentence, why, the rule. */
  watch?: [string, string, string][];
  /** The prompt in English, the Liraasa answer. */
  practice: [string, string][];
  rules: string[];
}

export interface CoursePart {
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  edition: string;
  intro: string[];
  parts: CoursePart[];
  map: { title: string; lines: string[]; np: string };
  open: string[];
}

export interface NumberedLesson {
  /** 1-based, across the whole course. */
  n: number;
  part: number;
  partTitle: string;
  lesson: CourseLesson;
}

/** Every lesson in order, numbered from 1. */
export function courseLessons(course: Course): NumberedLesson[] {
  const out: NumberedLesson[] = [];
  course.parts.forEach((p, part) => {
    for (const lesson of p.lessons)
      out.push({ n: out.length + 1, part: part + 1, partTitle: p.title, lesson });
  });
  return out;
}

/** The lessons the learner has marked studied, ascending. */
export function courseStudied(profile: Profile): number[] {
  const raw = hallOf(profile).courseStudied;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is number => Number.isInteger(x) && x > 0))].sort(
    (a, b) => a - b,
  );
}

/** Mark lesson `n` studied, or not. */
export function setCourseStudied(profile: Profile, n: number, studied: boolean): void {
  const now = new Set(courseStudied(profile));
  if (studied) now.add(n);
  else now.delete(n);
  setHall(profile, { ...hallOf(profile), courseStudied: [...now].sort((a, b) => a - b) });
}

/** The first lesson not yet studied, or null when all are. */
export function courseNext(course: Course, profile: Profile): number | null {
  const done = new Set(courseStudied(profile));
  return courseLessons(course).find((l) => !done.has(l.n))?.n ?? null;
}

export interface AnswerCheck {
  verdict: 'right' | 'order' | 'close' | 'different';
  /** Words of the answer the learner left out. */
  missing: string[];
  /** Words the learner wrote that the answer does not have. */
  extra: string[];
}

const words = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[.,!?;:“”"’‘()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w !== '');

/**
 * Compare a typed answer with the lesson's, ignoring case and punctuation.
 * `right` is the same words in the same order; `order` the same words in
 * another order; `close` one word added, left out or changed; else
 * `different`. The lesson's answer is one good answer, not the only one, and
 * the UI says so.
 */
export function checkCourseAnswer(given: string, answer: string): AnswerCheck {
  const g = words(given);
  const a = words(answer);
  const left = [...g];
  const missing: string[] = [];
  for (const w of a) {
    const i = left.indexOf(w);
    if (i === -1) missing.push(w);
    else left.splice(i, 1);
  }
  const extra = left;
  if (missing.length === 0 && extra.length === 0)
    return { verdict: g.join(' ') === a.join(' ') ? 'right' : 'order', missing, extra };
  return {
    verdict: missing.length <= 1 && extra.length <= 1 ? 'close' : 'different',
    missing,
    extra,
  };
}
