/* Liraasa grammar checker: the verb slot (Phase 2).
 *
 *   a noun or adjective in the verb slot (after tense or an operator, or
 *   opening a command after fisa), with its own verb form as the fix  error slot
 *   a second noun phrase but the clause has no verb or copula         error slot
 *   a subordinate clause with no verb (nevi + noun phrase is fine)    error slot
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  /** The listed verb form of the word's own headword, if it has one. */
  function verbFormOf(ix, word) {
    const r = word.reading;
    if (!r || !r.readings) return null;
    for (const x of r.readings) {
      const v = x.entry && x.entry.forms.v;
      if (v) return { form: v.form, gloss: v.gloss, as: x.roleName, of: x.gloss };
    }
    return null;
  }

  C.rules.verbslot = function verbslot(ctx) {
    const out = [];
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      const cut = W.some((w) => w.cut);
      const realVerb = s.verbs.some((v) => v.type !== 'nonverb');

      // a clause opened by a linker needs a verb: one diagnostic, naming the
      // word that stands where the verb should be (raho farla … → farlafa)
      const opened = (clause.kind === 'subordinate' || clause.kind === 'relative') && clause.linker;
      if (
        opened &&
        !realVerb &&
        !s.predicateAdj.length &&
        W.length > 1 &&
        !cut &&
        !ctx.cls.takesNounPhrase.has(clause.linker.lower)
      ) {
        const stand = W.slice(1).find((w) => C.verbFormOf(ctx.ix, w));
        const v = stand ? C.verbFormOf(ctx.ix, stand) : null;
        out.push(
          C.diagnostic({
            ...C.at(ctx, stand || W[0]),
            severity: 'error',
            rule: 'slot',
            message:
              '“' +
              W[0].text +
              '” opens a clause, and the clause has no verb' +
              (stand
                ? ' (“' + stand.text + '” is not a verb form; its verb is ' + v.form + ')'
                : '') +
              '.',
            fix: v ? v.form : undefined,
            autoFix: false,
          }),
        );
        continue;
      }

      // a tense with nothing at all in the verb slot after it (a noun standing
      // there is reported below, with its verb form)
      const tense = s.ops.filter((o) => o.name === 'TENSE');
      const emptySlot =
        !s.verbs.length ||
        s.verbs.every((v) => v.type === 'nonverb' && v.i < Math.min(...tense.map((o) => o.i)));
      if (tense.length && emptySlot && !cut) {
        for (const o of tense) {
          out.push(
            C.diagnostic({
              ...C.at(ctx, W[o.i]),
              severity: 'error',
              rule: 'slot',
              message:
                '“' +
                W[o.i].text +
                '” has no verb or copula after it; tense comes before the verb (ke, ka, loya …).',
            }),
          );
        }
        continue;
      }

      for (const { i } of s.nonVerbInSlot) {
        const w = W[i];
        const v = verbFormOf(ctx.ix, w);
        const why =
          s.command && !s.ops.length
            ? 'A command opens at its verb'
            : 'After tense or an operator comes the verb';
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'error',
            rule: 'slot',
            message:
              '“' +
              w.text +
              '” is in the verb slot but is not a verb form' +
              (v
                ? ' (it is the ' +
                  v.as +
                  ' “' +
                  v.of +
                  '”); its verb is ' +
                  v.form +
                  ', “' +
                  v.gloss +
                  '”.'
                : '.') +
              ' ' +
              why +
              '.',
            fix: v ? v.form : undefined,
            autoFix: Boolean(v),
          }),
        );
      }
      // ne A ne B with no verb: the paired negation as a fragment (1.0:G10, 0.8:G3)
      const neitherNor = s.ne.length >= 2 && !s.verbs.some((v) => v.type !== 'nonverb');
      for (const { np } of neitherNor ? [] : s.secondNoun) {
        const w = W[np.head];
        const v = verbFormOf(ctx.ix, w);
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'error',
            rule: 'slot',
            message:
              '“' +
              w.text +
              '” opens a second noun phrase, but the clause has no verb or copula' +
              (v ? '; its verb is ' + v.form + ' (“' + v.gloss + '”)' : '') +
              '. Use ke/ka for “is”.',
            fix: v ? v.form : undefined,
            autoFix: false,
          }),
        );
      }
    }
    return out;
  };

  C.verbFormOf = verbFormOf;
})(typeof window !== 'undefined' ? window : globalThis);
