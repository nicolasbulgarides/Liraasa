/* Liraasa grammar checker: what each word means, in English (Phase 4).
 *
 *   senses(token)       every English sense its reading carries, for gloss drift
 *   backTranslate(line) a literal word-by-word gloss line, with the markers in
 *                       data/checker/english.json (PAST, FUT, NOT, Q …)
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
    return sense.replace(/^to (be )?/, '').trim() || sense;
  };

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
      else if (r.kind === 'numeral') g = '#' + t.lower;
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
