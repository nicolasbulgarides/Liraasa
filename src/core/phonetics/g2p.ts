/**
 * Grapheme to phoneme conversion.
 *
 * The Grammar Guide, §5 "Sound and spelling", says the spelling **is**
 * phonetic: five pure vowels "roughly as in Spanish or Italian", a core
 * consonant set of `l m n r s v y` with `b d p t g h z k c f j` around it, and
 * `sh`/`ch` only in a few colour and number words. Neighbouring vowels are
 * separate syllables — `soraasa` is so-ra-a-sa, `opioa` is o-pi-o-a — a medial
 * cluster splits between its consonants, and stress is penultimate.
 *
 * So conversion is a letter-by-letter mapping with two digraphs, declared here
 * rather than inlined so a sound value is changed in one place.
 *
 * The values are ruling 2.0:G43 (the author, 2026-10-18): `c` is always "ch"
 * /t͡ʃ/ before every vowel (`ca` = cha, `co` = cho), so it no longer doubles
 * `k`; `j` is its voiced partner /d͡ʒ/, as in "jewel"; the digraph `ch` is the
 * same sound as `c`. `r` is a single tap, written /r/ here as the phoneme.
 */

export const VOWEL_LETTERS = ['a', 'e', 'i', 'o', 'u'] as const;

/** Which phone alphabet to emit. */
export type PhoneSet = 'ipa' | 'ascii';

interface Mapping {
  /** Two-letter graphemes, checked before single letters. */
  digraphs: Readonly<Record<string, string>>;
  letters: Readonly<Record<string, string>>;
}

const IPA: Mapping = {
  digraphs: { sh: 'ʃ', ch: 't͡ʃ' },
  letters: {
    a: 'a',
    e: 'e',
    i: 'i',
    o: 'o',
    u: 'u',
    l: 'l',
    m: 'm',
    n: 'n',
    r: 'r',
    s: 's',
    v: 'v',
    y: 'j',
    b: 'b',
    d: 'd',
    p: 'p',
    t: 't',
    g: 'ɡ',
    h: 'h',
    z: 'z',
    k: 'k',
    c: 't͡ʃ',
    f: 'f',
    j: 'd͡ʒ',
  },
};

/**
 * ASCII phones, for pipelines that dislike non-ASCII symbols in a dictionary.
 * One token per phone, so the two alphabets stay in step.
 */
const ASCII: Mapping = {
  digraphs: { sh: 'SH', ch: 'CH' },
  letters: {
    a: 'A',
    e: 'E',
    i: 'I',
    o: 'O',
    u: 'U',
    l: 'L',
    m: 'M',
    n: 'N',
    r: 'R',
    s: 'S',
    v: 'V',
    y: 'Y',
    b: 'B',
    d: 'D',
    p: 'P',
    t: 'T',
    g: 'G',
    h: 'HH',
    z: 'Z',
    k: 'K',
    c: 'CH',
    f: 'F',
    j: 'JH',
  },
};

const MAPPINGS: Readonly<Record<PhoneSet, Mapping>> = { ipa: IPA, ascii: ASCII };

/** Letters whose phone value the author has not settled: none since 2.0:G43. */
export const OPEN_QUESTIONS: readonly {
  letter: string;
  chosen: string;
  alternative: string;
  why: string;
}[] = [];

export class G2PError extends Error {}

