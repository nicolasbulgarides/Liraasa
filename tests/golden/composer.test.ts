import { beforeAll, describe, expect, it } from 'vitest';
import { type Composer, type ComposerDraft, loadComposer } from './editorComposer';

/**
 * The editor's assisted composer (editor/index.html, Compose tab). Two
 * expectations are the lexicon's own examples: hiro's "Li veluri po hiro
 * lirala." (The stars began to sing.) and kube's "Kube taivo venreva, maivo
 * lirala." (When you arrive, I sing.). The rest pin composer behaviour.
 */

let composer: Composer;
beforeAll(() => {
  composer = loadComposer();
});

const compose = (s: string): ComposerDraft => composer.composeSentence(s);
const text = (s: string): string => composer.draftText(compose(s));
const rows = (d: ComposerDraft) => d.clauses.flatMap((k) => k.chunks);
const chosen = (c: ReturnType<typeof rows>[number]) => c.options[c.chosen]?.word;

describe('lexicon examples', () => {
  it('reproduces hiro: The stars began to sing', () => {
    expect(text('The stars began to sing.')).toBe('li veluri po hiro lirala.');
  });

  it('reproduces kube: When you arrive, I sing', () => {
    expect(text('When you arrive, I sing.')).toBe('kube taivo venreva, maivo lirala.');
  });
});

describe('When time began, I heard your beautiful voice', () => {
  const S = 'When time began, I heard your beautiful voice';

  it('splits into a kube clause and a main clause', () => {
    const d = compose(S);
    expect(d.clauses).toHaveLength(2);
    expect(d.clauses[0]?.comma).toBe(true);
    expect(text(S)).toBe('kube krono po lombila, maivo po lenila taivo de vani valla.');
  });

  it('keeps "began" in its own clause instead of giving hiro to "heard"', () => {
    const [sub, main] = compose(S).clauses;
    const began = sub?.chunks.find((c) => c.en === 'began' && c.isVerb);
    expect(began && chosen(began)).toBe('lombila');
    // hiro is offered on the same row, one click away
    expect(began?.options.map((o) => o.word)).toContain('hiro');
    expect(main?.chunks.some((c) => chosen(c) === 'hiro')).toBe(false);
  });

  it('gives every English word a row, grammar included', () => {
    const d = compose(S);
    const english = new Set(rows(d).map((c) => c.en));
    for (const w of ['when', 'time', 'began', 'i', 'heard', 'your', 'beautiful', 'voice']) {
      expect(english).toContain(w);
    }
    // the implied past shows as a po row beside the word that set it
    const po = rows(d).filter((c) => c.role === 'grammar' && chosen(c) === 'po');
    expect(po.map((c) => c.en)).toEqual(['began', 'heard']);
  });

  it('shows "your" as taivo de, not taivo alone', () => {
    const your = rows(compose(S)).find((c) => c.en === 'your');
    expect(your?.role).toBe('possessor');
    expect(chosen(your!)).toBe('taivo');
    expect(your?.after).toBe('de');
    expect(your?.note).toMatch(/de marks possession/);
  });
});

describe('clauses and markers', () => {
  it.each([
    ["I can't sing.", 'maivo ne povi lirala.'],
    ['I know that you sing.', 'maivo sabesia fime taivo lirala.'],
    ['Time began.', 'krono po lombila.'],
    ['I sang and you danced.', 'maivo po lirala ata taivo po rilura.'],
    ['Will you sing?', 'taivo futu lirala ki?'],
  ])('%s', (en, liraasa) => {
    expect(text(en)).toBe(liraasa);
  });

  it('does not open a clause at determiner "that"', () => {
    expect(compose('I love that song.').clauses).toHaveLength(1);
  });
});

describe('every draft passes the checker', () => {
  it.each([
    'When time began, I heard your beautiful voice',
    'The stars began to sing.',
    'When you arrive, I sing.',
    "I can't sing.",
    'I know that you sing.',
    'I sang and you danced.',
    'Suddenly the stars began to sing again.',
    'Will you sing?',
  ])('%s', (en) => {
    const errors = composer
      .checkLine(text(en), 1, 'everyday')
      .filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });
});
