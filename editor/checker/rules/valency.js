/* Liraasa grammar checker: how many noun phrases a verb takes (Phase 2).
 *
 * 1.2:G26: a give-type verb (overlay give_type) takes VERB THEME ala
 * RECIPIENT, or VERB PRONOUN THEME when the recipient is a pronoun.
 *   give-type verb + bare non-pronoun recipient + theme   warn   1.2:G26
 *   any other verb + two bare noun phrases                error  1.2:G26
 *     a benefactive is vobi + NP (1.0:G12); "make X do" is the valency
 *     operator vaku (1.0:G14)
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  C.rules.valency = function valency(ctx) {
    const out = [];
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      const byVerb = new Map();
      for (const o of s.objects) {
        const list = byVerb.get(o.verb) || [];
        list.push(o);
        byVerb.set(o.verb, list);
      }
      for (const [v, objs] of byVerb) {
        if (objs.length < 2) continue;
        const verb = W[v];
        const [first, second] = objs;
        const text = (np) => ctx.line.slice(W[np.start].start, W[np.end - 1].end);
        const head = W[second.head];
        const pronounFirst = first.end - first.start === 1 && W[first.start].roles.has('pronoun');
        if (ctx.cls.giveType.has(verb.lower)) {
          if (pronounFirst) continue;
          out.push(
            C.diagnostic({
              ...C.at(ctx, W[first.head]),
              severity: 'warn',
              rule: '1.2:G26',
              message:
                '“' +
                verb.text +
                '” is a give-type verb: only a pronoun recipient stands bare after it. Otherwise VERB THEME ala RECIPIENT: ' +
                verb.text +
                ' ' +
                text(second) +
                ' ala ' +
                text(first) +
                '.',
              fix: verb.text + ' ' + text(second) + ' ala ' + text(first),
              fixStart: verb.start,
              fixEnd: W[second.end - 1].end,
              autoFix: false,
            }),
          );
        } else {
          out.push(
            C.diagnostic({
              ...C.at(ctx, head),
              severity: 'error',
              rule: '1.2:G26',
              message:
                '“' +
                verb.text +
                '” is followed by two bare noun phrases (“' +
                text(first) +
                '”, “' +
                text(second) +
                '”), but only give-type verbs take two. ' +
                (pronounFirst
                  ? 'For “for ' +
                    text(first) +
                    '” use vobi ' +
                    text(first) +
                    ' (1.0:G12); for “make ' +
                    text(first) +
                    ' do …”, use vaku (1.0:G14).'
                  : 'Join them with a preposition, or make one a de phrase.'),
            }),
          );
        }
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
