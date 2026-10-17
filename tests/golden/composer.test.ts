import { beforeAll, describe, expect, it } from 'vitest';
import { type Composer, type ComposerDraft, loadComposer } from './editorComposer';
import { type Checker, loadChecker } from '../checker/loadChecker';

/**
 * The editor's assisted composer (editor/index.html, Compose tab). Two
 * expectations are the lexicon's own examples: hiro's "Li veluri po hiro
 * lirala." (The stars began to sing.) and kube's "Kube taivo venreva, maivo
 * lirala." (When you arrive, I sing.). The rest pin composer behaviour.
 */

let composer: Composer;
let checker: Checker;
beforeAll(() => {
  composer = loadComposer();
  checker = loadChecker().checker;
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
    expect(text(S)).toBe('kube krono po lombila, maivo po lenila taivo de vanisan valla.');
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
    const errors = checker
      .checkLine(text(en), 1, '', { register: 'everyday' })
      .filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });
});

describe('the English under each line follows its line through edits', () => {
  const A = 'kube krono po lombila, maivo po lenila taivo de vanisan valla.';
  const realign = (before: string[], after: string[], english: string[]) =>
    composer.realignEnglish(before, after, english);

  it('keeps it when a word in the line is edited', () => {
    const edited = A.replace('vani ', '');
    expect(realign(['x', A], ['x', edited], ['', 'E'])).toEqual(['', 'E']);
  });

  it('keeps it on its line when a line is added above or below', () => {
    expect(realign([A], ['', A], ['E'])).toEqual(['', 'E']);
    expect(realign([A], [A, ''], ['E'])).toEqual(['E', '']);
  });

  it('drops it when its line is deleted', () => {
    expect(realign(['x', A, 'y'], ['x', 'y'], ['', 'E', 'F'])).toEqual(['', 'F']);
  });

  it('keeps it on the first half when the line is split', () => {
    expect(realign([A], ['kube krono po lombila,', 'maivo po lenila'], ['E'])).toEqual(['E', '']);
  });
});

/* "Song of Time" was composed here, and every error the checker found in it
   came from the composer: "was" lost its copula, synonyms picked the root over
   the adjective, near matches were chosen silently ("at" became hema), and
   relative "that" became fime with a bare root after it. These are its lines'
   English, with the drafts a reader of the 1.0 grammar expects. */
describe('Song of Time', () => {
  it.each([
    // "was" is po plus a copula; "shimmering" is the adjective sizosan
    [
      'Your voice was a song of shimmering light.',
      'taivo de valla po ke baba lira de sizosan lumi.',
    ],
    // relative "that" is raho, and its verb takes the verb form
    [
      'You were the holy tool that created the universe.',
      'taivo po ke li lumiasasan biti raho po farlafa li pagoasa.',
    ],
    // demonstrative "that" is ola; "hope to" is kopi; English drops the relative marker
    [
      'Now that is a holy light we hope to become.',
      'eli-krono ola ke baba lumiasasan lumi raho maivori kopi loya.',
    ],
    // a clause after "and" shares the subject, so its first word is the verb
    [
      'Truth heard your voice and felt shame.',
      'vera po lenila taivo de valla ata po surusia semra.',
    ],
    // "born" is kronobioka, glossed "to be born": the copula goes
    ['Heaven was born in your eyes.', 'mavopagoasa po kronobioka en taivo de vilneri.'],
    // "for the old stars to hear" is a kopisa purpose clause, not ala
    [
      'Holy light wrote songs for the old stars to hear.',
      'lumiasasan lumi po sarbisia lirari kopisa li yanbasan veluri lenila.',
    ],
    // a question keeps statement order and adds ki
    [
      'Or am I the cold one who holds your maternal heart?',
      'oro maivo ke li sili one raho tivrota taivo de maresan lore ki?',
    ],
  ])('%s', (en, liraasa) => {
    expect(text(en)).toBe(liraasa);
  });

  // ADR-0011: a noun does not modify a noun; the first becomes its -san adjective
  it.each([
    ['I am a song bird.', 'maivo ke baba lirasan lavra.'],
    ['I heard your honey voice.', 'maivo po lenila taivo de yomlasan valla.'],
  ])('%s', (en, liraasa) => {
    expect(text(en)).toBe(liraasa);
  });

  it('shows a word with only near matches as a gap, never a guess', () => {
    for (const [en, word] of [
      ['At the beginning of time I heard your song.', 'at'],
      ['I heard your voice once.', 'once'],
      ['The stars wrote about the fire.', 'about'],
    ] as const) {
      const row = rows(compose(en)).find((c) => c.en === word);
      expect(row?.role === 'gap' || row?.chosen === -1, en).toBe(true);
      expect(text(en)).not.toMatch(/\b(hema|kenvi|pago)\b/);
    }
  });

  it('leaves the checker nothing but those gaps', () => {
    for (const en of [
      'Your voice was a song of shimmering light.',
      'I was a bird of songs that learned your voice.',
      'Your beauty was a shimmering light that shone.',
      'Even the echoes of the shadows of the forgotten heard your song.',
    ]) {
      const errors = checker
        .checkLine(text(en), 1, '', { register: 'poetic' })
        .filter((f) => f.severity === 'error');
      expect(errors, en).toEqual([]);
    }
  });
});
