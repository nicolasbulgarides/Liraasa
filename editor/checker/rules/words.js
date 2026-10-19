/* Liraasa grammar checker: word-level rules (Phase 1).
 *
 *   unknown word        error  "never invent"  not a word of Liraasa
 *   unused slot         warn   0.8:R2          a rule-built form with no meaning
 *   older spelling      warn   1.0:G19         names its replacement (and the edition that respelled it)
 *   motion prefix       unsettled 1.2:G35      a prefix on a verb that is not
 *                                              a curated metaphor: the JSON
 *                                              does not list the motion verbs
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  /** Dictionary spellings one edit away: offered as spellings, never as meanings. */
  function nearby(ix, w) {
    const out = [];
    const near = (a, b) => {
      if (Math.abs(a.length - b.length) > 1 || a === b) return false;
      let i = 0;
      while (i < a.length && a[i] === b[i]) i += 1;
      return (
        a.slice(i + 1) === b.slice(i + 1) ||
        a.slice(i) === b.slice(i + 1) ||
        a.slice(i + 1) === b.slice(i)
      );
    };
    for (const f of ix.forms.keys()) if (near(w, f)) out.push(f);
    for (const f of ix.closed.keys()) if (near(w, f)) out.push(f);
    return out.slice(0, 4);
  }

  function wordRules(ctx) {
    const { ix, no, tokens } = ctx;
    const out = [];
    for (const t of tokens) {
      if (t.type !== 'word') continue;
      const r = t.reading;
      const at = { line: no, start: t.start, end: t.end, token: t.text };
      if (r === null) {
        const near = nearby(ix, t.lower);
        const hint =
          t.capital && t.first ? ' If it is a name, add it to data/checker/names.json.' : '';
        out.push(
          C.diagnostic({
            ...at,
            severity: 'error',
            rule: 'never invent',
            message:
              '“' +
              t.text +
              '” is not a word of Liraasa.' +
              (near.length ? ' Spelled like: ' + near.join(', ') + '.' : '') +
              hint,
            fix: near.length === 1 ? near[0] : undefined,
            autoFix: false,
          }),
        );
      } else if (r.kind === 'unused') {
        const listed = Object.values((ix.headwords.get(r.root) || { forms: {} }).forms).map(
          (f) => f.form + ' (' + f.roleName + ')',
        );
        out.push(
          C.diagnostic({
            ...at,
            severity: 'warn',
            rule: '0.8:R2',
            message:
              '“' +
              t.text +
              '” would be the ' +
              r.roleName +
              ' of ' +
              r.root +
              ', but that slot has no meaning and is not in the dictionary. Listed forms: ' +
              listed.join(', ') +
              '.',
          }),
        );
      } else if (r.kind === 'legacy') {
        out.push(
          C.diagnostic({
            ...at,
            severity: 'warn',
            rule: '1.0:G19',
            // an edition named: a spelling that edition respelled (2.1:G58); else pre-1.0
            // a spelling one edition brought in and a later one undid (2.1's puzu, 2.2:G68)
            message: r.since
              ? '“' +
                t.text +
                '” is the spelling of ' +
                r.since +
                '; ' +
                r.edition +
                ' spells it “' +
                r.to +
                '”.'
              : r.edition
                ? '“' +
                  t.text +
                  '” is the spelling before ' +
                  r.edition +
                  ' (' +
                  r.migration +
                  '); ' +
                  r.edition +
                  ' spells it “' +
                  r.to +
                  '”.'
                : '“' +
                  t.text +
                  '” is a pre-1.0 spelling (' +
                  r.migration +
                  '); 1.0 reads it as “' +
                  r.to +
                  '”.',
            fix: r.to,
            autoFix: !r.to.includes(' '),
          }),
        );
      } else if (r.kind === 'motion' && !r.curated) {
        out.push(
          C.diagnostic({
            ...at,
            severity: 'unsettled',
            rule: '1.2:G35',
            message:
              '“' +
              t.text +
              '” puts ' +
              r.prefix +
              ' on the verb ' +
              r.verb +
              '. Motion prefixes are a closed list for motion verbs and the curated metaphors; the lexicon does not say whether ' +
              r.verb +
              ' is a motion verb.',
          }),
        );
      }
    }
    return out;
  }

  C.rules = C.rules || {};
  C.rules.words = wordRules;
})(typeof window !== 'undefined' ? window : globalThis);
