/**
 * Reading one word (how_to_translate.how_a_reader_parses_one_word, 2.5):
 *
 *   1 exact form, every reading kept (a form and a closed word both: maivo is
 *     "I" and "Self", 2.5:G100)        2 closed word
 *   3 numeral, plain, hyphenated or ordinal; NUMBER-krono (2.1:G49)
 *   4 derivation -yo, -vu, -pago        5 -ri, then -ti, on a known stem (2.5:G122)
 *   6 a motion prefix on any verb form (2.5:G121)
 *   7 legacy spelling                   8 name
 *   otherwise: an unused slot (0.8:R2) or not a word of Liraasa.
 * A meaning is never guessed.
 */
import type { Index } from './lexicon';
import type { Reading, WordAnalysis } from './types';

const analysis = (
  text: string,
  readings: Reading[],
  extra: Partial<WordAnalysis> = {},
): WordAnalysis => ({
  text,
  lower: text.toLowerCase(),
  readings,
  suffixes: [],
  ...extra,
});

function numeral(ix: Index, w: string): Reading | null {
  let body = w;
  let ordinal = false;
  const suffix = ix.ordinalSuffix;
  if (body.endsWith(suffix)) {
    body = body.slice(0, -suffix.length);
    ordinal = true;
  }
  const parts = body.split('-');
  if (parts.length === 0 || !parts.every((p) => ix.numerals.has(p))) return null;
  return {
    pos: ordinal ? 'ord' : 'num',
    form: w,
    gloss: ordinal ? `${body} (ordinal)` : body,
    source: 'numeral',
  };
}

function times(ix: Index, w: string): Reading | null {
  const head = ix.timesHead;
  if (head === null || !w.endsWith(`-${head}`)) return null;
  const left = w.slice(0, -head.length - 1);
  if (left === ix.timesQuestion)
    return {
      pos: 'kiword',
      form: w,
      gloss: 'how many times',
      source: 'correlative',
      detail: 'times',
    };
  return numeral(ix, left) === null
    ? null
    : { pos: 'mannerAdv', form: w, gloss: `${left} times`, source: 'correlative', detail: 'times' };
}

function derivation(ix: Index, w: string): Reading | null {
  const listed = ix.lexicalised.get(w);
  if (listed !== undefined)
    return {
      pos: 'noun',
      form: w,
      root: listed.base,
      gloss: listed.gloss,
      source: listed.suffix === 'ti' ? 'diminutive-listed' : 'derivation-listed',
      detail: `-${listed.suffix}`,
    };
  const defaults = ix.source.ref.word_building.derivation_defaults ?? {};
  for (const suffix of ix.derivations) {
    if (!w.endsWith(suffix)) continue;
    const base = w.slice(0, -suffix.length);
    if (ix.headwords.has(base) && !ix.blocked.has(w))
      return {
        pos: 'noun',
        form: w,
        root: base,
        gloss: (defaults[`-${suffix}`] ?? suffix).replace(/\bR\b/g, base),
        source: 'derivation',
        detail: `-${suffix}`,
      };
  }
  return null;
}

/** A known stem's readings: a form, a derivation, a closed word or a name. */
function stem(ix: Index, s: string): Reading[] {
  const out = [...(ix.forms.get(s) ?? [])];
  const d = derivation(ix, s);
  if (d !== null && out.length === 0) out.push(d);
  for (const r of ix.closed.get(s) ?? [])
    if (r.pos === 'pron' || r.pos === 'det' || r.pos === 'noun') out.push(r);
  if (ix.names.has(s)) out.push({ pos: 'name', form: s, gloss: 'name', source: 'name' });
  return out;
}

