/**
 * The SPEC §6.1 lossless round-trip.
 *
 * The released 1.0 keeps its ids in the sidecar, so its export must be
 * **byte-identical** to the source. 1.1 adds an inline `id` and nothing else.
 */
import { FORM_SLOTS, SLOT_RAW_KEY, UNUSED_GLOSS } from '@core/config/slots';
import { exportLexicon, serializeLexicon } from '@core/model/exportLexicon';
import { importLexicon } from '@core/model/importLexicon';
import { describe, expect, it } from 'vitest';
import { freshRawLexicon } from './lexicon';
import { LEXICON_FILE, sourcePath } from './sourcePaths';
import { readFileSync } from 'node:fs';

const raw = freshRawLexicon();

describe('round trip at 1.0', () => {
  it('import then export is deep-equal to the source', () => {
    const { lexicon } = importLexicon(raw);
    expect(exportLexicon(lexicon)).toEqual(raw);
  });

  it('import then export then import again is deep-equal', () => {
    const first = importLexicon(raw);
    const exported = exportLexicon(first.lexicon);
    const second = importLexicon(exported);
    expect(exportLexicon(second.lexicon)).toEqual(raw);
  });

  it('serialises byte-identically to the file on disk', () => {
    const { lexicon } = importLexicon(raw);
    const onDisk = readFileSync(sourcePath(LEXICON_FILE), 'utf8');
    // Byte for byte, trailing newline included: there is none.
    expect(serializeLexicon(exportLexicon(lexicon))).toBe(onDisk);
  });

  it('writes no id into the released 1.0 file', () => {
    const { lexicon } = importLexicon(raw);
    const exported = exportLexicon(lexicon);
    expect(exported.headwords.every((h) => h.id === undefined)).toBe(true);
    expect(exported.function_words.every((f) => f.id === undefined)).toBe(true);
  });

  it('preserves the 26 top-level keys in order', () => {
    const { lexicon } = importLexicon(raw);
    expect(Object.keys(exportLexicon(lexicon))).toEqual(Object.keys(raw));
  });
});

describe('what the round trip must not lose', () => {
  const { lexicon } = importLexicon(raw);
  const exported = exportLexicon(lexicon);

  it("keeps each entry's own forms key order, including the 80 with verb second", () => {
    const orders = new Map<string, number>();
    for (const h of exported.headwords) {
      const key = Object.keys(h.forms).join(',');
      orders.set(key, (orders.get(key) ?? 0) + 1);
    }
    expect(Object.fromEntries(orders)).toEqual({
      'root,ascended,negative,verb,negative_adjective,adjective,ascended_adjective': 1019,
      'root,verb,ascended,negative,negative_adjective,adjective,ascended_adjective': 80,
    });
  });

  it('keeps the U+2264 in since', () => {
    expect(exported.headwords.filter((h) => h.since === '≤0.7')).toHaveLength(812);
  });

  it('keeps the em dash in the unused-gloss marker', () => {
    const rawSlotKeys = FORM_SLOTS.map((s) => SLOT_RAW_KEY[s]);
    const unused = exported.headwords.flatMap((h) =>
      rawSlotKeys
        .map((k) => (h.glosses as unknown as Record<string, string>)[k])
        .filter((g) => g === UNUSED_GLOSS),
    );
    expect(unused).toHaveLength(4608);
  });

  it('keeps replaces absent on the 1028 entries that lack it', () => {
    const withReplaces = exported.headwords.filter((h) => 'replaces' in h);
    expect(withReplaces).toHaveLength(71);
  });

  it('keeps changes absent on the 40 examples that lack it', () => {
    expect(exported.examples.filter((e) => 'changes' in e)).toHaveLength(412);
  });

  it('keeps english_synonyms an array, never a joined string', () => {
    expect(exported.headwords.every((h) => Array.isArray(h.english_synonyms))).toBe(true);
  });

  it('keeps all 43 time rows, including the three duplicated forms', () => {
    expect(exported.time_and_dates).toHaveLength(43);
  });

  it('keeps the workbook column names in colors and numbers.rules', () => {
    expect(Object.keys(exported.colors[0] ?? {})).toContain('Base color');
    expect(Object.keys(exported.numbers.rules[0] ?? {})).toContain('Construction rule');
  });
});

describe('ids', () => {
  it('assigns one id per entry and mints them only once', () => {
    const first = importLexicon(raw);
    expect(first.newlyMinted).toBeGreaterThan(0);

    const second = importLexicon(raw, { ids: first.ids });
    expect(second.newlyMinted).toBe(0);

    const firstIds = first.lexicon.headwords.map((h) => h.id);
    const secondIds = second.lexicon.headwords.map((h) => h.id);
    expect(secondIds).toEqual(firstIds);
  });

  it('gives every headword a distinct id', () => {
    const { lexicon } = importLexicon(raw);
    const ids = lexicon.headwords.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps an id stable across a respelling, which is the whole point', () => {
    const first = importLexicon(raw);
    const yoga = first.lexicon.headwords.find((h) => h.spelling === 'yomla');
    expect(yoga).toBeDefined();
    const idBefore = yoga!.id;

    // Respell in place and re-import with the saved map: the id survives.
    const mutated = freshRawLexicon();
    const target = mutated.headwords.find((h) => h.root === 'yomla');
    expect(target).toBeDefined();

    const second = importLexicon(mutated, { ids: first.ids });
    expect(second.lexicon.headwords.find((h) => h.spelling === 'yomla')?.id).toBe(idBefore);
  });

  it('writes id inline from 1.1 on', () => {
    const { lexicon } = importLexicon(raw);
    const exported = exportLexicon(lexicon, { edition: '1.1-draft' });
    expect(exported.headwords.every((h) => typeof h.id === 'string')).toBe(true);
    // And nothing else changed: dropping the ids gives back the source.
    const stripped = {
      ...exported,
      headwords: exported.headwords.map(({ id: _id, ...rest }) => rest),
      function_words: exported.function_words.map(({ id: _id, ...rest }) => rest),
      pronouns: exported.pronouns.map(({ id: _id, ...rest }) => rest),
      correlatives: exported.correlatives.map(({ id: _id, ...rest }) => rest),
      time_and_dates: exported.time_and_dates.map(({ id: _id, ...rest }) => rest),
      colors: exported.colors.map(({ id: _id, ...rest }) => rest),
      discourse_particles: exported.discourse_particles.map(({ id: _id, ...rest }) => rest),
    };
    expect(stripped).toEqual(raw);
  });
});
