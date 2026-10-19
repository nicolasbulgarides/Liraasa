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
 *   a direct question with no final ki, or a fronted
 *     question word that is not of time or the subject error 2.1:G46
 *   fime followed by a copula or tense                error  fime
 *   sidu between non-verbs, or before a copula        error  sidu
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
        if (!C.verbal(W[k - 1] || { roles: new Set() })) {
          const prevVerb = W[k - 1] ? C.verbFormOf(ctx.ix, W[k - 1]) : null;
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'error',
              rule: 'sidu',
              message:
                'sidu joins two verbs; “' +
                (W[k - 1] ? word(k - 1) : '') +
                '” before it is not a verb form' +
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
    // (a clause opened by a ki-word is 2.1:G46's, below)
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

  /**
   * 2.1:G46: a question word stands where its answer would stand, and every
   * direct question ends in ki. A ki-word of time may open the clause as a
   * frame; a ki-word that is the subject is already in place. A clause with a
   * ki-word and no final ki that ends in ! is an exclamation (2.1:G47), and
   * an embedded question keeps no ki, so only sentences ending in ? are read.
   */
  function questionsInPlace(ctx) {
    const out = [];
    for (const sent of sentences(ctx)) {
      if (!sent.end || sent.end.text !== '?') continue;
      const first = sent.words[0];
      const last = sent.words[sent.words.length - 1];
      const hasKi = sent.words.some((w) => w.roles.has('question'));
      const main = ctx.parsed.find((p) => p.clause.words[0] === first);
      const verbs = ctx.parsed.some(
        (p) => sent.words.includes(p.clause.words[0]) && p.s.verbs.length > 0,
      );
      // a fronted question word: not of time, not the subject, not a linker (ki-oro)
      const R = first.roles;
      const fronted =
        main &&
        main.clause.kind === 'question' &&
        !R.has('time') &&
        !R.has('subordinator') &&
        (R.has('adverb') || main.s.subject !== null);
      if (fronted) {
        out.push(
          C.diagnostic({
            ...C.at(ctx, first),
            severity: 'error',
            rule: '2.1:G46',
            message:
              'A question word stands where its answer would stand, and the question ends in ki: say it in statement order with “' +
              first.text.toLowerCase() +
              '” in the answer’s place (Taivo pagopa ki-pago ki?, where are you going?). Only a ki-word of time may open the clause.',
          }),
        );
      } else if (!hasKi && verbs) {
        out.push(
          C.diagnostic({
            ...C.at(ctx, last),
            severity: 'error',
            rule: '2.1:G46',
            message:
              'Every direct question ends in ki: “' +
              last.text +
              ' ki?”. A ki-word with no final ki makes an exclamation, ending in ! (2.1:G47).',
            fix: last.text + ' ki',
            autoFix: true,
          }),
        );
      }
    }
    return out;
  }
})(typeof window !== 'undefined' ? window : globalThis);
