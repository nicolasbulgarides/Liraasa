/* Liraasa grammar checker: negation (Phase 2).
 *
 *   ne with nothing after it in its clause    error  0.8:G2
 *     ne precedes what it negates. The fix moves it before the verb; for
 *     "never", the time correlative glossed "never" is offered.
 *   ne … nuna-… in its scope (a double negative reads positive)  warn  0.8:G2
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  /** The correlative glossed "never", read from the reference (nuna-krono). */
  function never(ix) {
    for (const [form, entries] of ix.closed) {
      if (entries.some((e) => e.cls === 'correlative' && /^never$/i.test(e.gloss))) return form;
    }
    return null;
  }

  C.rules.negation = function negation(ctx) {
    const out = [];
    const nev = never(ctx.ix);
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      for (const k of s.ne) {
        const rest = W.slice(k + 1).filter(
          (w) => !w.roles.has('question') && !w.roles.has('attitude'),
        );
        const verb = s.verbs.find((v) => v.type !== 'nonverb');
        // with no verb, a final ne is an elliptical answer: Dorin, ne. (0.8:G3)
        if (rest.length === 0 && verb) {
          const fix = verb ? moveNe(ctx.line, W[k], W[verb.i]) : undefined;
          out.push(
            C.diagnostic({
              ...C.at(ctx, W[k]),
              severity: 'error',
              rule: '0.8:G2',
              message:
                'ne negates what follows it, and nothing follows it in this clause. Put it before what it negates' +
                (verb ? ' (ne ' + W[verb.i].text + ')' : '') +
                '.' +
                (nev ? ' For “never”, use ' + nev + '.' : ''),
              fix,
              fixStart: 0,
              fixEnd: ctx.line.length,
              autoFix: false,
            }),
          );
        } else if (rest.some((w) => /^nuna(-|$)/.test(w.lower))) {
          // anywhere ne scopes over: ne vimova nuna-coda is as positive as ne nuna-coda (0.8:G2)
          const nuna = rest.find((w) => /^nuna(-|$)/.test(w.lower));
          out.push(
            C.diagnostic({
              ...C.at(ctx, W[k]),
              severity: 'warn',
              rule: '0.8:G2',
              message:
                'ne with ' + nuna.text + ' is a double negative and reads as a positive; drop ne.',
            }),
          );
        }
      }
    }
    return out;
  };

  /** The line with ne moved from the end of its clause to just before the verb. */
  function moveNe(line, ne, verb) {
    const without = line.slice(0, ne.start).replace(/\s+$/, '') + line.slice(ne.end);
    return without.slice(0, verb.start) + 'ne ' + without.slice(verb.start);
  }
})(typeof window !== 'undefined' ? window : globalThis);
