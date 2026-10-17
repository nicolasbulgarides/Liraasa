/* Liraasa grammar checker: the word index (Phase 1).
 *
 * Built entirely from the reference (handoff/liraasa_1_2_llm.json, loaded as
 * window.LIRAASA_REF) plus the checker's extra data (legacy spellings and
 * names, window.LIRAASA_CHECKER_EXTRA). Nothing here names a Liraasa word:
 * suffixes, derivations, the verb rule, motion prefixes and the reader's
 * length limit are all read from the reference's own text.
 */
(function (root) {
  'use strict';
  const C = (root.LiraasaChecker = root.LiraasaChecker || {});

  /** HEADWORD [PART+PART] {FLAGS}: FORM (ROLE) MEANING | … (dictionary.how_to_read) */
  const LINE = /^([a-z]+)(?: \[([a-z]+)\+([a-z]+)\])?(?: \{([^}]*)\})?: (.*)$/;
  /** One form; the noun form is written only as "(n) meaning". */
  const FORM = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/;

  function fail(msg) {
    throw new Error('Liraasa checker: ' + msg);
  }

  function parseDictionary(ref) {
    const headwords = new Map();
    const forms = new Map();
    const roles = ref.dictionary.role_codes;
    for (const [domain, lines] of Object.entries(ref.dictionary.by_domain)) {
      for (const line of lines) {
        const m = LINE.exec(line);
        if (!m) fail('cannot read dictionary line: ' + line);
        const root_ = m[1];
        const entry = {
          root: root_,
          parts: m[2] ? [m[2], m[3]] : null,
          flags: m[4] ? m[4].split(', ') : [],
          domain,
          forms: {},
        };
        for (const part of m[5].split(' | ')) {
          const f = FORM.exec(part);
          if (!f) fail('cannot read form "' + part + '" in ' + line);
          const role = f[2];
          if (!(role in roles)) fail('unknown role code ' + role + ' in ' + line);
          const form = f[1] || root_;
          const reading = { form, root: root_, role, roleName: roles[role], gloss: f[3], entry };
          entry.forms[role] = reading;
          const list = forms.get(form) || [];
          list.push(reading);
          forms.set(form, list);
        }
        headwords.set(root_, entry);
      }
    }
    return { headwords, forms };
  }

  /** Closed classes: every small word, with the class it was listed under. */
  function parseSmallWords(ref) {
    const closed = new Map();
    const bound = new Map(); // -na, -ti, -ri, -yo …: suffixes, not words
    const phrases = []; // multi-word entries such as "ki-nela de"
    const add = (form, entry) => {
      const list = closed.get(form) || [];
      list.push(entry);
      closed.set(form, list);
    };
    const sw = ref.small_words;
    const cols = sw.function_words.columns;
    const ix = (name) => cols.indexOf(name);
    for (const row of sw.function_words.rows) {
      const form = row[ix('form')];
      const entry = { cls: 'function word', form, gloss: row[ix('meaning')], use: row[ix('use')] };
      if (form.startsWith('-')) bound.set(form.slice(1), entry);
      else if (form.includes(' ')) phrases.push(entry);
      else add(form, entry);
    }
    for (const p of sw.pronouns) {
      add(p.form, {
        cls: 'pronoun',
        form: p.form,
        gloss: (p.person + ' ' + p.number).toLowerCase(),
      });
    }
    for (const [form, built, gloss] of sw.correlatives.rows) {
      add(form, { cls: 'correlative', form, gloss, use: built });
    }
    for (const [form, gloss] of sw.time_words.rows) {
      if (!form.includes(' ')) add(form, { cls: 'time word', form, gloss });
    }
    for (const c of sw.colours) {
      for (const k of ['base', 'dark', 'vivid', 'gem', 'light']) {
        if (c[k])
          add(c[k], {
            cls: 'colour',
            form: c[k],
            gloss: c.family.toLowerCase() + (k === 'base' ? '' : ' (' + k + ')'),
          });
      }
    }
    for (const d of sw.discourse_particles) {
      add(d.form, { cls: 'discourse particle', form: d.form, gloss: d.function });
    }
    return { closed, bound, phrases };
  }

  /** Numerals: the single words in numbers.rules and numbers.examples. */
  function parseNumerals(ref) {
    const words = new Map();
    const numbers = ref.small_words.numbers;
    for (const r of numbers.rules) {
      const w = String(r.liraasa || '');
      if (/^[a-z]+$/.test(w)) words.set(w, r.value);
    }
    for (const [value, w] of Object.entries(numbers.examples)) {
      if (/^[a-z]+$/.test(w)) words.set(w, Number(value));
    }
    const ordinal = /add (-[a-z]+)/.exec(numbers.ordinals_and_fractions);
    return { words, ordinalSuffix: ordinal ? ordinal[1] : null };
  }

  /** Suffixes, derivations and the verb rule, from word_building. */
  function parseMorphology(ref) {
    const wb = ref.word_building;
    const inflections = (wb.suffix_order.match(/-[a-z]+/g) || []).map((s) => s.slice(1));
    const derivations = Object.keys(wb.suffixes)
      .map((s) => s.replace(/^-/, ''))
      .filter((s) => !inflections.includes(s));
    const blocked = new Set();
    for (const text of Object.values(wb.suffixes)) {
      for (const m of String(text).matchAll(/([a-z]+)\+([a-z]+) blocked/g))
        blocked.add(m[1] + m[2]);
    }
    const lexicalised = new Map();
    for (const [word, text] of Object.entries(wb.lexicalised_derivations)) {
      const m = /^(.*): ([a-z]+) \+ -([a-z]+)$/.exec(text);
      if (m) lexicalised.set(word, { gloss: m[1], base: m[2], suffix: m[3] });
    }
    const prefixes = Object.keys(wb.motion_prefixes.canon);
    const curated = new Set();
    for (const text of Object.values(wb.motion_prefixes.canon)) {
      const m = /curated metaphors?: ([^)]*)/.exec(text);
      if (m) for (const w of m[1].split(',')) curated.add(w.trim());
    }
    const slots = wb.seven_forms.slots.map((s) => {
      const m = /^R(?: \+ ([a-z]+))?$/.exec(s.build);
      return { slotName: s.slot, suffix: m ? m[1] || '' : null }; // null: the verb rule decides
    });
    return {
      inflections,
      derivations,
      blocked,
      lexicalised,
      prefixes,
      curated,
      slots,
      verbRule: wb.verb_rule,
    };
  }

  /** The verb form by word_building.verb_rule, read from its own wording. */
  function verbOf(rule, word) {
    if (typeof rule[word] === 'string') return rule[word]; // the listed irregular
    const first = word[0];
    const pick = (key) => {
      const v = rule[key];
      const m = /^R\+([a-z]+)$/.exec(v || '');
      return m ? word + m[1] : null;
    };
    if (first === 'n' && pick('n-initial')) return pick('n-initial');
    if (first === 's' && pick('s-initial')) return pick('s-initial');
    if ('aeiou'.includes(first) && pick('vowel-initial')) return pick('vowel-initial');
    if (/first consonant \+ a/.test(rule.otherwise || '')) return word + first + 'a';
    return null;
  }

  function build(ref, extra) {
    if (!ref || !ref.dictionary) fail('the reference (window.LIRAASA_REF) is not loaded');
    const dict = parseDictionary(ref);
    const small = parseSmallWords(ref);
    const morph = parseMorphology(ref);
    const numerals = parseNumerals(ref);
    const order = ref.how_to_translate.how_a_reader_parses_one_word.join(' ');
    const longer = /longer than (\d+)/.exec(order);
    // every form a headword could have by rule, listed or not (for the unused-slot warning)
    const possible = new Map();
    for (const entry of dict.headwords.values()) {
      for (const [i, s] of morph.slots.entries()) {
        const code = Object.keys(ref.dictionary.role_codes)[i];
        const form = s.suffix === null ? verbOf(morph.verbRule, entry.root) : entry.root + s.suffix;
        if (form && !dict.forms.has(form))
          possible.set(form, { root: entry.root, role: code, roleName: s.slotName });
      }
    }
    return {
      version: ref.title,
      headwords: dict.headwords,
      forms: dict.forms,
      closed: small.closed,
      bound: small.bound,
      phrases: small.phrases,
      numerals,
      morph,
      unlisted: possible,
      minStripLength: longer ? Number(longer[1]) : 4,
      legacy: new Map(Object.entries((extra && extra.legacy) || {})),
      names: new Set(((extra && extra.names) || []).map((n) => n.toLowerCase())),
      selfCheck: ref.self_check,
      rulings: new Map(ref.rulings.map((r) => [r.id, r])),
      verbOf: (w) => verbOf(morph.verbRule, w),
    };
  }

  C.buildIndex = build;
})(typeof window !== 'undefined' ? window : globalThis);
