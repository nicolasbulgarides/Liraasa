/* Liraasa grammar checker: the public API.
 *
 *   const checker = LiraasaChecker.create(window.LIRAASA_REF, window.LIRAASA_CHECKER_EXTRA, window.LIRAASA_FLAGS);
 *   checker.checkLine('maivo lirala.', 1, 'I sing.')  → diagnostics
 *   checker.check(lines, englishLines)                → diagnostics for a whole piece
 *   checker.readLine('maivo lirala.')                 → tokens, each with its reading
 *
 * Load order (editor/index.html and the tests use the same list, MODULES):
 * the three data scripts, then tokenize, diagnostics, lexicon, reader, the
 * rules, and this file last.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  C.MODULES = [
    'tokenize.js',
    'diagnostics.js',
    'lexicon.js',
    'reader.js',
    'classes.js',
    'clauses.js',
    'slots.js',
    'rules/words.js',
    'rules/order.js',
    'rules/verbslot.js',
    'rules/negation.js',
    'rules/nounphrase.js',
    'rules/valency.js',
    'rules/semantic.js',
    'rules/register.js',
    'english.js',
    'gloss.js',
    'rules/english.js',
    'index.js',
  ];

  function create(ref, extra, flags, englishData) {
    const ix = C.buildIndex(ref, extra);
    ix.flags = flags || {};
    const cls = C.buildClasses(ref, ix, flags || {});
    const en = C.buildEnglish(englishData || {});
    const calques = (englishData && englishData.calques) || [];

    function readLine(line) {
      const tokens = C.tokenize(line);
      for (const t of tokens) if (t.type === 'word') t.reading = C.readWord(ix, t);
      return tokens;
    }

    /** Tokens, words with their roles, and each clause placed in the template. */
    function parseLine(line) {
      const tokens = readLine(line);
      const words = C.wordsOf(tokens, cls);
      const parsed = C.splitClauses(words).map((clause) => ({
        clause,
        s: C.placeClause(clause, cls),
      }));
      return { tokens, words, parsed };
    }

    function checkLine(line, no, english, opts) {
      const register = (opts && opts.register) || '';
      const ctx = {
        ix,
        cls,
        ref,
        en,
        calques,
        line,
        no,
        register,
        english: english || '',
        ...parseLine(line),
      };
      const out = [];
      for (const rule of Object.values(C.rules)) out.push(...rule(ctx));
      return out.sort((a, b) => a.start - b.start);
    }

    /** Every line's diagnostics; blank lines are skipped. opts.register: everyday | poetic | sacred. */
    function check(lines, english, opts) {
      return lines.flatMap((line, i) =>
        line.trim() ? checkLine(line, i + 1, (english || [])[i] || '', opts) : [],
      );
    }

    /** A literal word-by-word gloss of the line: { words: [{ text, gloss }], text }. */
    function backTranslate(line) {
      return C.backTranslateTokens(ix, en, readLine(line));
    }

    return {
      index: ix,
      classes: cls,
      readLine,
      parseLine,
      checkLine,
      check,
      backTranslate,
      applyFix: C.applyFix,
    };
  }

  C.create = create;
  if (root.LIRAASA_REF) {
    try {
      C.default = create(
        root.LIRAASA_REF,
        root.LIRAASA_CHECKER_EXTRA,
        root.LIRAASA_FLAGS,
        root.LIRAASA_ENGLISH,
      );
    } catch (e) {
      C.loadError = e;
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
