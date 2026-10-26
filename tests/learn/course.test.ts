import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  activeProfile,
  checkCourseAnswer,
  courseLessons,
  courseNext,
  courseStudied,
  createStore,
  exportStore,
  importStore,
  setCourseStudied,
  type Course,
} from '../../src/core/learn';
import { INTRO, MAP, OPEN, PARTS } from '../../scripts/lessons/lessons_2_5';

const course: Course = { edition: '2.5', intro: INTRO, parts: PARTS, map: MAP, open: OPEN };

describe('Grammar Lessons in Learn', () => {
  it('numbers the twenty lessons across five parts', () => {
    const all = courseLessons(course);
    expect(all).toHaveLength(20);
    expect(new Set(all.map((l) => l.part)).size).toBe(5);
    expect(all.map((l) => l.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('keeps what was studied on the profile, through export and import', () => {
    const store = createStore('2.5', 0);
    const p = activeProfile(store);
    expect(courseNext(course, p)).toBe(1);
    setCourseStudied(p, 1, true);
    setCourseStudied(p, 3, true);
    expect(courseStudied(p)).toEqual([1, 3]);
    expect(courseNext(course, p)).toBe(2);
    setCourseStudied(p, 3, false);
    const back = activeProfile(importStore(exportStore(store)));
    expect(courseStudied(back)).toEqual([1]);
  });

  it('compares a typed answer by words, ignoring case and punctuation', () => {
    const [, answer] = PARTS[1]?.lessons[0]?.practice[0] ?? ['', ''];
    expect(answer).not.toBe('');
    expect(checkCourseAnswer(answer.toLowerCase().replace(/\.$/, ''), answer).verdict).toBe(
      'right',
    );
    const ws = answer.replace(/\.$/, '').split(' ');
    expect(checkCourseAnswer([...ws].reverse().join(' '), answer).verdict).toBe('order');
    expect(checkCourseAnswer(ws.slice(1).join(' '), answer).verdict).toBe('close');
    expect(checkCourseAnswer('', answer).verdict).toBe('different');
  });

  it('ships in the Learn bundle and the editor loads its room', () => {
    expect(readFileSync('editor/learn/learn-data.js', 'utf8')).toContain(
      '"course":{"edition":"3.6"',
    );
    expect(readFileSync('editor/index.html', 'utf8')).toContain(
      '<script src="learn/course.js"></script>',
    );
  });
});
