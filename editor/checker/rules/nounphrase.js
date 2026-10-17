/* Liraasa grammar checker: noun phrases (Phase 2).
 *
 *   two bare nouns side by side                  error  ADR-0011
 *     fix: the first noun's own adjective (noun → adjective, ascended noun →
 *     ascended adjective, negative noun → negative adjective), else the
 *     dictionary's compound of the two, else a de phrase
 *   a prepositional phrase between the subject and the verb   error 1.0:G21
 *     the noun phrase has no slot for it; fix: a raho clause closed by a comma
 *   de with nothing after it, or after a verb or adjective    error noun phrase
 *   a preposition with no noun phrase; ala as infinitive "to"  error noun phrase
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  /** The fix for "noun noun": adjective, compound, or de phrase. */
  function nounPairFix(ctx, a, b) {
    const ra = (a.reading.readings || [])[0];
    const rb = (b.reading.readings || [])[0];
    if (!ra || !rb || (a.reading.suffixes || []).length) return null;
    const adjRole = ctx.cls.nounToAdjective[ra.role];
    const adj = adjRole && ra.entry.forms[adjRole];
    if (adj)
      return {
        text: adj.form + ' ' + b.text,
        how: 'use the adjective ' + adj.form + ' (“' + adj.gloss + '”)',
        auto: true,
      };
    for (const entry of ctx.ix.headwords.values()) {
      if (entry.parts && entry.parts[0] === ra.root && entry.parts[1] === rb.root) {
        return {
          text: entry.root,
          how:
            (adjRole
              ? 'its ' +
                ctx.ix.headwords.get(ra.root).forms.n.roleName +
                ' has no listed adjective; '
              : '') +
            'use the compound ' +
            entry.root +
            ' (“' +
            entry.forms.n.gloss +
            '”)',
          auto: true,
        };
      }
    }
    return {
      text: b.text + ' de ' + a.text,
      how: a.text + ' has no listed adjective and there is no compound, so use a de phrase',
      auto: false,
    };
  }

  C.rules.nounphrase = function nounphrase(ctx) {
    const out = [];
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      for (const [x, y] of s.nounPairs) {
        const a = W[x];
        const b = W[y];
        const fix = nounPairFix(ctx, a, b);
        out.push(
          C.diagnostic({
            line: ctx.no,
            start: a.start,
            end: b.end,
            token: a.text + ' ' + b.text,
            severity: 'error',
            rule: 'ADR-0011',
            message:
              '“' +
              a.text +
              ' ' +
              b.text +
              '”: a noun does not modify a noun' +
              (fix ? '; ' + fix.how + ': ' + fix.text : '') +
              '.',
            fix: fix ? fix.text : undefined,
            autoFix: Boolean(fix && fix.auto),
          }),
        );
      }

      if (s.ppInSubject) {
        const pp = s.ppInSubject;
        const subjEnd = W[s.subject.end - 1];
        const ppEnd = W[pp.end - 1];
        const line = ctx.line;
        const fixed =
          line.slice(0, subjEnd.end) +
          ', raho ke ' +
          line.slice(W[pp.start].start, ppEnd.end) +
          ',' +
          line.slice(ppEnd.end);
        out.push(
          C.diagnostic({
            ...C.at(ctx, W[pp.prep]),
            severity: 'error',
            rule: '1.0:G21',
            message:
              '“' +
              line.slice(W[pp.start].start, ppEnd.end) +
              '” stands between the subject and the verb, but a noun phrase has no slot for a prepositional phrase ([QUANT] [li|OWNER de] [NUM] [ADJ] NOUN [de …] [raho …]). Make it a raho clause closed by a comma.',
            fix: fixed,
            fixStart: 0,
            fixEnd: line.length,
            autoFix: true,
          }),
        );
      }

      for (const k of s.strayDe) {
        const prev = W[k - 1];
        const why = !W[k + 1]
          ? 'de needs a noun phrase after it (owner de thing).'
          : prev && C.verbal(prev)
            ? 'de cannot follow the verb “' +
              prev.text +
              '”: de joins an owner and a thing. For “about”, give the verb an object (1.2:G30).'
            : 'de needs a noun or pronoun on both sides (owner de thing).';
        out.push(
          C.diagnostic({
            ...C.at(ctx, W[k]),
            severity: 'error',
            rule: 'noun phrase',
            message: why,
          }),
        );
      }

      for (const k of s.stranded) {
        const w = W[k];
        const next = W[k + 1];
        const infinitive = w.lower === 'ala' && next && C.verbal(next);
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'error',
            rule: 'noun phrase',
            message: infinitive
              ? 'ala means “toward”, never the infinitive “to”: join two verbs with sidu, or use kopisa for “in order to”.'
              : '“' + w.text + '” needs a noun phrase after it.',
          }),
        );
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
