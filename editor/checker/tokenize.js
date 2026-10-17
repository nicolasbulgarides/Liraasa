/* Liraasa grammar checker: tokens.
 *
 * A word is a run of letters with internal hyphens and apostrophes kept
 * (eli-krono, dozira-cuara, revo-sabesia are one token). Everything else is
 * punctuation. Every token keeps its character offsets so the editor can
 * underline it, and its capitalisation so the reader can tell a name.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  const WORD = /[A-Za-z]+(?:['-][A-Za-z]+)*/g;

  /** Split one line into word and punctuation tokens, in order. */
  function tokenize(line) {
    const out = [];
    let last = 0;
    let m;
    WORD.lastIndex = 0;
    while ((m = WORD.exec(line))) {
      pushPunct(out, line, last, m.index);
      out.push({
        type: 'word',
        text: m[0],
        lower: m[0].toLowerCase(),
        start: m.index,
        end: m.index + m[0].length,
        capital: /^[A-Z]/.test(m[0]),
        first: !out.some((t) => t.type === 'word'),
      });
      last = m.index + m[0].length;
    }
    pushPunct(out, line, last, line.length);
    return out;
  }

  function pushPunct(out, line, from, to) {
    for (let i = from; i < to; i += 1) {
      const ch = line[i];
      if (/\s/.test(ch)) continue;
      out.push({ type: 'punct', text: ch, start: i, end: i + 1 });
    }
  }

  C.tokenize = tokenize;
})(typeof window !== 'undefined' ? window : globalThis);
