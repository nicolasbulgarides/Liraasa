/* Liraasa grammar checker: what each word can do in a clause (Phase 2).
 *
 * Read from the reference wherever it says it:
 *   clause.slots            operator words and their slot number (TENSE 4 …
 *                           EVIDENTIAL 13), copulas, valency operators and
 *                           gome (VERB 14), la (ADJUNCTS 16), fuyi, the status
 *                           and attitude words, ki, the frame words and hozi
 *   clause.scope_operators  ne doli tu yesta pendi vinto
 * and from the overlay (data/checker/lexicon_flags.json, LIRAASA_FLAGS) for
 * what the reference leaves unstated: determiners, prepositions, linkers,
 * quantifiers, degree words, correlative roles.
 *
 * roles(token) gives a set of roles; a word with several readings keeps all
 * of them and the slot parser picks by position.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  function buildClasses(ref, ix, flags) {
    const slotOf = new Map(); // word → { n, name }
    const verbSlot = new Map(); // word → copula | valency | gome
    const adjunctMarker = new Set();
    const frameWords = new Set();
    let topicWord = null;
    const closedWord = (w) => ix.closed.has(w);
    for (const s of ref.clause.slots) {
      for (const text of s.words) {
        const words = String(text).match(/[a-z]+(?:-[a-z]+)*/g) || [];
        for (const w of words.filter(closedWord)) {
          if (s.slot === 'VERB') {
            verbSlot.set(w, /copula/.test(text) ? 'copula' : /valency/.test(text) ? 'valency' : w);
          } else if (s.slot === 'ADJUNCTS') {
            if (/\+ adjective/.test(text)) adjunctMarker.add(w);
          } else if (s.slot === 'FRAME') {
            frameWords.add(w);
          } else if (s.slot === 'TOPIC') {
            topicWord = w;
          } else if (!slotOf.has(w)) {
            slotOf.set(w, { n: s.n, name: s.slot });
          }
        }
      }
    }
    const scope = new Set(ref.clause.scope_operators.words);
    // operators the template lets close the clause instead ("reve and loki may instead close the clause")
    const mayClose = new Set();
    for (const s of ref.clause.slots) {
      const m = /^(.*) may instead close the clause/.exec(s.notes || '');
      if (m) for (const w of m[1].match(/[a-z]+/g) || []) if (ix.closed.has(w)) mayClose.add(w);
    }
    const wordClass = Object.fromEntries(
      Object.entries((flags && flags.word_class) || {}).filter(([k]) => !k.startsWith('_')),
    );
    const corrRole = (flags && flags.correlative_role) || {};
    const exclusions = ref.clause.stacking.exclusions;
    const slotByName = new Map(ref.clause.slots.map((s) => [s.slot, s]));

    /** The roles a token may fill. */
    function roles(token) {
      const r = new Set();
      const read = token.reading;
      const w = token.lower;
      // a closed word, or a closed stem under -ri / -ti (montari: monta + -ri)
      const closed = ix.closed.get(w) || (read && read.kind === 'closed' ? read.readings : []);
      const add = (x) => r.add(x);
      if (slotOf.has(w)) {
        const s = slotOf.get(w);
        add(s.n >= 4 && s.n <= 13 ? 'operator' : s.name.toLowerCase());
      }
      if (verbSlot.has(w)) add(verbSlot.get(w) === w ? w : verbSlot.get(w));
      if (adjunctMarker.has(w)) add('adjunct marker');
      if (frameWords.has(w)) add('frame');
      if (w === topicWord) add('topic');
      if (scope.has(w)) add(w === 'ne' ? 'ne' : 'scope');
      if (wordClass[w]) add(wordClass[w]);
      for (const c of closed) {
        if (c.cls === 'pronoun') add('noun').add('pronoun');
        else if (c.cls === 'correlative') {
          const concept = (c.use || '').split(' + ')[1];
          add(corrRole[concept] === 'noun' ? 'noun' : 'adverb');
          if (w.startsWith('ki-')) add('question word');
        } else if (c.cls === 'time word') add('time');
        else if (c.cls === 'colour') add('adj').add('noun');
        else if (c.cls === 'discourse particle' && !r.size) add('interjection');
      }
      // a time word is also a noun (deya, montafama: "three months"), unless it is
      // an operator, a preposition or an adverbial correlative (po, kroti, eli-krono)
      if (
        r.has('time') &&
        !r.has('operator') &&
        !r.has('preposition') &&
        !r.has('adverb') &&
        !r.has('determiner')
      )
        add('noun');
      if (!read) return r.add('noun').add('unknown');
      switch (read.kind) {
        case 'lexical':
        case 'unused':
          for (const x of read.readings.length ? read.readings : [{ role: read.role }]) {
            add(x.role === 'v' ? 'verb' : ['n', 'an', 'nn'].includes(x.role) ? 'noun' : 'adj');
          }
          break;
        case 'motion':
          add('verb');
          break;
        case 'numeral':
          add('num');
          break;
        case 'closed':
          break;
        default:
          add('noun'); // derivation, name, fraction, legacy
      }
      return r;
    }

    return {
      roles,
      slotOf,
      mayClose,
      verbSlot,
      frameWords,
      scope,
      exclusions,
      slotByName,
      giveType: new Set(
        Object.keys((flags && flags.give_type) || {}).filter((k) => !k.startsWith('_')),
      ),
      sayType: new Set(
        Object.keys((flags && flags.say_type) || {}).filter((k) => !k.startsWith('_')),
      ),
      nounToAdjective: (flags && flags.noun_to_adjective_role) || {},
      takesNounPhrase: new Set(
        Object.keys((flags && flags.subordinators_taking_a_noun_phrase) || {}),
      ),
    };
  }

  C.buildClasses = buildClasses;
})(typeof window !== 'undefined' ? window : globalThis);
