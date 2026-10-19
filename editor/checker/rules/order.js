/* Liraasa grammar checker: order within the clause (Phase 2).
 *
 *   operator after the verb, or out of slot order     error  1.0:G1
 *   two words for one slot; excluded pairs            error  1.0:G16
 *   more preverbal operators than recommended         note   1.0:G16
 *   ki not last; attitude word not clause-final       error  1.0:G22
 *   zafra/finra/lanto/kenvi not opening its clause    error  slot 1
 *   … or without its comma                            warn   slot 1
 *   a time word opening a clause with no comma        note   1.2:G24
 *   a question with the copula or tense in front      error  ki
 *   a yes/no question, or a degree question, with no
 *     final ki                                        error  2.2:G60, G61
 *   a ! clause with a ki-word that cannot exclaim     warn   2.2:G61
 *   raho opening a direct question                    error  2.2:G64
 *   fime followed by a copula or tense                error  fime
 *   sidu between non-verbs (an adjective may take it,
 *     2.2:G65), after or before a copula              error  sidu
 *   a relative clause not closed by a comma           note   1.0:G21
 *   ata opening a line with a clause                  unsettled 1.2:G25
 *   a token that fits no slot; a second verb          error  slot
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});
  C.rules = C.rules || {};

  C.rules.order = function order(ctx) {
    const out = [];
    for (const { clause, s } of ctx.parsed) {
      const W = clause.words;
      const at = (i) => C.at(ctx, W[i]);
      const word = (i) => W[i].text;

      const realVerb = s.verbs.some((v) => v.type !== 'nonverb');
      for (const op of s.ops) {
        if (op.afterVerb && !realVerb) continue; // reported by verbslot: no verb at all
        if (op.afterVerb) {
          out.push(
            C.diagnostic({
              ...at(op.i),
              severity: 'error',
              rule: '1.0:G1',
              message:
                '“' +
                word(op.i) +
                '” (' +
                op.name +
                ', slot ' +
                op.n +
                ') belongs before the verb, not after it.',
            }),
          );
        } else if (op.sameSlot) {
          out.push(
            C.diagnostic({
              ...at(op.i),
              severity: 'error',
              rule: '1.0:G16',
              message: 'Two ' + op.name + ' words in one clause: one word per slot.',
            }),
          );
        } else if (op.outOfOrder) {
          const prev = s.ops
            .filter((o) => o.i < op.i && o.n > op.n)
            .map((o) => '“' + word(o.i) + '” (' + o.name + ', ' + o.n + ')');
          out.push(
            C.diagnostic({
              ...at(op.i),
              severity: 'error',
              rule: '1.0:G1',
              message:
                '“' +
                word(op.i) +
                '” (' +
                op.name +
                ', slot ' +
                op.n +
                ') comes after ' +
                prev.join(', ') +
                ' but belongs before it in the template.',
            }),
          );
        }
      }
      const present = new Map(s.ops.map((o) => [W[o.i].lower, o.i]));
      for (const f of s.finals) present.set(W[f.i].lower, f.i);
      for (const a of s.frames) present.set(W[a].lower, a);
      for (const [x, y] of ctx.cls.exclusions) {
        if (present.has(x) && present.has(y)) {
          out.push(
            C.diagnostic({
              ...at(present.get(y)),
              severity: 'error',
              rule: '1.0:G16',
              message: '“' + x + '” and “' + y + '” exclude each other in one clause.',
            }),
          );
        }
      }
      const pre = s.ops.filter((o) => !o.afterVerb).length;
      const max = ctx.ref.clause.stacking.max_preverbal_operators_recommended;
      if (pre > max) {
        out.push(
          C.diagnostic({
            ...at(s.ops[0].i),
            severity: 'note',
            rule: '1.0:G16',
            message: pre + ' operators before the verb; at most ' + max + ' are recommended.',
          }),
        );
      }

      // finals: ki last; attitude words close the clause (0.8:R9: certainty before ki)
      const reported = new Set();
      for (const f of s.finals) {
        if (f.kind !== 'after-final' || reported.size) continue;
        const closer = s.finals
          .filter((g) => g.kind !== 'after-final' && g.kind !== 'reciprocal' && g.i < f.i)
          .pop();
        if (!closer) continue;
        reported.add(closer.i);
        const what =
          closer.kind === 'ki'
            ? 'ki is the last word of its clause'
            : '“' +
              word(closer.i) +
              '” (' +
              closer.kind +
              ') closes its clause; only ki may follow it';
        out.push(
          C.diagnostic({
            ...at(closer.i),
            severity: 'error',
            rule: '1.0:G22',
            message: what + ', but “' + word(f.i) + '” comes after it.',
          }),
        );
      }

      // frame words: clause-initial, with a comma
      const firstContent = W.findIndex(
        (w, k) =>
          k >= (clause.linker ? 1 : 0) &&
          !w.roles.has('scope') &&
          !w.roles.has('ne') &&
          !w.roles.has('interjection'),
      );
      for (let k = 0; k < W.length; k += 1) {
        if (!ctx.cls.frameWords.has(W[k].lower)) continue;
        if (k !== firstContent) {
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'error',
              rule: 'slot 1',
              message:
                '“' + word(k) + '” is a frame word: it opens its clause, followed by a comma.',
            }),
          );
        } else if (!W[k].comma && W.length > k + 1) {
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'warn',
              rule: 'slot 1',
              message: '“' + word(k) + '” frames the clause and is followed by a comma.',
              fix: word(k) + ',',
              autoFix: true,
            }),
          );
        }
      }
      for (const k of s.frames) {
        if (
          ctx.cls.frameWords.has(W[k].lower) ||
          W[k].comma ||
          k !== firstContent ||
          W.length === k + 1
        )
          continue;
        out.push(
          C.diagnostic({
            ...at(k),
            severity: 'note',
            rule: '1.2:G24',
            message:
              '“' +
              word(k) +
              '” opens the clause; a comma after it is optional and marks the pause.',
          }),
        );
      }

      // fime opens a content clause, whose subject comes next
      if (
        clause.linker &&
        clause.linker.lower === 'fime' &&
        W[1] &&
        (W[1].roles.has('copula') ||
          (W[1].roles.has('operator') && ctx.cls.slotOf.get(W[1].lower).name === 'TENSE'))
      ) {
        out.push(
          C.diagnostic({
            ...at(0),
            severity: 'error',
            rule: 'fime',
            message:
              'fime opens a clause (“that you sing”), so a subject follows it, not “' +
              word(1) +
              '”. The demonstrative “that” is ola.',
          }),
        );
      }

      // sidu joins two verbs that share a subject
      for (const k of s.chains) {
        const lineStart = ctx.words.indexOf(W[k]) === 0;
        if (lineStart) continue; // clause-initial sidu nominalises (0.8:G6)
        const before = W[k - 1] || { roles: new Set() };
        if (before.roles.has('copula')) {
          // ke sidu VERB, "destined to", is an open question (album 08), not grammar
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'error',
              rule: 'sidu',
              message:
                'sidu never follows a copula: “' +
                word(k - 1) +
                ' sidu” is not grammar (whether it can mean “destined to” is an open question). Use a modal (musi) or an adjective + sidu (2.2:G65).',
            }),
          );
        } else if (!C.verbal(before) && !before.roles.has('adj')) {
          // an adjective may take sidu + verb, "easy to …, ready to …" (2.2:G65)
          const prevVerb = W[k - 1] ? C.verbFormOf(ctx.ix, W[k - 1]) : null;
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'error',
              rule: 'sidu',
              message:
                'sidu joins two verbs, or an adjective and a verb (2.2:G65); “' +
                (W[k - 1] ? word(k - 1) : '') +
                '” before it is neither' +
                (prevVerb ? '; its verb is ' + prevVerb.form : '') +
                '.',
              fix: undefined,
            }),
          );
        }
        const next = W[k + 1];
        if (next && next.roles.has('copula')) {
          out.push(
            C.diagnostic({
              ...at(k + 1),
              severity: 'error',
              rule: 'sidu',
              message:
                'sidu takes a lexical verb, not the copula “' +
                next.text +
                '” (hope to become = kopi loya).',
            }),
          );
        } else if (next && !C.verbal(next)) {
          out.push(
            C.diagnostic({
              ...at(k + 1),
              severity: 'error',
              rule: 'sidu',
              message: 'sidu joins two verbs; “' + next.text + '” after it is not a verb form.',
            }),
          );
        }
      }

      if (clause.kind === 'relative' && clause.missingComma) {
        const last = W[W.length - 1];
        out.push(
          C.diagnostic({
            ...C.at(ctx, last),
            severity: 'note',
            rule: '1.0:G21',
            message:
              'The raho clause does not end the sentence, so a comma closes it; without the pause the main verb reads inside it.',
            fix: last.text + ',',
            autoFix: true,
          }),
        );
      }

      if (W[0] === ctx.words[0] && W[0].lower === 'ata' && s.verbs.length) {
        out.push(
          C.diagnostic({
            ...at(0),
            severity: 'unsettled',
            rule: '1.2:G25',
            message:
              'ata opens the line. 1.2:G25 lets oro open a clause that continues the line before; no ruling says whether ata may (1.0:G13: ata is “and” only). Canon has line-initial ata only in “Ata X ki?”, “what about X?”.',
          }),
        );
      }

      for (const u of s.unplaced) {
        out.push(
          C.diagnostic({
            ...at(u.i),
            severity: 'error',
            rule: 'slot',
            message:
              '“' +
              word(u.i) +
              '” cannot be placed in the clause template: expected ' +
              u.expected +
              '.',
          }),
        );
      }
      for (const k of s.secondVerbs) {
        out.push(
          C.diagnostic({
            ...at(k),
            severity: 'error',
            rule: 'slot',
            message:
              '“' +
              word(k) +
              '” is a second verb in one clause; open its clause with a linker (ata, fime, raho, kopisa…), or join the two verbs with sidu.',
          }),
        );
      }

      // a saying verb with su reads as "on", not "about" (1.2:G30)
      for (const v of s.verbs) {
        if (ctx.cls.sayType.has(W[v.i].lower) && W[v.i + 1] && W[v.i + 1].lower === 'su') {
          out.push(
            C.diagnostic({
              ...at(v.i + 1),
              severity: 'warn',
              rule: '1.2:G30',
              message:
                'Liraasa has no “about”: “' +
                word(v.i) +
                ' su” reads as speaking on top of something. Give the verb an object with a de phrase (lirari de amor).',
            }),
          );
        }
      }
    }
    // a question keeps statement order: ki closes the line, so the first clause
    // must not open with the copula or a tense (… raho … ki? still counts)
    const last = ctx.words[ctx.words.length - 1];
    const firstClause = ctx.parsed[0];
    // (a clause opened by a ki-word may front it: 2.2:G60)
    if (
      last &&
      last.roles.has('question') &&
      firstClause &&
      firstClause.clause.kind !== 'question'
    ) {
      const W = firstClause.clause.words;
      const k = firstClause.clause.linker ? 1 : 0;
      const w = W[k];
      if (
        w &&
        (w.roles.has('copula') ||
          (w.roles.has('operator') && ctx.cls.slotOf.get(w.lower).name === 'TENSE'))
      ) {
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'error',
            rule: 'ki',
            message:
              'A question keeps statement order and ends with ki; “' +
              w.text +
              '” is not moved to the front.',
          }),
        );
      }
    }
    out.push(...questionsInPlace(ctx));
    return out;
  };

  /** The sentences of a line: its words, split after . ! ?, with the mark that ends each. */
  function sentences(ctx) {
    const out = [];
    let cur = [];
    for (const w of ctx.words) {
      cur.push(w);
      let end = null;
      for (let k = w.k + 1; k < ctx.tokens.length && ctx.tokens[k].type === 'punct'; k += 1) {
        if (/[.!?]/.test(ctx.tokens[k].text)) {
          end = ctx.tokens[k];
          break;
        }
      }
      if (end) {
        out.push({ words: cur, end });
        cur = [];
      }
    }
    if (cur.length) out.push({ words: cur, end: null });
    return out;
  }

  /** A ki- question word (ki-oro, "whether", is a linker, not one). */
  const kiWord = (w) => /^ki-/.test(w.lower) && !w.roles.has('subordinator');

  /** Does a ki-word open an exclamative: ki-modo + adjective, ki-eli / ki-muya + noun (2.2:G61)? */
  function exclamative(words, j) {
    const w = words[j];
    const next = words[j + 1];
    if (!next) return false;
    if (w.lower === 'ki-modo') return next.roles.has('adj');
    if (w.lower === 'ki-eli' || w.lower === 'ki-muya') return next.roles.has('noun');
    return false;
  }

  /**
   * Questions and exclamations (2.2:G60, G61, G64; they supersede 2.1:G46,
   * G47). A ki-word may open the clause or stay where its answer would stand.
   * A yes/no question ends in ki; a question with a ki-word may end in ki or
   * not, except a degree question (ki-modo + adjective), which must. Only
   * ki-modo + adjective, ki-eli + noun and ki-muya + noun make an
   * exclamation, and only without a final ki. raho is never a question word.
   * An embedded question (a ki-word after the main verb) is left alone.
   */
  function questionsInPlace(ctx) {
    const out = [];
    for (const sent of sentences(ctx)) {
      if (!sent.end || (sent.end.text !== '?' && sent.end.text !== '!')) continue;
      const words = sent.words;
      const first = words[0];
      const last = words[words.length - 1];
      // ki closes its clause, which may be followed by a person addressed (1.2:G31)
      const endsKi = words.some((w) => w.roles.has('question'));
      const verbs = ctx.parsed.some(
        (p) => words.includes(p.clause.words[0]) && p.s.verbs.length > 0,
      );
      // the ki-words of the main clause: a ki-word that opens a clause of its own
      // after a lexical verb is an embedded question (Maivo ne sabesia ki-pago …)
      const lexicalVerbBefore = (j) =>
        words.slice(0, j).some((x) => C.verbal(x) && !x.roles.has('copula'));
      const embedded = (j) => {
        const p = ctx.parsed.find((x) => x.clause.words[0] === words[j]);
        return j > 0 && p !== undefined && p.s.verbs.length > 0 && lexicalVerbBefore(j);
      };
      const mainKis = words.map((_, j) => j).filter((j) => kiWord(words[j]) && !embedded(j));
      const addKi = (rule, message) =>
        C.diagnostic({
          ...C.at(ctx, last),
          severity: 'error',
          rule,
          message,
          fix: last.text + ' ki',
          autoFix: true,
        });

      if (sent.end.text === '?') {
        if (first.lower === 'raho') {
          out.push(
            C.diagnostic({
              ...C.at(ctx, first),
              severity: 'error',
              rule: '2.2:G64',
              message:
                'raho is never a question word: it opens a relative clause, or stands for “the one who, that which”. Ask with ki-nela (who) or ki-coda (what).',
              fix: /^R/.test(first.text) ? 'Ki-nela' : 'ki-nela',
            }),
          );
          continue;
        }
        if (endsKi) continue;
        if (mainKis.some((j) => words[j].lower === 'ki-modo' && exclamative(words, j))) {
          out.push(
            addKi(
              '2.2:G61',
              'A degree question (ki-modo + adjective) must end in ki: “' +
                last.text +
                ' ki?”. Without ki it is an exclamation, ending in !.',
            ),
          );
        } else if (mainKis.length === 0 && verbs) {
          out.push(addKi('2.2:G60', 'A yes/no question must end in ki: “' + last.text + ' ki?”.'));
        }
        continue;
      }
      // "!": a ki-word clause without a final ki is an exclamation only in the three shapes
      if (endsKi || mainKis.length === 0) continue;
      if (mainKis.some((j) => exclamative(words, j))) continue;
      const j = mainKis[0];
      out.push(
        C.diagnostic({
          ...C.at(ctx, words[j]),
          severity: 'warn',
          rule: '2.2:G61',
          message:
            'Only ki-modo + adjective, ki-eli + noun and ki-muya + noun make an exclamation; a clause with “' +
            words[j].text.toLowerCase() +
            '” and no final ki is a question: end it with ?.',
        }),
      );
    }
    return out;
  }
})(typeof window !== 'undefined' ? window : globalThis);