export function readWord(
  ix: Index,
  text: string,
  opts: { capital: boolean; first: boolean; quoted?: boolean },
): WordAnalysis {
  const w = text.toLowerCase();
  if (opts.quoted === true)
    return analysis(text, [
      {
        pos: 'noun',
        form: w,
        gloss: `the word “${text}”`,
        source: 'closed',
        detail: 'a word quoted',
      },
    ]);

  // 1, 2: exact form and closed word, every reading kept
  const exact = [...(ix.forms.get(w) ?? []), ...(ix.closed.get(w) ?? [])];
  if (exact.length > 0) {
    // a capitalised known name away from the start is a name first
    if (opts.capital && !opts.first && ix.names.has(w))
      exact.unshift({ pos: 'name', form: text, gloss: 'name', source: 'name' });
    return analysis(text, exact);
  }

  // 3: numerals, N-krono
  const num = numeral(ix, w) ?? times(ix, w);
  if (num !== null) return analysis(text, [num]);

  // a hyphenated fraction: written with spaces since 2.5:G97
  const fr = /^([a-z-]+)-de-([a-z-]+)$/.exec(w);
  if (fr !== null && numeral(ix, fr[1] ?? '') !== null && numeral(ix, fr[2] ?? '') !== null)
    return analysis(text, [], { problem: { kind: 'hyphenated-fraction' } });

  // 4: derivation
  const d = derivation(ix, w);
  if (d !== null) return analysis(text, [d]);

  // 5: -ri, then -ti (ROOT + form or derivation + -ti + -ri, 2.5:G122)
  if (w.length > ix.minStripLength) {
    for (const suffixes of [['ri'], ['ti', 'ri'], ['ti']] as ('ti' | 'ri')[][]) {
      const end = suffixes.join('');
      if (!w.endsWith(end)) continue;
      const s = w.slice(0, -end.length);
      const readings = stem(ix, s);
      if (readings.length > 0) return analysis(text, readings, { suffixes });
    }
  }

  // 6: a motion prefix on any verb form (2.5:G121)
  for (const prefix of ix.prefixes) {
    for (const p of [prefix, prefix.replace(/-$/, '')]) {
      if (!w.startsWith(p) || w.length === p.length) continue;
      const rest = w.slice(p.length);
      const verbs = (ix.forms.get(rest) ?? []).filter((r) => r.pos === 'verb');
      if (verbs.length > 0) {
        const curated = ix.curated.has(prefix + rest);
        return analysis(
          text,
          verbs.map((v) => ({
            ...v,
            form: prefix + rest,
            gloss: curated
              ? v.gloss
              : `${v.gloss} (${prefix} ${ix.source.ref.word_building.motion_prefixes.canon[prefix] ?? ''})`,
            source: 'prefix' as const,
            detail: curated ? 'listed meaning' : 'compositional',
          })),
          { prefix },
        );
      }
    }
  }

  // 7: a legacy spelling, bare or with its -ri / -ti
  for (const suffixes of [[], ['ri'], ['ti', 'ri'], ['ti']] as ('ti' | 'ri')[][]) {
    const end = suffixes.join('');
    if (end !== '' && !w.endsWith(end)) continue;
    const old = ix.source.legacy[end === '' ? w : w.slice(0, -end.length)];
    if (old !== undefined && !(end !== '' && old.to.includes(' '))) {
      // read with the shape of the word it became, so the clause still parses
      const now = old.to.includes(' ')
        ? []
        : [...(ix.forms.get(old.to) ?? []), ...(ix.closed.get(old.to) ?? [])];
      return analysis(text, now, {
        suffixes,
        problem: { kind: 'legacy', to: old.to + end, edition: old.edition ?? null },
      });
    }
  }

  // a form the rules would build and the dictionary leaves unlisted: its slot gives it a shape, not a meaning
  const unused = ix.unlisted.get(w);
  if (unused !== undefined) {
    const pos =
      unused.role === 'v' ? 'verb' : ['n', 'an', 'nn'].includes(unused.role) ? 'noun' : 'adj';
    return analysis(
      text,
      [
        {
          pos,
          form: w,
          root: unused.root,
          role: unused.role,
          gloss: '(an unused slot: no meaning)',
          source: 'listed',
        },
      ],
      { problem: { kind: 'unused', ...unused } },
    );
  }

  // 8: a name, known or capitalised (-ti may attach to a name, 0.8:R12)
  const known = ix.names.has(w) || (w.endsWith('ti') && ix.names.has(w.slice(0, -2)));
  if (known || opts.capital)
    return analysis(text, [
      {
        pos: 'name',
        form: text,
        gloss: 'name',
        source: 'name',
        // a capitalised first word could also be a misspelling: say so
        ...(known || !opts.first ? {} : { detail: 'unconfirmed' }),
      },
    ]);

  return analysis(text, [], { problem: { kind: 'unknown' } });
}
