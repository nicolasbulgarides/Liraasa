/**
 * Word choice from the dictionary only (2.5, ADR-0020): an English sense is
 * matched to a listed Liraasa form in the slot that needs it. A form is never
 * invented; when no listed word fits, the gap is reported with the nearest
 * listed words, and the caller says so instead of writing one.
 */
import type { Index } from '../grammar';
import type { FormRole, Reading } from '../grammar';
import type { LWord } from './frame';

export type Want = 'noun' | 'verb' | 'adj';

const ROLES: Record<Want, FormRole[]> = {
  noun: ['n', 'an', 'nn'],
  verb: ['v'],
  adj: ['a', 'aa', 'na'],
};

export interface Choice {
  word: LWord | null;
  /** other listed words for the same sense, for the author to pick from */
  alternatives: LWord[];
  /** nearest listed words when nothing fits */
  nearest: LWord[];
}

/** One gloss → its English senses: "to give; to hand over (a thing)" → give, hand over. */
export function senses(gloss: string): string[] {
  return gloss
    .replace(/\([^)]*\)/g, ' ')
    .split(/[;,/]/)
    .map((s) =>
      s
        .trim()
        .toLowerCase()
        .replace(/^(to|the|a|an|be)\s+/, '')
        .replace(/^(to|be)\s+/, '')
        .replace(/[.!?"“”]/g, '')
        .trim(),
    )
    .filter((s) => s !== '' && s !== '— unused' && !s.startsWith('—'));
}

export interface EnglishIndex {
  /** sense → readings, with the sense's rank in its gloss (0 = first) */
  bySense: Map<string, { r: Reading; rank: number }[]>;
  choose(want: Want, lemma: string): Choice;
}

const toWord = (r: Reading, english: string): LWord => ({
  form: r.form,
  ...(r.root === undefined ? {} : { root: r.root }),
  ...(r.role === undefined ? {} : { role: r.role }),
  gloss: r.gloss,
  english,
  ...(r.source === 'image-predicted'
    ? { flags: ['predicted image-compound form (2.5:G124)'] }
    : {}),
});

export function buildEnglishIndex(
  ix: Index,
  synonyms: Record<string, string[]> = {},
  aliases: Partial<Record<Want, Record<string, string>>> = {},
  /** words built by rule or copied, not listed: polygons, copied names, origin adjectives (3.x) */
  ruleWords: Partial<Record<Want, Record<string, string>>> = {},
): EnglishIndex {
  const bySense = new Map<string, { r: Reading; rank: number }[]>();
  const add = (sense: string, r: Reading, rank: number): void => {
    const list = bySense.get(sense) ?? [];
    if (!list.some((x) => x.r.form === r.form)) list.push({ r, rank });
    bySense.set(sense, list);
  };
  for (const h of ix.headwords.values()) {
    for (const r of Object.values(h.roles)) {
      // predicted image-compound forms are a last resort (2.5:G124), not indexed by sense
      if (r.source === 'image-predicted') continue;
      senses(r.gloss).forEach((s, i) => {
        add(s, r, i);
        // the head of a multi-word sense, after every exact sense: bake bread → bake
        const words = s.split(' ');
        if (words.length > 1 && words.length <= 3 && (words[0] ?? '').length > 2)
          add(words[0] ?? '', r, 20 + i);
      });
    }
    // the headword's English synonyms name its noun
    const noun = h.roles.n;
    if (noun !== undefined) for (const s of synonyms[h.root] ?? []) add(s.toLowerCase(), noun, 5);
  }
  // listed derivations are nouns with fixed meanings
  for (const [w, d] of ix.lexicalised) {
    senses(d.gloss).forEach((s, i) => {
      add(
        s,
        { pos: 'noun', form: w, root: d.base, gloss: d.gloss, source: 'derivation-listed' },
        i,
      );
    });
  }

  // the time nouns of the time table (deya, monta …), which are not headwords
  for (const [form, rs] of ix.closed) {
    for (const r of rs)
      if (r.pos === 'noun')
        senses(r.gloss).forEach((s, i) => {
          add(s, { ...r, role: 'n', form }, i);
        });
  }
  const choose = (want: Want, lemma: string): Choice => {
    const key0 = lemma.toLowerCase().trim();
    // an alias wins over a match on the head of a longer sense (have → possess, not "have luck")
    const exact = (bySense.get(key0) ?? []).some(
      (x) =>
        x.rank < 20 && (x.r.role === undefined ? want === 'noun' : ROLES[want].includes(x.r.role)),
    );
    const key =
      !exact && aliases[want]?.[key0] !== undefined ? (aliases[want][key0] ?? key0) : key0;
    const hits = (bySense.get(key) ?? []).filter((x) =>
      x.r.role !== undefined ? ROLES[want].includes(x.r.role) : want === 'noun',
    );
    // the plain form first (n before an/nn, a before aa/na), then the sense's rank, then the shortest
    const order = ROLES[want];
    const ranked = [...hits].sort(
      (a, b) =>
        a.rank - b.rank ||
        order.indexOf(a.r.role ?? 'n') - order.indexOf(b.r.role ?? 'n') ||
        (a.r.source === 'listed' ? 0 : 1) - (b.r.source === 'listed' ? 0 : 1) ||
        a.r.form.length - b.r.form.length,
    );
    const best = ranked[0];
    // nothing listed: a word the rules build or a copied name (3.2:G147, 3.5:G150, G151)
    const built = best === undefined ? ruleWords[want]?.[key0] : undefined;
    if (built !== undefined)
      return {
        word: {
          form: built,
          role: want === 'adj' ? 'a' : 'n',
          english: lemma,
          gloss: lemma,
          flags: ['built by rule or copied, not listed'],
        },
        alternatives: [],
        nearest: [],
      };
    if (best !== undefined)
      return {
        word: toWord(best.r, lemma),
        alternatives: ranked.slice(1, 6).map((x) => toWord(x.r, lemma)),
        nearest: [],
      };
    // nothing fits: the nearest listed words (a sense that contains the lemma, or the other slots)
    const near: LWord[] = [];
    for (const [s, list] of bySense) {
      if (near.length >= 6) break;
      if (s.split(' ').includes(key) || s.startsWith(`${key} `))
        for (const x of list) if (near.length < 6) near.push(toWord(x.r, s));
    }
    const other = (bySense.get(key) ?? []).map((x) => toWord(x.r, lemma));
    return { word: null, alternatives: [], nearest: [...other, ...near].slice(0, 6) };
  };

  return { bySense, choose };
}