export function phoneInventory(set: PhoneSet = 'ipa'): string[] {
  const m = MAPPINGS[set];
  return [...new Set([...Object.values(m.letters), ...Object.values(m.digraphs)])].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function isVowelPhone(phone: string, set: PhoneSet = 'ipa'): boolean {
  const m = MAPPINGS[set];
  return VOWEL_LETTERS.some((v) => m.letters[v] === phone);
}

/**
 * Convert one orthographic word to phones.
 *
 * A hyphen is a word-internal boundary in Liraasa orthography (`toda-nela`,
 * `ki-oro`, `dossacenta-unzira-penta`) and produces no phone of its own.
 *
 * @throws G2PError on a letter outside the inventory.
 */
export function toPhones(word: string, set: PhoneSet = 'ipa'): string[] {
  const m = MAPPINGS[set];
  const w = word.toLowerCase();
  const out: string[] = [];

  for (let i = 0; i < w.length; ) {
    const pair = w.slice(i, i + 2);
    const digraph = m.digraphs[pair];
    if (digraph !== undefined) {
      out.push(digraph);
      i += 2;
      continue;
    }
    const ch = w.charAt(i);
    if (ch === '-' || ch === "'") {
      i += 1;
      continue;
    }
    const phone = m.letters[ch];
    if (phone === undefined) {
      throw new G2PError(`${word}: letter ${JSON.stringify(ch)} is outside the inventory`);
    }
    out.push(phone);
    i += 1;
  }

  if (out.length === 0) throw new G2PError(`${word}: no phones`);
  return out;
}

export interface Syllable {
  /** The orthographic text of this syllable. */
  text: string;
  /** Phones, in order. */
  phones: string[];
  /** Index of the vowel phone within `phones`. */
  nucleusAt: number;
}

export interface Syllabification {
  word: string;
  syllables: Syllable[];
  /** Index of the stressed syllable: penultimate, or 0 when there is one. */
  stressIndex: number;
  phones: string[];
}

/**
 * Syllabify a word.
 *
 * Every vowel is a nucleus and adjacent vowels never form a diphthong, so
 * `dorvaasa` is dor-va-a-sa. A medial cluster splits between its consonants
 * (`bal-bu`, `mas-ka`, `lem-vo`), which here means the last consonant of a run
 * joins the following nucleus and the rest close the previous syllable. A
 * word-initial run attaches wholly to the first nucleus, so `krono` is kro-no
 * and `trana` is tra-na.
 */
export function syllabify(word: string, set: PhoneSet = 'ipa'): Syllabification {
  const w = word.toLowerCase();

  // Split the orthography into onset runs and vowels, keeping the letters so
  // the syllable text can be reported alongside the phones.
  interface Unit {
    kind: 'c' | 'v';
    text: string;
  }
  const units: Unit[] = [];
  for (let i = 0; i < w.length; ) {
    const pair = w.slice(i, i + 2);
    if (pair === 'sh' || pair === 'ch') {
      units.push({ kind: 'c', text: pair });
      i += 2;
      continue;
    }
    const ch = w.charAt(i);
    if (ch === '-' || ch === "'") {
      i += 1;
      continue;
    }
    units.push({
      kind: (VOWEL_LETTERS as readonly string[]).includes(ch) ? 'v' : 'c',
      text: ch,
    });
    i += 1;
  }

  const syllables: Syllable[] = [];
  let onset: string[] = [];

  for (const unit of units) {
    if (unit.kind === 'c') {
      onset.push(unit.text);
      continue;
    }

    // A vowel closes the pending onset. Everything in the onset except its
    // last consonant belongs to the previous syllable's coda — unless this is
    // the first syllable, where the whole run is the onset (kro-no, tra-na).
    const prev = syllables.at(-1);
    if (prev !== undefined && onset.length > 1) {
      const coda = onset.slice(0, -1);
      prev.text += coda.join('');
      prev.phones.push(...coda.flatMap((c) => toPhones(c, set)));
      onset = onset.slice(-1);
    }

    const phones = [...onset.flatMap((c) => toPhones(c, set)), ...toPhones(unit.text, set)];
    syllables.push({
      text: onset.join('') + unit.text,
      phones,
      nucleusAt: phones.length - 1,
    });
    onset = [];
  }

  // A trailing consonant run closes the last syllable (amor, apok).
  if (onset.length > 0) {
    const last = syllables.at(-1);
    if (last === undefined) throw new G2PError(`${word}: no vowel`);
    last.text += onset.join('');
    last.phones.push(...onset.flatMap((c) => toPhones(c, set)));
  }

  return {
    word,
    syllables,
    stressIndex: syllables.length <= 1 ? 0 : syllables.length - 2,
    phones: syllables.flatMap((s) => s.phones),
  };
}

/** `dor-va-a-sa`, for display. */
export function hyphenate(word: string): string {
  return syllabify(word)
    .syllables.map((s) => s.text)
    .join('-');
}

/** `dorvaASAsa`-style: the stressed syllable uppercased, as the guide writes it. */
export function markStress(word: string): string {
  const { syllables, stressIndex } = syllabify(word);
  return syllables.map((s, i) => (i === stressIndex ? s.text.toUpperCase() : s.text)).join('-');
}

/**
 * Phones with a stress digit appended to each vowel, ARPAbet style: `1` on the
 * stressed nucleus, `0` elsewhere. Only useful if the acoustic model was
 * trained with stress-marked phones.
 */
export function toStressedPhones(word: string, set: PhoneSet = 'ipa'): string[] {
  const { syllables, stressIndex } = syllabify(word, set);
  return syllables.flatMap((s, i) =>
    s.phones.map((p, j) => (j === s.nucleusAt ? `${p}${i === stressIndex ? '1' : '0'}` : p)),
  );
}

/**
 * A rapid-speech variant: the guide says "hiatus vowels may glide without
 * changing spelling". Returns the phones with each vowel-vowel sequence
 * reduced to a single long vowel, or `null` when the word has no hiatus.
 *
 * Offered as a second MFA pronunciation so an aligner can choose.
 */
export function glidedVariant(word: string, set: PhoneSet = 'ipa'): string[] | null {
  const phones = toPhones(word, set);
  const out: string[] = [];
  let glided = false;
  let i = 0;
  while (i < phones.length) {
    const here = phones[i];
    if (here === undefined) break;
    const next = phones[i + 1];
    out.push(here);
    // A doubled vowel is hiatus; rapid speech glides it to a single vowel.
    if (next !== undefined && here === next && isVowelPhone(here, set)) {
      glided = true;
      i += 2;
      continue;
    }
    i += 1;
  }
  return glided ? out : null;
}
