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
 *   a question opened by raho with no final ki        error  2.3:G74
 *   a ki-eli / ki-muya + noun question with no ki     error  2.3:G76
 *   fime followed by a copula or tense                error  fime
 *   sidu between non-verbs (an adjective may take it,
 *     2.2:G65), after or before a copula              error  sidu
 *   a relative clause not closed by a comma           note   1.0:G21 (the album omits it)
 *   ne before the tense; a scope word with nothing after it   error 1.0:G1
 *   two hozi topics                                   error  1.0:G16
 *   noma with no tense, modal or si in its line       note   1.0:G16
 *   vinto on the hozi topic                           error  1.0:G18
 *   an attitude word opening a clause                 error  1.0:G22
 *   an untensed sige clause                           warn   0.8:R6
 *   ata between a subject and its verb ("also")       error  1.0:G13
 *   a noun phrase out of order; a bare adjective noun error  0.8:G7, 1.2:G29
 *   ki closing a statement (an embedded question)     error  2.2:G60
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
        } else if (op.sameSlot && realVerb) {
          // with no verb the words are named, not used: a list (album: Yehu, gesu, bisu, vuda —)
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

      const tenseOps = s.ops.filter((o) => o.name === 'TENSE');
      const hasOp = (name) => s.ops.some((o) => o.name === name);

      // ne follows the tense: po ne lirala, never ne po lirala (0.8:G2; slot 6 after slot 4)
      for (const k of s.ne) {
        const t = tenseOps.find((o) => o.i > k);
        if (t && !s.verbs.some((v) => v.i < t.i && v.type !== 'nonverb'))
          out.push(
            C.diagnostic({
              ...at(k),
              severity: 'error',
              rule: '1.0:G1',
              message:
                'ne follows the tense (slot 6 after slot 4): “' +
                word(t.i) +
                ' ne …”, never “ne ' +
                word(t.i) +
                '” (0.8:G2).',
            }),
          );
      }

      // one topic per clause (slot 2); hozi and vinto never mark the same constituent (1.0:G18)
      const topics = W.map((w, k) => (w.roles.has('topic') ? k : -1)).filter((k) => k >= 0);
      if (topics.length > 1)
        out.push(
          C.diagnostic({
            ...at(topics[1]),
            severity: 'error',
            rule: '1.0:G16',
            message:
              'Two hozi topics in one clause: a clause has at most one (slot 2), except paired contrastive topics in parallel clauses.',
          }),
        );
      for (const k of topics) {
        const v = W.findIndex((w) => w.lower === 'vinto');
        if (v >= 0 && v < k && !W.slice(v + 1, k).some((w) => w.comma || C.verbal(w)))
          out.push(
            C.diagnostic({
              ...at(v),
              severity: 'error',
              rule: '1.0:G18',
              message:
                'vinto and hozi never mark the same constituent: the topic opens the clause, and vinto may then mark a focus inside it.',
            }),
          );
      }

      // noma needs a tense, a modal or a si clause (1.0:G16)
      const noma = s.ops.find((o) => o.name === 'REALITY');
      if (
        noma &&
        !tenseOps.length &&
        !hasOp('MODAL') &&
        !(clause.linker && clause.linker.lower === 'si')
      )
        out.push(
          C.diagnostic({
            ...at(noma.i),
            severity: 'note',
            rule: '1.0:G16',
            message:
              'noma needs a tense, a modal or a si clause for its context: po noma suvi lirala, si … po noma …. If the context is in an earlier line, this is fine.',
          }),
        );

      // a sige clause never inherits its tense: it is always marked (0.8:R6)
      if (clause.linker && clause.linker.lower === 'sige' && realVerb && !tenseOps.length)
        out.push(
          C.diagnostic({
            ...at(0),
            severity: 'warn',
            rule: '0.8:R6',
            message:
              'A sige clause never inherits the tense of its main clause: mark it (sige maivo po venreva …).',
          }),
        );

      // a scope word scopes over what follows it, and here nothing does (1.0:G1)
      const lastW = W[W.length - 1];
      const after = lastW ? ctx.words[ctx.words.indexOf(lastW) + 1] : undefined;
      if (
        lastW &&
        lastW.roles.has('scope') &&
        !lastW.roles.has('ne') &&
        W.length > 1 &&
        !(after && (after.roles.has('subordinator') || after.roles.has('coordinator')))
      )
        out.push(
          C.diagnostic({
            ...at(W.length - 1),
            severity: 'error',
            rule: '1.0:G1',
            message:
              '“' +
              lastW.text +
              '” scopes over the constituent right after it, and nothing follows it here: put it before what it marks.',
          }),
        );

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
      // an attitude word never opens a clause, comma or not ('Perhaps, …' is a closing poye: 1.0:G22)
      const opener = W[firstContent];
      if (
        opener &&
        opener.roles.has('attitude') &&
        W.slice(firstContent + 1).some((w) => !w.roles.has('attitude')) &&
        !reported.has(firstContent)
      )
        out.push(
          C.diagnostic({
            ...at(firstContent),
            severity: 'error',
            rule: '1.0:G22',
            message:
              '“' +
              opener.text +
              '” never opens a clause: an attitude word closes it (“… ' +
              opener.text.toLowerCase() +
              '”).',
          }),
        );
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

      for (const u of s.unplaced) {
        const w = W[u.i];
        const prev = W[u.i - 1];
        const numeral = Boolean(w.reading && w.reading.kind === 'numeral');
        // a noun phrase out of order (0.8:G7), or an adjective with no article (1.2:G29)
        const np =
          prev && prev.roles.has('noun') && (w.roles.has('adj') || numeral)
            ? 'a' +
              (numeral ? ' number' : 'n adjective') +
              ' comes before its noun: “' +
              word(u.i) +
              ' ' +
              prev.text +
              '”'
            : prev && prev.roles.has('determiner') && w.roles.has('quantifier')
              ? 'a quantifier comes before the article: “' + word(u.i) + ' ' + prev.text + '”'
              : null;
        const bareAdj = u.i === 0 && w.roles.has('adj') && !w.roles.has('noun');
        out.push(
          C.diagnostic({
            ...at(u.i),
            severity: 'error',
            rule: np ? '0.8:G7' : bareAdj ? '1.2:G29' : 'slot',
            message: np
              ? 'Noun-phrase order: ' + np + ' (0.8:G7).'
              : bareAdj
                ? 'An adjective stands as a noun only after an article or determiner: “li ' +
                  word(u.i).toLowerCase() +
                  '” (1.2:G29, 2.3:G82).'
                : '“' +
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
        // only directly after the verb: the album writes VERB OBJECT su NP (2.2:G68)
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
      // existential miyo has no subject: it opens its clause, question or not
      if (
        w &&
        w.lower !== 'miyo' &&
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
    // ata between a subject and its verb is not "also": that is tu (1.0:G13)
    ctx.words.forEach((w, k) => {
      const prev = ctx.words[k - 1];
      const next = ctx.words[k + 1];
      if (
        w.lower === 'ata' &&
        prev &&
        next &&
        (prev.roles.has('pronoun') || prev.roles.has('noun')) &&
        !C.verbal(prev) &&
        (C.verbal(next) || next.roles.has('operator') || next.roles.has('ne')) &&
        !ctx.words.slice(0, k).some((x) => C.verbal(x))
      )
        out.push(
          C.diagnostic({
            ...C.at(ctx, w),
            severity: 'error',
            rule: '1.0:G13',
            message:
              'ata is “and” only, joining equals; “also” is tu, before what it marks: “tu ' +
              prev.text.toLowerCase() +
              ' …”.',
          }),
        );
    });
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
   * exclamation, and only without a final ki. raho may open a question that
   * ends in ki (2.3:G74); a ki-eli / ki-muya + noun question ends in ki (2.3:G76).
   * An embedded question (a ki-word after the main verb) is left alone.
   */
  function questionsInPlace(ctx) {
    const out = [];
    for (const sent of sentences(ctx)) {
      // ki ends a direct question; a statement, or a question embedded in one, takes none (2.2:G60)
      const lastWord = sent.words[sent.words.length - 1];
      if (sent.end && sent.end.text === '.' && lastWord && lastWord.lower === 'ki')
        out.push(
          C.diagnostic({
            ...C.at(ctx, lastWord),
            severity: 'error',
            rule: '2.2:G60',
            message:
              'ki ends a direct question, and this sentence is a statement: an embedded question never ends in ki. Drop ki, or end with ?.',
          }),
        );
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
        // raho may open a direct question, which then ends in ki (2.3:G74, the album)
        if (first.lower === 'raho') {
          if (!endsKi)
            out.push(
              addKi(
                '2.3:G74',
                'A question opened by raho ends in ki: “' +
                  last.text +
                  ' ki?”. (ki-nela and ki-coda are the ordinary question words.)',
              ),
            );
          continue;
        }
        if (endsKi) continue;
        // ki-eli / ki-muya + noun without ki is an exclamation: the question ends in ki (2.3:G76)
        if (
          mainKis.some(
            (j) => ['ki-eli', 'ki-muya'].includes(words[j].lower) && exclamative(words, j),
          )
        ) {
          out.push(
            addKi(
              '2.3:G76',
              'A question with ki-eli or ki-muya + noun ends in ki: “' +
                last.text +
                ' ki?”. Without ki it is an exclamation, ending in !.',
            ),
          );
          continue;
        }
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
