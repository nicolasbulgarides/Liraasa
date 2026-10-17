/* Liraasa grammar checker: rules that use the semantic overlay (Phase 3).
 *
 * The overlay (data/checker/lexicon_flags.json) gives noun classes,
 * preposition senses, verbs that are not causative, and verbs of mixing.
 *
 *   ko + a substance or abstract noun        warn  1.2:G33  the instrument is yuta
 *     (not after a verb of mixing: mix the flour ko the water)
 *   en + an abstract noun                    warn  1.2:G33  "in a voice" is the
 *     means, yuta; en is location (en li narvo, in the darkness, stays)
 *   a not-causative verb + actor + verb/noun warn  1.0:G14  "make someone do" = vaku
 *   ke + a noun phrase                       note  clause.copulas  ke is a temporary
 *     state; a lasting identity is ka; a state may be the noun's adjective
 *   gase opening a clause                    warn  0.8:G8   gase compares only;
 *     "as / while" is the while-subordinator, "when" the when-subordinator
 *
 * The words suggested are looked up by meaning, never named here: the
 * instrument preposition, the causative valency operator, the enduring
 * copula, and the subordinators glossed "while" and "when".
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  function table(flags, name) {
    return Object.fromEntries(
      Object.entries((flags && flags[name]) || {}).filter(([k]) => !k.startsWith('_')),
    );
  }

  function lookups(ctx) {
    if (ctx.ix.semantic) return ctx.ix.semantic;
    const flags = ctx.ix.flags;
    const sense = table(flags, 'preposition_sense');
    const bySense = (s) => Object.keys(sense).find((p) => sense[p] === s) || null;
    const fw = ctx.ref.small_words.function_words;
    const col = (name) => fw.columns.indexOf(name);
    const byMeaning = (re) => {
      const row = fw.rows.find((r) => re.test(r[col('meaning')]));
      return row ? row[col('form')] : null;
    };
    const causative = Object.entries(ctx.ref.clause.valency_operators).find(([, v]) =>
      /causative/.test(v),
    );
    ctx.ix.semantic = {
      sense,
      nounClass: table(flags, 'noun_class'),
      notCausative: table(flags, 'not_causative'),
      koCombines: table(flags, 'ko_combines'),
      instrument: bySense('instrument'),
      causative: causative ? causative[0] : null,
      enduring: byMeaning(/^enduring is/),
      temporary: byMeaning(/^temporary is/),
      whileWord: byMeaning(/^while\b/),
      whenWord: byMeaning(/^when \(subordinate\)/),
    };
    return ctx.ix.semantic;
  }

  /** The noun class of the head of a noun phrase, from its headword. */
  function classOf(sem, word) {
    const r = word.reading;
    if (!r || !r.readings) return null;
    for (const x of r.readings) {
      if (x.root && sem.nounClass[x.root]) return sem.nounClass[x.root];
    }
    return null;
  }

  C.rules.semantic = function semantic(ctx) {
    const sem = lookups(ctx);
    const out = [];
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      const mainVerb = s.verbs.find((v) => v.type === 'verb');

      // ko / en and the instrument (1.2:G33)
      for (const a of s.adjuncts) {
        if (a.kind !== 'pp' || a.head === undefined || !sem.instrument) continue;
        const prep = W[a.prep];
        const cls = classOf(sem, W[a.head]);
        const noun = W[a.head].text;
        const combining = mainVerb && sem.koCombines[W[mainVerb.i].lower];
        const ko =
          sem.sense[prep.lower] === 'accompaniment' &&
          (cls === 'substance' || cls === 'abstract') &&
          !combining;
        const en = sem.sense[prep.lower] === 'location' && cls === 'abstract';
        if (!ko && !en) continue;
        out.push(
          C.diagnostic({
            ...C.at(ctx, prep),
            severity: 'warn',
            rule: '1.2:G33',
            message: ko
              ? '“' +
                prep.text +
                '” is accompaniment (with a companion), but “' +
                noun +
                '” is a ' +
                cls +
                ': the tool or means of an act takes ' +
                sem.instrument +
                '.'
              : '“' +
                prep.text +
                '” is location (in, inside), but “' +
                noun +
                '” is ' +
                cls +
                ': “in a voice / tone / manner” is the means of the act, ' +
                sem.instrument +
                '.',
            fix: sem.instrument,
            autoFix: true,
          }),
        );
      }

      // a verb that is not causative, used as "make someone do" (1.0:G14)
      for (const v of s.verbs) {
        const w = W[v.i];
        if (!sem.notCausative[w.lower] || !sem.causative) continue;
        const objs = s.objects.filter((o) => o.verb === v.i);
        const actor = objs[0];
        const next = actor ? W[actor.end] : null;
        const second = objs[1] ? W[objs[1].head] : next;
        if (!actor || !second || !(C.verbal(second) || second.roles.has('noun'))) continue;
        const vf = C.verbal(second) ? null : C.verbFormOf(ctx.ix, second);
        const actorText = ctx.line.slice(W[actor.start].start, W[actor.end - 1].end);
        const fix = sem.causative + ' ' + actorText + ' ' + (vf ? vf.form : second.text);
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'warn',
            rule: '1.0:G14',
            message:
              '“' +
              w.text +
              '” is not causative (' +
              sem.notCausative[w.lower] +
              '). “Make ' +
              actorText +
              ' do …” is ' +
              sem.causative +
              ' + actor + verb: ' +
              fix +
              '.',
            fix,
            fixStart: w.start,
            fixEnd: second.end,
            autoFix: Boolean(vf) || C.verbal(second),
          }),
        );
      }

      // ke + a noun phrase: a temporary identity
      for (const v of s.verbs) {
        if (v.type !== 'copula' || W[v.i].lower !== sem.temporary) continue;
        for (const c of s.complements) {
          const head = W[c.head];
          if (!head || !head.roles.has('noun') || head.roles.has('adj')) continue;
          const r =
            head.reading && head.reading.readings && head.reading.readings.find((x) => x.entry);
          const adjRole = r && ctx.cls.nounToAdjective[r.role];
          const adj = adjRole && r.entry.forms[adjRole];
          out.push(
            C.diagnostic({
              ...C.at(ctx, W[v.i]),
              severity: 'note',
              rule: 'clause.copulas',
              message:
                '“' +
                W[v.i].text +
                ' … ' +
                head.text +
                '” is a temporary identity (' +
                sem.temporary +
                ' is the state or place now). Did you mean ' +
                sem.enduring +
                ', a lasting identity' +
                (adj ? ', or the state ' + adj.form + ' (“' + adj.gloss + '”)' : '') +
                '?',
              fix: sem.enduring,
              autoFix: false,
            }),
          );
        }
      }

      // gase opening a clause: comparison only (0.8:G8)
      if (clause.kind === 'gase') {
        out.push(
          C.diagnostic({
            ...C.at(ctx, W[0]),
            severity: 'warn',
            rule: '0.8:G8',
            message:
              '“' +
              W[0].text +
              '” compares (as ADJ as, like NP); it does not open a clause. For “as / while” use ' +
              sem.whileWord +
              '; for “when”, ' +
              sem.whenWord +
              '.',
            fix: sem.whileWord || undefined,
            autoFix: false,
          }),
        );
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
