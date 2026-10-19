/* Liraasa grammar checker: placing a clause in the slot template (Phase 2).
 *
 *   [FRAME] [TOPIC hozi] SUBJECT [TENSE] [noma] [ne] [MODAL] … [EVIDENTIAL]
 *   VERB [OBJECT] [ADJUNCTS] [fuyi] [hoyo|yasmo] [ATTITUDE] [ki]
 *
 * and each noun phrase in
 *
 *   [QUANT] [li|eli|ola|OWNER de] [NUMBER] [ADJ…] NOUN[-ti][-ri] [de …] [raho …]
 *
 * The parser walks left to right and records what it finds; it does not
 * judge. The rule files read the structure it returns:
 *   subject, vocatives, frames, topic, ops (with slot numbers), verbs, actor,
 *   objects, complements, adjuncts, finals, ne, chains, and the problems it
 *   met on the way: unplaced, nonVerbInSlot, secondNoun, ppInSubject,
 *   stranded, strayDe, nounPairs, secondVerbs.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  function placeClause(clause, classes) {
    const W = clause.words;
    const n = W.length;
    const has = (i, role) => i >= 0 && i < n && W[i].roles.has(role);
    const nounOnly = (i) =>
      has(i, 'noun') &&
      !has(i, 'verb') &&
      !has(i, 'adj') &&
      W[i].reading &&
      W[i].reading.kind === 'lexical' &&
      !has(i, 'time') &&
      !has(i, 'pronoun');
    const laterVerbal = (from) => W.slice(from).some((w) => C.verbal(w));

    const s = {
      clause,
      subject: null,
      vocatives: [],
      frames: [],
      topic: null,
      ops: [],
      verbs: [],
      actor: null,
      objects: [],
      complements: [],
      adjuncts: [],
      finals: [],
      ne: [],
      chains: [],
      command: false,
      unplaced: [],
      nonVerbInSlot: [],
      secondNoun: [],
      ppInSubject: null,
      stranded: [],
      strayDe: [],
      nounPairs: [],
      secondVerbs: [],
      predicateAdj: [],
    };

    /** A noun phrase from i: {start, end, head} or null. With single, a second
        bare noun starts the next phrase instead of pairing with this one. */
    function np(i, wantVerb, single) {
      let j = i;
      while (has(j, 'scope')) j += 1;
      if (W[j] && W[j].lower === 'diba' && has(j + 1, 'quantifier')) j += 1;
      if (has(j, 'quantifier')) j += 1;
      const lead = has(j, 'determiner') ? j : -1;
      if (lead >= 0) j += 1;
      while (has(j, 'num') || has(j, 'degree')) j += 1;
      const before = j;
      while (has(j, 'adj') && !has(j, 'noun')) j += 1;
      let head = -1;
      if (has(j, 'noun') && !(wantVerb && has(j, 'verb'))) {
        head = j;
        j += 1;
        // two bare nouns side by side (ADR-0011): keep reading, the rule reports it
        while (!single && nounOnly(head) && nounOnly(j) && !W[j - 1].comma) {
          s.nounPairs.push([j - 1, j]);
          head = j;
          j += 1;
        }
        if (W[j] && W[j].lower === 'sela') j += 1;
      } else if (lead >= 0 && j > before) {
        head = j - 1; // an adjective standing as a noun after an article (1.2:G29)
      } else if (lead >= 0 && j === before && j - 1 === lead) {
        head = lead; // eli, ola alone (0.8:G1)
      } else if (j > i && has(j - 1, 'num')) {
        head = j - 1;
      } else {
        return null;
      }
      const first = head;
      while (W[j] && W[j].lower === 'de' && !W[j - 1].comma) {
        const inner = np(j + 1, false);
        if (!inner) break;
        // OWNER de THING: a pronoun or name before de is the owner, so the thing
        // after de is the head (maivo de miru, my water); otherwise X de Y has X
        // as its head (li suma de maivo, the warmth of mine) (1.2:G27, 1.2:G32)
        if (
          head === first &&
          j === first + 1 &&
          (has(first, 'pronoun') || (W[first].reading && W[first].reading.kind === 'name'))
        ) {
          head = inner.head;
        }
        j = inner.end;
      }
      return { start: i, end: j, head };
    }

    let i = 0;
    if (clause.linker) i = 1;
    if (clause.kind === 'question') {
      const q = np(0, false);
      i = q ? q.end : 1;
    }
    let state = 'front';
    let lastRank = 0;
    let actorPending = false;
    let afterFinal = false;

    const placeVerb = (k, type) => {
      s.verbs.push({ i: k, type });
      if (type === 'valency') actorPending = true;
      state = 'post';
    };
    const slotOpen = (k) => {
      if (!s.verbs.length) return true;
      const last = s.verbs[s.verbs.length - 1];
      if (has(k - 1, 'chain')) return true; // sidu: a second verb sharing the subject
      if (last.type === 'gome' && last.i === k - 1) return true; // gome + verb
      if (last.type === 'valency' && s.actor && !s.verbs.some((v) => v.i > s.actor.end - 1))
        return true;
      return false;
    };
    const verbType = (k) =>
      has(k, 'copula')
        ? 'copula'
        : has(k, 'valency')
          ? 'valency'
          : has(k, 'gome')
            ? 'gome'
            : 'verb';

    while (i < n) {
      const w = W[i];
      const R = w.roles;
      // a person addressed may follow ki or an attitude word, set off by a comma (1.2:G31)
      if (afterFinal && W[i - 1] && W[i - 1].comma) afterFinal = false;
      if (
        afterFinal &&
        !R.has('question') &&
        !R.has('attitude') &&
        !R.has('status') &&
        !R.has('interjection')
      ) {
        s.finals.push({ i, kind: 'after-final' });
      }
      if (R.has('interjection')) {
        if (w.lower === 'fisa' && !s.subject && !s.verbs.length) s.command = true;
        i += 1;
        continue;
      }
      if (R.has('ne')) {
        s.ne.push(i);
        i += 1;
        continue;
      }
      if (R.has('scope') && !R.has('operator')) {
        i += 1;
        continue;
      }
      if (R.has('question') || R.has('attitude') || R.has('status') || R.has('reciprocal')) {
        const kind = R.has('question')
          ? 'ki'
          : R.has('attitude')
            ? 'attitude'
            : R.has('status')
              ? 'status'
              : 'reciprocal';
        // ki is last: a certainty or status word comes before it (0.8:R9)
        if (kind !== 'ki' && s.finals.some((f) => f.kind === 'ki'))
          s.finals.push({ i, kind: 'after-final' });
        s.finals.push({ i, kind });
        if (kind !== 'reciprocal') afterFinal = true;
        i += 1;
        continue;
      }
      if (R.has('frame')) {
        // a frame word away from the front is reported by the order rule (slot 1)
        if (state === 'front') s.frames.push(i);
        i += 1;
        continue;
      }
      if (R.has('operator')) {
        // a time word in an operator slot (fututi, bodu, reve, loki) opening the
        // clause before any subject frames it: fututi maivo lirala, soon I sing (1.0:G7)
        if (state === 'front' && !s.subject && !s.ops.length && R.has('time')) {
          s.frames.push(i);
          i += 1;
          continue;
        }
        const slot = classes.slotOf.get(w.lower);
        // after the verb: reve and loki may close the clause (slot 12), and so may a
        // time word in another operator slot (Taivo futu yugemeyiya fututi, 1.2:G24);
        // a tense word never does
        const closesAsTime =
          classes.mayClose.has(w.lower) || (R.has('time') && slot.name !== 'TENSE');
        if (s.verbs.length && closesAsTime) {
          s.adjuncts.push({ start: i, end: i + 1, kind: 'time' });
        } else if (s.verbs.length) {
          s.ops.push({ i, n: slot.n, name: slot.name, afterVerb: true });
        } else {
          s.ops.push({
            i,
            n: slot.n,
            name: slot.name,
            afterVerb: false,
            outOfOrder: slot.n < lastRank,
            sameSlot: slot.n === lastRank,
          });
          lastRank = Math.max(lastRank, slot.n);
          state = 'pre';
        }
        i += 1;
        continue;
      }
      if (state === 'front' && (R.has('time') || R.has('adverb'))) {
        // a time word or adverbial correlative opening the clause frames it (1.2:G24);
        // one that is also a noun is the subject when a verb or operator follows
        // at once (nullo ka benasan), and a noun before de (vesno de deyaapo)
        const next = W[i + 1];
        const subjectNoun =
          R.has('noun') &&
          next &&
          !w.comma &&
          (C.verbal(next) || next.roles.has('operator') || next.lower === 'de');
        if (!subjectNoun) {
          s.frames.push(i);
          i += 1;
          continue;
        }
      }
      if (R.has('chain')) {
        s.chains.push(i);
        i += 1;
        continue;
      }
      if (R.has('topic') && s.subject && !s.verbs.length) {
        s.topic = s.subject;
        s.subject = null;
        i += 1;
        continue;
      }
      // the verb slot
      if (C.verbal(w) && slotOpen(i)) {
        const ambiguous =
          R.has('noun') && !s.subject && !s.ops.length && state === 'front' && laterVerbal(i + 1);
        if (!ambiguous) {
          placeVerb(i, verbType(i));
          if (s.actor === null && actorPending && s.verbs.length > 1) actorPending = false;
          i += 1;
          continue;
        }
      } else if (C.verbal(w) && C.strictVerbal(w)) {
        s.secondVerbs.push(i);
        i += 1;
        continue;
      }
      if (R.has('comparison') && (has(i + 1, 'adj') || has(i + 1, 'num'))) {
        i += 1; // gase ADJ gase NP, as ADJ as NP; gase before a number (0.8:G8, 1.0:G9)
        continue;
      }
      if (
        R.has('preposition') &&
        (has(i + 1, 'adverb') || (has(i + 1, 'time') && !has(i + 1, 'operator')))
      ) {
        s.adjuncts.push({ start: i, end: i + 2, prep: i, kind: 'pp' }); // en eli-pago, kroti deya
        i += 2;
        continue;
      }
      if (R.has('preposition') || R.has('comparison')) {
        const obj = np(i + 1, false);
        if (!obj && R.has('noun') && s.verbs.length) {
          // a side noun after its verb with no noun phrase is an adverb (2.2:G67)
          s.adjuncts.push({ start: i, end: i + 1, prep: i, head: i, kind: 'adverb' });
          i += 1;
          continue;
        }
        if (!obj) {
          s.stranded.push(i);
          i += 1;
          continue;
        }
        const pp = { start: i, end: obj.end, prep: i, head: obj.head, kind: 'pp' };
        if (
          state === 'front' &&
          s.subject &&
          !s.verbs.length &&
          !s.ops.length &&
          laterVerbal(obj.end) &&
          R.has('preposition')
        ) {
          s.ppInSubject = pp;
        }
        s.adjuncts.push(pp);
        i = obj.end;
        continue;
      }
      if (R.has('adjunct marker')) {
        if (has(i + 1, 'adj') || has(i + 1, 'noun')) {
          s.adjuncts.push({ start: i, end: i + 2, kind: 'la' });
          i += 2;
        } else {
          s.stranded.push(i);
          i += 1;
        }
        continue;
      }
      if (R.has('owner')) {
        s.strayDe.push(i);
        i += 1;
        continue;
      }
      const ownerFollows = W[i + 1] && W[i + 1].lower === 'de';
      if ((R.has('time') || R.has('adverb')) && !(R.has('noun') && ownerFollows)) {
        s.adjuncts.push({ start: i, end: i + 1, kind: 'time' });
        i += 1;
        continue;
      }
      // a noun phrase
      const wantVerb =
        !s.verbs.length &&
        (s.command || s.ops.length > 0 || (s.subject !== null && !laterVerbal(i)));
      // right after a give-type verb two bare nouns are recipient and theme
      // (1.2:G26), not one noun modifying another
      const lastVerb = s.verbs[s.verbs.length - 1];
      const giveFirst =
        lastVerb !== undefined &&
        classes.giveType.has(W[lastVerb.i].lower) &&
        !s.objects.some((o) => o.verb === lastVerb.i);
      const e = np(i, wantVerb && !C.strictVerbal(w), giveFirst);
      if (e) {
        if (!s.verbs.length) {
          if (state === 'front' && !s.subject && !s.command) {
            const endWord = W[e.end - 1];
            if (endWord.comma && e.end < n && (laterVerbal(e.end) || np(e.end, false))) {
              s.vocatives.push(e); // a person addressed, set off by a comma (1.2:G31)
            } else if (W[e.end] && W[e.end].roles.has('topic')) {
              s.topic = e;
              i = e.end + 1;
              continue;
            } else {
              s.subject = e;
            }
          } else if (s.command || s.ops.length) {
            s.nonVerbInSlot.push({ i: e.head, np: e });
            s.verbs.push({ i: e.head, type: 'nonverb' });
            state = 'post';
          } else if (!laterVerbal(e.end)) {
            s.secondNoun.push({ np: e });
            s.verbs.push({ i: e.head, type: 'nonverb' });
            state = 'post';
          } else {
            s.unplaced.push({ i, expected: 'the VERB' });
          }
        } else {
          const last = s.verbs[s.verbs.length - 1];
          const setOff = W[e.start - 1] && W[e.start - 1].comma && e.end === n;
          let b = e.start - 1;
          while (b >= 0 && (W[b].roles.has('ne') || W[b].roles.has('scope'))) b -= 1;
          const afterComma = b >= 0 && b < e.start - 1 && W[b].comma; // eli, ne ola: a contrast (0.8:G2)
          const timeHead = has(e.head, 'time');
          if (setOff && !afterComma) s.vocatives.push(e);
          else if (afterComma) s.adjuncts.push({ ...e, kind: 'contrast' });
          else if (timeHead)
            s.adjuncts.push({ ...e, kind: 'time' }); // tressa montari, for three months
          else if (last.type === 'valency' && !s.actor) s.actor = e;
          else if (last.type === 'copula') s.complements.push(e);
          else s.objects.push({ ...e, verb: last.i });
        }
        i = e.end;
        continue;
      }
      if (R.has('adj')) {
        const last = s.verbs[s.verbs.length - 1];
        if (
          (last && last.type === 'copula') ||
          !W.some((x) => C.verbal(x)) ||
          (last && last.type === 'nonverb')
        ) {
          s.predicateAdj.push(i);
          i += 1;
          while (has(i, 'adj') || has(i, 'degree')) i += 1;
          continue;
        }
      }
      if (R.has('degree') && has(i + 1, 'adj')) {
        i += 1;
        continue;
      }
      if (R.has('hortative')) {
        s.command = true;
        i += 1;
        continue;
      }
      s.unplaced.push({
        i,
        expected: s.verbs.length
          ? 'the OBJECT or an adjunct'
          : s.subject
            ? 'the VERB'
            : 'the SUBJECT',
      });
      i += 1;
    }
    if (!s.subject && s.verbs.length && !clause.linker) s.command = true;
    return s;
  }

  C.placeClause = placeClause;
})(typeof window !== 'undefined' ? window : globalThis);
