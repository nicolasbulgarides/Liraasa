/* Liraasa grammar checker: splitting a line into clauses (Phase 2).
 *
 * A new clause starts at
 *   - a linker (a coordinator or subordinator in the overlay: ata, nara, oro,
 *     kasa, fime, raho, kube, nayo, tuni, sige, kureli, si, sina, kopisa, nevi …);
 *   - a ki- question word with more of the clause after it;
 *   - a comma after a clause that already has its verb, when what follows has
 *     a verb of its own (asyndetic clauses: Kube taivo venreva, maivo lirala);
 *   - gase followed by a subject and a verb (gase is comparison only: the
 *     semantic rules report it);
 *   - sentence punctuation (. ! ? ; : —), which also closes every open clause.
 * A comma before material with no verb leaves the clause open: it sets off a
 * person addressed or a closing time word (1.2:G31, 1.2:G24).
 *
 * raho embeds. When the clause around it has a subject but no verb yet, the
 * relative clause interrupts it, and the outer clause resumes after the
 * relative closes: at a comma (1.0:G21), or, with no comma, at the next verb
 * (Li nela raho lirala ka benasan), which the rules note.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  const STOP = /[.!?;:—]/;

  /** The words of a line with their roles and the punctuation after each. */
  function wordsOf(tokens, classes) {
    const words = [];
    tokens.forEach((t, k) => {
      if (t.type !== 'word') return;
      const next = tokens[k + 1];
      words.push({
        ...t,
        k,
        roles: classes.roles(t),
        comma: Boolean(next && next.type === 'punct' && next.text === ','),
        // speech cut off (Maivo po ne povi—): its verb is elided, not missing
        cut: Boolean(next && next.type === 'punct' && /[—…]/.test(next.text)),
        stop: Boolean(next && next.type === 'punct' && STOP.test(next.text)),
      });
    });
    return words;
  }

  const verbal = (w) =>
    w.roles.has('verb') || w.roles.has('copula') || w.roles.has('valency') || w.roles.has('gome');
  const strictVerbal = (w) => verbal(w) && !w.roles.has('noun') && !w.roles.has('adj');
  const nounish = (w) => w.roles.has('noun') || w.roles.has('pronoun');

  function split(words) {
    const clauses = [];
    const stack = [];
    let cur = open('main', null);

    function open(kind, linker, parent) {
      return {
        kind,
        linker,
        words: [],
        parent: parent || null,
        resumed: false,
        missingComma: false,
      };
    }
    function close(c) {
      if (c.words.length) clauses.push(c);
    }
    function closeAll() {
      close(cur);
      while (stack.length) close(stack.pop());
      cur = open('main', null);
    }
    const hasVerb = (c) => c.words.some(strictVerbal) || c.words.some(verbal);
    const verbAhead = (i) => {
      for (let j = i; j < words.length; j += 1) {
        if (verbal(words[j])) return true;
        if (words[j].comma || words[j].stop) return false;
      }
      return false;
    };

    words.forEach((w, i) => {
      const prev = words[i - 1];
      const R = w.roles;
      if (!cur.words.length) {
        // what opens a clause decides its kind: a linker, a fronted ki- question
        // word, or sidu nominalising a verb phrase (0.8:G6)
        if (R.has('coordinator') || R.has('subordinator')) {
          cur.kind = R.has('subordinator') ? 'subordinate' : 'coordinate';
          cur.linker = w;
        } else if (/^ki-/.test(w.lower)) {
          cur.kind = 'question';
          cur.linker = w;
        } else if (R.has('chain')) {
          cur.kind = 'nominal';
          cur.linker = w;
        } else if (w.lower === 'gase' && clauseFollows(words, i + 1)) {
          // gase opening a line with a subject and a verb: reported as comparison only (0.8:G8)
          cur.kind = 'gase';
          cur.linker = w;
        }
        cur.lineInitial = i === 0 || Boolean(prev && prev.stop);
      } else {
        const isLinker = R.has('coordinator') || R.has('subordinator');
        const restAfter = words.slice(i + 1).filter((x) => !x.roles.has('question'));
        if (isLinker) {
          if (w.lower === 'raho' && !hasVerb(cur) && cur.words.some(nounish)) {
            stack.push(cur);
            cur = open('relative', w, stack[stack.length - 1]);
          } else {
            close(cur);
            cur = open(R.has('subordinator') ? 'subordinate' : 'coordinate', w);
          }
        } else if (
          R.has('question word') &&
          !R.has('determiner') &&
          !R.has('quantifier') &&
          restAfter.length &&
          !(prev && prev.lower === 'de')
        ) {
          close(cur);
          cur = open('question', w);
        } else if (w.lower === 'gase' && clauseFollows(words, i + 1)) {
          close(cur);
          cur = open('gase', w);
        } else if (prev && prev.comma && cur.kind === 'relative' && stack.length && hasVerb(cur)) {
          close(cur);
          cur = stack.pop();
          cur.resumed = true;
        } else if (prev && prev.comma && hasVerb(cur) && verbAhead(i)) {
          close(cur);
          while (stack.length) close(stack.pop());
          cur = open('main', null);
        } else if (
          cur.lineInitial &&
          hasVerb(cur) &&
          strictVerbal(w) &&
          !(prev && (prev.roles.has('chain') || prev.roles.has('gome'))) &&
          (cur.kind === 'nominal' || (cur.kind === 'subordinate' && cur.linker.lower === 'fime'))
        ) {
          // a clause standing as the subject (0.8:G6): Fime taivo po relnura ka baba juba
          close(cur);
          cur = open('main', null);
          cur.clauseSubject = true;
        } else if (
          cur.kind === 'relative' &&
          stack.length &&
          hasVerb(cur) &&
          strictVerbal(w) &&
          !(prev && prev.roles.has('chain'))
        ) {
          // a relative clause with no closing comma: the main verb is read inside it (1.0:G21)
          cur.missingComma = true;
          close(cur);
          cur = stack.pop();
          cur.resumed = true;
        }
      }
      cur.words.push(w);
      if (w.stop) closeAll();
    });
    closeAll();
    return clauses.sort((a, b) => a.words[0].start - b.words[0].start);
  }

  /** A subject noun phrase followed by a verb: the start of a clause. */
  function clauseFollows(words, i) {
    let j = i;
    let noun = false;
    while (j < words.length && !verbal(words[j])) {
      // gase NP raho …: a simile whose noun has a relative clause, not a clause (album 12:14)
      if (noun && words[j].lower === 'raho') return false;
      if (nounish(words[j])) noun = true;
      if (words[j].comma || words[j].stop) return false;
      j += 1;
    }
    return noun && j < words.length;
  }

  C.wordsOf = wordsOf;
  C.splitClauses = split;
  C.verbal = verbal;
  C.strictVerbal = strictVerbal;
})(typeof window !== 'undefined' ? window : globalThis);
