/* Liraasa grammar checker: what each word means, in English (Phase 4).
 *
 *   senses(token)       every English sense its reading carries, for gloss drift
 *   backTranslate(line) a literal word-by-word gloss line, with the markers in
 *                       data/checker/english.json (PAST, FUT, NOT, Q …); numbers
 *                       by value, tonsi + adjective as "so" (2.2:G62), kroti +
 *                       a measure as "ago" (2.1:G55), a side noun before a noun
 *                       phrase as its preposition (2.2:G67)
 *
 * Mechanical by design: it judges nothing, and shows the first sense of each
 * gloss so drift between the Liraasa and the intended English is visible.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  /** The first sense of a gloss, plainly: "to love; to care for" → love, "on / upon" → on. */
  const first = (gloss) => {
    const sense = String(gloss || '')
      .split(/[;,/]/)[0]
      .replace(/\(.*?\)/g, '')
      .replace(/^[^:]*:\s*/, '')
      .trim()
      .toLowerCase();
    // a gloss's own note after a question mark is not a sense: "who? preferred" → who
    const plain = sense.replace(/\?.*$/, '').trim() || sense;
    return plain.replace(/^to (be )?/, '').trim() || plain;
  };

  /** What the next word is, from its reading (a token has no clause roles here). */
  const readsAs = (t, test) => Boolean(t && t.reading && (t.reading.readings || []).some(test));
  const isAdjective = (t) =>
    readsAs(t, (x) => x.role === 'a' || x.role === 'aa' || x.role === 'na');
  const opensNounPhrase = (t) =>
    readsAs(
      t,
      (x) =>
        /^n|^an$/.test(x.role || '') ||
        /pronoun/.test(x.cls || '') ||
        /article|demonstrative|quantit|determiner/.test(x.use || ''),
    ) || Boolean(t && t.reading && t.reading.kind === 'numeral');
  const isMeasure = (t) =>
    Boolean(t && t.reading && t.reading.kind === 'numeral') ||
    readsAs(t, (x) => /quantifier/.test(x.cls || '') || /quantit/.test(x.use || ''));

  /** A numeral's value: una-ne → 1st, dozira-una → 21, dossa-mililumi → 2000. */
  function numberOf(ix, word) {
    const suffix = ix.numerals.ordinalSuffix;
    const ordinal = Boolean(suffix && word.endsWith(suffix));
    const body = ordinal ? word.slice(0, -suffix.length) : word;
    let total = 0;
    let group = 0;
    for (const part of body.split('-')) {
      const v = ix.numerals.words.get(part);
      if (typeof v !== 'number') return null;
      if (v >= 1000) {
        total += (group || 1) * v;
        group = 0;
      } else group += v;
    }
    const n = total + group;
    if (!ordinal) return String(n);
    const end = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
    return String(n) + end;
  }

  /** Every gloss text a token's reading carries. */
  function glossTexts(ix, token) {
    const r = token.reading;
    if (!r) return [];
    const out = [];
    for (const x of r.readings || []) {
      if (x.gloss) out.push(x.gloss);
      if (x.use && x.cls === 'correlative') out.push(x.use);
    }
    if (r.kind === 'derivation') {
      if (r.gloss) out.push(r.gloss);
      const base = ix.headwords.get(r.base);
      if (base && base.forms.n) out.push(base.forms.n.gloss);
      const suffix = ix.bound.get(r.suffix);
      if (suffix) out.push(suffix.gloss);
    }
    if (r.kind === 'name') out.push(token.lower);
    for (const s of r.suffixes || []) {
      const b = ix.bound.get(s);
      if (b) out.push(b.gloss);
    }
    return out;
  }

  /** The back-translation of one line: [{ text, gloss }] and the joined line. */
  function backTranslate(ix, en, tokens) {
    const words = [];
    const ws = tokens.filter((t) => t.type === 'word');
    for (let i = 0; i < ws.length; i += 1) {
      const t = ws[i];
      const r = t.reading;
      const next = ws[i + 1];
      const prev = ws[i - 1];
      let g;
      // a pronoun before de owns what follows (maivo de lira, my song: 1.2:G27);
      // after de it is the owner read as "of me" (li purma de maivo)
      if (en.owner[t.lower] && next && next.lower === 'de') {
        words.push({ text: t.text + ' ' + next.text, gloss: en.owner[t.lower] });
        i += 1;
        continue;
      }
      if (
        en.object[t.lower] &&
        prev &&
        (prev.lower === 'de' ||
          (prev.reading && (prev.reading.readings || []).some((x) => x.role === 'v')))
      ) {
        g = en.object[t.lower];
      } else if (en.markers[t.lower]) g = en.markers[t.lower];
      else if (!r) g = '?' + t.text + '?';
      else if (r.kind === 'name') g = t.text;
      else if (r.kind === 'numeral') g = numberOf(ix, t.lower) || '#' + t.lower;
      // tonsi before an adjective is "so" (2.2:G62); clause-initial it stays "therefore"
      else if (t.lower === 'tonsi' && isAdjective(next)) g = 'so';
      // kroti / krotiapo before a measure: ago, from now (2.1:G55)
      else if ((t.lower === 'kroti' || t.lower === 'krotiapo') && isMeasure(next))
        g = t.lower === 'kroti' ? 'ago:' : 'from-now:';
      // a side noun before a noun phrase is a preposition (2.2:G67)
      else if (
        ix.flags.side_nouns_as_prepositions &&
        typeof ix.flags.side_nouns_as_prepositions[t.lower] === 'string' &&
        opensNounPhrase(next)
      )
        g = ix.flags.side_nouns_as_prepositions[t.lower];
      else if (r.kind === 'legacy') g = '(old ' + t.lower + ')';
      else if (r.kind === 'derivation')
        g = first(r.gloss) || first((ix.bound.get(r.suffix) || {}).gloss) + ':' + r.base;
      else if (r.kind === 'motion') g = r.prefix + first(r.readings[0].gloss);
      else if (r.kind === 'unused') g = '(' + r.roleName + ' of ' + r.root + ', unused)';
      else {
        const x = (r.readings || [])[0];
        g = x ? en.markers[r.stem] || first(x.gloss) || x.form : t.text;
      }
      for (const s of r ? r.suffixes || [] : []) {
        const m = en.suffixes[s];
        if (m === undefined) continue;
        g = m.endsWith(' ') ? m + g : g + m;
      }
      words.push({ text: t.text, gloss: g });
    }
    return { words, text: words.map((w) => w.gloss).join(' ') };
  }

  C.glossTexts = glossTexts;
  C.backTranslateTokens = backTranslate;
})(typeof window !== 'undefined' ? window : globalThis);
