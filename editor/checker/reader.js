/* Liraasa grammar checker: reading one word (Phase 1).
 *
 * The reader order is how_to_translate.how_a_reader_parses_one_word:
 *   1 exact form (every reading kept)   2 closed word   3 numeral / ordinal
 *   4 derivation (-yo, -vu, -pago)      5 -ri / -ti stripping
 *   6 motion prefix on a verb form      7 fraction N-de-N
 *   8 legacy spelling                   9 name
 *  10 otherwise: not a word of Liraasa. A meaning is never guessed.
 * One step is added before giving up: a spelling the rules would build for
 * a headword but the dictionary does not list is reported as an unused slot
 * (self_check: "a form whose slot is unused"), not as an unknown word.
 *
 * Lexicon first: a listed spelling always beats a decomposition, because
 * many roots end in letters that look like suffixes (navu, sevu, pago).
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  function readWord(ix, token) {
    const w = token.lower;

    // 1 exact form
    const lexical = ix.forms.get(w);
    if (lexical) return { kind: 'lexical', word: w, readings: lexical, suffixes: [] };

    // 2 closed class
    const closed = ix.closed.get(w);
    if (closed) return { kind: 'closed', word: w, readings: closed, suffixes: [] };

    // 3 numeral, plain or hyphenated, optionally ordinal
    const num = readNumeral(ix, w);
    if (num) return num;

    // 4 derivation
    const deriv = readDerivation(ix, w);
    if (deriv) return deriv;

    // 5 -ri, then -ti, on a known stem
    const stripped = readStripped(ix, w);
    if (stripped) return stripped;

    // 6 motion prefix on a verb form
    const motion = readMotion(ix, w);
    if (motion) return motion;

    // 7 fraction, N-de-N
    const fr = /^([a-z-]+)-de-([a-z-]+)$/.exec(w);
    if (fr && readNumeral(ix, fr[1]) && readNumeral(ix, fr[2])) {
      return { kind: 'fraction', word: w, readings: [], suffixes: [] };
    }

    // 8 legacy spelling
    const legacy = ix.legacy.get(w);
    if (legacy)
      return {
        kind: 'legacy',
        word: w,
        to: legacy.to,
        migration: legacy.kind,
        readings: [],
        suffixes: [],
      };

    // a rule-built form the dictionary leaves unlisted: an unused slot
    const unlisted = ix.unlisted.get(w);
    if (unlisted) return { kind: 'unused', word: w, ...unlisted, readings: [], suffixes: [] };

    // 9 name: a known name, or capitalised away from the start of the line;
    //   -ti may attach to a name (0.8:R12)
    if (isName(ix, token, w)) return { kind: 'name', word: token.text, readings: [], suffixes: [] };

    // 10 not a word of Liraasa
    return null;
  }

  function isName(ix, token, w) {
    if (ix.names.has(w)) return true;
    const dim = ix.morph.inflections.find(
      (s) => w.endsWith(s) && ix.names.has(w.slice(0, -s.length)),
    );
    if (dim) return true;
    return token.capital && !token.first;
  }

  function readNumeral(ix, w) {
    const suffix = ix.numerals.ordinalSuffix;
    let body = w;
    let ordinal = false;
    if (suffix && body.endsWith(suffix)) {
      body = body.slice(0, -suffix.length);
      ordinal = true;
    }
    const parts = body.split('-');
    if (parts.length && parts.every((p) => ix.numerals.words.has(p))) {
      return { kind: 'numeral', word: w, ordinal, readings: [], suffixes: [] };
    }
    return null;
  }

  function readDerivation(ix, w) {
    const lex = ix.morph.lexicalised.get(w);
    if (lex)
      return {
        kind: 'derivation',
        word: w,
        base: lex.base,
        suffix: lex.suffix,
        gloss: lex.gloss,
        lexicalised: true,
        readings: [],
        suffixes: [],
      };
    for (const suffix of ix.morph.derivations) {
      if (!w.endsWith(suffix)) continue;
      const base = w.slice(0, -suffix.length);
      if (ix.headwords.has(base) && !ix.morph.blocked.has(w)) {
        return {
          kind: 'derivation',
          word: w,
          base,
          suffix,
          lexicalised: false,
          readings: [],
          suffixes: [],
        };
      }
    }
    return null;
  }

  function knownStem(ix, s) {
    if (ix.forms.has(s)) return { kind: 'lexical', readings: ix.forms.get(s) };
    const d = readDerivation(ix, s);
    if (d) return d;
    if (ix.closed.has(s)) return { kind: 'closed', readings: ix.closed.get(s) };
    return null;
  }

  /**
   * "strip -ri, then -ti if what remains is not known": suffix_order is
   * ROOT + … + -ti + -ri, so the last inflection comes off first.
   */
  function readStripped(ix, w) {
    if (w.length <= ix.minStripLength) return null;
    const chain = ix.morph.inflections; // ['ti', 'ri'] in suffix order
    const outer = chain[chain.length - 1];
    const inner = chain[chain.length - 2];
    const done = (stem, suffixes) => {
      const hit = knownStem(ix, stem);
      return hit ? { ...hit, word: w, stem, suffixes } : null;
    };
    if (outer && w.endsWith(outer)) {
      const stem = w.slice(0, -outer.length);
      const found = done(stem, [outer]);
      if (found) return found;
      if (inner && stem.endsWith(inner)) return done(stem.slice(0, -inner.length), [inner, outer]);
      return null;
    }
    if (inner && w.endsWith(inner)) return done(w.slice(0, -inner.length), [inner]);
    return null;
  }

  function readMotion(ix, w) {
    for (const prefix of ix.morph.prefixes) {
      const bare = prefix.replace(/-$/, '');
      for (const p of [prefix, bare]) {
        if (!w.startsWith(p)) continue;
        const rest = w.slice(p.length);
        const verbs = (ix.forms.get(rest) || []).filter((r) => r.role === 'v');
        if (verbs.length) {
          const spelled = prefix + rest;
          return {
            kind: 'motion',
            word: w,
            prefix,
            verb: rest,
            readings: verbs,
            curated: ix.morph.curated.has(spelled),
            suffixes: [],
          };
        }
      }
    }
    return null;
  }

  C.readWord = readWord;
})(typeof window !== 'undefined' ? window : globalThis);
