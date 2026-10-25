var LiraasaGrammar = function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const LINE = /^([a-z]+)(?: \[([a-z]+)\+([a-z]+)(?:\+-([a-z]+))?\])?(?: \{([^}]*)\})?: (.*)$/;
  const FORM = /^(?:([a-z]+) )?\(([a-z]+)\) (.*)$/;
  const ROLE_POS = {
    n: "noun",
    an: "noun",
    nn: "noun",
    v: "verb",
    na: "adj",
    a: "adj",
    aa: "adj"
  };
  const push = (m, k, v) => {
    const list = m.get(k);
    if (list === void 0) m.set(k, [v]);
    else list.push(v);
  };
  function verbRule(rule, word2) {
    const irregular = rule[word2];
    if (typeof irregular === "string") return irregular;
    const pick = (key) => {
      const m = /^R\+([a-z]+)$/.exec(rule[key] ?? "");
      return m === null ? null : word2 + (m[1] ?? "");
    };
    const first = word2[0] ?? "";
    if (first === "n") return pick("n-initial");
    if (first === "s") return pick("s-initial");
    if ("aeiou".includes(first)) return pick("vowel-initial");
    return (rule.otherwise ?? "").includes("first consonant + a") ? `${word2}${first}a` : null;
  }
  function formRules(ref) {
    const codes = Object.keys(ref.dictionary.role_codes);
    return ref.word_building.seven_forms.slots.map((s, i) => {
      const m = /^R(?: \+ ([a-z]+))?$/.exec(s.build);
      return { role: codes[i] ?? "n", suffix: m === null ? null : m[1] ?? "" };
    });
  }
  function functionPos(form, ix, src) {
    const out = [];
    const slot = ix.slotOf.get(form);
    const r = src.rules;
    if (slot !== void 0) {
      const bySlot = {
        FRAME: "frame",
        TOPIC: "topic",
        TENSE: "op",
        REALITY: "op",
        NEGATION: "op",
        MODAL: "op",
        APPROACH: "op",
        PHASE: "op",
        EFFORT: "op",
        ASPECT: "op",
        ITERATION: "op",
        EVIDENTIAL: "op",
        RECIPROCAL: "recip",
        STATUS: "status",
        ATTITUDE: "attitude",
        QUESTION: "ki",
        ADJUNCTS: form === "la" ? "la" : "prep",
        VERB: r.valency.operators.includes(form) || form === r.passive.word ? "valency" : "copula"
      };
      const p = slot === "VERB" && !(r.valency.operators.includes(form) || form === r.passive.word) ? "copula" : slot === "VERB" ? void 0 : bySlot[slot];
      if (p !== void 0) out.push({ pos: p, slot });
    }
    if (r.valency.operators.includes(form)) out.push({ pos: "valency", slot: "VERB" });
    if (form === r.passive.word) out.push({ pos: "passive", slot: "VERB" });
    if (form === r.negative_number.word) out.push({ pos: "sign" });
    if (r.edges.clause_adverbs.words.includes(form)) out.push({ pos: "clauseAdv" });
    const cls = src.flags.word_class[form];
    const byClass = {
      determiner: "det",
      owner: "owner",
      reflexive: "refl",
      preposition: "prep",
      comparison: "comparison",
      coordinator: "coord",
      subordinator: "sub",
      "question word": "kiword",
      quantifier: "quant",
      degree: "degree",
      chain: "chain",
      hortative: "hortative",
      interjection: "interjection",
      time: "timeAdv",
      vocative: "vocative"
    };
    if (cls !== void 0) {
      const p = byClass[cls];
      if (p !== void 0 && !(p === "coord" && out.some((o) => o.pos === "clauseAdv")))
        out.push({ pos: p, detail: cls });
    }
    if (r.noun_phrase.degree_words.includes(form) && !out.some((o) => o.pos === "degree"))
      out.push({ pos: "degree" });
    if (r.noun_phrase.quantifier_extra.includes(form) && !out.some((o) => o.pos === "quant"))
      out.push({ pos: "quant" });
    if (src.ref.clause.scope_operators.words.includes(form)) out.push({ pos: "scope" });
    if (form in src.flags.subordinators_taking_a_noun_phrase && !out.some((o) => o.pos === "prep"))
      out.push({ pos: "prep" });
    return out;
  }
  function buildIndex(src) {
    const ref = src.ref;
    const forms = /* @__PURE__ */ new Map();
    const headwords = /* @__PURE__ */ new Map();
    const roles = ref.dictionary.role_codes;
    for (const [domain, lines] of Object.entries(ref.dictionary.by_domain)) {
      for (const line of lines) {
        const m = LINE.exec(line);
        if (m === null) throw new Error(`cannot read dictionary line: ${line}`);
        const root = m[1] ?? "";
        const h = {
          root,
          parts: m[2] !== void 0 && m[3] !== void 0 ? [m[2], m[3]] : null,
          domain,
          roles: {},
          image: false
        };
        for (const part of (m[6] ?? "").split(" | ")) {
          const f = FORM.exec(part);
          if (f === null) throw new Error(`cannot read form "${part}" in ${line}`);
          const role = f[2] ?? "";
          if (!(role in roles)) throw new Error(`unknown role ${role} in ${line}`);
          const form = f[1] ?? root;
          const reading = {
            pos: ROLE_POS[role],
            form,
            root,
            role,
            gloss: f[3] ?? "",
            source: "listed"
          };
          h.roles[role] = reading;
          push(forms, form, reading);
        }
        headwords.set(root, h);
      }
    }
    const wb = ref.word_building;
    const rules = formRules(ref);
    const verbOf = (root) => verbRule(wb.verb_rule, root);
    const build = (root, suffix) => suffix === null ? verbOf(root) : root + suffix;
    const ic = wb.image_compounds;
    if (ic !== void 0) {
      for (const [mod, m] of Object.entries(ic.modifiers)) {
        if (!headwords.has(mod)) continue;
        for (const head of Object.keys(ic.heads)) {
          const hw = headwords.get(head);
          const word2 = mod + head;
          if (hw === void 0 || headwords.has(word2)) continue;
          const attested = ic.attested[word2];
          const sense = (hw.roles.n?.gloss ?? head).split(";")[0]?.trim().toLowerCase() ?? head;
          const noun = attested ?? `${m.as_modifier} ${sense}`;
          const h = {
            root: word2,
            parts: [mod, head],
            domain: "image compounds",
            roles: {},
            image: true
          };
          for (const { role, suffix } of rules) {
            const form = build(word2, suffix);
            if (form === null || forms.has(form)) continue;
            const gloss = role === "n" ? noun : `${noun} (${roles[role] ?? role}, predicted)`;
            const reading = {
              pos: ROLE_POS[role],
              form,
              root: word2,
              role,
              gloss,
              source: role === "n" && attested !== void 0 ? "image" : "image-predicted"
            };
            h.roles[role] = reading;
            push(forms, form, reading);
          }
          headwords.set(word2, h);
        }
      }
    }
    const unlisted = /* @__PURE__ */ new Map();
    for (const h of headwords.values()) {
      if (h.image) continue;
      for (const { role, suffix } of rules) {
        const form = build(h.root, suffix);
        if (form !== null && !forms.has(form) && h.roles[role] === void 0)
          unlisted.set(form, { root: h.root, role });
      }
    }
    const slotOf = /* @__PURE__ */ new Map();
    const fwForms = /* @__PURE__ */ new Set([
      ...ref.small_words.function_words.rows.map((r) => String(r[0])),
      ...ref.small_words.discourse_particles.map((d) => d.form)
    ]);
    for (const s of ref.clause.slots) {
      for (const w of s.words) {
        if (s.slot === "FRAME" && !/^[a-z-]+$/.test(w)) continue;
        for (const t of w.replace(/\([^)]*\)/g, " ").split(/[\s,+]+/)) {
          if (/^[a-z-]+$/.test(t) && fwForms.has(t) && !slotOf.has(t)) slotOf.set(t, s.slot);
        }
      }
    }
    const closed = /* @__PURE__ */ new Map();
    const phrases = /* @__PURE__ */ new Map();
    const ixPartial = { slotOf };
    const cols = ref.small_words.function_words.columns;
    const col = (name) => cols.indexOf(name);
    const fwRows = [
      ...ref.small_words.function_words.rows,
      ...ref.small_words.historical_and_formulae?.rows ?? []
    ];
    for (const row of fwRows) {
      const form = String(row[col("form")]);
      if (form.startsWith("-")) continue;
      const gloss = String(row[col("meaning")]);
      const readings = functionPos(form, ixPartial, src).map(
        (p) => ({
          pos: p.pos,
          form,
          gloss,
          source: "closed",
          ...p.slot === void 0 ? {} : { slot: p.slot },
          ...p.detail === void 0 ? {} : { detail: p.detail }
        })
      );
      if (readings.length === 0)
        readings.push({
          pos: "interjection",
          form,
          gloss,
          source: "closed",
          detail: "function word"
        });
      for (const r of readings) push(form.includes(" ") ? phrases : closed, form, r);
    }
    for (const p of ref.small_words.pronouns) {
      push(closed, p.form, {
        pos: "pron",
        form: p.form,
        gloss: `${p.person} ${p.number}`.toLowerCase(),
        source: "closed"
      });
    }
    for (const [form, built, gloss] of ref.small_words.correlatives.rows) {
      const concept = /\+ ([a-z]+)/.exec(built)?.[1] ?? "";
      const role = src.flags.correlative_role[concept];
      const pos = form.startsWith("ki-") ? "kiword" : role === "noun" ? "pron" : concept === "pago" ? "placeAdv" : concept === "krono" ? "timeAdv" : "mannerAdv";
      if (!(closed.get(form) ?? []).some((r) => r.pos === pos))
        push(closed, form, { pos, form, gloss, source: "correlative", detail: concept });
    }
    for (const row of ref.small_words.time_words.rows) {
      const [form, gloss, cls] = [String(row[0]), String(row[1]), String(row[2] ?? "")];
      if (form.includes(" ") || cls === "operator") continue;
      const pos = cls === "noun" ? "noun" : cls === "place_adverbial" ? "placeAdv" : "timeAdv";
      if (pos === "noun" && forms.has(form)) continue;
      if (!(closed.get(form) ?? []).some((r) => r.pos === pos))
        push(closed, form, { pos, form, gloss, source: "closed", detail: `time word (${cls})` });
    }
    for (const c of ref.small_words.colours) {
      for (const k of ["base", "dark", "vivid", "gem", "light"]) {
        const w = c[k];
        if (typeof w === "string" && w !== "")
          push(closed, w, {
            pos: "colour",
            form: w,
            gloss: `${String(c.family).toLowerCase()}${k === "base" ? "" : ` (${k})`}`,
            source: "closed"
          });
      }
    }
    for (const d of ref.small_words.discourse_particles) {
      const slot = slotOf.get(d.form);
      if (slot === "ATTITUDE")
        push(closed, d.form, {
          pos: "attitude",
          form: d.form,
          gloss: d.function,
          source: "closed",
          slot
        });
      push(closed, d.form, { pos: "discourse", form: d.form, gloss: d.function, source: "closed" });
    }
    const timeNouns = new Set(
      ref.small_words.time_words.rows.filter((r) => String(r[2] ?? "") === "noun").map((r) => String(r[0]))
    );
    const numerals = /* @__PURE__ */ new Map();
    for (const r of ref.small_words.numbers.rules) {
      const w = typeof r.liraasa === "string" ? r.liraasa : "";
      if (/^[a-z]+$/.test(w)) numerals.set(w, r.value);
    }
    for (const [value, w] of Object.entries(ref.small_words.numbers.examples))
      if (/^[a-z]+$/.test(w)) numerals.set(w, Number(value));
    const ordinalSuffix = /add (-[a-z]+)/.exec(ref.small_words.numbers.ordinals_and_fractions)?.[1] ?? "-ne";
    let timesHead = null;
    let timesQuestion = null;
    for (const r of ref.rulings) {
      const head = /\bNUMBER-([a-z]+) = N times/.exec(r.rule);
      if (head === null) continue;
      timesHead = head[1] ?? null;
      timesQuestion = new RegExp(`\\b(ki-[a-z]+)-${timesHead ?? ""} = how many times`).exec(r.rule)?.[1] ?? null;
      break;
    }
    const inflections = (wb.suffix_order.match(/-[a-z]+/g) ?? []).map((s) => s.slice(1));
    const derivations = Object.keys(wb.suffixes).map((s) => s.replace(/^-/, "")).filter((s) => !inflections.includes(s));
    const blocked = /* @__PURE__ */ new Set();
    for (const text of Object.values(wb.suffixes))
      for (const m of text.matchAll(/([a-z]+)\+([a-z]+) blocked/g))
        blocked.add((m[1] ?? "") + (m[2] ?? ""));
    const lexicalised = /* @__PURE__ */ new Map();
    for (const [word2, text] of Object.entries({
      ...wb.lexicalised_derivations,
      ...wb.lexicalised_diminutives ?? {}
    })) {
      const m = /^(.*): ([a-z]+) \+ -([a-z]+)$/.exec(text);
      if (m !== null)
        lexicalised.set(word2, { gloss: m[1] ?? "", base: m[2] ?? "", suffix: m[3] ?? "" });
    }
    const prefixes = Object.keys(wb.motion_prefixes.canon);
    const curated = /* @__PURE__ */ new Set();
    for (const text of Object.values(wb.motion_prefixes.canon)) {
      const m = /curated metaphors?: ([^)]*)/.exec(text);
      if (m !== null) for (const w of (m[1] ?? "").split(",")) curated.add(w.trim());
    }
    const order = src.ref.how_to_translate?.how_a_reader_parses_one_word?.join(" ") ?? "";
    const longer = /longer than (\d+)/.exec(order);
    return {
      source: src,
      forms,
      headwords,
      unlisted,
      closed,
      phrases,
      numerals,
      ordinalSuffix,
      timesHead,
      timesQuestion,
      derivations,
      inflections,
      blocked,
      lexicalised,
      prefixes,
      curated,
      slotOf,
      exclusions: ref.clause.stacking.exclusions,
      maxOps: ref.clause.stacking.max_preverbal_operators_recommended,
      verbOf,
      formOf: (root, role) => headwords.get(root)?.roles[role]?.form ?? null,
      minStripLength: longer === null ? 4 : Number(longer[1]),
      names: new Set(src.names.map((n) => n.toLowerCase())),
      transitive: new Set(src.transitive ?? []),
      timeNouns
    };
  }
  const OP_ORDER = [
    "TENSE",
    "REALITY",
    "NEGATION",
    "MODAL",
    "APPROACH",
    "PHASE",
    "EFFORT",
    "ASPECT",
    "ITERATION",
    "EVIDENTIAL"
  ];
  const emptyClause$2 = (kind, start, linker) => ({
    kind,
    linker,
    start,
    end: start,
    frame: [],
    topic: null,
    kiFront: null,
    subject: null,
    ops: [],
    verb: null,
    predKind: "none",
    actor: null,
    actorOps: [],
    innerVerb: null,
    recipient: null,
    object: null,
    objectClause: null,
    predicate: null,
    agent: null,
    adjuncts: [],
    closing: [],
    vocative: null,
    subordinates: []
  });
  class SentenceParser {
    constructor(ix, t) {
      __publicField(this, "i", 0);
      __publicField(this, "findings", []);
      __publicField(this, "roles", /* @__PURE__ */ new Map());
      __publicField(this, "clauseNo", 0);
      __publicField(this, "clauses", []);
      this.ix = ix;
      this.t = t;
    }
    // ------------------------------------------------------------ token helpers
    w(i) {
      const t = this.t[i];
      return t === void 0 ? "" : t.kind === "punct" ? t.text : t.word?.lower ?? "";
    }
    readings(i) {
      return this.t[i]?.word?.readings ?? [];
    }
    is(i, pos) {
      return this.readings(i).some((r) => r.pos === pos);
    }
    only(i, pos) {
      const rs = this.readings(i);
      return rs.length > 0 && rs.every((r) => r.pos === pos);
    }
    reading(i, pos) {
      return this.readings(i).find((r) => r.pos === pos);
    }
    isPunct(i, text) {
      const t = this.t[i];
      return t?.kind === "punct" && (text === void 0 || t.text === text);
    }
    isWord(i) {
      return this.t[i]?.kind === "word";
    }
    atEnd(i = this.i) {
      for (let k = i; k < this.t.length; k++)
        if (!this.isPunct(k) || /[,;:—–-]/.test(this.w(k))) return false;
      return true;
    }
    /** Sentence-final punctuation only remains. */
    onlyEndPunct(i = this.i) {
      for (let k = i; k < this.t.length; k++)
        if (!this.isPunct(k) || !/^[.!?…"”'’)]+$/.test(this.w(k))) return false;
      return true;
    }
    opSlot(i) {
      return this.reading(i, "op")?.slot;
    }
    find(rule, message, at, severity = "error", fix) {
      this.findings.push({ severity, rule, message, at, ...fix === void 0 ? {} : { fix } });
    }
    role(i, role) {
      if (!this.roles.has(i)) this.roles.set(i, { role, clause: this.clauseNo });
    }
    roleSpan(start, end, role) {
      for (let k = start; k < end; k++) if (this.isWord(k)) this.role(k, role);
    }
    // --------------------------------------------------------------- word kinds
    /** A word that can stand at the head of a noun phrase. */
    nounish(i) {
      return this.is(i, "noun") || this.is(i, "name") || this.is(i, "pron") || this.kiNoun(i);
    }
    /** ki-coda, ki-nela: question words that stand as a noun phrase. */
    kiNoun(i) {
      return this.is(i, "kiword") && (/^ki-(coda|nela)$/.test(this.w(i)) || this.readings(i).some((r) => r.pos === "kiword" && /^(coda|nela)$/.test(r.detail ?? "")));
    }
    side(i) {
      return this.w(i) in this.ix.source.flags.side_nouns_as_prepositions;
    }
    adjish(i) {
      return this.is(i, "adj") || this.is(i, "colour");
    }
    /** A word that can open a noun phrase. */
    npStart(i) {
      return this.isWord(i) && (this.nounish(i) || this.adjish(i) || this.is(i, "det") || this.is(i, "quant") || this.is(i, "num") || this.is(i, "ord") || this.is(i, "sign") || this.is(i, "degree") && (this.adjish(i + 1) || this.is(i + 1, "quant") || this.is(i + 1, "num") || this.nounish(i + 1)) || this.is(i, "scope") && this.w(i) !== "ne" && this.npStart(i + 1) || this.w(i) === "sidu" && this.verbish(i + 1));
    }
    verbish(i) {
      return this.is(i, "verb");
    }
    predicateStart(i) {
      if (this.is(i, "scope") && this.w(i) !== "ne" && (this.verbish(i + 1) || this.is(i + 1, "op")))
        return true;
      return this.is(i, "op") || this.is(i, "copula") || this.is(i, "valency") || this.is(i, "passive") || this.verbish(i) || this.w(i) === "ne";
    }
    // ------------------------------------------------------------- noun phrase
    /**
     * [QUANTIFIER] [DETERMINER] [ORDINAL] [NUMBER] {[DEGREE] ADJECTIVE} NOUN[-ti][-ri]
     * [de NP] [raho CLAUSE] (2.5:G98), with de grouped from the left (2.5:G96).
     */
    parseNP(opts = {}) {
      const start = this.i;
      if (this.is(start, "scope") && this.npStart(start + 1)) {
        this.i += 1;
        const inner = this.parseNP(opts);
        if (inner === null) {
          this.i = start;
          return null;
        }
        this.role(start, this.roles.get(inner.start)?.role ?? "ADJUNCT");
        return { ...inner, start };
      }
      const np = this.parseNPCore(opts);
      if (np === null) {
        this.i = start;
        return null;
      }
      let cur = np;
      while (!opts.noDe && this.w(this.i) === "de") {
        const deAt = this.i;
        this.i += 1;
        const right = this.parseNPCore({ ...opts, noRelative: true, adverbHead: true });
        if (right === null) {
          this.find("0.8:G7", "de with no noun phrase after it", [deAt]);
          break;
        }
        this.role(deAt, this.roles.get(cur.start)?.role ?? "OBJECT");
        const leftKind = cur.headKind;
        const title = cur.de === null && this.titleAsName(cur);
        const deKind = leftKind === "num" || cur.quant !== null && cur.head === cur.quant ? "partitive" : leftKind === "pron" || leftKind === "name" || title ? "owner-left" : "owner-right";
        if (title) {
          const text = this.t[cur.head ?? -1]?.text ?? "";
          this.find(
            this.ix.source.rules.titles?.ruling ?? "3.0:G131",
            `${text}, capitalised with no article, is a name: it owns what follows de (${text}’s …); a descriptive epithet keeps li and lower case (li ${text.toLowerCase()} de …)`,
            [cur.head ?? deAt],
            "note"
          );
        }
        const attach = (n) => n.de === null ? { ...n, de: right, deKind } : { ...n, de: attach(n.de) };
        cur = { ...attach(cur), end: right.end };
      }
      const au = this.ix.source.rules.authorship;
      if (au !== void 0 && this.w(this.i) === au.word && this.npStart(this.i + 1)) {
        const g = this.i;
        if (this.workNoun(cur.head)) {
          this.i += 1;
          const maker = this.parseNP({ ...opts, noRelative: true });
          if (maker === null) this.i = g;
          else cur = { ...cur, end: maker.end, maker };
        } else if (!this.t.slice(0, g).some((t) => t.word?.lower === this.ix.source.rules.passive.word))
          this.find(
            au.ruling,
            `${au.word} names the maker after a made work (li lira ${au.word} …), or the agent after a passive verb (gome …): ${this.w(cur.head ?? g)} is neither`,
            [g]
          );
      }
      if (!opts.noRelative && this.w(this.i) === "raho") {
        const rel = this.parseSubClause("relative");
        cur = { ...cur, end: this.i, relative: rel };
      }
      if ((this.w(this.i) === "ata" || this.w(this.i) === "oro") && this.npStart(this.i + 1)) {
        const save = this.i;
        this.i += 1;
        const second = this.parseNP({ ...opts, noRelative: true });
        if (second === null || this.predicateStart(this.i)) this.i = save;
        else cur = { ...cur, end: second.end, plural: true, and: { linker: save, np: second } };
      }
      return cur;
    }
    parseNPCore(opts) {
      const start = this.i;
      const np = {
        start,
        end: start,
        head: null,
        headKind: "noun",
        det: null,
        quant: null,
        ord: null,
        num: null,
        adjectives: [],
        degrees: [],
        de: null,
        relative: null,
        refl: null,
        plural: false
      };
      const i0 = this.i;
      if (this.w(i0) === "sidu" && this.verbish(i0 + 1)) {
        this.i += 2;
        const vp = emptyClause$2("chain", i0 + 1, i0);
        vp.verb = i0 + 1;
        vp.predKind = "verb";
        this.parseObject(vp, {});
        this.parseAdjuncts(vp);
        np.head = i0 + 1;
        np.end = this.i;
        return np;
      }
      if (opts.adverbHead && (this.is(i0, "timeAdv") || this.is(i0, "placeAdv")) && !this.nounish(i0)) {
        np.head = i0;
        np.headKind = "correlative";
        this.i += 1;
        np.end = this.i;
        return np;
      }
      if (this.is(i0, "pron") && !this.is(i0, "det")) {
        np.head = i0;
        np.headKind = "pron";
        np.plural = this.w(i0).endsWith("ri");
        this.i += 1;
        if (this.w(this.i) === "sela") {
          np.refl = this.i;
          this.i += 1;
        }
        np.end = this.i;
        return np;
      }
      if (this.is(i0, "name") && !this.is(i0, "noun")) {
        np.head = i0;
        np.headKind = "name";
        this.i += 1;
        if (this.w(this.i) === "sela") {
          np.refl = this.i;
          this.i += 1;
        }
        np.end = this.i;
        return np;
      }
      if (this.kiNoun(i0)) {
        np.head = i0;
        np.headKind = "kiword";
        this.i += 1;
        np.end = this.i;
        return np;
      }
      if (this.w(this.i) === "diba" && this.is(this.i + 1, "quant")) {
        np.degrees.push(this.i);
        this.i += 1;
      }
      if (this.ix.source.rules.comparison.amount_words.includes(this.w(this.i)) && this.is(this.i + 1, "quant") && this.nounish(this.i + 2)) {
        this.find(
          "2.5:G106",
          `${this.w(this.i)} + a quantifier (${this.w(this.i)} ${this.w(this.i + 1)} …) is not ruled: 2.5:G106 rules ${this.w(this.i)} + a noun`,
          [this.i, this.i + 1],
          "unruled"
        );
        np.degrees.push(this.i);
        this.i += 1;
      }
      if (this.is(this.i, "quant") && !this.is(this.i, "kiword")) {
        np.quant = this.i;
        this.i += 1;
      } else if (this.is(this.i, "kiword") && this.w(this.i) === "ki-muya") {
        np.quant = this.i;
        this.i += 1;
      } else if (this.ix.source.rules.comparison.amount_words.includes(this.w(this.i)) && this.nounish(this.i + 1) && !this.adjish(this.i + 1)) {
        np.quant = this.i;
        this.i += 1;
      }
      if (np.quant !== null && (this.is(this.i, "pron") || this.is(this.i, "name")) && this.w(this.i + 1) === "de") {
        const owner = this.parseNPCore(opts);
        if (owner !== null) return { ...owner, start, quant: np.quant };
      }
      if (this.is(this.i, "det")) {
        np.det = this.i;
        this.i += 1;
      }
      if (this.is(this.i, "ord")) {
        np.ord = this.i;
        this.i += 1;
      }
      if (this.is(this.i, "sign")) {
        if (!this.is(this.i + 1, "num"))
          this.find("2.5:G125", `${this.w(this.i)} stands directly before a number`, [this.i]);
        this.i += 1;
      }
      if (["lusu", "mosa", "gase", "pendi"].includes(this.w(this.i)) && this.is(this.i + 1, "num")) {
        np.degrees.push(this.i);
        this.i += 1;
      }
      if (this.is(this.i, "num")) {
        np.num = this.i;
        this.i += 1;
      }
      for (; ; ) {
        const k = this.i;
        if (this.is(k, "degree") && this.adjish(k + 1)) {
          np.degrees.push(k);
          np.adjectives.push(k + 1);
          this.i += 2;
          continue;
        }
        if (this.adjish(k) && !this.nounish(k) && this.isWord(k)) {
          np.adjectives.push(k);
          this.i += 1;
          continue;
        }
        break;
      }
      const h = this.i;
      if (this.nounish(h) && this.isWord(h) && !(this.is(h, "pron") && this.is(h, "det"))) {
        np.head = h;
        np.headKind = this.is(h, "noun") ? "noun" : this.is(h, "name") ? "name" : this.is(h, "pron") ? "pron" : "kiword";
        this.i += 1;
        const n2 = this.i;
        if (this.only(n2, "noun") && !this.is(n2, "name") && this.t[n2]?.word?.problem === void 0) {
          const adj = this.adjectiveOf(h);
          this.find(
            "ADR-0011",
            `two nouns side by side: ${this.w(h)} ${this.w(n2)}; the first becomes its adjective${adj === null ? " (none is listed: use a compound or a de phrase)" : ` (${adj})`}`,
            [h, n2],
            "error",
            adj ?? void 0
          );
          np.head = n2;
          this.i += 1;
        }
      } else if (np.adjectives.length > 0 && (np.det !== null || np.quant !== null || np.num !== null || np.ord !== null)) {
        const last = np.adjectives.pop() ?? h;
        np.head = last;
        np.headKind = "adj";
      } else if (np.adjectives.length > 0) {
        if (!opts.allowBareAdj) {
          const last = np.adjectives[np.adjectives.length - 1] ?? h;
          const noun = this.nounOf(last);
          this.find(
            "1.2:G29",
            `${this.w(last)} is an adjective; an adjective stands as a noun only after a determiner (li ${this.w(last)})${noun === null ? "" : `, or use the noun ${noun}`}`,
            [last],
            "error",
            noun ?? `li ${this.w(last)}`
          );
          np.head = last;
          np.headKind = "adj";
          np.adjectives.pop();
        } else {
          this.i = start;
          return null;
        }
      } else if (np.num !== null) {
        np.head = np.num;
        np.headKind = "num";
      } else if (np.det !== null && ["eli", "ola", "eliri", "olari"].includes(this.w(np.det))) {
        np.head = np.det;
        np.headKind = "demonstrative";
        np.det = null;
      } else if (np.quant !== null && (this.w(this.i) === "de" || this.is(np.quant, "kiword"))) {
        np.head = np.quant;
        np.headKind = "num";
      } else if ((np.det !== null || np.quant !== null) && this.verbish(h) && this.isWord(h)) {
        const noun = this.nounOf(h);
        this.find(
          "0.8:G7",
          `${this.w(h)} is a verb form; the head of a noun phrase is a noun${noun === null ? "" : ` (${noun})`}`,
          [h],
          "error",
          noun ?? void 0
        );
        np.head = h;
        this.i += 1;
      } else if (np.det !== null || np.quant !== null) {
        this.find("0.8:G7", `${this.w(np.det ?? np.quant ?? h)} needs a noun after it`, [
          np.det ?? np.quant ?? h
        ]);
        np.end = this.i;
        return np.det === null && np.quant === null ? null : np;
      } else {
        this.i = start;
        return null;
      }
      if (!(opts.allowBareAdj ?? false) && np.headKind !== "adj" && this.only(this.i, "adj") && !this.nounish(this.i + 1) && !this.is(this.i + 1, "degree")) {
        this.find(
          "2.5:G98",
          `${this.w(this.i)} is an adjective after its noun: adjectives come before the noun (${this.w(this.i)} ${this.w(np.head)})`,
          [np.head, this.i]
        );
        np.adjectives.push(this.i);
        this.i += 1;
      }
      if (this.w(this.i) === "sela" && np.headKind !== "adj") {
        np.refl = this.i;
        this.i += 1;
      }
      const head = np.head;
      {
        const sfx = this.t[head]?.word?.suffixes ?? [];
        np.plural = sfx.includes("ri") || this.w(np.det ?? -1).endsWith("ri");
        if (sfx.includes("ri") && np.headKind === "adj" && np.det === null && np.quant === null)
          this.find("2.5:G101", `-ri on a bare adjective: ${this.w(head)}`, [head]);
        if (np.det !== null && this.ix.source.rules.plural.singular_demonstratives.includes(this.w(np.det)) && sfx.includes("ri"))
          this.find(
            "2.5:G101",
            `${this.w(np.det)} takes a singular noun (${this.w(np.det)}ri for plural)`,
            [np.det, head],
            "error",
            `${this.w(np.det)}ri`
          );
        if (np.adjectives.length > 1)
          this.find(
            "A4.22",
            "the order of two or more adjectives before one noun is not ruled yet",
            np.adjectives,
            "unruled"
          );
      }
      np.end = this.i;
      return np;
    }
    /** The listed adjective of a noun form (ADR-0011): -san, -asasan, -nasan. */
    adjectiveOf(i) {
      const r = this.reading(i, "noun");
      if (r?.root === void 0 || r.role === void 0) return null;
      const map = this.ix.source.flags.noun_to_adjective_role;
      const role = map[r.role];
      return role === void 0 ? null : this.ix.formOf(r.root, role);
    }
    nounOf(i) {
      const r = this.readings(i).find((x) => x.root !== void 0);
      return r?.root === void 0 ? null : this.ix.formOf(r.root, "n");
    }
    verbOfWord(i) {
      const r = this.readings(i).find((x) => x.root !== void 0);
      return r?.root === void 0 ? null : this.ix.formOf(r.root, "v");
    }
    // ---------------------------------------------- 3.0: address and naming
    /** A noun naming a made work (3.0:G136): one listed, or a compound whose head is one. */
    workNoun(i) {
      const list = this.ix.source.rules.authorship?.work_nouns ?? [];
      if (i === null) return false;
      return this.readings(i).some(
        (r) => r.pos === "noun" && list.some((n) => r.form === n || r.form.endsWith(n))
      );
    }
    /** A capitalised ascended noun with no article: a title used as a name (3.0:G131). */
    titleAsName(np) {
      const h = np.head;
      if (h === null || np.det !== null || np.quant !== null || np.adjectives.length > 0)
        return false;
      if (this.ix.source.rules.titles === void 0) return false;
      const text = this.t[h]?.text ?? "";
      return /^[A-Z]/.test(text) && !this.is(h, "pron") && !this.is(h, "name") && this.readings(h).some((r) => r.pos === "noun" && r.role === "an");
    }
    /**
     * iya + a noun phrase: a vocative (3.0:G129). iya belongs to its noun
     * phrase, so a comma after it is an error. Names or noun phrases set off by
     * commas may follow, each another address: a litany (3.0:G130).
     */
    parseIyaVocative() {
      const k = this.i;
      if (!this.is(k, "vocative")) return null;
      const rule = this.ix.source.rules.vocative?.ruling ?? "3.0:G129";
      this.role(k, "VOCATIVE");
      this.i += 1;
      if (this.isPunct(this.i, ",") && this.npStart(this.i + 1)) {
        this.find(
          rule,
          `${this.w(k)} belongs to its noun phrase: no comma after it`,
          [k, this.i],
          "error",
          `${this.w(k)} ${this.t[this.i + 1]?.text ?? ""}`
        );
        this.role(this.i, "PUNCT");
        this.i += 1;
      }
      const np = this.parseNP();
      if (np === null) {
        this.find(rule, `${this.w(k)} is followed by the noun phrase it addresses`, [k]);
        return null;
      }
      this.roleSpan(np.start, np.end, "VOCATIVE");
      let voc = { ...np, start: k };
      for (; ; ) {
        if (!this.isPunct(this.i, ",") || this.is(this.i + 1, "vocative")) break;
        const save = this.i;
        const mark = this.findings.length;
        this.i += 1;
        const ap = this.npStart(this.i) && !this.clauseAhead(this.i) ? this.parseNP() : null;
        if (ap !== null && (this.isPunct(this.i, ",") || this.onlyEndPunct())) {
          this.role(save, "PUNCT");
          this.roleSpan(ap.start, ap.end, "VOCATIVE");
          voc = { ...voc, end: ap.end };
          continue;
        }
        this.findings.length = mark;
        this.i = save;
        for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        break;
      }
      return voc;
    }
    /**
     * Noun phrases set off by commas that rename the subject just read, the last
     * comma closing them before the predicate (3.0:G130). Nothing is consumed
     * unless the whole pattern holds.
     */
    parseAppositions(role) {
      const save = this.i;
      const mark = this.findings.length;
      let n = 0;
      while (this.isPunct(this.i, ",") && this.npStart(this.i + 1) && !this.is(this.i + 1, "vocative")) {
        const c = this.i;
        this.i += 1;
        const np = this.parseNP();
        const closed = np !== null && (this.isPunct(this.i, ",") || np.relative !== null && this.isPunct(this.i - 1, ","));
        if (np === null || !closed) {
          this.i = c;
          break;
        }
        this.role(c, "PUNCT");
        this.roleSpan(np.start, np.end, role);
        n += 1;
        if (!this.isPunct(this.i, ",")) break;
      }
      if (n > 0 && this.isPunct(this.i, ",") && this.predicateStart(this.i + 1)) {
        this.role(this.i, "PUNCT");
        this.i += 1;
        return true;
      }
      if (n > 0 && this.isPunct(this.i - 1, ",") && this.predicateStart(this.i)) return true;
      this.findings.length = mark;
      this.i = save;
      for (let x = save; x < this.t.length; x++) this.roles.delete(x);
      return false;
    }
    /** ola-modo [TENSE] miyo: the liturgical formula, opened without a comma (3.0:G133). */
    formulaAt(k) {
      const f = this.ix.source.rules.formula;
      if (f === void 0 || this.w(k) !== f.opener) return false;
      const n = this.opSlot(k + 1) === "TENSE" ? k + 2 : k + 1;
      return this.w(n) === f.word;
    }
    /** X krotiapo X: one X after another, a bare noun or number repeated (3.0:G140). */
    distributiveAt(k) {
      const d = this.ix.source.rules.distributive;
      return d !== void 0 && this.isWord(k) && this.w(k + 1) === d.word && this.w(k + 2) === this.w(k) && (this.is(k, "noun") || this.is(k, "num"));
    }
    // --------------------------------------------------------------- operators
    /** A run of preverbal operators, in the order of the template (1.0:G1, 1.0:G16). */
    parseOps(clause, into) {
      const run = [];
      for (; ; ) {
        const k = this.i;
        let slot = this.opSlot(k);
        if (slot === void 0 && this.is(k, "scope") && (this.verbish(k + 1) || this.is(k + 1, "op")))
          slot = "SCOPE";
        if (slot === void 0) break;
        if (slot === "ITERATION" && !this.predicateStart(k + 1)) break;
        if (slot === "APPROACH" && !this.predicateStart(k + 1)) break;
        run.push({ at: k, slot });
        this.i += 1;
      }
      for (const o of run) this.role(o.at, o.slot === "SCOPE" ? "ADJUNCT" : o.slot);
      let last = -1;
      const seen = /* @__PURE__ */ new Map();
      for (const o of run) {
        const rank = OP_ORDER.indexOf(o.slot);
        if (seen.has(o.slot) && o.slot !== "NEGATION")
          this.find("1.0:G16", `two ${o.slot.toLowerCase()} words in one clause`, [
            seen.get(o.slot) ?? o.at,
            o.at
          ]);
        seen.set(o.slot, o.at);
        if (o.slot === "NEGATION" || o.slot === "SCOPE") continue;
        if (rank < last)
          this.find(
            "1.0:G1",
            `${this.w(o.at)} (${o.slot.toLowerCase()}) is out of the template's order`,
            [o.at]
          );
        last = Math.max(last, rank);
      }
      const ne = run.find((o) => o.slot === "NEGATION");
      const tense = run.find((o) => o.slot === "TENSE" || o.slot === "REALITY");
      if (ne !== void 0 && tense !== void 0 && ne.at < tense.at)
        this.find(
          "1.0:G1",
          `ne stands after ${this.w(tense.at)}`,
          [ne.at, tense.at],
          "error",
          `${this.w(tense.at)} ne`
        );
      const words = run.map((o) => this.w(o.at));
      for (const [a, b] of this.ix.exclusions) {
        if (words.includes(a) && words.includes(b))
          this.find(
            "1.0:G16",
            `${a} and ${b} never share a clause`,
            run.filter((o) => [a, b].includes(this.w(o.at))).map((o) => o.at)
          );
      }
      const preverbal = run.filter((o) => o.slot !== "NEGATION" && o.slot !== "SCOPE").length;
      if (preverbal > this.ix.maxOps)
        this.find(
          "1.0:G16",
          `${String(preverbal)} operators before one verb; at most ${String(this.ix.maxOps)} are recommended`,
          run.map((o) => o.at),
          "warn"
        );
      const po = run.find((o) => this.w(o.at) === "po");
      const viki = run.find((o) => this.w(o.at) === "viki");
      if (po !== void 0 && viki !== void 0 && !run.some((o) => this.w(o.at) === "noma"))
        this.find(
          "2.5:G114",
          "'would have' is po noma viki: po viki without noma is not a form",
          [po.at, viki.at],
          "error",
          "po noma viki"
        );
      clause[into].push(...run);
    }
    // ---------------------------------------------------------------- clauses
    /** One clause's core: [ki-word] SUBJECT OPERATORS PREDICATE [OBJECT] ADJUNCTS CLOSING. */
    parseClauseCore(clause, ctx) {
      const k0 = this.i;
      if (this.is(k0, "kiword") && !this.predicateStart(k0 + 1) && this.npStart(k0 + 1) && !(this.w(k0) === "ki-eli" || this.w(k0) === "ki-muya")) {
        const save = this.i;
        this.i += 1;
        const subj = this.parseNP();
        if (subj !== null && (this.predicateStart(this.i) || this.is(this.i, "prep") || this.is(this.i, "scope"))) {
          clause.kiFront = k0;
          this.role(k0, "KI-WORD");
          clause.subject = subj;
          this.roleSpan(subj.start, subj.end, "SUBJECT");
        } else {
          this.i = save;
        }
      }
      if (clause.kind === "main" && clause.subject === null && clause.kiFront === null && this.w(this.i) === "raho" && !this.predicateStart(this.i + 1) && this.clauseAhead(this.i + 1)) {
        clause.kiFront = this.i;
        this.role(this.i, "KI-WORD");
        this.i += 1;
      }
      if (clause.kind === "main" && clause.subject === null && this.w(this.i) === "raho" && this.predicateStart(this.i + 1)) {
        const r = this.i;
        this.role(r, "SUBJECT");
        clause.subject = {
          start: r,
          end: r + 1,
          head: r,
          headKind: "kiword",
          det: null,
          quant: null,
          ord: null,
          num: null,
          adjectives: [],
          degrees: [],
          de: null,
          relative: null,
          refl: null,
          plural: false
        };
        this.i += 1;
      }
      let formula = false;
      if (clause.subject === null && this.formulaAt(this.i)) {
        this.role(this.i, "FRAME");
        clause.frame.push(this.i);
        this.i += 1;
        formula = true;
      }
      const emph = this.ix.source.rules.emphatic;
      if (clause.subject === null && ctx.subjectFound !== void 0 && ctx.subjectFound !== null) {
        clause.subject = ctx.subjectFound;
      } else if (clause.subject === null && !ctx.noSubject && !formula) {
        if (emph !== void 0 && this.w(this.i) === emph.word) {
          this.find(
            emph.ruling,
            `${emph.word} needs a pronoun or noun phrase before it (saivo ${emph.word} …)`,
            [this.i]
          );
          this.role(this.i, "SUBJECT");
          this.i += 1;
        } else if (this.w(this.i) === this.ix.source.rules.command.hortative) {
          this.role(this.i, "SUBJECT");
          this.i += 1;
        } else if (this.w(this.i) === "ne" && this.npStart(this.i + 1) && !this.is(this.i + 1, "op") && !this.verbish(this.i + 1)) {
          const neAt = this.i;
          this.i += 1;
          const subj = this.parseNP();
          if (subj !== null && this.predicateStart(this.i)) {
            this.role(neAt, "NEGATION");
            clause.subject = { ...subj, start: neAt };
            this.roleSpan(subj.start, subj.end, "SUBJECT");
          } else this.i = neAt;
        } else if ((this.is(this.i, "timeAdv") || this.is(this.i, "placeAdv")) && this.is(this.i + 1, "copula")) {
          const a = this.i;
          clause.subject = {
            start: a,
            end: a + 1,
            head: a,
            headKind: "correlative",
            det: null,
            quant: null,
            ord: null,
            num: null,
            adjectives: [],
            degrees: [],
            de: null,
            relative: null,
            refl: null,
            plural: false
          };
          this.role(a, "SUBJECT");
          this.i += 1;
        } else if (this.npStart(this.i) && !this.verbStartsHere()) {
          const save = this.i;
          const subj = this.parseNP({ allowBareAdj: true });
          if (subj !== null) {
            clause.subject = subj;
            this.roleSpan(subj.start, subj.end, "SUBJECT");
          } else this.i = save;
        }
      }
      const ap = this.ix.source.rules.apposition;
      if (clause.subject !== null && ap !== void 0 && this.isPunct(this.i, ","))
        this.parseAppositions("SUBJECT");
      else if (clause.subject !== null && ap !== void 0 && this.is(this.i, "det") && this.npStart(this.i)) {
        const save = this.i;
        const mark = this.findings.length;
        const np2 = this.parseNP();
        if (np2 !== null && this.predicateStart(this.i)) {
          this.findings.length = mark;
          this.find(
            ap.ruling,
            "an apposition is set off by commas: a second noun phrase renaming the subject stands between commas",
            [np2.start],
            "error",
            ","
          );
          this.roleSpan(np2.start, np2.end, "SUBJECT");
        } else {
          this.findings.length = mark;
          this.i = save;
          for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        }
      }
      if (clause.subject !== null && this.is(this.i, "timeAdv") && (this.predicateStart(this.i + 1) || this.verbish(this.i + 1))) {
        this.find(
          "2.5:G126",
          `${this.w(this.i)} between the subject and the ${this.is(this.i + 1, "op") ? "operators" : "verb"} has no slot in the template: a time word opens the clause as its FRAME or stands among the closing adjuncts`,
          [this.i],
          "error"
        );
        this.role(this.i, "ADJUNCT");
        clause.adjuncts.push({
          kind: "time",
          start: this.i,
          end: this.i + 1,
          head: this.i,
          np: null,
          clause: null
        });
        this.i += 1;
      }
      this.parseOps(clause, "ops");
      if (this.w(this.i) === "la" && (this.adjish(this.i + 1) || this.is(this.i + 1, "degree")) && this.verbish(this.i + (this.is(this.i + 1, "degree") ? 3 : 2))) {
        const la = this.i;
        this.i += this.is(this.i + 1, "degree") ? 3 : 2;
        this.roleSpan(la, this.i, "ADJUNCT");
        this.find(
          "2.5:G105",
          "la + adjective stands among the adjuncts, after the verb and the object",
          [la],
          "error"
        );
        clause.adjuncts.push({
          kind: "la",
          start: la,
          end: this.i,
          head: la,
          np: null,
          clause: null
        });
      }
      const v = this.i;
      if (this.is(v, "copula")) {
        clause.verb = v;
        this.role(v, "COPULA");
        this.i += 1;
        const w = this.w(v);
        clause.predKind = w === "loya" ? "become" : w === "miyo" ? "existential" : "copula";
        const being = this.ix.source.rules.absolute_being;
        if (clause.predKind === "existential") {
          const np = this.parseNP();
          const kiSubject = clause.subject === null && clause.linker !== null && this.kiNoun(clause.linker);
          if (np === null && being !== void 0 && (clause.subject !== null || formula || kiSubject)) ;
          else if (np === null) this.find("0.8:G7", "miyo needs a noun phrase after it", [v]);
          else {
            clause.object = np;
            this.roleSpan(np.start, np.end, "OBJECT");
          }
        } else if (being !== void 0 && !ctx.gap && // a place or time word as the subject keeps its own diagnosis (2.5:G93)
        clause.subject?.headKind !== "correlative" && being.copulas_needing_a_predicate.includes(w) && (this.atEnd() || this.isPunct(this.i, ","))) {
          this.find(
            being.ruling,
            `${w} needs a predicate; bare being is ${being.word} (… ${being.word})`,
            [v],
            "error",
            being.word
          );
        } else {
          this.parsePredicate(clause, v);
        }
      } else if (this.is(v, "valency")) {
        this.parseValency(clause, v);
      } else if (this.is(v, "passive")) {
        clause.verb = v;
        clause.predKind = "passive";
        this.role(v, "VERB");
        this.i += 1;
        if (this.verbish(this.i)) {
          clause.innerVerb = this.i;
          this.role(this.i, "VERB");
          this.checkPassiveVerb(this.i);
          this.i += 1;
        } else this.find("2.5:G110", "gome is followed by a verb", [v]);
        if (this.w(this.i) === this.ix.source.rules.passive.agent) {
          const g = this.i;
          this.role(g, "ADJUNCT");
          this.i += 1;
          const ag = this.parseNP();
          if (ag === null) this.find("0.8:G7", "gagu needs the agent after it", [g]);
          else {
            clause.agent = ag;
            this.roleSpan(ag.start, ag.end, "ADJUNCT");
          }
        }
      } else if (this.verbish(v) && this.isWord(v)) {
        clause.verb = v;
        clause.predKind = "verb";
        this.role(v, "VERB");
        this.i += 1;
        this.parseObject(clause, ctx);
      } else if (clause.subject !== null && this.is(v, "prep") && !this.verbish(v)) {
        const pp = this.parsePP();
        if (pp !== null && this.predicateStart(this.i)) {
          this.find(
            "2.5:G98",
            `a ${this.w(v)} phrase stands between the subject and the verb: a noun phrase takes de or a raho clause after it (… raho ke ${this.w(v)} …)`,
            [v]
          );
          this.roleSpan(pp.start, pp.end, "SUBJECT");
          clause.adjuncts.push(pp);
          this.parseOps(clause, "ops");
          const v2 = this.i;
          if (this.is(v2, "copula")) {
            clause.verb = v2;
            this.role(v2, "COPULA");
            this.i += 1;
            clause.predKind = "copula";
            this.parsePredicate(clause, v2);
          } else if (this.verbish(v2)) {
            clause.verb = v2;
            clause.predKind = "verb";
            this.role(v2, "VERB");
            this.i += 1;
            this.parseObject(clause, ctx);
          }
        } else if (pp !== null) {
          const ac = this.ix.source.rules.acclamation;
          const acclaimed = ac !== void 0 && this.w(v) === ac.preposition && this.acclamationEnds(ac.mark);
          if (!acclaimed)
            this.find(
              "2.5:G128",
              `a ${this.w(v)} phrase as the predicate needs ke or ka (SUBJECT ke ${this.w(v)} …)`,
              [v],
              "error",
              `ke ${this.w(v)}`
            );
          this.roleSpan(pp.start, pp.end, "PREDICATE");
          clause.predicate = {
            kind: "pp",
            start: pp.start,
            end: pp.end,
            degree: null,
            tonsi: null,
            np: pp.np,
            prep: pp.head
          };
          clause.predKind = "copula";
        }
      } else if (clause.subject !== null && this.adjish(v)) {
        clause.predKind = "bare-adjective";
        const s = this.i;
        this.parseAdjP(clause);
        const objectAhead = this.w(this.i) === "raho" || this.w(this.i) === "fime" || this.npStart(this.i) && !this.is(this.i, "prep") && !this.is(this.i, "timeAdv") && !this.is(this.i, "placeAdv");
        const verb = this.verbOfWord(s);
        if (objectAhead && verb !== null && clause.predicate?.degree === null) {
          this.find(
            "2.5:G126",
            `${this.w(s)} is an adjective where the verb belongs: ${verb}`,
            [s],
            "error",
            verb
          );
          clause.predKind = "verb";
          clause.verb = s;
          this.parseObject(clause, {});
        }
        if (clause.ops.length > 0)
          this.find(
            "2.5:G128",
            "a bare adjective predicate takes no operators: use ke or ka",
            [...clause.ops.map((o) => o.at), s],
            "error",
            `${clause.ops.map((o) => this.w(o.at)).join(" ")} ke`
          );
      } else if (v < this.t.length && this.isWord(v)) {
        const r = this.readings(v);
        const neFragment = clause.subject === null && clause.ops.length > 0 && clause.ops.every((o) => o.slot === "NEGATION");
        if (!neFragment && (clause.ops.length > 0 || clause.subject !== null) && r.some((x) => x.pos === "noun" || x.pos === "adj")) {
          const verb = this.verbOfWord(v);
          if (clause.ops.length > 0 || clause.subject !== null) {
            if (verb !== null && clause.ops.length > 0) {
              this.find(
                "2.5:G126",
                `${this.w(v)} is not a verb form; the verb slot takes a verb (${verb})`,
                [v],
                "error",
                verb
              );
              clause.verb = v;
              clause.predKind = "verb";
              this.role(v, "VERB");
              this.i += 1;
              this.parseObject(clause, ctx);
            } else if (clause.subject !== null && this.nounish(v) && !this.is(v, "verb")) {
              const np = this.parseNP();
              if (np !== null) {
                this.find(
                  "2.5:G128",
                  "a noun-phrase predicate needs ke or ka",
                  [np.start],
                  "error",
                  "ke"
                );
                clause.predicate = {
                  kind: "np",
                  start: np.start,
                  end: np.end,
                  degree: null,
                  tonsi: null,
                  np
                };
                clause.predKind = "copula";
                this.roleSpan(np.start, np.end, "PREDICATE");
              }
            }
          }
        }
      }
      const onlyNe = clause.ops.length > 0 && clause.ops.every((o) => o.slot === "NEGATION");
      if (clause.predKind === "none" && onlyNe && (this.npStart(this.i) || this.w(this.i) === "la" || this.is(this.i, "attitude") || this.is(this.i, "timeAdv") || this.is(this.i, "placeAdv") || this.is(this.i, "mannerAdv") || this.adjish(this.i) || this.atEnd() || this.isPunct(this.i, ","))) {
        if (this.npStart(this.i)) {
          const np = this.parseNP({ adverbHead: true });
          if (np !== null) {
            this.roleSpan(np.start, np.end, clause.subject === null ? "PREDICATE" : "OBJECT");
            if (clause.subject === null)
              clause.predicate = {
                kind: "np",
                start: np.start,
                end: np.end,
                degree: null,
                tonsi: null,
                np
              };
            else clause.object = np;
          }
        } else if (this.adjish(this.i)) this.parseAdjP(clause);
        else if (this.is(this.i, "attitude")) this.parseClosing(clause);
        else if (this.w(this.i) === "la") this.parseAdjuncts(clause);
        else if (!this.atEnd() && !this.isPunct(this.i)) {
          this.role(this.i, "ADJUNCT");
          clause.adjuncts.push({
            kind: "time",
            start: this.i,
            end: this.i + 1,
            head: this.i,
            np: null,
            clause: null
          });
          this.i += 1;
        }
      } else if (clause.ops.length > 0 && clause.predKind === "none" && !this.isPunct(this.i, "—") && !this.isPunct(this.i, "–"))
        this.find(
          "2.5:G126",
          "the operators have no verb after them",
          clause.ops.map((o) => o.at)
        );
      this.parseAdjuncts(clause);
      this.parseClosing(clause);
      clause.end = this.i;
    }
    /** The sentence ends here with the mark, or after a comma-set iya vocative (3.0:G137). */
    acclamationEnds(mark) {
      const last = [...this.t].reverse().find((t) => t.kind === "punct")?.text ?? "";
      if (!last.includes(mark)) return false;
      return this.onlyEndPunct() || this.isPunct(this.i, ",") && this.is(this.i + 1, "vocative");
    }
    /** A verb starts here (so the word is not a subject): ne + verb, or a verb with no noun reading. */
    verbStartsHere() {
      const k = this.i;
      if (this.w(k) === "ne" && (this.verbish(k + 1) || this.is(k + 1, "op"))) return true;
      return this.verbish(k) && !this.nounish(k) && !this.adjish(k);
    }
    checkPassiveVerb(i) {
      const form = this.w(i);
      if (this.ix.transitive.size > 0 && !this.ix.transitive.has(form))
        this.find(
          "2.5:G110",
          `gome passivises a verb attested with an object; ${form} is not attested with one in the data`,
          [i],
          "warn"
        );
    }
    parseValency(clause, v) {
      clause.verb = v;
      clause.predKind = "valency";
      this.role(v, "VERB");
      this.i += 1;
      const actor = this.parseNP();
      if (actor === null) {
        this.find(
          "2.5:G109",
          `${this.w(v)} needs its actor and a verb: CAUSER ${this.w(v)} ACTOR VERB`,
          [v]
        );
        return;
      }
      clause.actor = actor;
      this.roleSpan(actor.start, actor.end, "ACTOR");
      const before = clause.actorOps.length;
      this.parseOps(clause, "actorOps");
      const allowed = this.ix.source.rules.valency.actor_slots;
      for (const o of clause.actorOps.slice(before)) {
        if (!allowed.includes(o.slot))
          this.find("2.5:G109", `${this.w(o.at)} belongs to the main clause, before ${this.w(v)}`, [
            o.at
          ]);
      }
      if (this.is(this.i, "copula")) {
        clause.innerVerb = this.i;
        this.role(this.i, "COPULA");
        this.i += 1;
        const inner = emptyClause$2("chain", this.i, null);
        this.parsePredicate(inner, this.i - 1);
        clause.predicate = inner.predicate;
      } else if (this.verbish(this.i)) {
        clause.innerVerb = this.i;
        this.role(this.i, "VERB");
        this.i += 1;
        const inner = emptyClause$2("chain", this.i, null);
        this.parseObject(inner, {});
        clause.object = inner.object;
        clause.objectClause = inner.objectClause;
        clause.recipient = inner.recipient;
      } else {
        this.find("2.5:G109", `${this.w(v)} ACTOR is followed by the actor's verb`, [v]);
      }
    }
    /** After a copula: one predicate, or several joined by ata / oro (and commas before the last). */
    parsePredicate(clause, cop) {
      this.parsePredicateOne(clause, cop);
      const first = clause.predicate;
      const parts = first === null ? [] : [first];
      for (let guard = 0; guard < 8; guard++) {
        const k = this.i;
        const joined = (this.w(k) === "ata" || this.w(k) === "oro") && (this.adjish(k + 1) || this.npStart(k + 1)) && !this.clauseAhead(k + 1);
        const listed = this.isPunct(k, ",") && (this.adjish(k + 1) || this.npStart(k + 1)) && /^(ata|oro)$/.test(this.w(k + 2)) || this.isPunct(k, ",") && (this.adjish(k + 1) || this.nounish(k + 1)) && (this.w(k + 2) === "ata" || this.w(k + 2) === "oro" || this.isPunct(k + 2, ","));
        if (!joined && !listed) break;
        this.role(k, joined ? "LINKER" : "PUNCT");
        this.i += 1;
        this.parsePredicateOne(clause, cop);
        if (clause.predicate !== null && clause.predicate !== parts[parts.length - 1])
          parts.push(clause.predicate);
      }
      if (first !== null && clause.predicate !== null)
        clause.predicate = {
          ...first,
          end: clause.predicate.end,
          ...parts.length > 1 ? { parts } : {}
        };
    }
    parsePredicateOne(clause, cop) {
      const k = this.i;
      if (this.w(k) === "sidu" && this.verbish(k + 1))
        this.find(
          "open_questions",
          `${this.w(cop)} sidu + verb ("destined to") is an open question: hold until a second use`,
          [cop, k],
          "unruled"
        );
      let ne;
      if (this.w(k) === "ne" && (this.adjish(k + 1) || this.npStart(k + 1))) {
        this.role(k, "NEGATION");
        ne = k;
        this.i += 1;
      }
      const s = this.i;
      this.parsePredicateBody(clause, cop, s);
      if (ne !== void 0 && clause.predicate !== null)
        clause.predicate = { ...clause.predicate, ne };
    }
    parsePredicateBody(clause, cop, s) {
      if (this.is(s, "kiword") && this.w(s) === "ki-modo") {
        this.role(s, "PREDICATE");
        this.i += 1;
        this.parseAdjP(clause);
        clause.predicate = { kind: "kiword", start: s, end: this.i, degree: s, tonsi: null };
        return;
      }
      if (this.is(s, "kiword") && !this.npStart(s)) {
        this.role(s, "PREDICATE");
        this.i += 1;
        clause.predicate = { kind: "kiword", start: s, end: this.i, degree: null, tonsi: null };
        return;
      }
      if (this.is(s, "degree") && !this.adjish(s + 1) && this.nounish(s + 1) && !this.ix.source.rules.comparison.amount_words.includes(this.w(s))) {
        const adj = this.adjectiveOf(s + 1);
        this.find(
          "2.5:G98",
          `${this.w(s)} is a degree word: it stands before an adjective, and ${this.w(s + 1)} is a noun${adj === null ? "" : ` (its adjective is ${adj})`}`,
          [s, s + 1],
          "error",
          adj ?? void 0
        );
        this.roleSpan(s, s + 2, "PREDICATE");
        this.i += 2;
        clause.predicate = { kind: "adj", start: s, end: this.i, degree: s, tonsi: null };
        return;
      }
      if (this.w(s) === "tonsi" || this.adjish(s) || this.is(s, "degree") && this.adjish(s + 1)) {
        const save = this.i;
        const probe = this.parseAdjP(clause);
        if (probe && !this.nounish(this.i)) return;
        this.i = save;
        clause.predicate = null;
      }
      if (this.is(s, "prep") || this.is(s, "side")) {
        const a = this.parsePP();
        if (a !== null) {
          clause.predicate = {
            kind: "pp",
            start: a.start,
            end: a.end,
            degree: null,
            tonsi: null,
            np: a.np,
            prep: a.head
          };
          this.roleSpan(a.start, a.end, "PREDICATE");
          return;
        }
      }
      if (this.is(s, "placeAdv") || this.is(s, "timeAdv")) {
        this.role(s, "PREDICATE");
        this.i += 1;
        clause.predicate = { kind: "adv", start: s, end: this.i, degree: null, tonsi: null };
        return;
      }
      const np = this.parseNP();
      if (np !== null) {
        clause.predicate = {
          kind: "np",
          start: np.start,
          end: np.end,
          degree: null,
          tonsi: null,
          np
        };
        this.roleSpan(np.start, np.end, "PREDICATE");
        return;
      }
      if (clause.kiFront !== null || clause.kind === "relative") return;
      if (this.verbish(s))
        this.find(
          "2.5:G93",
          `${this.w(cop)} is followed by an adjective, a noun phrase or a place, not a verb`,
          [s]
        );
      else this.find("2.5:G93", `${this.w(cop)} needs its predicate`, [cop]);
    }
    /** [tonsi] [DEGREE] ADJECTIVE, with tamo / gase / fime / sidu after it. */
    parseAdjP(clause) {
      const s = this.i;
      let tonsi = null;
      if (this.w(s) === "tonsi" && (this.adjish(s + 1) || this.is(s + 1, "degree"))) {
        tonsi = s;
        this.role(s, "PREDICATE");
        this.i += 1;
      }
      let degree = null;
      if (this.is(this.i, "degree") && this.adjish(this.i + 1)) {
        degree = this.i;
        this.role(this.i, "PREDICATE");
        this.i += 1;
      }
      if (!this.adjish(this.i)) {
        this.i = s;
        return false;
      }
      this.role(this.i, "PREDICATE");
      this.i += 1;
      clause.predicate = { kind: "adj", start: s, end: this.i, degree, tonsi };
      if (this.w(this.i) === "sidu" && this.verbish(this.i + 1)) {
        const sd = this.i;
        this.role(sd, "ADJUNCT");
        this.i += 1;
        this.role(this.i, "VERB");
        const vb = this.i;
        this.i += 1;
        const chain = emptyClause$2("chain", vb, sd);
        chain.verb = vb;
        chain.predKind = "verb";
        if (this.npStart(this.i)) {
          const obj = this.parseNP();
          if (obj !== null) {
            chain.object = obj;
            this.roleSpan(obj.start, obj.end, "OBJECT");
            const dummy = this.ix.source.rules.adjective_sidu.dummy;
            if (clause.subject !== null && this.w(clause.subject.head ?? -1) === dummy)
              this.find(
                "2.5:G111",
                `no dummy ${dummy}: the thing described is the subject and the verb's understood object (${this.w(obj.head ?? obj.start)} ke … sidu ${this.w(vb)})`,
                [clause.subject.start, obj.start]
              );
          }
        }
        clause.subordinates.push(chain);
      }
      return true;
    }
    /** OBJECT after a verb: a recipient pronoun + theme, a noun phrase, or a clause. */
    parseObject(clause, ctx) {
      const k = this.i;
      if (this.w(k) === "sidu") {
        this.parseChain(clause);
        return;
      }
      if (this.w(k) === "fime" || this.w(k) === "ki-oro") {
        clause.objectClause = this.parseSubClause("content");
        return;
      }
      if (this.w(k) === "raho") {
        clause.objectClause = this.parseSubClause("relative");
        return;
      }
      if (this.is(k, "kiword") && this.w(k) !== "ki-oro" && this.clauseAhead(k + 1)) {
        const sub = this.parseSubClause("content");
        clause.objectClause = sub;
        return;
      }
      if (this.is(k, "kiword") && !this.npStart(k)) return;
      if (this.w(k) === "ne" && this.npStart(k + 1)) {
        this.role(k, "NEGATION");
        this.i += 1;
        const np = this.parseNP();
        if (np !== null) {
          clause.object = { ...np, start: k };
          this.roleSpan(np.start, np.end, "OBJECT");
        }
        return;
      }
      if (!this.npStart(k) || this.is(k, "prep") && !this.nounish(k)) return;
      if (this.is(k, "timeAdv") && !this.is(k, "noun")) return;
      if (this.is(k, "placeAdv") || this.is(k, "mannerAdv")) return;
      if (this.side(k) && this.npStart(k + 1)) return;
      const first = this.parseNP();
      if (first === null) return;
      if (this.npStart(this.i) && this.w(this.i) !== "sidu" && !this.is(this.i, "prep") && !this.is(this.i, "timeAdv") && !this.is(this.i, "placeAdv") && first.headKind !== "adj") {
        const save = this.i;
        const second = this.parseNP();
        if (second !== null) {
          clause.recipient = first;
          clause.object = second;
          this.roleSpan(first.start, first.end, "RECIPIENT");
          this.roleSpan(second.start, second.end, "OBJECT");
          this.checkRecipient(clause, first);
          return;
        }
        this.i = save;
      }
      clause.object = first;
      this.roleSpan(first.start, first.end, "OBJECT");
      const subj = clause.subject;
      if (subj !== null && subj.headKind === "pron" && first.headKind === "pron" && first.refl === null && first.de === null && this.w(subj.head ?? -1) === this.w(first.head ?? -2))
        this.find(
          "function_words:sela",
          `the object is the subject itself: a reflexive takes sela (${this.w(first.head ?? -1)} sela)`,
          [first.start],
          "warn",
          `${this.w(first.head ?? -1)} sela`
        );
    }
    checkRecipient(clause, rec) {
      const verb = this.w(clause.innerVerb ?? clause.verb ?? -1).replace(/^[a-z]+-/, "");
      if (rec.headKind !== "pron") {
        this.find(
          "2.5:G112",
          "a recipient that is not a pronoun takes ala after the theme: VERB THEME ala RECIPIENT",
          [rec.start],
          "error"
        );
        return;
      }
      const approved = verb in this.ix.source.flags.give_type;
      if (!approved) {
        const draft = this.ix.source.rules.recipient.draft_tags.verbs.includes(verb);
        this.find(
          "2.5:G112",
          `a bare pronoun recipient after ${verb}: the verbs whose meaning has a recipient are awaiting the author's approval${draft ? " (drafted)" : " (not in the draft)"}`,
          [rec.start],
          "unruled"
        );
      }
    }
    parseChain(clause) {
      const sd = this.i;
      this.role(sd, "ADJUNCT");
      this.i += 1;
      if (this.is(this.i, "copula")) {
        this.find("0.8:G6", "sidu joins two verbs; it is never followed by a copula", [sd, this.i]);
      }
      const chain = emptyClause$2("chain", this.i, sd);
      this.parseOps(chain, "ops");
      if (this.verbish(this.i)) {
        chain.verb = this.i;
        chain.predKind = "verb";
        this.role(this.i, "VERB");
        this.i += 1;
        this.parseObject(chain, {});
      } else {
        this.find("0.8:G6", "sidu needs a verb after it", [sd]);
      }
      chain.end = this.i;
      clause.adjuncts.push({
        kind: "chain",
        start: sd,
        end: this.i,
        head: sd,
        np: null,
        clause: chain
      });
    }
    parsePP() {
      const p = this.i;
      const side = this.w(p) in this.ix.source.flags.side_nouns_as_prepositions;
      if (!(this.is(p, "prep") || side)) return null;
      if (side && !this.npStart(p + 1)) return null;
      this.i += 1;
      const np = this.parseNP({ adverbHead: true });
      if (np === null) {
        if (side) {
          this.i = p;
          return null;
        }
        if (this.ix.source.rules.measure.heads.includes(this.w(p)) && (this.isPunct(this.i) || this.i >= this.t.length))
          return { kind: "time", start: p, end: this.i, head: p, np: null, clause: null };
        this.find("0.8:G7", `${this.w(p)} has no noun phrase after it`, [p]);
        return { kind: "pp", start: p, end: this.i, head: p, np: null, clause: null };
      }
      if (side && np.det === null && np.quant === null && np.headKind === "noun")
        this.find(
          "2.5:G99",
          `li is not dropped after ${this.w(p)}, a side noun used as a preposition`,
          [p, np.start],
          "error",
          `${this.w(p)} li ${this.w(np.start)}`
        );
      if (this.ix.source.rules.measure.heads.includes(this.w(p)) && np.quant !== null)
        this.find(
          "2.5:G108",
          `a measure after ${this.w(p)} with a quantifier: the listed quantifiers are awaiting the author`,
          [p, np.quant],
          "unruled"
        );
      return { kind: "pp", start: p, end: this.i, head: p, np, clause: null };
    }
    /** ADJUNCTS: prepositional phrases, la + adjective, time, place, comparison … */
    parseAdjuncts(clause) {
      for (; ; ) {
        const k = this.i;
        if (k >= this.t.length || !this.isWord(k)) return;
        const w = this.w(k);
        if (this.isClosing(k) || this.startsSubordinate(k) || w === "ata" || w === "nara" || w === "oro")
          return;
        if (w === "la") {
          this.role(k, "ADJUNCT");
          this.i += 1;
          let degree;
          let adj;
          if (this.is(this.i, "degree")) {
            degree = this.i;
            this.role(this.i, "ADJUNCT");
            this.i += 1;
          }
          if (this.adjish(this.i)) {
            adj = this.i;
            this.role(this.i, "ADJUNCT");
            this.i += 1;
          } else this.find("2.5:G105", "la is followed by an adjective", [k]);
          clause.adjuncts.push({
            kind: "la",
            start: k,
            end: this.i,
            head: k,
            np: null,
            clause: null,
            ...degree === void 0 ? {} : { degree },
            ...adj === void 0 ? {} : { adj }
          });
          if (this.w(this.i) === "tamo") this.parseTamo(clause);
          continue;
        }
        if (this.is(k, "degree") && this.w(k + 1) === "la") {
          this.find(
            "2.5:G105",
            `a degree word goes between la and the adjective: la ${w} …`,
            [k],
            "error"
          );
          this.role(k, "ADJUNCT");
          this.i += 1;
          continue;
        }
        if (this.ix.source.rules.comparison.amount_words.includes(w) && this.w(k + 1) === "tamo") {
          this.find(
            "2.5:G106",
            `${w} needs a noun (${w} + noun … tamo) or la + an adjective (la ${w} + adjective … tamo)`,
            [k]
          );
          this.role(k, "ADJUNCT");
          this.i += 1;
          continue;
        }
        if (w === "tamo") {
          this.parseTamo(clause);
          continue;
        }
        if (w === "gase") {
          this.role(k, "ADJUNCT");
          this.i += 1;
          let adj;
          if (this.adjish(this.i) && this.w(this.i + 1) === "gase") {
            adj = this.i;
            this.role(this.i, "ADJUNCT");
            this.role(this.i + 1, "ADJUNCT");
            this.i += 2;
          }
          const np = this.parseNP();
          if (np !== null) this.roleSpan(np.start, np.end, "ADJUNCT");
          clause.adjuncts.push({
            kind: "simile",
            start: k,
            end: this.i,
            head: k,
            np,
            clause: null,
            ...adj === void 0 ? {} : { adj }
          });
          if (np === null)
            this.find("0.8:G8", "gase needs a noun phrase or an adjective after it", [k]);
          continue;
        }
        if (w === "sidu") {
          this.find(
            "2.5:G113",
            "sidu joins a verb directly to the verb before it; purpose is kopisa",
            [k],
            "error",
            "kopisa"
          );
          this.parseChain(clause);
          continue;
        }
        if (this.ix.source.rules.measure.heads.includes(w) && (this.is(k + 1, "num") || this.is(k + 1, "quant"))) {
          this.role(k, "ADJUNCT");
          this.i += 1;
          if (this.is(this.i, "quant"))
            this.find(
              "2.5:G108",
              `a measure after ${w} with a quantifier: the listed quantifiers are awaiting the author`,
              [k, this.i],
              "unruled"
            );
          const np = this.parseNP();
          if (np !== null) this.roleSpan(np.start, np.end, "ADJUNCT");
          clause.adjuncts.push({ kind: "measure", start: k, end: this.i, head: k, np, clause: null });
          continue;
        }
        if (this.is(k, "prep") || w in this.ix.source.flags.side_nouns_as_prepositions) {
          const a = this.parsePP();
          if (a !== null) {
            this.role(k, "ADJUNCT");
            if (a.np !== null) this.roleSpan(a.np.start, a.np.end, "ADJUNCT");
            clause.adjuncts.push(a);
            continue;
          }
        }
        if (this.is(k, "timeAdv") || this.is(k, "placeAdv") || this.is(k, "mannerAdv") || this.is(k, "kiword") && !this.npStart(k)) {
          this.role(k, "ADJUNCT");
          this.i += 1;
          clause.adjuncts.push({
            kind: this.is(k, "kiword") ? "kiword" : this.is(k, "timeAdv") ? "time" : this.is(k, "placeAdv") ? "place" : "manner",
            start: k,
            end: this.i,
            head: k,
            np: null,
            clause: null
          });
          continue;
        }
        if (this.ix.source.rules.closing_order.iteration_may_close.includes(w)) {
          this.role(k, "ADJUNCT");
          this.i += 1;
          clause.adjuncts.push({
            kind: "iteration",
            start: k,
            end: this.i,
            head: k,
            np: null,
            clause: null
          });
          continue;
        }
        if (clause.kind === "relative" && this.is(k, "op") && (this.predicateStart(k + 1) || this.verbish(k + 1)))
          return;
        if (this.ix.source.rules.closing_order.never_closing.words.includes(w)) {
          this.find(
            "2.5:G127",
            `${w} is a tense or iteration word, not a closing time word: it stands before the verb`,
            [k]
          );
          this.role(k, "ADJUNCT");
          this.i += 1;
          continue;
        }
        if (this.is(k, "scope") && w !== "ne") {
          this.role(k, "ADJUNCT");
          clause.adjuncts.push({
            kind: "time",
            start: k,
            end: k + 1,
            head: k,
            np: null,
            clause: null
          });
          this.i += 1;
          continue;
        }
        if (this.is(k, "num") && this.ix.timeNouns.has((this.t[k + 1]?.word?.lower ?? "").replace(/ri$/, ""))) {
          const np = this.parseNP();
          if (np !== null) {
            this.find(
              "I-17",
              "a duration (NUMBER + a time unit after the verb) is not ruled yet: a bare noun after a verb is its object (2.5:G103)",
              [np.start],
              "unruled"
            );
            this.roleSpan(np.start, np.end, "ADJUNCT");
            clause.adjuncts.push({
              kind: "measure",
              start: np.start,
              end: np.end,
              head: np.start,
              np,
              clause: null
            });
            continue;
          }
        }
        if (this.npStart(k) && clause.object === null && clause.objectClause === null && clause.adjuncts.length > 0 && (clause.predKind === "verb" || clause.predKind === "valency")) {
          const np = this.parseNP();
          if (np !== null) {
            const pp = clause.adjuncts[clause.adjuncts.length - 1];
            const ala = pp !== void 0 && this.w(pp.head) === "ala";
            this.find(
              ala ? "2.5:G112" : "2.5:G126",
              ala ? "the theme comes first and the recipient after it: VERB THEME ala RECIPIENT" : "the object stands right after the verb, before the adjuncts",
              [np.start],
              "error"
            );
            clause.object = np;
            this.roleSpan(np.start, np.end, "OBJECT");
            continue;
          }
        }
        if (this.npStart(k) && clause.object !== null) {
          const np = this.parseNP();
          if (np !== null) {
            this.find(
              "2.5:G112",
              "a second noun phrase after the object: a recipient that is not a pronoun takes ala (VERB THEME ala RECIPIENT)",
              [np.start]
            );
            this.roleSpan(np.start, np.end, "OBJECT");
            continue;
          }
        }
        return;
      }
    }
    parseTamo(clause) {
      const k = this.i;
      this.role(k, "ADJUNCT");
      this.i += 1;
      const np = this.parseNP();
      if (np === null) this.find("0.8:G8", "tamo needs what is compared after it", [k]);
      else this.roleSpan(np.start, np.end, "ADJUNCT");
      clause.adjuncts.push({ kind: "comparison", start: k, end: this.i, head: k, np, clause: null });
    }
    isClosing(k) {
      return this.is(k, "recip") || this.is(k, "status") || this.is(k, "attitude") || this.is(k, "ki");
    }
    /** CLOSING: [fuyi] [hoyo | yasmo] [ATTITUDE] [ki], in this order (2.5:G126). */
    parseClosing(clause) {
      const rank = { RECIPROCAL: 0, STATUS: 1, ATTITUDE: 2, QUESTION: 3 };
      let last = -1;
      for (; ; ) {
        const k = this.i;
        if (!this.isClosing(k)) break;
        const slot = this.is(k, "recip") ? "RECIPROCAL" : this.is(k, "status") ? "STATUS" : this.is(k, "attitude") ? "ATTITUDE" : "QUESTION";
        const r = rank[slot] ?? 0;
        if (r <= last && slot !== "QUESTION")
          this.find(
            "2.5:G126",
            `${this.w(k)} is out of the closing order: … ADJUNCTS fuyi hoyo|yasmo ATTITUDE ki`,
            [k]
          );
        last = Math.max(last, r);
        this.role(k, slot);
        clause.closing.push({ at: k, slot });
        this.i += 1;
        if (slot === "RECIPROCAL" && (this.is(this.i, "timeAdv") || this.is(this.i, "placeAdv") || this.is(this.i, "prep"))) {
          this.find("2.5:G126", `${this.w(this.i)} stands among the adjuncts, before fuyi`, [this.i]);
          const before = clause.adjuncts.length;
          this.parseAdjuncts(clause);
          if (clause.adjuncts.length === before) this.i += 1;
        }
      }
      const words = clause.closing.map((c) => this.w(c.at));
      for (const [a, b] of this.ix.exclusions)
        if (words.includes(a) && words.includes(b))
          this.find(
            "1.0:G16",
            `${a} and ${b} never share a clause`,
            clause.closing.map((c) => c.at)
          );
    }
    startsSubordinate(k) {
      const w = this.w(k);
      if (this.is(k, "sub") && w !== "raho") {
        if (w in this.ix.source.flags.subordinators_taking_a_noun_phrase && !this.clauseAhead(k + 1))
          return false;
        return true;
      }
      if (this.ix.source.rules.measure.heads.includes(w) && this.clauseAhead(k + 1)) return true;
      return false;
    }
    /** A clause starts here: a subject then a predicate, or a predicate. */
    clauseAhead(k) {
      const save = this.i;
      this.i = k;
      const mute = this.findings.length;
      const roles = new Map(this.roles);
      let ok = false;
      if (this.predicateStart(k) || this.formulaAt(k)) ok = true;
      else if (this.npStart(k)) {
        const np = this.parseNP({ noRelative: true });
        ok = np !== null && (this.predicateStart(this.i) || np.headKind !== "adj" && this.adjish(this.i));
      }
      this.findings.length = mute;
      this.roles.clear();
      for (const [a, b] of roles) this.roles.set(a, b);
      this.i = save;
      return ok;
    }
    /** A subordinate clause after its linker (or a relative after raho). */
    parseSubClause(kind) {
      const linker = this.i;
      this.role(linker, kind === "relative" ? "SUBORDINATE" : "SUBORDINATE");
      this.i += 1;
      this.clauseNo += 1;
      const c = emptyClause$2(kind, this.i, linker);
      this.clauses.push(c);
      const word2 = this.w(linker);
      if (kind === "relative") {
        const subjectGap = this.predicateStart(this.i) && !this.npStart(this.i);
        this.parseClauseCore(c, { noSubject: subjectGap, gap: true });
        const hasMore = c.object !== null || c.objectClause !== null || c.adjuncts.length > 0;
        if (hasMore && !this.isPunct(this.i) && this.i < this.t.length && !this.onlyEndPunct())
          this.find(
            "2.5:G115",
            "a raho clause with its own object or adjunct is closed by a comma when the sentence goes on",
            [linker, this.i],
            "error",
            ","
          );
        if (this.isPunct(this.i, ",") && !this.atEnd(this.i + 1)) {
          this.role(this.i, "PUNCT");
          this.i += 1;
        }
      } else {
        this.parseClauseCore(c, {});
        const pronounClause = c.subject !== null && c.subject.headKind === "demonstrative" && c.subject.end === c.subject.start + 1;
        if (c.predKind === "none" && pronounClause)
          this.find(
            "I-54",
            `${word2} ${this.w(c.subject?.start ?? linker)}: a demonstrative standing for a whole clause is not ruled`,
            [linker],
            "note"
          );
        else if (c.predKind === "none" && c.subject === null && this.adjish(this.i)) {
          this.parseAdjP(c);
          this.find(
            "2.5:G128",
            `the ${word2} clause has an adjective and no verb: a predicate adjective needs a subject and ke or ka`,
            [linker]
          );
        } else if (c.predKind === "none" && (c.subject === null || this.w(linker) !== "nevi"))
          this.find("2.5:G126", `the ${word2} clause has no verb`, [linker]);
        if (this.ix.source.rules.tense.own_tense.includes(word2) && !c.ops.some((o) => o.slot === "TENSE"))
          this.find("2.5:G118", `a ${word2} clause marks its own tense`, [linker], "error");
      }
      c.end = this.i;
      this.clauseNo -= 1;
      return c;
    }
    // ---------------------------------------------------------------- sentence
    parse() {
      const main = emptyClause$2("main", 0, null);
      this.clauses.push(main);
      this.parseEdgesBefore(main);
      const start = this.i;
      this.parseClauseCore(main, {});
      main.start = start;
      if (main.predKind === "none" && main.ops.length === 0) {
        while (this.isPunct(this.i, ",") && (this.npStart(this.i + 1) || this.is(this.i + 1, "attitude") || this.is(this.i + 1, "op"))) {
          this.role(this.i, "PUNCT");
          this.i += 1;
          if (this.npStart(this.i)) {
            const np = this.parseNP();
            if (np !== null) this.roleSpan(np.start, np.end, "SUBJECT");
            else this.i += 1;
          } else {
            this.role(this.i, "INTERJECTION");
            this.i += 1;
          }
        }
      }
      if (main.predKind === "none" && main.subject === null && this.i < this.t.length) {
        if (this.adjish(this.i) || this.is(this.i, "degree")) {
          const mark = this.i;
          if (!this.parseAdjP(main)) this.i = mark;
        }
        this.parseAdjuncts(main);
        this.parseClosing(main);
      }
      this.parseAfter(main);
      const unplaced = [];
      for (let k = 0; k < this.t.length; k++) {
        const tk = this.t[k];
        if (tk?.kind === "word" && !this.roles.has(k)) unplaced.push(k);
      }
      return { clauses: this.clauses, findings: this.findings, roles: this.roles, unplaced };
    }
    /** LINKER, interjections, clause adverbs, FRAME, TOPIC and preposed clauses (2.5:G126). */
    parseEdgesBefore(main, inner = false) {
      const r = this.ix.source.rules;
      const first = this.i;
      for (let guard = 0; guard < 12; guard++) {
        const k = this.i;
        const w = this.w(k);
        if ((k === 0 || inner && k === first) && r.edges.line_linkers.includes(w) && this.isWord(k + 1)) {
          this.role(k, "LINKER");
          main.linker = k;
          this.i += 1;
          continue;
        }
        if (this.is(k, "vocative")) {
          const voc = this.parseIyaVocative();
          if (voc !== null) main.address = [...main.address ?? [], voc];
          if (this.isPunct(this.i, ",")) {
            this.role(this.i, "PUNCT");
            this.i += 1;
          }
          continue;
        }
        if (this.distributiveAt(k)) {
          this.roleSpan(k, k + 3, "FRAME");
          main.frame.push(k);
          this.i = k + 3;
          if (this.isPunct(this.i, ",")) this.i += 1;
          else
            this.find(
              "2.5:G127",
              `a FRAME (${this.w(k)} krotiapo ${this.w(k)}) is set off by a comma`,
              [k],
              "warn"
            );
          continue;
        }
        if ((this.is(k, "interjection") || this.is(k, "discourse")) && (this.isPunct(k + 1, ",") || this.isPunct(k + 1, "…") || this.isPunct(k + 1, "...") || this.isPunct(k + 1, "!"))) {
          this.role(k, "INTERJECTION");
          this.i += 2;
          continue;
        }
        if (w === "fisa" && this.predicateStart(k + 1)) {
          this.role(k, "INTERJECTION");
          this.i += 1;
          continue;
        }
        if (this.is(k, "attitude") && this.isPunct(k + 1, ",") && k === first) {
          this.role(k, "INTERJECTION");
          this.i += 2;
          continue;
        }
        if (w === "la" && this.isWord(k + 1) && this.isPunct(k + 2, ",")) {
          if (!this.adjish(k + 1)) {
            const adj = this.adjectiveOf(k + 1);
            this.find(
              "2.5:G105",
              `la + adjective: ${this.w(k + 1)} is not an adjective${adj === null ? "" : ` (${adj})`}`,
              [k, k + 1],
              "error",
              adj === null ? void 0 : `la ${adj}`
            );
          }
          this.roleSpan(k, k + 2, "FRAME");
          main.frame.push(k);
          this.i += 3;
          continue;
        }
        if ((this.is(k, "interjection") || this.is(k, "discourse") || w === "ne") && (this.onlyEndPunct(k + 1) || this.is(k + 1, "prep"))) {
          this.role(k, "INTERJECTION");
          this.i += 1;
          continue;
        }
        if (this.is(k, "clauseAdv")) {
          this.role(k, "LINKER");
          main.linker = main.linker === null || this.isPunct(main.linker) ? k : main.linker;
          this.i += 1;
          if (this.isPunct(this.i, ",")) this.i += 1;
          else if (r.edges.clause_adverbs.comma_required.includes(w))
            this.find(
              "2.5:G117",
              `clause-initial ${w} is followed by a comma`,
              [k],
              "error",
              `${w},`
            );
          continue;
        }
        if (this.is(k, "frame")) {
          main.frame.push(k);
          this.role(k, "FRAME");
          this.i += 1;
          if (this.isPunct(this.i, ",")) this.i += 1;
          else
            this.find(
              "2.5:G127",
              `${w} opens its clause and is set off by a comma`,
              [k],
              "warn",
              `${w},`
            );
          continue;
        }
        if ((this.is(k, "timeAdv") || this.is(k, "placeAdv")) && (this.isWord(k + 1) || this.isPunct(k + 1, ",")) && !this.is(k + 1, "copula")) {
          if (this.isPunct(k + 1, ",")) {
            main.frame.push(k);
            this.role(k, "FRAME");
            this.i += 2;
            continue;
          }
          if (this.npStart(k + 1) || this.predicateStart(k + 1)) {
            main.frame.push(k);
            this.role(k, "FRAME");
            this.find("2.5:G127", `a FRAME (${w}) is set off by a comma`, [k], "warn", `${w},`);
            this.i += 1;
            continue;
          }
        }
        if (this.is(k, "prep") && !this.startsSubordinate(k)) {
          const save = this.i;
          const pp = this.parsePP();
          if (pp !== null && this.isPunct(this.i, ",")) {
            for (let x = pp.start; x < pp.end; x++) this.roles.delete(x);
            this.roleSpan(pp.start, pp.end, "FRAME");
            main.frame.push(pp.start);
            main.frameItems = [
              ...main.frameItems ?? [],
              { start: pp.start, end: pp.end, np: pp.np, prep: pp.head }
            ];
            this.i += 1;
            continue;
          }
          if (pp !== null && this.clauseAhead(this.i)) {
            for (let x = pp.start; x < pp.end; x++) this.roles.delete(x);
            this.roleSpan(pp.start, pp.end, "FRAME");
            main.frame.push(pp.start);
            main.frameItems = [
              ...main.frameItems ?? [],
              { start: pp.start, end: pp.end, np: pp.np, prep: pp.head }
            ];
            this.find(
              "2.5:G127",
              `a FRAME (${this.w(pp.start)} …) is set off by a comma`,
              [pp.start],
              "warn"
            );
            continue;
          }
          this.i = save;
          for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        }
        if (this.npStart(k)) {
          const save = this.i;
          const mark = this.findings.length;
          const np = this.parseNP();
          const head = np?.head ?? -1;
          const placeOrTime = np !== null && (this.ix.timeNouns.has(this.w(head)) || this.side(head) || ["place"].includes(this.ix.source.flags.noun_class[this.w(head)] ?? "") || np.de !== null && this.ix.timeNouns.has(this.w(np.de.head ?? -1)));
          if (np !== null && placeOrTime && this.isPunct(this.i, ",") && this.clauseAhead(this.i + 1)) {
            for (let x = np.start; x < np.end; x++) this.roles.delete(x);
            this.roleSpan(np.start, np.end, "FRAME");
            main.frame.push(np.start);
            main.frameItems = [...main.frameItems ?? [], { start: np.start, end: np.end, np }];
            this.i += 1;
            continue;
          }
          if (np !== null && this.w(this.i) === "hozi") {
            this.roleSpan(np.start, np.end, "TOPIC");
            this.role(this.i, "TOPIC");
            main.topic = np;
            this.i += 1;
            if (this.isPunct(this.i, ",")) this.i += 1;
            continue;
          }
          this.findings.length = mark;
          this.i = save;
          for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        }
        if (this.is(k, "scope") && this.startsSubordinate(k + 1)) {
          this.role(k, "SUBORDINATE");
          this.i += 1;
          const sub = this.parseSubClause("adverbial");
          sub.scope = k;
          main.subordinates.push(sub);
          if (this.isPunct(this.i, ",")) this.i += 1;
          continue;
        }
        if (this.npStart(k)) {
          const save = this.i;
          const mark = this.findings.length;
          const np = this.parseNP();
          if (np !== null && this.isPunct(this.i, ",") && (this.predicateStart(this.i + 1) || this.w(this.i + 1) === "fisa") && !this.npStart(this.i + 1)) {
            this.roleSpan(np.start, np.end, "VOCATIVE");
            main.vocative = np;
            this.i += 1;
            continue;
          }
          if (np !== null && k === first && this.isPunct(this.i, ",") && np.headKind !== "pron" && this.clauseAhead(this.i + 1) && this.npStart(this.i + 1)) {
            this.roleSpan(np.start, np.end, "VOCATIVE");
            main.vocative = np;
            this.find(
              "2.5:G126",
              "a vocative before the clause: 2.5:G126 places the vocative after it",
              [np.start],
              "unruled"
            );
            this.i += 1;
            continue;
          }
          this.findings.length = mark;
          this.i = save;
          for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        }
        if (this.startsSubordinate(k)) {
          const sub = this.parseSubClause("adverbial");
          main.subordinates.push(sub);
          if (this.isPunct(this.i, ",")) this.i += 1;
          continue;
        }
        break;
      }
    }
    /** After the clause: subordinate and coordinate clauses, a vocative, a quotation. */
    parseAfter(main) {
      let apposed = false;
      for (let guard = 0; guard < 24 && this.i < this.t.length; guard++) {
        const k = this.i;
        const w = this.w(k);
        if (this.isPunct(k) && /^[.!?…"”')]+$/.test(w)) {
          this.i += 1;
          continue;
        }
        if (this.isPunct(k, ",") || this.isPunct(k, ";") || this.isPunct(k, "—") || this.isPunct(k, "–")) {
          this.role(k, "PUNCT");
          const n = k + 1;
          if (this.is(n, "vocative")) {
            this.i = n;
            const voc = this.parseIyaVocative();
            if (voc !== null && this.onlyEndPunct()) main.vocative = voc;
            else if (voc !== null) main.address = [...main.address ?? [], voc];
            continue;
          }
          if (this.npStart(n)) {
            const save = this.i;
            this.i = n;
            const mark = this.findings.length;
            const np = this.parseNP();
            if (np !== null && (this.onlyEndPunct() || this.isPunct(this.i, ":") && this.onlyEndPunct(this.i + 1))) {
              if (apposed) this.roleSpan(np.start, np.end, this.roles.get(k - 1)?.role ?? "OBJECT");
              else {
                main.vocative = np;
                this.roleSpan(np.start, np.end, "VOCATIVE");
              }
              continue;
            }
            if (np !== null && this.ix.source.rules.apposition !== void 0 && this.isPunct(this.i, ",") && (this.nounish(k - 1) || this.w(k - 1) === "sela") && !this.clauseAhead(n)) {
              this.roleSpan(np.start, np.end, this.roles.get(k - 1)?.role ?? "OBJECT");
              apposed = true;
              continue;
            }
            this.findings.length = mark;
            this.i = save;
            for (let x = n; x < this.t.length; x++) this.roles.delete(x);
          }
          this.i += 1;
          const n2 = this.i;
          const w2 = this.w(n2);
          if (w2 === "fime" && main.objectClause === null) {
            this.find(
              "2.5:G116",
              'fime introduces a content clause ("that"); hopeful purpose is kopisa + a clause with nosi',
              [n2],
              "error",
              "kopisa"
            );
          }
          if (this.isClosing(n2)) {
            main.closingComma = true;
            this.parseClosing(main);
            continue;
          }
          if ((this.is(n2, "interjection") || this.is(n2, "discourse") || w2 === "ne") && (this.isPunct(n2 + 1) || n2 + 1 >= this.t.length)) {
            this.role(n2, "INTERJECTION");
            if (this.onlyEndPunct(n2 + 1)) main.trailing = [...main.trailing ?? [], n2];
            this.i += 1;
            continue;
          }
          if (w === ";" || w === "—" || w === "–") {
            this.clauseNo += 1;
            const c = emptyClause$2("coordinate", this.i, k);
            this.clauses.push(c);
            this.parseEdgesBefore(c, true);
            this.parseClauseCore(c, {});
            main.subordinates.push(c);
            this.clauseNo -= 1;
            continue;
          }
          if (main.object !== null && this.npStart(n2) && !this.clauseAhead(n2)) {
            const save2 = this.i;
            const np2 = this.parseNP();
            if (np2 !== null && (this.isPunct(this.i, ",") || this.onlyEndPunct())) {
              this.roleSpan(np2.start, np2.end, "OBJECT");
              continue;
            }
            this.i = save2;
            for (let x = save2; x < this.t.length; x++) this.roles.delete(x);
          }
          if (!this.startsSubordinate(n2) && !["ata", "nara", "oro"].includes(w2) && (this.is(n2, "prep") || this.is(n2, "comparison") || this.is(n2, "timeAdv") || this.is(n2, "placeAdv") || this.is(n2, "mannerAdv") || w2 === "la") && !this.clauseAhead(n2)) {
            const before = this.i;
            const count = main.adjuncts.length;
            this.parseAdjuncts(main);
            const added = main.adjuncts[count];
            if (added !== void 0) main.adjuncts[count] = { ...added, commaBefore: true };
            if (this.i > before) continue;
          }
          if (["ata", "nara", "oro"].includes(w2) && !this.clauseAhead(n2 + 1) && (this.npStart(n2 + 1) || this.adjish(n2 + 1))) {
            this.role(n2, "LINKER");
            this.i += 1;
            const c = emptyClause$2("coordinate", this.i, n2);
            const np = this.adjish(this.i) && !this.nounish(this.i) ? null : this.parseNP({ adverbHead: true });
            if (np !== null) {
              this.roleSpan(np.start, np.end, "OBJECT");
              c.predicate = {
                kind: "np",
                start: np.start,
                end: np.end,
                degree: null,
                tonsi: null,
                np
              };
            } else if (!this.parseAdjP(c)) this.i += 1;
            this.parseAdjuncts(c);
            c.end = this.i;
            main.subordinates.push(c);
            continue;
          }
          continue;
        }
        if (this.isPunct(k, ":")) {
          this.role(k, "PUNCT");
          this.i += 1;
          if (this.isPunct(this.i, "«q»")) {
            this.i += 1;
            this.parseClosing(main);
            continue;
          }
          this.clauseNo += 1;
          const c = emptyClause$2("coordinate", this.i, k);
          this.clauses.push(c);
          this.parseEdgesBefore(c, true);
          this.parseClauseCore(c, {});
          if (c.predKind === "none" && c.subject !== null)
            this.roleSpan(c.subject.start, c.subject.end, "OBJECT");
          main.subordinates.push(c);
          this.clauseNo -= 1;
          continue;
        }
        if (this.isClosing(k)) {
          this.parseClosing(main);
          continue;
        }
        if (this.startsSubordinate(k) || w === "fime" || w === "ki-oro") {
          const sub = this.parseSubClause(w === "fime" || w === "ki-oro" ? "content" : "adverbial");
          main.subordinates.push(sub);
          continue;
        }
        if (w === "ata" || w === "nara" || w === "oro" || this.is(k, "clauseAdv")) {
          this.role(k, "LINKER");
          this.i += 1;
          if (this.isPunct(this.i, ",")) this.i += 1;
          else if (this.ix.source.rules.edges.clause_adverbs.comma_required.includes(w))
            this.find(
              "2.5:G117",
              `clause-initial ${w} is followed by a comma`,
              [k],
              "error",
              `${w},`
            );
          this.clauseNo += 1;
          const c = emptyClause$2("coordinate", this.i, k);
          this.clauses.push(c);
          this.parseClauseCore(c, this.predicateStart(this.i) ? { noSubject: true } : {});
          main.subordinates.push(c);
          this.clauseNo -= 1;
          continue;
        }
        if (this.isWord(k) && (this.npStart(k) || this.predicateStart(k) || this.formulaAt(k)) && this.clauseAhead(k) && (main.predKind !== "none" || this.isPunct(k - 1))) {
          const prev = this.t[k - 1];
          if (prev?.kind !== "punct")
            this.find(
              "2.5:G126",
              "a second clause with no linker: join it with ata, nara, a comma or a subordinator",
              [k]
            );
          this.clauseNo += 1;
          const c = emptyClause$2("coordinate", k, null);
          this.clauses.push(c);
          this.parseClauseCore(c, {});
          main.subordinates.push(c);
          this.clauseNo -= 1;
          continue;
        }
        if (this.isWord(k) && this.isPunct(k - 1, ",") && this.ix.source.rules.apposition !== void 0 && this.npStart(k) && !this.clauseAhead(k)) {
          const save = this.i;
          const mark = this.findings.length;
          const np = this.parseNP();
          if (np !== null && (this.isPunct(this.i, ",") || this.onlyEndPunct())) {
            this.roleSpan(np.start, np.end, this.roles.get(k - 2)?.role ?? "OBJECT");
            apposed = true;
            continue;
          }
          this.findings.length = mark;
          this.i = save;
          for (let x = save; x < this.t.length; x++) this.roles.delete(x);
        }
        if (this.isWord(k)) {
          const run = [];
          while (this.isWord(this.i) && !this.isClosing(this.i) && !(run.length > 0 && this.startsSubordinate(this.i))) {
            run.push(this.i);
            this.role(this.i, "ADJUNCT");
            this.i += 1;
          }
          const firstR = this.readings(k)[0];
          let msg = `${run.map((x) => this.t[x]?.text ?? "").join(" ")}: no place in the clause template`;
          if (firstR?.pos === "verb")
            msg += "; a second verb needs a linker (sidu, fime, kopisa, ata …)";
          else if (firstR !== void 0 && (firstR.pos === "noun" || firstR.pos === "adj" || firstR.pos === "det" || firstR.pos === "pron"))
            msg += ` after the ${main.object !== null ? "object" : main.predicate !== null ? "predicate" : "verb"}: a second noun phrase needs de, a preposition or a linker`;
          this.find("2.5:G126", msg, run);
          continue;
        }
        this.i += 1;
      }
    }
  }
  const analysis = (text, readings, extra = {}) => ({
    text,
    lower: text.toLowerCase(),
    readings,
    suffixes: [],
    ...extra
  });
  function numeral(ix, w) {
    let body = w;
    let ordinal = false;
    const suffix = ix.ordinalSuffix;
    if (body.endsWith(suffix)) {
      body = body.slice(0, -suffix.length);
      ordinal = true;
    }
    const parts = body.split("-");
    if (parts.length === 0 || !parts.every((p) => ix.numerals.has(p))) return null;
    return {
      pos: ordinal ? "ord" : "num",
      form: w,
      gloss: ordinal ? `${body} (ordinal)` : body,
      source: "numeral"
    };
  }
  function times(ix, w) {
    const head = ix.timesHead;
    if (head === null || !w.endsWith(`-${head}`)) return null;
    const left = w.slice(0, -head.length - 1);
    if (left === ix.timesQuestion)
      return {
        pos: "kiword",
        form: w,
        gloss: "how many times",
        source: "correlative",
        detail: "times"
      };
    return numeral(ix, left) === null ? null : { pos: "mannerAdv", form: w, gloss: `${left} times`, source: "correlative", detail: "times" };
  }
  function derivation(ix, w) {
    const listed = ix.lexicalised.get(w);
    if (listed !== void 0)
      return {
        pos: "noun",
        form: w,
        root: listed.base,
        gloss: listed.gloss,
        source: listed.suffix === "ti" ? "diminutive-listed" : "derivation-listed",
        detail: `-${listed.suffix}`
      };
    const defaults = ix.source.ref.word_building.derivation_defaults ?? {};
    for (const suffix of ix.derivations) {
      if (!w.endsWith(suffix)) continue;
      const base = w.slice(0, -suffix.length);
      if (ix.headwords.has(base) && !ix.blocked.has(w))
        return {
          pos: "noun",
          form: w,
          root: base,
          gloss: (defaults[`-${suffix}`] ?? suffix).replace(/\bR\b/g, base),
          source: "derivation",
          detail: `-${suffix}`
        };
    }
    return null;
  }
  function stem(ix, s) {
    const out = [...ix.forms.get(s) ?? []];
    const d = derivation(ix, s);
    if (d !== null && out.length === 0) out.push(d);
    for (const r of ix.closed.get(s) ?? [])
      if (r.pos === "pron" || r.pos === "det" || r.pos === "noun") out.push(r);
    if (ix.names.has(s)) out.push({ pos: "name", form: s, gloss: "name", source: "name" });
    return out;
  }
  function readWord(ix, text, opts) {
    const w = text.toLowerCase();
    if (opts.quoted === true)
      return analysis(text, [
        {
          pos: "noun",
          form: w,
          gloss: `the word “${text}”`,
          source: "closed",
          detail: "a word quoted"
        }
      ]);
    const exact = [...ix.forms.get(w) ?? [], ...ix.closed.get(w) ?? []];
    if (exact.length > 0) {
      if (opts.capital && !opts.first && ix.names.has(w))
        exact.unshift({ pos: "name", form: text, gloss: "name", source: "name" });
      return analysis(text, exact);
    }
    const num = numeral(ix, w) ?? times(ix, w);
    if (num !== null) return analysis(text, [num]);
    const fr = /^([a-z-]+)-de-([a-z-]+)$/.exec(w);
    if (fr !== null && numeral(ix, fr[1] ?? "") !== null && numeral(ix, fr[2] ?? "") !== null)
      return analysis(text, [], { problem: { kind: "hyphenated-fraction" } });
    const d = derivation(ix, w);
    if (d !== null) return analysis(text, [d]);
    if (w.length > ix.minStripLength) {
      for (const suffixes of [["ri"], ["ti", "ri"], ["ti"]]) {
        const end = suffixes.join("");
        if (!w.endsWith(end)) continue;
        const s = w.slice(0, -end.length);
        const readings = stem(ix, s);
        if (readings.length > 0) return analysis(text, readings, { suffixes });
      }
    }
    for (const prefix of ix.prefixes) {
      for (const p of [prefix, prefix.replace(/-$/, "")]) {
        if (!w.startsWith(p) || w.length === p.length) continue;
        const rest = w.slice(p.length);
        const verbs = (ix.forms.get(rest) ?? []).filter((r) => r.pos === "verb");
        if (verbs.length > 0) {
          const curated = ix.curated.has(prefix + rest);
          return analysis(
            text,
            verbs.map((v) => ({
              ...v,
              form: prefix + rest,
              gloss: curated ? v.gloss : `${v.gloss} (${prefix} ${ix.source.ref.word_building.motion_prefixes.canon[prefix] ?? ""})`,
              source: "prefix",
              detail: curated ? "listed meaning" : "compositional"
            })),
            { prefix }
          );
        }
      }
    }
    for (const suffixes of [[], ["ri"], ["ti", "ri"], ["ti"]]) {
      const end = suffixes.join("");
      if (end !== "" && !w.endsWith(end)) continue;
      const old = ix.source.legacy[end === "" ? w : w.slice(0, -end.length)];
      if (old !== void 0 && !(end !== "" && old.to.includes(" "))) {
        const now = old.to.includes(" ") ? [] : [...ix.forms.get(old.to) ?? [], ...ix.closed.get(old.to) ?? []];
        return analysis(text, now, {
          suffixes,
          problem: { kind: "legacy", to: old.to + end, edition: old.edition ?? null }
        });
      }
    }
    const unused = ix.unlisted.get(w);
    if (unused !== void 0) {
      const pos = unused.role === "v" ? "verb" : ["n", "an", "nn"].includes(unused.role) ? "noun" : "adj";
      return analysis(
        text,
        [
          {
            pos,
            form: w,
            root: unused.root,
            role: unused.role,
            gloss: "(an unused slot: no meaning)",
            source: "listed"
          }
        ],
        { problem: { kind: "unused", ...unused } }
      );
    }
    const known = ix.names.has(w) || w.endsWith("ti") && ix.names.has(w.slice(0, -2));
    if (known || opts.capital)
      return analysis(text, [
        {
          pos: "name",
          form: text,
          gloss: "name",
          source: "name",
          // a capitalised first word could also be a misspelling: say so
          ...known || !opts.first ? {} : { detail: "unconfirmed" }
        }
      ]);
    return analysis(text, [], { problem: { kind: "unknown" } });
  }
  const WORD = /[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*/y;
  const PUNCT = /[,.;:!?…—–"“”'‘’()[\]]/y;
  function tokenize$1(line) {
    const out = [];
    let i = 0;
    while (i < line.length) {
      const c = line[i] ?? "";
      if (/\s/.test(c)) {
        i += 1;
        continue;
      }
      WORD.lastIndex = i;
      const m = WORD.exec(line);
      if (m !== null) {
        out.push({ kind: "word", text: m[0], start: i, end: i + m[0].length });
        i += m[0].length;
        continue;
      }
      PUNCT.lastIndex = i;
      const p = PUNCT.exec(line);
      if (p !== null) {
        let text = p[0];
        if (text === "." && line.slice(i, i + 3) === "...") text = "...";
        out.push({ kind: "punct", text, start: i, end: i + text.length });
        i += text.length;
        continue;
      }
      out.push({ kind: "punct", text: c, start: i, end: i + 1 });
      i += 1;
    }
    return out;
  }
  function sentencesOf(tokens) {
    const out = [];
    let cur = [];
    let inQuote = false;
    let quote = [];
    const flush = () => {
      if (cur.some((t) => t.kind === "word")) out.push({ tokens: cur, quote: false });
      cur = [];
    };
    let afterColon = false;
    let mention = false;
    for (const t of tokens) {
      const opening = t.kind === "punct" && (t.text === "“" || t.text === '"' && !inQuote);
      if (opening && afterColon) {
        inQuote = true;
        quote = [];
        continue;
      }
      if (t.kind === "punct" && /^["“”]$/.test(t.text) && !inQuote) {
        mention = !mention;
        continue;
      }
      if (mention && t.kind === "word") {
        cur.push({ ...t, quoted: true });
        continue;
      }
      if (inQuote) {
        if (t.kind === "punct" && (t.text === "”" || t.text === '"')) {
          inQuote = false;
          for (const s of sentencesOf(quote)) out.push({ tokens: s.tokens, quote: true });
          cur.push({ kind: "punct", text: "«q»", start: t.start, end: t.end });
          continue;
        }
        quote.push(t);
        continue;
      }
      afterColon = t.kind === "punct" && t.text === ":";
      if (t.kind === "punct" && t.text === "/") {
        flush();
        continue;
      }
      if (t.kind === "punct" && (t.text === "—" || t.text === "–")) {
        const words = cur.filter((x) => x.kind === "word");
        if (words.length === 1 && /^(po|futu)$/i.test(words[0]?.text ?? "")) {
          cur = [];
          continue;
        }
        const prev = cur[cur.length - 1];
        if (prev === void 0 || prev.kind === "punct" && /[.!?…]/.test(prev.text)) {
          flush();
          continue;
        }
        cur.push(t);
        flush();
        continue;
      }
      cur.push(t);
      if (t.kind === "punct" && /^[.!?…]+$/.test(t.text)) flush();
    }
    if (inQuote) cur.push(...quote);
    flush();
    return out;
  }
  const REALISED = {
    VERB: ["verb", "valency", "passive"],
    COPULA: ["copula"],
    SUBJECT: [
      "pron",
      "noun",
      "name",
      "det",
      "quant",
      "num",
      "ord",
      "adj",
      "degree",
      "kiword",
      "owner",
      "refl",
      "colour",
      "sign"
    ],
    OBJECT: [
      "pron",
      "noun",
      "name",
      "det",
      "quant",
      "num",
      "ord",
      "adj",
      "degree",
      "kiword",
      "owner",
      "refl",
      "colour",
      "sign"
    ],
    PREDICATE: [
      "adj",
      "noun",
      "pron",
      "det",
      "degree",
      "prep",
      "placeAdv",
      "timeAdv",
      "kiword",
      "clauseAdv",
      "colour",
      "owner"
    ],
    ADJUNCT: [
      "prep",
      "side",
      "la",
      "adj",
      "degree",
      "timeAdv",
      "placeAdv",
      "mannerAdv",
      "kiword",
      "comparison",
      "noun",
      "pron",
      "det",
      "num",
      "name",
      "owner",
      "chain",
      "scope",
      "op",
      "quant"
    ]
  };
  function choose(token, role) {
    const rs = token.word?.readings ?? [];
    if (role === "") return rs[0];
    const want = REALISED[role];
    if (want !== void 0)
      for (const pos of want) {
        const r = rs.find((x) => x.pos === pos);
        if (r !== void 0) return r;
      }
    const bySlot = rs.find((r) => r.slot === role);
    return bySlot ?? rs[0];
  }
  function analysisOf(r, token) {
    if (r === void 0) return token.word?.problem?.kind ?? "";
    const sfx = (token.word?.suffixes ?? []).map((s) => ` + -${s}`).join("");
    const names = {
      n: "noun",
      an: "ascended noun",
      nn: "negative noun",
      v: "verb",
      na: "negative adjective",
      a: "adjective",
      aa: "ascended adjective"
    };
    if (r.root !== void 0 && r.role !== void 0)
      return `${r.root} (${names[r.role] ?? r.role})${token.word?.prefix === void 0 ? "" : ` + ${token.word.prefix}`}${sfx}`;
    if (r.root !== void 0) return `${r.root} ${r.detail ?? ""}${sfx}`.trim();
    return `${r.form} (${r.slot?.toLowerCase() ?? r.detail ?? r.pos})${sfx}`;
  }
  function createChecker(source) {
    const ix = buildIndex(source);
    const p = source.rules;
    const selfCheck = source.ref.self_check ?? [];
    const unusedSeverity = selfCheck.find((r) => r.source === "0.8:R2")?.severity ?? "warn";
    function checkSentence(text, offset = 0, preTokens) {
      const base = preTokens ?? tokenize$1(text);
      const firstAt = base.findIndex((t) => t.kind === "word");
      const tokens = base.map((t, k) => {
        if (t.kind !== "word") return t;
        const capital = /^[A-ZÀ-Ý]/.test(t.text);
        return {
          ...t,
          capital,
          word: readWord(ix, t.text, { capital, first: k === firstAt, quoted: t.quoted === true })
        };
      });
      const parser = new SentenceParser(ix, tokens);
      const parsed = parser.parse();
      const findings = [...parsed.findings];
      const add = (rule, message, at, severity = "error", fix) => {
        findings.push({ rule, message, at, severity, ...fix === void 0 ? {} : { fix } });
      };
      const w = (k) => tokens[k]?.word?.lower ?? tokens[k]?.text ?? "";
      const words = tokens.map((t, k) => ({ t, k })).filter((x) => x.t.kind === "word");
      const main = parsed.clauses[0];
      for (const { t, k } of words) {
        const a = t.word;
        if (a?.problem === void 0) {
          if (a?.readings.every((r) => r.source === "image-predicted") === true)
            add(
              "2.5:G124",
              `${t.text} is a predicted image-compound form (${a.readings[0]?.gloss ?? ""}): prefer a listed word`,
              [k],
              "note"
            );
          if (a?.readings.some((r) => r.detail === "unconfirmed") === true)
            add(
              "names",
              `${t.text} is read as a name (not a known name or a word of Liraasa)`,
              [k],
              "note"
            );
          continue;
        }
        switch (a.problem.kind) {
          case "unknown":
            add("hard_rules[0]", `${t.text}: not a word of Liraasa`, [k]);
            break;
          case "unused":
            add(
              "0.8:R2",
              `${t.text}: the ${a.problem.role} form of ${a.problem.root} is an unused slot; only listed forms have a meaning, and a slot is filled only by an approved change`,
              [k],
              unusedSeverity
            );
            break;
          case "legacy":
            add(
              "1.0:G19",
              `${t.text} is an older spelling: ${a.problem.to}${a.problem.edition === null ? "" : ` (since ${a.problem.edition})`}`,
              [k],
              "warn",
              a.problem.to
            );
            break;
          case "hyphenated-fraction":
            add(
              "2.5:G97",
              `a fraction is written with spaces: ${t.text.replace(/-de-/, " de ")}`,
              [k],
              "error",
              t.text.replace(/-de-/, " de ")
            );
            break;
        }
      }
      const loose = parsed.unplaced.filter(
        (k) => tokens[k]?.word?.problem === void 0 && !findings.some((f) => f.at.includes(k))
      );
      for (let n = 0; n < loose.length; ) {
        let m = n;
        while (m + 1 < loose.length && (loose[m + 1] ?? 0) - (loose[m] ?? 0) <= 2) m += 1;
        const run = loose.slice(n, m + 1);
        add(
          "2.5:G126",
          `${run.map(w).join(" ")}: ${run.length === 1 ? "this word has" : "these words have"} no place in the clause template`,
          run
        );
        n = m + 1;
      }
      for (const { t, k } of words) {
        const rs = t.word?.readings ?? [];
        if (!(t.word?.suffixes ?? []).includes("ri") || rs.length === 0 || !rs.every((r) => r.pos === "adj"))
          continue;
        const prev = tokens[k - 1]?.word?.readings ?? [];
        if (!prev.some((r) => r.pos === "det" || r.pos === "quant" || r.pos === "num"))
          add(
            "2.5:G101",
            `-ri on a bare adjective: ${t.text} (an adjective takes -ri only standing as a noun after a determiner)`,
            [k]
          );
      }
      for (const [k, r] of parsed.roles) {
        const sfx = tokens[k]?.word?.suffixes ?? [];
        if (r.role === "VERB" && sfx.includes("ri"))
          add("2.5:G101", `-ri never goes on a verb: ${w(k)}`, [k]);
      }
      const last = [...tokens].reverse().find((t) => t.kind === "punct" && /[.!?…]/.test(t.text))?.text ?? "";
      const endIdx = (() => {
        let k = tokens.length - 1;
        while (k >= 0 && tokens[k]?.kind === "punct") k -= 1;
        if (main?.vocative !== null && main?.vocative !== void 0) {
          k = main.vocative.start - 1;
          while (k >= 0 && tokens[k]?.kind === "punct") k -= 1;
        }
        return k;
      })();
      const endsKi = w(endIdx) === "ki";
      const first = words[0]?.k ?? 0;
      const firstWord = w(first);
      const hasPred = parsed.clauses.some((c) => c.predKind !== "none");
      const kiWords = words.filter(
        (x) => x.t.word?.readings.some((r) => r.pos === "kiword") === true
      );
      const always = p.question.always_ki;
      const degreeKi = (k) => w(k) === always.degree && (tokens[k + 1]?.word?.readings.some((r) => r.pos === "adj") ?? false);
      const detKi = (k) => always.determiners.includes(w(k));
      let type = "statement";
      if (last.includes("?") || endsKi) type = "question";
      const echoNP = main?.subject ?? null;
      if (type === "question" && endsKi && !hasPred && echoNP !== null) {
        const np = echoNP;
        if (np.relative !== null || (np.de?.relative ?? null) !== null)
          add(
            "2.5:G92",
            "echo ki follows only a single word or a bare noun phrase; with a relative clause this needs a verb",
            [np.start]
          );
      }
      if (type === "question") {
        if (!endsKi) {
          if (!hasPred && words.length <= 2)
            add(
              String(p.question.fragment ?? "2.5:G91"),
              "a fragment question ends in ki",
              [first],
              "error",
              `${firstWord} ki?`
            );
          else if (firstWord === "raho")
            add("2.3:G74", "a question opened by raho ends in ki", [first], "error", "ki");
          else if (kiWords.some((x) => detKi(x.k) || degreeKi(x.k)))
            add(
              always.ruling,
              `a question with ${kiWords.map((x) => w(x.k)).find((x) => always.determiners.includes(x) || x === always.degree) ?? "ki-eli"} + a noun or a degree ki-modo always ends in ki (2.5:G88)`,
              kiWords.map((x) => x.k),
              "error",
              "ki"
            );
          else if (!(p.question.fronted_may_drop_ki.includes(firstWord) || firstWord === "ki-nela" && w(first + 1) === "de"))
            add(
              "2.5:G88",
              kiWords.length > 0 ? `a ki-word left in its answer's place needs the final ki` : "a question ends in ki",
              [kiWords[0]?.k ?? first],
              "error",
              "ki"
            );
        }
      } else if (last.includes("!")) {
        type = kiWords.some((x) => p.question.exclamation_without_ki.words.includes(w(x.k))) ? "exclamation" : "exclamation";
      }
      for (const { k } of words) {
        if (w(k) !== "ki" || k === endIdx) continue;
        const next = tokens[k + 1];
        if (next?.kind === "punct" && (next.text === ":" || next.text === ",")) {
          if (next.text === "," && main?.vocative !== null) continue;
          if (next.text === ":") continue;
        }
        add(
          "2.5:G89",
          "ki is the last word of the sentence (only a vocative set off by a comma may follow)",
          [k]
        );
      }
      const onlyAttitude = words.every(
        (x) => x.t.word?.readings.some((r) => r.pos === "attitude") === true
      );
      for (const [k, r] of parsed.roles) {
        if (r.role !== "ATTITUDE" || onlyAttitude) continue;
        let n = k + 1;
        while (n < tokens.length && (parsed.roles.get(n)?.role === "ATTITUDE" || parsed.roles.get(n)?.role === "QUESTION"))
          n += 1;
        const rest = tokens.slice(n);
        const ok = rest.every((t) => t.kind === "punct") || rest[0]?.text === "," && main?.vocative !== null || rest[0]?.text === ":" || rest[0]?.text === ";";
        if (!ok && n <= endIdx)
          add("1.0:G22", `${w(k)} is an attitude word: it closes its clause`, [k]);
      }
      const hasFisa = words.some((x) => w(x.k) === "fisa");
      const allowed = p.command.operators;
      if (main !== void 0 && main.subject === null && main.kiFront === null && (allowed !== void 0 || !main.ops.some((o) => o.slot === "TENSE")) && main.predKind !== "none" && main.predKind !== "existential") {
        const hortative = words.some((x) => w(x.k) === p.command.hortative);
        if (last.includes("!") || hasFisa || hortative) {
          type = "command";
          if (allowed !== void 0) {
            const never = main.ops.filter((o) => allowed.never.includes(o.slot));
            if (never.length > 0)
              add(
                allowed.ruling,
                `a command carries no tense, modal or evidential: ${never.map((o) => w(o.at)).join(" ")}`,
                never.map((o) => o.at)
              );
            const other = main.ops.filter(
              (o) => !allowed.never.includes(o.slot) && !allowed.allowed_words.includes(w(o.at))
            );
            if (other.length > 0)
              add(
                "I-42",
                `whether a command may carry ${other.map((o) => w(o.at)).join(" ")} is not ruled: 3.0:G135 names ne, reve and loki`,
                other.map((o) => o.at),
                "unruled"
              );
          } else {
            const extra = main.ops.filter((o) => o.slot !== "NEGATION");
            if (extra.length > 0)
              add(
                "I-42",
                "which operators a command may carry is not ruled yet",
                extra.map((o) => o.at),
                "unruled"
              );
            if (hortative && main.frame.length > 0)
              add(
                "I-42",
                "whether yava stands after a FRAME is not ruled yet",
                main.frame,
                "unruled"
              );
          }
        }
      }
      if (words.some((x) => w(x.k) === "pifu")) type = type === "question" ? type : "wish";
      if (!hasPred && type === "statement") type = "fragment";
      for (const { k } of words) {
        if (w(k) !== "tonsi") continue;
        const role = parsed.roles.get(k)?.role;
        if (role !== "LINKER" && role !== "PREDICATE")
          add(
            "2.5:G117",
            'tonsi is "therefore" opening a clause (with a comma), or "so" before a predicate adjective after a copula',
            [k]
          );
      }
      if (main?.topic !== null && main?.topic !== void 0 && main.subject === null && main.predKind !== "none")
        add(
          "2.5:G119",
          "a topic that is the subject is picked up by a pronoun",
          [main.topic.start],
          "error",
          "saivo"
        );
      const seen = /* @__PURE__ */ new Set();
      const unique = findings.filter((f) => {
        const key = `${f.rule}|${f.at.join(",")}|${f.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const gloss = words.map(({ t, k }) => {
        const r = parsed.roles.get(k);
        const role = r?.role ?? "";
        const reading = choose(t, role);
        const fs = unique.filter((f) => f.at.includes(k));
        const flags = [];
        if (reading?.source === "image-predicted") flags.push("predicted image-compound form");
        if (reading?.source === "prefix" && reading.detail === "compositional")
          flags.push("compositional motion prefix");
        if (fs.some((f) => f.severity === "unruled")) flags.push("unruled");
        if (t.word?.problem !== void 0) flags.push(t.word.problem.kind);
        return {
          word: t.text,
          analysis: analysisOf(reading, t),
          gloss: reading?.gloss ?? "",
          role,
          clause: r?.clause ?? 0,
          rules: [...new Set(fs.map((f) => f.rule))],
          flags
        };
      });
      const roleAt = tokens.map((_, k) => parsed.roles.get(k)?.role ?? "");
      return {
        text,
        offset,
        tokens,
        findings: unique,
        gloss,
        type,
        clauses: parsed.clauses,
        roleAt
      };
    }
    function checkLine(line) {
      const tokens = tokenize$1(line);
      const sentences = sentencesOf(tokens).map((s) => {
        const startChar = s.tokens[0]?.start ?? 0;
        const endChar = s.tokens[s.tokens.length - 1]?.end ?? startChar;
        return checkSentence(line.slice(startChar, endChar), startChar, s.tokens);
      });
      const findings = sentences.flatMap(
        (s, n) => s.findings.map((f) => {
          const ts = f.at.map((k) => s.tokens[k]).filter((t) => t !== void 0);
          return {
            ...f,
            start: ts.length === 0 ? s.offset : Math.min(...ts.map((t) => t.start)),
            end: ts.length === 0 ? s.offset : Math.max(...ts.map((t) => t.end)),
            sentence: n
          };
        })
      );
      return { line, sentences, findings, ok: !findings.some((f) => f.severity === "error") };
    }
    return { index: ix, checkLine, checkSentence: (text, offset) => checkSentence(text, offset) };
  }
  const MODALS = ["can", "could", "will", "would", "shall", "should", "may", "might", "must"];
  const emptyClause$1 = () => ({
    type: "statement",
    subject: null,
    verb: null,
    tense: "present",
    adjuncts: [],
    subordinates: []
  });
  function tokenize(text) {
    const s = text.replace(/[’‘]/g, "'").replace(/\bcan't\b/gi, "can not").replace(/\bwon't\b/gi, "will not").replace(/\bshan't\b/gi, "shall not").replace(/\blet's\b/gi, "let us").replace(/n't\b/gi, " not").replace(/'m\b/gi, " am").replace(/'re\b/gi, " are").replace(/'ll\b/gi, " will").replace(/'ve\b/gi, " have").replace(/'d\b/gi, " would");
    const out = [];
    for (const m of s.matchAll(/[A-Za-z]+(?:-[A-Za-z]+)*(?:'s)?|[0-9]+|[.,;:!?…—–()"]/g)) {
      const text2 = m[0];
      out.push({ text: text2, lower: text2.toLowerCase(), punct: !/[A-Za-z0-9]/.test(text2) });
    }
    return out;
  }
  function createEnglishReader(data, lex) {
    const irregular = data.irregular_verbs;
    const verbLemmas = (w) => {
      const out = [];
      const add = (x) => {
        if (x.length > 1 && !out.includes(x)) out.push(x);
      };
      if (irregular[w] !== void 0) add(irregular[w]);
      add(w);
      if (w.endsWith("ies")) add(`${w.slice(0, -3)}y`);
      if (w.endsWith("es")) add(w.slice(0, -2));
      if (w.endsWith("s")) add(w.slice(0, -1));
      if (w.endsWith("ied")) add(`${w.slice(0, -3)}y`);
      if (w.endsWith("ed")) {
        add(w.slice(0, -2));
        add(w.slice(0, -1));
        if (w.length > 5 && w[w.length - 3] === w[w.length - 4]) add(w.slice(0, -3));
      }
      if (w.endsWith("ing")) {
        add(w.slice(0, -3));
        add(`${w.slice(0, -3)}e`);
        if (w.length > 5 && w[w.length - 4] === w[w.length - 5]) add(w.slice(0, -4));
      }
      return out;
    };
    const verbOf = (w) => {
      for (const l of verbLemmas(w))
        if (lex.isVerb(l) || lex.isVerb(data.aliases.verb[l] ?? "") || ["be", "have", "do", "become"].includes(l) || l in data.causatives)
          return l;
      return null;
    };
    const isPastForm = (w) => irregular[w] !== void 0 && !w.endsWith("ing") && !["am", "is", "are", "be", "being", "has", "have", "does", "do"].includes(w) || w.endsWith("ed");
    const nounLemma = (w) => {
      const ir = data.irregular_plurals[w];
      if (ir !== void 0 && lex.isNoun(ir)) return { lemma: ir, plural: ir !== w };
      if (lex.isNoun(w)) return { lemma: w, plural: false };
      if (!data.not_plural.includes(w)) {
        for (const [end, rep] of [
          ["ies", "y"],
          ["ves", "f"],
          ["ves", "fe"],
          ["es", ""],
          ["s", ""]
        ]) {
          if (w.endsWith(end)) {
            const l = w.slice(0, -end.length) + rep;
            if (lex.isNoun(l)) return { lemma: l, plural: true };
          }
        }
      }
      return null;
    };
    const adjLemma = (w) => {
      const ir = data.irregular_comparatives[w];
      if (ir !== void 0) return { lemma: ir[0], degree: ir[1] };
      if (lex.isAdj(w)) return { lemma: w };
      for (const [end, deg] of [
        ["est", "mosa"],
        ["er", "kasi"]
      ]) {
        if (!w.endsWith(end)) continue;
        const stem2 = w.slice(0, -end.length);
        for (const l of [
          stem2,
          `${stem2}e`,
          stem2.endsWith("i") ? `${stem2.slice(0, -1)}y` : "",
          stem2.length > 2 && stem2.endsWith(stem2[stem2.length - 2] ?? "#") ? stem2.slice(0, -1) : ""
        ]) {
          if (l !== "" && lex.isAdj(l)) return { lemma: l, degree: deg };
        }
      }
      return null;
    };
    const adverbAdj = (w) => {
      if (!w.endsWith("ly") || w.length < 5) return null;
      const stem2 = w.slice(0, -2);
      for (const l of [
        stem2,
        `${stem2}e`,
        stem2.endsWith("i") ? `${stem2.slice(0, -1)}y` : "",
        `${stem2}le`,
        w.endsWith("ally") ? w.slice(0, -4) : ""
      ])
        if (l !== "" && lex.isAdj(l)) return l;
      return null;
    };
    function readSentence(english) {
      const toks = tokenize(english);
      const unread = [];
      let i = 0;
      const lastPunct = [...toks].reverse().find((t) => t.punct && /[.!?]/.test(t.text))?.text ?? ".";
      const end = lastPunct === "?" ? "?" : lastPunct === "!" ? "!" : ".";
      toks.filter((t) => !t.punct);
      const at = (k = i) => toks[k]?.lower ?? "";
      const raw = (k = i) => toks[k]?.text ?? "";
      const isPunct = (k = i, p) => toks[k]?.punct === true && (p === void 0 || toks[k]?.text === p);
      const done = (k = i) => k >= toks.length || isPunct(k) && /^[.!?]$/.test(raw(k));
      const phrase = (table, k = i) => {
        for (let n = 4; n >= 1; n--) {
          const words2 = toks.slice(k, k + n);
          if (words2.length < n || words2.some((t) => t.punct)) continue;
          const key = words2.map((t) => t.lower).join(" ");
          if (key in table) return key;
        }
        return null;
      };
      const skip = (key) => {
        i += key.split(" ").length;
      };
      function readNP(opts = {}) {
        const start = i;
        const np = { head: "", kind: "noun", adjectives: [] };
        const focus = phrase(data.scope);
        if (focus !== null && !["too"].includes(focus)) {
          const save = i;
          skip(focus);
          const inner = readNP(opts);
          if (inner !== null)
            return {
              ...inner,
              focus: focus === "also" ? "also" : focus === "even" ? "even" : focus === "only" ? "only" : "exactly"
            };
          i = save;
        }
        if (at() === "not" && !done(i + 1)) {
          const save = i;
          i += 1;
          const inner = readNP(opts);
          if (inner !== null) return { ...inner, negated: true };
          i = save;
        }
        const w = at();
        const pron = data.pronouns[w];
        if (pron !== void 0 && pron.case !== "owner" && !(w === "her" && nounStart(i + 1))) {
          i += 1;
          const out = {
            head: w,
            kind: pron.case === "reflexive" ? "reflexive" : "pronoun",
            adjectives: []
          };
          if (at() === "'s") i += 1;
          return out;
        }
        const pw = phrase(data.pronoun_words);
        if (pw !== null && !nounStart(i + pw.split(" ").length) && !(["this", "that", "these", "those"].includes(pw) && adjLemma(at(i + 1)) !== null)) {
          skip(pw);
          return {
            head: pw,
            kind: ["this", "that", "these", "those"].includes(pw) ? "demonstrative" : "pronoun",
            adjectives: []
          };
        }
        if (w === "all" && at(i + 1) === "the") {
          np.quantifier = "all";
          i += 1;
        }
        const own = data.pronouns[at()];
        if (own !== void 0 && (own.case === "owner" || own.case === "object-or-owner") && nounStart(i + 1)) {
          np.owner = { head: at(), kind: "pronoun", adjectives: [] };
          i += 1;
        } else if (at() in data.determiners && !(at() === "that" && !nounStart(i + 1))) {
          np.definite = at();
          i += 1;
        }
        if (np.owner === void 0 && np.definite === void 0 && raw().endsWith("'s") && nounStart(i + 1)) {
          const ownerWord = raw().replace(/'s$/, "");
          const nl = nounLemma(ownerWord.toLowerCase());
          np.owner = lex.isName(ownerWord) || nl === null ? { head: ownerWord, kind: "name", adjectives: [] } : { head: nl.lemma, kind: "noun", adjectives: [] };
          i += 1;
        }
        const q = phrase(data.quantifiers);
        if (q !== null && np.quantifier === void 0 && nounStart(i + q.split(" ").length)) {
          np.quantifier = q;
          skip(q);
        }
        if ((at() === "more" || at() === "less" || at() === "fewer") && nounLemma(at(i + 1)) !== null && adjLemma(at(i + 1)) === null) {
          np.quantifier = at() === "more" ? "more" : "less";
          i += 1;
        }
        const ord = data.ordinals[at()];
        if (ord !== void 0 && nounStart(i + 1)) {
          np.ordinal = ord;
          i += 1;
        }
        if (data.negative_number.words.includes(at()) && (data.numbers[at(i + 1)] !== void 0 || /^\d+$/.test(at(i + 1)))) {
          np.negativeNumber = true;
          i += 1;
        }
        if (data.approximately.words.includes(at()) && (data.numbers[at(i + 1)] !== void 0 || /^\d+$/.test(at(i + 1)))) {
          np.approximately = true;
          i += 1;
        }
        const num = data.numbers[at()] ?? (/^\d+$/.test(at()) ? Number(at()) : void 0);
        if (num !== void 0) {
          np.number = num;
          i += 1;
          const fr = data.fractions[at()];
          if (fr !== void 0) {
            i += 1;
            return {
              head: String(fr[1]),
              kind: "number",
              number: num,
              adjectives: [],
              of: { head: String(fr[1]), kind: "number", number: fr[1], adjectives: [] },
              partitive: true
            };
          }
          if (at() === "of" && (at(i + 1) === "the" || data.pronouns[at(i + 1)] !== void 0 || data.numbers[at(i + 1)] !== void 0)) {
            i += 1;
            const of = readNP();
            return {
              head: String(num),
              kind: "number",
              number: num,
              adjectives: [],
              ...of === null ? {} : { of, partitive: true }
            };
          }
        }
        for (; ; ) {
          const k = i;
          let degree;
          if (at() in data.degree && ["very", "more", "most", "less", "least", "too"].includes(at()) && adjLemma(at(i + 1)) !== null && nounStart(i + 2)) {
            degree = data.degree[at()];
            i += 1;
          }
          const a = adjLemma(at());
          if (a !== null && (nounStart(i + 1) || np.definite !== void 0 && !nounStart(i + 1) && nounLemma(at()) === null)) {
            if (nounLemma(at()) !== null && !nounStart(i + 1)) break;
            np.adjectives.push({
              lemma: a.lemma,
              ...degree ?? a.degree ? { degree: degree ?? a.degree ?? "" } : {}
            });
            i += 1;
            continue;
          }
          i = k;
          break;
        }
        const nw = at();
        const n = nounLemma(nw);
        if (n !== null) {
          np.head = n.lemma;
          np.plural = n.plural;
          i += 1;
          const n2 = nounLemma(at());
          if (n2 !== null && !done() && !isPunct() && verbOf(at()) === null && !(at() in data.prepositions) && data.pronouns[at()] === void 0) {
            np.adjectives.push({ lemma: n.lemma });
            np.head = n2.lemma;
            np.plural = n2.plural;
            i += 1;
          }
        } else if (np.adjectives.length > 0 && (np.definite !== void 0 || np.quantifier !== void 0)) {
          const last = np.adjectives.pop();
          np.head = last?.lemma ?? "";
          np.kind = "adjective";
        } else if (np.number !== void 0) {
          np.head = String(np.number);
          np.kind = "number";
        } else if (raw() !== "" && /^[A-Z]/.test(raw()) && !isPunct() && (i !== 0 || lex.isName(raw()))) {
          np.head = raw().replace(/'s$/, "");
          np.kind = "name";
          i += 1;
        } else if (np.definite === "this" || np.definite === "that" || np.definite === "these" || np.definite === "those") {
          np.head = np.definite;
          np.kind = "demonstrative";
          delete np.definite;
        } else {
          i = start;
          return null;
        }
        if (at() === "of" && nounStart(i + 1)) {
          i += 1;
          const of = readNP();
          if (of !== null) np.of = of;
        }
        if (data.relativizers.includes(at()) && !done(i + 1) && np.kind !== "pronoun") {
          const rel = readRelative();
          if (rel !== null) np.relative = rel;
        } else if (opts.noRelative !== true && np.kind === "noun" && data.pronouns[at()]?.case === "subject" && verbOf(at(i + 1)) !== null) {
          const rel = readClauseBody({ gapObject: true });
          np.relative = { ...rel, link: "relative" };
        }
        if ((at() === "and" || at() === "or") && nounStart(i + 1)) {
          const save = i;
          const link = at();
          i += 1;
          const second = readNP(opts);
          if (second !== null && !verbGroupAhead()) np.and = { linker: link, np: second };
          else i = save;
        }
        return np;
      }
      function nounStart(k) {
        const w = toks[k]?.lower ?? "";
        if (toks[k] === void 0 || toks[k]?.punct) return false;
        if (w in data.determiners || data.pronouns[w] !== void 0 || w in data.quantifiers || w in data.pronoun_words)
          return true;
        if (data.approximately.words.includes(w) && (data.numbers[toks[k + 1]?.lower ?? ""] !== void 0 || /^\d+$/.test(toks[k + 1]?.lower ?? "")))
          return true;
        if (data.negative_number.words.includes(w) && data.numbers[toks[k + 1]?.lower ?? ""] !== void 0)
          return true;
        if (data.numbers[w] !== void 0 || /^\d+$/.test(w) || data.ordinals[w] !== void 0)
          return true;
        if (nounLemma(w) !== null) return true;
        if (adjLemma(w) !== null && nounLemma(toks[k + 1]?.lower ?? "") !== null) return true;
        if (/^[A-Z]/.test(toks[k]?.text ?? "") && k > 0) return true;
        return false;
      }
      function verbGroupAhead(k = i) {
        const w = toks[k]?.lower ?? "";
        return MODALS.includes(w) || data.copula.be.includes(w) || data.have.includes(w) || data.do.includes(w) || verbOf(w) !== null && nounLemma(w) === null || w === "not";
      }
      function readVerbGroup(inverted) {
        const vg = { lemma: null, tense: "present" };
        const saw = { be: false, have: false, do: false };
        const aux = inverted?.aux;
        const noteAux = (w) => {
          if (w === "will" || w === "shall") vg.tense = "future";
          else if (MODALS.includes(w)) {
            data.modals[w];
            vg.modal = w === "could" || w === "can" ? "can" : w === "might" ? "might" : w === "may" ? "may" : w === "must" ? "must" : w === "should" ? "should" : w === "would" ? "would" : void 0;
          } else if (data.do.includes(w)) {
            saw.do = true;
            if (w === "did") vg.tense = "past";
          } else if (data.copula.be.includes(w)) {
            saw.be = true;
            if (w === "was" || w === "were") vg.tense = "past";
          } else if (data.have.includes(w)) {
            saw.have = true;
            if (w === "had") vg.tense = "past";
          }
        };
        if (aux !== void 0) noteAux(aux);
        const start = i;
        for (let guard = 0; guard < 12; guard++) {
          const w = at();
          if (done() || isPunct()) break;
          if (w === "not" || w === "never") {
            vg.negated = true;
            if (w === "never") vg.timeAdverb = "never";
            i += 1;
            continue;
          }
          if ([
            "always",
            "often",
            "sometimes",
            "rarely",
            "seldom",
            "usually",
            "just",
            "really",
            "also"
          ].includes(w) && verbGroupAhead(i + 1)) {
            if (["always", "often", "sometimes", "rarely", "seldom"].includes(w)) vg.timeAdverb = w;
            i += 1;
            continue;
          }
          if (w === "still" || w === "again" || w === "already") {
            vg.iteration = w;
            i += 1;
            continue;
          }
          if ((w === "almost" || w === "nearly") && verbGroupAhead(i + 1)) {
            vg.approach = "almost";
            i += 1;
            continue;
          }
          if (w === "about" && at(i + 1) === "to") {
            vg.approach = "about to";
            i += 2;
            continue;
          }
          if (w === "going" && at(i + 1) === "to" && (saw.be || vg.tense !== "present" || i > start)) {
            vg.tense = vg.tense === "past" ? "past" : "future";
            saw.be = false;
            i += 2;
            continue;
          }
          if (w === "used" && at(i + 1) === "to") {
            vg.tense = "past";
            vg.aspect = "habitual";
            i += 2;
            continue;
          }
          if ((w === "have" || w === "has" || w === "had") && at(i + 1) === "to") {
            vg.modal = "must";
            if (w === "had") vg.tense = "past";
            i += 2;
            continue;
          }
          if ((w === "able" || w === "allowed") && at(i + 1) === "to" && saw.be) {
            vg.modal = w === "able" ? "can" : "may";
            saw.be = false;
            i += 2;
            continue;
          }
          if (["try", "tries", "tried", "trying"].includes(w) && at(i + 1) === "to") {
            vg.effort = "try";
            if (w === "tried") vg.tense = "past";
            i += 2;
            continue;
          }
          if (["manage", "manages", "managed"].includes(w) && at(i + 1) === "to") {
            vg.effort = "manage";
            if (w === "managed") vg.tense = "past";
            i += 2;
            continue;
          }
          if (["fail", "fails", "failed"].includes(w) && at(i + 1) === "to") {
            vg.effort = "fail";
            if (w === "failed") vg.tense = "past";
            i += 2;
            continue;
          }
          if (["begin", "begins", "began", "start", "starts", "started"].includes(w) && (at(i + 1) === "to" || at(i + 1).endsWith("ing"))) {
            vg.phase = "begin";
            if (w === "began" || w === "started") vg.tense = "past";
            i += at(i + 1) === "to" ? 2 : 1;
            continue;
          }
          if (["stop", "stops", "stopped", "cease", "ceased"].includes(w) && at(i + 1).endsWith("ing")) {
            vg.phase = "stop";
            if (w.endsWith("ed")) vg.tense = "past";
            i += 1;
            continue;
          }
          if (["keep", "keeps", "kept"].includes(w) && at(i + 1).endsWith("ing")) {
            vg.iteration = "still";
            if (w === "kept") vg.tense = "past";
            i += 1;
            continue;
          }
          if (["hope", "hopes", "hoped"].includes(w) && at(i + 1) === "to") {
            vg.modal = "hope";
            if (w === "hoped") vg.tense = "past";
            i += 2;
            continue;
          }
          if (MODALS.includes(w) || data.do.includes(w) || data.copula.be.includes(w) || data.have.includes(w)) {
            const next = at(i + 1);
            const nextIsVerbish = MODALS.includes(next) || data.copula.be.includes(next) || data.have.includes(next) || next === "not" || next === "never" || verbOf(next) !== null && (/(ed|en|ing)$/.test(next) || irregular[next] !== void 0 || data.do.includes(w) || MODALS.includes(w));
            if (MODALS.includes(w) || data.do.includes(w) || nextIsVerbish || [
              "always",
              "still",
              "already",
              "just",
              "really",
              "often",
              "again",
              "almost",
              "nearly",
              "going",
              "able",
              "allowed",
              "used",
              "about"
            ].includes(next)) {
              if (data.have.includes(w) && (vg.modal === "would" || vg.modal === "can" || vg.modal === "should" || vg.modal === "must" || vg.modal === "might")) {
                vg.counterfactual = true;
                vg.tense = "past";
                i += 1;
                continue;
              }
              if (data.have.includes(w) && vg.modal === void 0 && verbOf(next) !== null && (/(ed|en)$/.test(next) || irregular[next] !== void 0 || next === "been")) {
                vg.aspect = "completed";
                if (w === "had") vg.tense = "past";
                saw.have = true;
                i += 1;
                continue;
              }
              noteAux(w);
              i += 1;
              continue;
            }
          }
          const lemma = verbOf(w);
          if (lemma !== null) {
            if (lemma === "be") {
              saw.be = true;
              if (w === "was" || w === "were") vg.tense = "past";
              i += 1;
              continue;
            }
            if (lemma === "have" && vg.lemma === null) {
              saw.have = true;
              if (w === "had") vg.tense = "past";
              i += 1;
              vg.lemma = "have";
              vg.have = true;
              break;
            }
            if (lemma === "do" && vg.lemma === null && saw.do) {
              vg.lemma = "do";
              i += 1;
              break;
            }
            if (data.copula.become.includes(w)) {
              vg.become = true;
              if (w === "became") vg.tense = "past";
              i += 1;
              break;
            }
            if (saw.be && adjLemma(w) !== null && at(i + 1) !== "by" && !w.endsWith("ing")) {
              vg.be = true;
              break;
            }
            const ph = data.phrasal_verbs[`${lemma} ${at(i + 1)}`];
            if (ph !== void 0 && lex.isVerb(ph)) {
              vg.lemma = ph;
              if (!saw.do && !saw.have && vg.modal === void 0 && vg.tense === "present" && isPastForm(w))
                vg.tense = "past";
              i += 2;
              break;
            }
            vg.lemma = lemma;
            if (saw.be && w.endsWith("ing")) vg.aspect = "progressive";
            else if (saw.be && (/(ed|en)$/.test(w) || irregular[w] !== void 0)) vg.passive = true;
            else if (!saw.do && !saw.have && vg.modal === void 0 && vg.tense === "present" && isPastForm(w))
              vg.tense = "past";
            i += 1;
            break;
          }
          break;
        }
        if (vg.lemma === null && !vg.become && !vg.have) {
          if (saw.be) vg.be = true;
          else if (saw.have) {
            vg.lemma = "have";
            vg.have = true;
          } else if (i === start && aux === void 0) return null;
        }
        return vg;
      }
      function readAdjunct() {
        const w = at();
        if (done() || isPunct()) return null;
        const tw = phrase(data.time_adverbs);
        if (tw !== null && !(tw === "then" && at(i + 1) === ",")) {
          skip(tw);
          return { role: "time", word: tw };
        }
        const pw = phrase(data.place_adverbs);
        if (pw !== null) {
          skip(pw);
          return { role: "place", word: pw };
        }
        const rec = phrase(data.reciprocal) ?? (w === "to" || w === "with" ? phrase(data.reciprocal, i + 1) === null ? null : `${w} ${phrase(data.reciprocal, i + 1) ?? ""}` : null);
        if (rec !== null) {
          skip(rec);
          return { role: "manner", word: rec.replace(/^(to|with) /, "") };
        }
        const save = i;
        if (data.numbers[w] !== void 0 || /^\d+$/.test(w)) {
          const np = readNP();
          if (np !== null && at() === "ago") {
            i += 1;
            return { role: "ago", np };
          }
          if (np !== null) {
            i = save;
          } else i = save;
        }
        if (w === "more" || w === "less") {
          const a = adverbAdj(at(i + 1));
          if (a !== null) {
            i += 2;
            const adj = {
              role: "manner",
              word: a,
              degree: w === "more" ? "kasi" : "menu"
            };
            if (at() === "than") {
              i += 1;
              const np = readNP({});
              if (np !== null) adj.np = np;
            }
            return adj;
          }
        }
        if (w === "very" || w === "so" || w === "too") {
          const a = adverbAdj(at(i + 1));
          if (a !== null) {
            i += 2;
            return { role: "manner", word: a, degree: data.degree[w] ?? "ruli" };
          }
        }
        const adv = adverbAdj(w);
        if (adv !== null) {
          i += 1;
          return { role: "manner", word: adv };
        }
        if (w === "than") {
          i += 1;
          const np = readNP({});
          return np === null ? null : { role: "comparison", np };
        }
        if (w === "like" && nounStart(i + 1)) {
          i += 1;
          const np = readNP({});
          return np === null ? null : { role: "simile", np };
        }
        const prep = phrase(data.prepositions);
        if (prep !== null && prep !== "of") {
          skip(prep);
          if (done() || isPunct())
            return { role: "place", word: prep, np: { head: "it", kind: "pronoun", adjectives: [] } };
          if (prep === "in" && (data.numbers[at()] !== void 0 || /^\d+$/.test(at()))) {
            const np2 = readNP();
            if (np2 !== null) return { role: "time", word: "in", np: np2 };
          }
          if (prep === "for" && (data.numbers[at()] !== void 0 || /^\d+$/.test(at()))) {
            const np2 = readNP();
            if (np2 !== null) return { role: "duration", word: "for", np: np2 };
          }
          const pt = phrase(data.place_adverbs);
          if (pt !== null) {
            skip(pt);
            return { role: "place", word: prep, np: { head: pt, kind: "pronoun", adjectives: [] } };
          }
          const np = readNP({});
          if (np === null) {
            i = save;
            return null;
          }
          const sense = data.prepositions[prep]?.sense ?? "";
          const role = prep === "with" ? "companion" : prep === "using" || prep === "by means of" ? "means" : prep === "to" || prep === "toward" || prep === "towards" ? "goal" : prep === "from" ? "source" : prep === "for" ? "beneficiary" : sense.includes("about") ? "comparison" : "place";
          return { role, word: prep, np };
        }
        return null;
      }
      function readRelative() {
        const rel = at();
        i += 1;
        if (rel === "whose") {
          const owned = readNP({ noRelative: true });
          const body2 = readClauseBody({ gapObject: true });
          if (owned !== null) body2.object = owned;
          return { ...body2, link: "relative", question: { word: "whose", role: "owner" } };
        }
        if (rel === "where" || rel === "when") {
          const body2 = readClauseBody({});
          return {
            ...body2,
            link: "relative",
            question: { word: rel, role: rel === "where" ? "place" : "time" }
          };
        }
        const subjectGap = verbGroupAhead();
        const body = readClauseBody(subjectGap ? { gapSubject: true } : { gapObject: true });
        return { ...body, link: "relative" };
      }
      function readClauseBody(opts) {
        const c = emptyClause$1();
        const lead = phrase(data.attitude);
        if (lead !== null && nounStart(i + lead.split(" ").length)) {
          c.attitude = data.attitude[lead] === "seye" ? "certainly" : data.attitude[lead] === "mufe" ? "probably" : "perhaps";
          skip(lead);
        }
        if (at() === "there" && data.copula.be.includes(at(i + 1))) {
          i += 1;
          const vg0 = readVerbGroup();
          c.verb = { lemma: "be", kind: "exist" };
          c.tense = vg0?.tense ?? "present";
          if (vg0?.negated === true) c.negated = true;
          const np = readNP();
          if (np !== null) c.object = np;
          for (let guard = 0; guard < 6 && !done() && !isPunct(); guard++) {
            const a = readAdjunct();
            if (a === null) break;
            c.adjuncts.push(a);
          }
          return c;
        }
        if (!opts.gapSubject && !opts.noSubject) {
          const subj = readNP();
          if (subj !== null) c.subject = subj;
        }
        const vg = readVerbGroup(opts.inverted === void 0 ? void 0 : { aux: opts.inverted });
        if (vg === null) {
          return c;
        }
        c.tense = vg.tense;
        if (vg.aspect !== void 0) c.aspect = vg.aspect;
        if (vg.modal !== void 0) c.modal = vg.modal;
        if (vg.counterfactual === true) c.counterfactual = true;
        if (vg.negated === true) c.negated = true;
        if (vg.phase !== void 0) c.phase = vg.phase;
        if (vg.effort !== void 0) c.effort = vg.effort;
        if (vg.approach !== void 0) c.approach = vg.approach;
        if (vg.iteration !== void 0) c.iteration = vg.iteration;
        if (vg.timeAdverb !== void 0 && vg.timeAdverb !== "never")
          c.adjuncts.push({ role: "time", word: vg.timeAdverb });
        if (vg.timeAdverb === "never") {
          c.negated = false;
          c.adjuncts.push({ role: "time", word: "never" });
        }
        if (vg.be === true || vg.become === true) {
          c.verb = {
            lemma: vg.become === true ? "become" : "be",
            kind: vg.become === true ? "become" : "be"
          };
          if (c.subject?.head === "there" || c.subject === null && at() === "there" || c.subject?.head === "ola-pago") {
            c.verb = { lemma: "be", kind: "exist" };
            c.subject = null;
            const np = readNP();
            if (np !== null) c.object = np;
          } else readComplement(c);
        } else if (vg.lemma !== null) {
          c.verb = { lemma: vg.lemma, kind: vg.lemma === "have" ? "have" : "action" };
          if (vg.passive === true) {
            c.passive = {};
          }
          readObjects(c, opts);
        }
        for (let guard = 0; guard < 10; guard++) {
          if (done() || isPunct()) break;
          if ((at() === "again" || at() === "still" || at() === "already") && c.iteration === void 0) {
            c.iteration = at();
            i += 1;
            continue;
          }
          const cue = [...data.now_cues.phrases, ...data.always_cues.phrases].find(
            (ph) => toks.slice(i, i + ph.split(" ").length).map((t) => t.lower).join(" ") === ph
          );
          if (cue !== void 0) {
            c.lasting = data.always_cues.phrases.includes(cue);
            i += cue.split(" ").length;
            continue;
          }
          if (c.passive !== void 0 && at() === "by") {
            i += 1;
            const ag = readNP({});
            if (ag !== null) c.passive = { agent: ag };
            continue;
          }
          const att = phrase(data.attitude);
          if (att !== null && (done(i + att.split(" ").length) || isPunct(i + att.split(" ").length))) {
            c.attitude = data.attitude[att] === "seye" ? "certainly" : data.attitude[att] === "mufe" ? "probably" : "perhaps";
            skip(att);
            continue;
          }
          const a = readAdjunct();
          if (a === null) break;
          c.adjuncts.push(a);
        }
        return c;
      }
      function readComplement(c) {
        if (done() || isPunct()) return;
        let degree;
        if (["very", "more", "most", "less", "least", "too", "so", "as"].includes(at()) && adjLemma(at(i + 1)) !== null) {
          degree = at();
          i += 1;
        }
        const a = adjLemma(at());
        if (a !== null && !(nounStart(i + 1) && nounLemma(at(i + 1)) !== null)) {
          i += 1;
          const comp = { kind: "adjective", lemma: a.lemma };
          const d = degree ?? a.degree;
          if (d !== void 0) comp.degree = d;
          if (at() === "than") {
            i += 1;
            const np2 = readNP({});
            if (np2 !== null) comp.than = np2;
          }
          if (degree === "as" && at() === "as") {
            i += 1;
            const np2 = readNP({});
            if (np2 !== null) comp.as = np2;
          }
          c.complement = comp;
          if (at() === "to" && verbOf(at(i + 1)) !== null) {
            i += 1;
            const chain = emptyClause$1();
            const v = verbOf(at()) ?? at();
            i += 1;
            chain.verb = { lemma: v, kind: "action" };
            chain.link = "purpose";
            c.chain = chain;
          }
          if (degree === "so" && at() === "that") {
            i += 1;
            const res = readClauseBody({});
            c.subordinates.push({ ...res, link: "that" });
          }
          return;
        }
        const pt = phrase(data.place_adverbs);
        if (pt !== null) {
          skip(pt);
          c.complement = { kind: "place", adjunct: { role: "place", word: pt } };
          return;
        }
        const prep = phrase(data.prepositions);
        if (prep !== null) {
          const ad = readAdjunct();
          if (ad !== null) {
            c.complement = { kind: "place", adjunct: ad };
            return;
          }
        }
        const np = readNP({});
        if (np !== null) c.complement = { kind: "np", np };
      }
      function readObjects(c, opts) {
        const lemma = c.verb?.lemma ?? "";
        const caus = data.causatives[lemma];
        if (caus !== void 0 && nounStart(i)) {
          const save = i;
          const actor = readNP({});
          if (at() === "from" && at(i + 1).endsWith("ing")) i += 1;
          const inner = actor === null ? null : verbOf(at());
          if (actor !== null && inner !== null) {
            const kind = caus === "vaku" ? "make" : caus === "lesvu" ? "let" : "prevent";
            c.causative = { kind, actor };
            c.verb = { lemma: inner, kind: "action" };
            i += 1;
            const obj = nounStart(i) ? readNP({}) : null;
            if (obj !== null) c.object = obj;
            return;
          }
          i = save;
        }
        if (at() === "that" && (!nounStart(i + 1) || data.pronouns[at(i + 1)] !== void 0 || verbGroupAheadAfterNP(i + 1))) {
          i += 1;
          c.objectClause = { ...readClauseBody({}), link: "that" };
          return;
        }
        if (at() === "whether" || at() === "if" && data.say_verbs.words.includes(lemma)) {
          i += 1;
          c.objectClause = { ...readClauseBody({}), link: "whether" };
          return;
        }
        if (at() === "what" && !data.say_verbs.words.includes(lemma) && !opts.gapObject && !done(i + 1) && nounStart(i + 1)) {
          i += 1;
          c.objectClause = { ...readClauseBody({ gapObject: true }), link: "relative" };
          return;
        }
        const qw = phrase(data.question_words);
        if (qw !== null && data.say_verbs.words.includes(lemma) && !opts.gapObject) {
          skip(qw);
          if (done() || isPunct()) {
            c.objectClause = {
              ...emptyClause$1(),
              link: "question",
              question: { word: qw, role: data.question_words[qw]?.role ?? "" }
            };
            return;
          }
          const body = readClauseBody({
            gapSubject: (qw === "who" || qw === "what") && verbGroupAhead()
          });
          c.objectClause = {
            ...body,
            link: "question",
            question: { word: qw, role: data.question_words[qw]?.role ?? "" }
          };
          return;
        }
        const recip = phrase(data.reciprocal);
        if (recip !== null) {
          skip(recip);
          c.adjuncts.push({ role: "manner", word: recip });
          return;
        }
        const approx = data.approximately.words.includes(at()) && (data.numbers[at(i + 1)] !== void 0 || /^\d+$/.test(at(i + 1)));
        if (!opts.gapObject && nounStart(i) && (approx || !(at() in data.prepositions && !(data.pronouns[at()] !== void 0)))) {
          const first = readNP({});
          if (first !== null) {
            if (nounStart(i) && first.kind === "pronoun" && !done()) {
              const second = readNP({});
              if (second !== null) {
                c.recipient = first;
                c.object = second;
              } else c.object = first;
            } else c.object = first;
          }
        }
        if (c.object !== void 0 && at() === "ago") {
          i += 1;
          c.adjuncts.push({ role: "ago", np: c.object });
          delete c.object;
        }
        const qw2 = phrase(data.question_words);
        if (qw2 !== null && data.say_verbs.words.includes(lemma) && (done(i + qw2.split(" ").length) || isPunct(i + qw2.split(" ").length))) {
          skip(qw2);
          c.objectClause = {
            ...emptyClause$1(),
            link: "question",
            question: { word: qw2, role: data.question_words[qw2]?.role ?? "" }
          };
          return;
        }
        if (at() === "to" && verbOf(at(i + 1)) !== null) {
          i += 1;
          const body = readClauseBody({ noSubject: true });
          if (c.object !== void 0 && data.chain_verbs.words.includes(lemma)) {
            c.objectClause = { ...body, subject: c.object, link: "that" };
            delete c.object;
          } else if (data.chain_verbs.words.includes(lemma) && c.object === void 0) {
            c.chain = body;
          } else {
            c.subordinates.push({ ...body, link: "purpose" });
          }
        }
        if (c.object !== void 0 && at() === "to" && nounStart(i + 1) && c.recipient === void 0) {
          i += 1;
          const r = readNP({});
          if (r !== null) c.recipient = r;
        }
      }
      function readTop() {
        const c = emptyClause$1();
        const before = [];
        const front = [];
        let type = end === "?" ? "question" : "statement";
        let please = false;
        for (let guard = 0; guard < 8; guard++) {
          const w = at();
          if (w === "please") {
            please = true;
            i += 1;
            if (isPunct(i, ",")) i += 1;
            continue;
          }
          if (w === "as" && at(i + 1) === "for") {
            i += 2;
            const t = readNP();
            if (t !== null) c.topic = t;
            if (isPunct(i, ",")) i += 1;
            continue;
          }
          if (w === "therefore" || w === "nevertheless") {
            c.link = "therefore";
            i += isPunct(i + 1, ",") ? 2 : 1;
            continue;
          }
          if ((w === "and" || w === "but" || w === "or" || w === "so") && done(i + 1)) {
            c.link = w === "so" ? "therefore" : w;
            i += 1;
            continue;
          }
          const att = phrase(data.attitude);
          if (att !== null && (isPunct(i + att.split(" ").length, ",") || nounStart(i + att.split(" ").length))) {
            c.attitude = data.attitude[att] === "seye" ? "certainly" : data.attitude[att] === "mufe" ? "probably" : "perhaps";
            skip(att);
            if (isPunct(i, ",")) i += 1;
            continue;
          }
          const fw2 = phrase(data.frame_words);
          if (fw2 !== null) {
            front.push({ role: "time", word: fw2, fronted: true });
            skip(fw2);
            if (isPunct(i, ",")) i += 1;
            continue;
          }
          const sub = phrase(data.subordinators);
          if (sub !== null && sub !== "that" && sub !== "whether" && !(sub === "when" && end === "?") && !(["before", "after", "until"].includes(sub) && !verbGroupAheadAfterNP(i + 1))) {
            skip(sub);
            const body = readClauseBody({});
            before.push({
              ...body,
              link: data.subordinators[sub]?.link ?? "condition"
            });
            if (isPunct(i, ",")) i += 1;
            continue;
          }
          const tw = phrase(data.time_adverbs) ?? phrase(data.place_adverbs);
          if (tw !== null && !(tw === "there" && data.copula.be.includes(at(i + 1)))) {
            const a = readAdjunct();
            if (a !== null) {
              front.push({ ...a, fronted: true });
              if (isPunct(i, ",")) i += 1;
              continue;
            }
          }
          if (phrase(data.prepositions) !== null && end !== "?") {
            const save = i;
            const a = readAdjunct();
            if (a !== null && isPunct(i, ",")) {
              front.push({ ...a, fronted: true });
              i += 1;
              continue;
            }
            i = save;
          }
          break;
        }
        if (/^[A-Z]/.test(raw()) && isPunct(i + 1, ",") && verbOf(at(i + 2)) !== null) {
          c.vocative = { head: raw(), kind: "name", adjectives: [] };
          i += 2;
        }
        const imperative = at() === "let" && at(i + 1) === "us" || at() === "do" && at(i + 1) === "not" && verbOf(at(i + 2)) !== null || at() === "never" && verbOf(at(i + 1)) !== null || verbOf(at()) !== null && nounLemma(at()) === null && data.pronouns[at()] === void 0 && !(at() in data.determiners) && !MODALS.includes(at()) && !data.do.includes(at()) && !data.copula.be.includes(at()) && end !== "?" || verbOf(at()) !== null && (end === "!" || please) && i === 0 && !/^[A-Z]/.test(raw(i + 1)) || verbOf(at()) !== null && i === 0 && data.pronouns[at(i + 1)] !== void 0 && data.pronouns[at(i + 1)]?.case !== "subject" && !verbGroupAhead(i + 1) || verbOf(at()) !== null && i === 0 && at(i + 1) in data.determiners && !data.copula.be.includes(at());
        let main;
        if (imperative && end !== "?") {
          if (at() === "let" && at(i + 1) === "us") {
            i += 2;
            type = "hortative";
          } else type = "command";
          let neg = false;
          if (at() === "do" && at(i + 1) === "not") {
            neg = true;
            i += 2;
          } else if (at() === "never") {
            neg = true;
            i += 1;
          } else if (at() === "not") {
            neg = true;
            i += 1;
          }
          main = readClauseBody({ noSubject: true });
          main.tense = "present";
          if (neg) main.negated = true;
        } else if (end === "?" && phrase(data.question_words) !== null) {
          const qw = phrase(data.question_words) ?? "";
          skip(qw);
          const role = data.question_words[qw]?.role ?? "";
          let qnp = null;
          if (role === "determiner" || role === "quantity" || role === "owner") {
            qnp = readNP();
            if (qnp !== null)
              qnp = {
                ...qnp,
                definite: qw === "which" ? "which" : qw === "whose" ? "whose" : "how many"
              };
          }
          const aux = at();
          const inverted = MODALS.includes(aux) || data.do.includes(aux) || data.copula.be.includes(aux) || data.have.includes(aux);
          if (inverted && nounStart(i + 1)) {
            i += 1;
            main = readClauseBody({
              inverted: aux,
              gapObject: role === "thing" || role === "person" || qnp !== null
            });
            if (qnp !== null && main.object === void 0 && main.verb?.kind !== "be")
              main.object = qnp;
            else if (qnp !== null && main.verb?.kind === "be")
              main.complement = { kind: "np", np: qnp };
            else if (role === "thing" || role === "person") {
              if (main.verb?.kind === "be" && main.complement === void 0)
                main.complement = { kind: "np", np: { head: qw, kind: "question", adjectives: [] } };
              else main.object = { head: qw, kind: "question", adjectives: [] };
            } else main.adjuncts.unshift({ role: "question", word: qw });
          } else {
            main = readClauseBody({ gapSubject: true });
            main.subject = qnp ?? { head: qw, kind: "question", adjectives: [] };
          }
          main.question = { word: qw, role };
        } else if (end === "?" && (MODALS.includes(at()) || data.do.includes(at()) || data.copula.be.includes(at()) || data.have.includes(at())) && nounStart(i + 1)) {
          const aux = at();
          i += 1;
          main = readClauseBody({ inverted: aux });
        } else if (at() === "what" && (at(i + 1) === "a" || at(i + 1) === "an") && end === "!") {
          i += 2;
          const np = readNP();
          main = emptyClause$1();
          main.type = "exclamation";
          if (np !== null) main.subject = { ...np, definite: "which" };
          main.question = { word: "what", role: "exclamation" };
        } else if (at() === "how" && adjLemma(at(i + 1)) !== null && end === "!") {
          const a = adjLemma(at(i + 1));
          i += 2;
          const np = readNP();
          main = emptyClause$1();
          main.type = "exclamation";
          main.subject = np;
          main.verb = { lemma: "be", kind: "be" };
          main.lasting = true;
          main.complement = { kind: "adjective", lemma: a?.lemma ?? "", degree: "ki-modo" };
          while (!done()) i += 1;
        } else if (at() === "may" && nounStart(i + 1) && end !== "?") {
          i += 1;
          main = readClauseBody({});
          main.type = "wish";
          main.attitude = "hope";
        } else if (at() === "if" && at(i + 1) === "only") {
          i += 2;
          main = readClauseBody({});
          main.type = "wish";
          main.attitude = "hope";
          main.counterfactual = true;
        } else {
          main = readClauseBody({});
        }
        if (main.type === "statement") main.type = type;
        if (please) main.please = true;
        if (c.topic !== void 0) main.topic = c.topic;
        if (c.vocative !== void 0) main.vocative = c.vocative;
        if (c.attitude !== void 0 && main.attitude === void 0) main.attitude = c.attitude;
        if (c.link !== void 0) main.link = c.link;
        main.adjuncts = [...front, ...main.adjuncts];
        main.subordinates = [
          ...before.map((b) => ({ ...b, fronted: true })),
          ...main.subordinates
        ];
        for (let guard = 0; guard < 8 && !done(); guard++) {
          if (isPunct(i, ",") || isPunct(i, ";") || isPunct(i, "—")) {
            const p = raw();
            i += 1;
            const save = i;
            const v = readNP();
            if (v !== null && done()) {
              main.vocative = v;
              continue;
            }
            i = save;
            if (p === ";") {
              const next = readClauseBody({});
              main.subordinates.push({ ...next, link: "and", semicolon: true });
              continue;
            }
            continue;
          }
          const w = at();
          const sub = phrase(data.subordinators);
          if (sub !== null && sub !== "that") {
            skip(sub);
            const link = data.subordinators[sub]?.link ?? "condition";
            if (link === "purpose" && at() === "to") i += 1;
            const body = readClauseBody(
              link === "purpose" && verbOf(at()) !== null && !nounStart(i) ? { noSubject: true } : {}
            );
            if (body.attitude === "perhaps" && link === "purpose") {
              delete body.attitude;
              body.modal = "might";
            }
            main.subordinates.push({ ...body, link });
            continue;
          }
          const nl = data.no_longer.phrases.find(
            (ph) => toks.slice(i + 1, i + 1 + ph.split(" ").length).map((t) => t.lower).join(" ") === ph
          );
          if (w === "and" && nl !== void 0 && main.verb?.kind === "be") {
            main.noLonger = true;
            while (!done()) i += 1;
            continue;
          }
          if (w === "and" || w === "but" || w === "or") {
            i += 1;
            if (isPunct(i, ",")) i += 1;
            const shared = verbGroupAhead();
            const body = readClauseBody(shared ? { noSubject: true } : {});
            main.subordinates.push({ ...body, link: w });
            continue;
          }
          if (w === "to" && verbOf(at(i + 1)) !== null) {
            i += 1;
            const body = readClauseBody({ noSubject: true });
            main.subordinates.push({ ...body, link: "purpose" });
            continue;
          }
          unread.push(raw());
          i += 1;
        }
        return main;
      }
      function verbGroupAheadAfterNP(k) {
        const save = i;
        i = k;
        const np = readNP();
        const ok = np !== null && verbGroupAhead();
        i = save;
        return ok;
      }
      const clause = readTop();
      return { english, clause, end, unread };
    }
    function read(text) {
      const parts = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s !== "");
      return parts.map(readSentence);
    }
    return { read, readSentence, verbOf, nounLemma, adjLemma, adverbAdj };
  }
  function fromParse(s) {
    const t = s.tokens;
    const role = (k) => s.roleAt[k] ?? "";
    const isPunct = (k, text) => t[k]?.kind === "punct" && (text === void 0 || t[k]?.text === text);
    const lw = (k) => {
      const tok = t[k];
      const a = tok?.word;
      const r = a?.readings[0];
      const sfx = a?.suffixes ?? [];
      const lower = a?.lower ?? tok?.text ?? "";
      const isName = a?.readings.some((x) => x.pos === "name") === true && !a.readings.some((x) => x.pos !== "name");
      const body2 = sfx.length > 0 ? lower.slice(0, lower.length - sfx.join("").length) : lower;
      return {
        form: isName ? tok?.text ?? body2 : body2,
        ...r?.root === void 0 ? {} : { root: r.root },
        ...r?.role === void 0 ? {} : { role: r.role },
        ...r?.gloss === void 0 ? {} : { gloss: r.gloss },
        ...sfx.length > 0 ? { suffixes: [...sfx] } : {}
      };
    };
    const np = (n) => {
      const head = n.head ?? n.start;
      const out2 = {
        kind: n.headKind === "kiword" ? "kiword" : n.headKind === "demonstrative" ? "demonstrative" : n.headKind === "correlative" ? "correlative" : n.headKind,
        head: lw(head),
        adjectives: []
      };
      if (n.start < (n.quant ?? n.det ?? n.ord ?? n.num ?? n.adjectives[0] ?? n.degrees[0] ?? head)) {
        const first = n.start;
        if (t[first]?.word?.readings.some((r) => r.pos === "scope") === true) out2.scope = lw(first);
        if (t[first]?.word?.lower === "sidu") {
          out2.kind = "sidu";
          const vp = emptyLClause();
          vp.pred = { kind: "verb", verb: lw(first + 1) };
          out2.vp = vp;
          return out2;
        }
      }
      if (n.quant !== null && n.quant !== head) {
        out2.quant = lw(n.quant);
        if (n.degrees.includes(n.quant - 1)) out2.degreeQuant = lw(n.quant - 1);
      }
      if (n.det !== null) out2.det = lw(n.det);
      if (n.ord !== null) out2.ord = lw(n.ord);
      if (n.num !== null) {
        if (n.num === head) out2.kind = "num";
        else out2.num = lw(n.num);
      }
      for (let k = n.start; k < head; k++) {
        if (t[k]?.word?.readings.some((r) => r.pos === "sign") === true) out2.sign = lw(k);
        if (n.num !== null && k === n.num - 1 && n.degrees.includes(k)) out2.degreeNum = lw(k);
      }
      for (const a of n.adjectives) {
        const d = n.degrees.includes(a - 1) && a - 1 !== (n.num ?? -5) - 1 ? lw(a - 1) : void 0;
        out2.adjectives.push({ ...d === void 0 ? {} : { degree: d }, adj: lw(a) });
      }
      if (n.refl !== null) out2.refl = lw(n.refl);
      if (n.de !== null) out2.de = np(n.de);
      if (n.and !== void 0) out2.and = { linker: lw(n.and.linker), np: np(n.and.np) };
      if (n.relative !== null) {
        out2.relative = clause(n.relative);
        if (isPunct(n.relative.end - 1, ",") || isPunct(n.relative.end, ","))
          out2.relativeComma = isPunct(n.relative.end - 1, ",");
      }
      return out2;
    };
    const pred = (p) => {
      const one = (q) => {
        switch (q.kind) {
          case "adj": {
            let k = q.start;
            const tonsi = q.tonsi === null ? void 0 : lw(q.tonsi);
            if (q.tonsi !== null) k += 1;
            const degree = q.degree === null ? void 0 : lw(q.degree);
            if (q.degree !== null) k = q.degree + 1;
            return {
              kind: "adj",
              ...tonsi === void 0 ? {} : { tonsi },
              ...degree === void 0 ? {} : { degree },
              adj: lw(k)
            };
          }
          case "np":
            return q.np === null || q.np === void 0 ? { kind: "gap" } : { kind: "np", np: np(q.np) };
          case "pp":
            return {
              kind: "pp",
              prep: lw(q.prep ?? q.start),
              np: q.np === null || q.np === void 0 ? null : np(q.np)
            };
          case "adv":
            return { kind: "adv", word: lw(q.start) };
          case "kiword":
            return {
              kind: "kiword",
              word: lw(q.start),
              ...q.end > q.start + 1 ? { adj: lw(q.end - 1) } : {}
            };
        }
      };
      const head0 = one(p.parts?.[0] ?? p);
      const head = p.ne !== void 0 && (head0.kind === "adj" || head0.kind === "np" || head0.kind === "pp") ? { ...head0, ne: lw(p.ne) } : head0;
      const rest = (p.parts ?? []).slice(1).map(one);
      if (rest.length > 0 && head.kind !== "adv" && head.kind !== "kiword" && head.kind !== "gap")
        return { ...head, and: rest };
      return head;
    };
    const adjunct = (a) => {
      switch (a.kind) {
        case "pp":
          return { kind: "pp", word: lw(a.head), np: a.np === null ? null : np(a.np) };
        case "la":
          return {
            kind: "la",
            ...a.degree === void 0 ? {} : { degree: lw(a.degree) },
            ...a.adj === void 0 ? {} : { adj: lw(a.adj) }
          };
        case "comparison":
          return { kind: "tamo", np: a.np === null ? null : np(a.np) };
        case "simile":
          return {
            kind: "gase",
            np: a.np === null ? null : np(a.np),
            ...a.adj === void 0 ? {} : { adj: lw(a.adj) }
          };
        case "chain":
          return { kind: "chain", ...a.clause === null ? {} : { clause: body(a.clause) } };
        case "kiword":
        case "time":
        case "times":
        case "place":
        case "manner":
        case "cause":
        case "purpose":
        case "iteration":
          return { kind: "adv", word: lw(a.head) };
        case "measure":
          return a.np !== null && a.np.start === a.start ? { kind: "measure", np: np(a.np) } : { kind: "measure", word: lw(a.head), np: a.np === null ? null : np(a.np) };
      }
    };
    function emptyLClause() {
      return {
        frame: [],
        interjections: [],
        subject: null,
        ops: [],
        pred: { kind: "none" },
        adjuncts: [],
        closing: [],
        ki: false,
        before: [],
        after: []
      };
    }
    function body(c) {
      const out2 = emptyLClause();
      if (c.kiFront !== null) out2.kiFront = lw(c.kiFront);
      if (c.subject !== null) out2.subject = np(c.subject);
      else if (t[c.start]?.word?.lower === "yava") out2.subject = "hortative";
      out2.ops = c.ops.filter((o) => o.slot !== "NEGATION" || c.verb === null || o.at < c.verb).map((o) => lw(o.at));
      const v = c.verb;
      switch (c.predKind) {
        case "verb":
          if (v !== null) out2.pred = { kind: "verb", verb: lw(v) };
          break;
        case "copula":
        case "become":
          if (v !== null)
            out2.pred = {
              kind: "copula",
              cop: lw(v),
              predicate: c.predicate === null ? { kind: "gap" } : pred(c.predicate)
            };
          else if (c.predicate !== null)
            out2.pred = { kind: "bare-adj", predicate: pred(c.predicate) };
          break;
        case "existential":
          if (v !== null && c.object !== null)
            out2.pred = { kind: "exist", miyo: lw(v), np: np(c.object) };
          break;
        case "passive":
          if (v !== null && c.innerVerb !== null)
            out2.pred = {
              kind: "passive",
              gome: lw(v),
              verb: lw(c.innerVerb),
              ...c.agent === null ? {} : { agent: { gagu: lw(c.agent.start - 1), np: np(c.agent) } }
            };
          break;
        case "valency":
          if (v !== null && c.actor !== null && c.innerVerb !== null) {
            const isCop = t[c.innerVerb]?.word?.readings.some((r) => r.pos === "copula") === true;
            out2.pred = {
              kind: "valency",
              op: lw(v),
              actor: np(c.actor),
              actorOps: c.actorOps.map((o) => lw(o.at)),
              verb: lw(c.innerVerb),
              ...isCop ? {
                cop: lw(c.innerVerb),
                predicate: c.predicate === null ? { kind: "gap" } : pred(c.predicate)
              } : {}
            };
          }
          break;
        case "bare-adjective":
          if (c.predicate !== null) out2.pred = { kind: "bare-adj", predicate: pred(c.predicate) };
          break;
        case "none":
          if (c.predicate !== null) out2.pred = { kind: "bare-adj", predicate: pred(c.predicate) };
          break;
      }
      if (c.recipient !== null) out2.recipient = np(c.recipient);
      if (c.object !== null && c.predKind !== "existential") out2.object = np(c.object);
      if (c.objectClause !== null) out2.objectClause = clause(c.objectClause);
      out2.adjuncts = [...c.adjuncts].sort((a, b) => a.start - b.start).map((a) => ({ ...adjunct(a), ...a.commaBefore === true ? { commaBefore: true } : {} }));
      if (c.closingComma === true) out2.closingComma = true;
      if (c.trailing !== void 0) out2.trailing = c.trailing.map(lw);
      const chain = c.subordinates.find(
        (x) => x.kind === "chain" && x.linker !== null && t[x.linker]?.word?.lower === "sidu"
      );
      if (chain !== void 0 && out2.pred.kind === "copula" && out2.pred.predicate.kind === "adj") {
        const sb = emptyLClause();
        if (chain.verb !== null) sb.pred = { kind: "verb", verb: lw(chain.verb) };
        if (chain.object !== null) sb.object = np(chain.object);
        out2.pred.predicate.sidu = sb;
      }
      for (const cl of c.closing) {
        if (cl.slot === "QUESTION") out2.ki = true;
        else out2.closing.push(lw(cl.at));
      }
      return out2;
    }
    function clause(c) {
      const out2 = body(c);
      if (c.scope !== void 0) out2.scope = lw(c.scope);
      if (c.linker !== null && !isPunct(c.linker)) {
        out2.linker = lw(c.linker);
        out2.linkerComma = isPunct(c.linker + 1, ",");
      }
      for (const f of c.frame) {
        const item = c.frameItems?.find((x) => x.start === f);
        if (item !== void 0) {
          const a2 = item.prep !== void 0 ? {
            kind: "pp",
            word: lw(item.prep),
            np: item.np === null || item.np === void 0 ? null : np(item.np)
          } : {
            kind: "measure",
            np: item.np === null || item.np === void 0 ? null : np(item.np)
          };
          out2.frame.push({ adjunct: a2, comma: isPunct(item.end, ",") });
          continue;
        }
        let e = f + 1;
        while (role(e) === "FRAME" && !isPunct(e)) e += 1;
        const span = e - f;
        const a = span === 1 ? { kind: "adv", word: lw(f) } : t[f]?.word?.lower === "la" ? { kind: "la", adj: lw(f + 1) } : { kind: "pp", word: lw(f), np: null };
        if (a.kind === "pp" && span > 1) {
          const words = Array.from({ length: span - 1 }, (_, i) => lw(f + 1 + i));
          const head = words[words.length - 1];
          if (head !== void 0)
            a.np = {
              kind: "noun",
              head,
              adjectives: [],
              ...words.length > 1 ? { det: words[0] } : {}
            };
          if (words.length > 2)
            a.np = {
              kind: "noun",
              head: words[words.length - 1] ?? head ?? lw(f),
              adjectives: words.slice(1, -1).map((adj) => ({ adj })),
              det: words[0] ?? lw(f)
            };
        }
        out2.frame.push({ adjunct: a, comma: isPunct(e, ",") });
      }
      if (c.topic !== null) out2.topic = np(c.topic);
      if (c.vocative !== null && c.vocative.start < (c.subject?.start ?? c.verb ?? c.end))
        out2.vocativeBefore = np(c.vocative);
      else if (c.vocative !== null) out2.vocative = np(c.vocative);
      for (const sub of c.subordinates) {
        if (sub.kind === "chain") continue;
        const lc = clause(sub);
        if (sub.start < c.start || c.subject !== null && sub.start < c.subject.start || c.subject === null && c.verb !== null && sub.start < c.verb && sub.kind !== "coordinate") {
          out2.before.push({ clause: lc, comma: isPunct(sub.end, ",") || isPunct(sub.end - 1, ",") });
        } else {
          const sep = sub.linker === null ? sub.start - 1 : isPunct(sub.linker) ? sub.linker : sub.linker - 1;
          const punct = isPunct(sep) ? t[sep]?.text : void 0;
          out2.after.push({
            clause: lc,
            comma: punct !== void 0,
            ...punct === void 0 ? {} : { punct }
          });
        }
      }
      return out2;
    }
    const main = s.clauses[0];
    const out = { main: main === void 0 ? body({}) : clause(main), end: "" };
    for (let k = 0; k < t.length; k++) {
      if (role(k) !== "INTERJECTION") continue;
      if (main !== void 0 && k > (main.subject?.start ?? main.verb ?? main.start)) continue;
      out.main.interjections.push({ word: lw(k), comma: isPunct(k + 1, ",") });
    }
    [...t].reverse().find((x) => x.kind === "punct" && /[.!?]/.test(x.text));
    const endClause = (c) => {
      const a = c.after[c.after.length - 1]?.clause;
      if (a !== void 0) return endClause(a);
      if (c.objectClause !== void 0 && c.adjuncts.length === 0 && c.closing.length === 0 && !c.ki)
        return endClause(c.objectClause);
      return c;
    };
    const tail = endClause(out.main);
    if (tail !== out.main && (tail.ki || tail.closing.length > 0) && !out.main.ki && out.main.closing.length === 0) {
      out.main.ki = tail.ki;
      out.main.closing = tail.closing;
      if (tail.closingComma === true) out.main.closingComma = true;
      tail.ki = false;
      tail.closing = [];
      delete tail.closingComma;
    }
    const lastAny = [...t].reverse().find((x) => x.kind === "punct" && /[.!?…]/.test(x.text));
    out.end = lastAny === void 0 ? "" : lastAny.text.includes("?") ? "?" : lastAny.text.includes("!") ? "!" : lastAny.text === "…" ? "…" : ".";
    if (t[t.length - 1]?.kind === "punct" && t[t.length - 1]?.text === ",") out.end = ",";
    return out;
  }
  const ROLES = {
    noun: ["n", "an", "nn"],
    verb: ["v"],
    adj: ["a", "aa", "na"]
  };
  function senses(gloss) {
    return gloss.replace(/\([^)]*\)/g, " ").split(/[;,/]/).map(
      (s) => s.trim().toLowerCase().replace(/^(to|the|a|an|be)\s+/, "").replace(/^(to|be)\s+/, "").replace(/[.!?"“”]/g, "").trim()
    ).filter((s) => s !== "" && s !== "— unused" && !s.startsWith("—"));
  }
  const toWord = (r, english) => ({
    form: r.form,
    ...r.root === void 0 ? {} : { root: r.root },
    ...r.role === void 0 ? {} : { role: r.role },
    gloss: r.gloss,
    english,
    ...r.source === "image-predicted" ? { flags: ["predicted image-compound form (2.5:G124)"] } : {}
  });
  function buildEnglishIndex(ix, synonyms = {}, aliases = {}) {
    const bySense = /* @__PURE__ */ new Map();
    const add = (sense, r, rank) => {
      const list = bySense.get(sense) ?? [];
      if (!list.some((x) => x.r.form === r.form)) list.push({ r, rank });
      bySense.set(sense, list);
    };
    for (const h of ix.headwords.values()) {
      for (const r of Object.values(h.roles)) {
        if (r.source === "image-predicted") continue;
        senses(r.gloss).forEach((s, i) => {
          add(s, r, i);
          const words = s.split(" ");
          if (words.length > 1 && words.length <= 3 && (words[0] ?? "").length > 2)
            add(words[0] ?? "", r, 20 + i);
        });
      }
      const noun = h.roles.n;
      if (noun !== void 0) for (const s of synonyms[h.root] ?? []) add(s.toLowerCase(), noun, 5);
    }
    for (const [w, d] of ix.lexicalised) {
      senses(d.gloss).forEach((s, i) => {
        add(
          s,
          { pos: "noun", form: w, root: d.base, gloss: d.gloss, source: "derivation-listed" },
          i
        );
      });
    }
    for (const [form, rs] of ix.closed) {
      for (const r of rs)
        if (r.pos === "noun")
          senses(r.gloss).forEach((s, i) => {
            add(s, { ...r, role: "n", form }, i);
          });
    }
    const choose2 = (want, lemma) => {
      const key0 = lemma.toLowerCase().trim();
      const exact = (bySense.get(key0) ?? []).some(
        (x) => x.rank < 20 && (x.r.role === void 0 ? want === "noun" : ROLES[want].includes(x.r.role))
      );
      const key = !exact && aliases[want]?.[key0] !== void 0 ? aliases[want][key0] ?? key0 : key0;
      const hits = (bySense.get(key) ?? []).filter(
        (x) => x.r.role !== void 0 ? ROLES[want].includes(x.r.role) : want === "noun"
      );
      const order = ROLES[want];
      const ranked = [...hits].sort(
        (a, b) => a.rank - b.rank || order.indexOf(a.r.role ?? "n") - order.indexOf(b.r.role ?? "n") || (a.r.source === "listed" ? 0 : 1) - (b.r.source === "listed" ? 0 : 1) || a.r.form.length - b.r.form.length
      );
      const best = ranked[0];
      if (best !== void 0)
        return {
          word: toWord(best.r, lemma),
          alternatives: ranked.slice(1, 6).map((x) => toWord(x.r, lemma)),
          nearest: []
        };
      const near = [];
      for (const [s, list] of bySense) {
        if (near.length >= 6) break;
        if (s.split(" ").includes(key) || s.startsWith(`${key} `)) {
          for (const x of list) if (near.length < 6) near.push(toWord(x.r, s));
        }
      }
      const other = (bySense.get(key) ?? []).map((x) => toWord(x.r, lemma));
      return { word: null, alternatives: [], nearest: [...other, ...near].slice(0, 6) };
    };
    return { bySense, choose: choose2 };
  }
  const word = (w) => w.form + (w.suffixes ?? []).join("");
  function comma(out, mark = ",") {
    const last = out[out.length - 1];
    if (last !== void 0 && !last.endsWith(mark)) out[out.length - 1] = last + mark;
  }
  function realizeNP(np) {
    const out = [];
    if (np.scope !== void 0) out.push(word(np.scope));
    if (np.kind === "sidu" && np.vp !== void 0) {
      out.push("sidu", ...realizeClauseBody(np.vp));
      return out;
    }
    for (const w of [np.degreeQuant, np.quant, np.det, np.ord, np.sign, np.degreeNum, np.num])
      if (w !== void 0) out.push(word(w));
    for (const a of np.adjectives) {
      if (a.degree !== void 0) out.push(word(a.degree));
      out.push(word(a.adj));
    }
    out.push(word(np.head));
    if (np.refl !== void 0) out.push(word(np.refl));
    if (np.de !== void 0) out.push("de", ...realizeNP(np.de));
    if (np.relative !== void 0) {
      out.push(...realizeClause(np.relative));
      if (np.relativeComma === true) comma(out);
    }
    if (np.and !== void 0) out.push(word(np.and.linker), ...realizeNP(np.and.np));
    return out;
  }
  function realizePredicate(p) {
    const out = [];
    if ((p.kind === "adj" || p.kind === "np" || p.kind === "pp") && p.ne !== void 0)
      out.push(word(p.ne));
    switch (p.kind) {
      case "adj":
        if (p.tonsi !== void 0) out.push(word(p.tonsi));
        if (p.degree !== void 0) out.push(word(p.degree));
        out.push(word(p.adj));
        if (p.tamo !== void 0) out.push("tamo", ...realizeNP(p.tamo));
        if (p.gase !== void 0) out.push("gase", ...realizeNP(p.gase));
        if (p.sidu !== void 0) out.push("sidu", ...realizeClauseBody(p.sidu));
        break;
      case "np":
        out.push(...realizeNP(p.np));
        break;
      case "pp":
        out.push(word(p.prep), ...p.np === null ? [] : realizeNP(p.np));
        break;
      case "adv":
        out.push(word(p.word));
        break;
      case "kiword":
        out.push(word(p.word));
        if (p.adj !== void 0) out.push(word(p.adj));
        break;
    }
    if ((p.kind === "adj" || p.kind === "np" || p.kind === "pp") && p.and !== void 0)
      for (const q of p.and) out.push("ata", ...realizePredicate(q));
    return out;
  }
  function realizeAdjunct(a) {
    switch (a.kind) {
      case "pp":
        return [
          ...a.word === void 0 ? [] : [word(a.word)],
          ...a.np === null || a.np === void 0 ? [] : realizeNP(a.np)
        ];
      case "la":
        return [
          "la",
          ...a.degree === void 0 ? [] : [word(a.degree)],
          ...a.adj === void 0 ? [] : [word(a.adj)],
          ...a.np === void 0 || a.np === null ? [] : ["tamo", ...realizeNP(a.np)]
        ];
      case "tamo":
        return ["tamo", ...a.np === null || a.np === void 0 ? [] : realizeNP(a.np)];
      case "gase":
        return [
          "gase",
          ...a.adj === void 0 ? [] : [word(a.adj), "gase"],
          ...a.np === null || a.np === void 0 ? [] : realizeNP(a.np)
        ];
      case "chain":
        return ["sidu", ...a.clause === void 0 ? [] : realizeClauseBody(a.clause)];
      case "measure":
        return [
          ...a.word === void 0 ? [] : [word(a.word)],
          ...a.np === null || a.np === void 0 ? [] : realizeNP(a.np)
        ];
      case "kiword":
      case "scope":
      case "iteration":
      case "adv":
        return a.word === void 0 ? [] : [word(a.word)];
    }
  }
  function realizeClauseBody(c, deferClosing = false) {
    const out = [];
    if (c.kiFront !== void 0) out.push(word(c.kiFront));
    if (c.subject === "hortative") out.push("yava");
    else if (c.subject !== null) out.push(...realizeNP(c.subject));
    for (const o of c.ops) out.push(word(o));
    const p = c.pred;
    switch (p.kind) {
      case "verb":
        out.push(word(p.verb));
        break;
      case "copula":
        out.push(word(p.cop), ...realizePredicate(p.predicate));
        break;
      case "valency":
        out.push(word(p.op), ...realizeNP(p.actor));
        for (const o of p.actorOps) out.push(word(o));
        if (p.cop !== void 0 && p.predicate !== void 0)
          out.push(word(p.cop), ...realizePredicate(p.predicate));
        else out.push(word(p.verb));
        break;
      case "passive":
        out.push(word(p.gome), word(p.verb));
        if (p.agent !== void 0) out.push(word(p.agent.gagu), ...realizeNP(p.agent.np));
        break;
      case "exist":
        out.push(word(p.miyo), ...realizeNP(p.np));
        break;
      case "bare-adj":
        out.push(...realizePredicate(p.predicate));
        break;
    }
    if (c.recipient !== void 0) out.push(...realizeNP(c.recipient));
    if (c.object !== void 0) out.push(...realizeNP(c.object));
    if (c.objectClause !== void 0) out.push(...realizeClause(c.objectClause));
    for (const a of c.adjuncts) {
      if (a.commaBefore === true) comma(out);
      out.push(...realizeAdjunct(a));
    }
    if (!deferClosing) closingOf(c, out);
    return out;
  }
  function closingOf(c, out) {
    if (c.closingComma === true && (c.closing.length > 0 || c.ki)) comma(out);
    for (const w of c.closing) out.push(word(w));
    if (c.ki) out.push("ki");
    for (const w of c.trailing ?? []) {
      comma(out);
      out.push(word(w));
    }
  }
  function realizeClause(c) {
    const out = [];
    for (const i of c.interjections) out.push(word(i.word) + (i.comma ? "," : ""));
    for (const b of c.before) {
      const part = realizeClause(b.clause);
      if (b.comma) comma(part);
      out.push(...part);
    }
    if (c.scope !== void 0) out.push(word(c.scope));
    if (c.linker !== void 0) out.push(word(c.linker) + (c.linkerComma === true ? "," : ""));
    for (const f of c.frame) {
      const part = realizeAdjunct(f.adjunct);
      if (f.comma) comma(part);
      out.push(...part);
    }
    if (c.topic !== void 0) {
      out.push(...realizeNP(c.topic), "hozi,");
    }
    if (c.vocativeBefore !== void 0) {
      const part = realizeNP(c.vocativeBefore);
      comma(part);
      out.push(...part);
    }
    const defer = c.after.length > 0;
    out.push(...realizeClauseBody(c, defer));
    for (const a of c.after) {
      const part = realizeClause(a.clause);
      if (a.comma) comma(out, a.punct ?? ",");
      out.push(...part);
    }
    if (defer) closingOf(c, out);
    if (c.vocative !== void 0) {
      comma(out);
      out.push(...realizeNP(c.vocative));
    }
    return out;
  }
  function realize(s) {
    const words = realizeClause(s.main).filter((x) => x !== "");
    const text = words.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1) + s.end;
  }
  const fw = (form, english) => ({
    form,
    ...english === void 0 ? {} : { english }
  });
  function buildLSentence(ctx, ms, choice = {}) {
    const flags = [];
    const gaps = [];
    const alternatives = {};
    const { data, en, ix } = ctx;
    const content = (want, lemma) => {
      const c = en.choose(want, lemma);
      if (c.word !== null) {
        if (c.alternatives.length > 0) alternatives[lemma] = c.alternatives;
        for (const f of c.word.flags ?? []) flags.push(`${c.word.form}: ${f}`);
        return c.word;
      }
      gaps.push({ english: lemma, want, nearest: c.nearest });
      return { form: `⟨${lemma}⟩`, english: lemma, flags: ["no listed word"] };
    };
    const nounClass = (w) => ix.source.flags.noun_class[w.root ?? w.form] ?? "";
    const numeral2 = (n) => {
      const w = ctx.numerals[String(n)];
      if (w === void 0) {
        gaps.push({ english: String(n), want: "noun", nearest: [] });
        return { form: `⟨${String(n)}⟩` };
      }
      return fw(w, String(n));
    };
    function np(m, role = "object") {
      if (m.kind === "pronoun" || m.kind === "reflexive") {
        const p = data.pronouns[m.head];
        const pw = data.pronoun_words[m.head];
        if (p !== void 0) {
          const out2 = { kind: "pron", head: fw(p.form, m.head), adjectives: [] };
          if (m.kind === "reflexive") out2.refl = fw("sela", "self");
          return wrap(out2, m);
        }
        if (pw !== void 0)
          return wrap(
            {
              kind: ["eli", "ola", "eliri", "olari"].includes(pw) ? "demonstrative" : "correlative",
              head: fw(pw, m.head),
              adjectives: []
            },
            m
          );
      }
      if (m.kind === "demonstrative") {
        const d = data.pronoun_words[m.head] ?? data.determiners[m.head] ?? m.head;
        return wrap({ kind: "demonstrative", head: fw(d, m.head), adjectives: [] }, m);
      }
      if (m.kind === "question") {
        const q = data.question_words[m.head]?.word ?? "ki-coda";
        return wrap({ kind: "kiword", head: fw(q, m.head), adjectives: [] }, m);
      }
      if (m.kind === "name") return wrap({ kind: "name", head: fw(m.head), adjectives: [] }, m);
      if (m.kind === "number" && m.partitive === true && m.of !== void 0) {
        const out2 = { kind: "num", head: numeral2(m.number ?? 1), adjectives: [] };
        const of = np(m.of, "pp");
        if (m.of.kind !== "number" || m.of.definite !== void 0) out2.de = withArticle(of);
        else out2.de = of;
        return wrap(out2, m);
      }
      if (m.kind === "number")
        return wrap(
          {
            kind: "num",
            head: numeral2(m.number ?? 0),
            adjectives: [],
            ...m.negativeNumber === true ? { sign: fw("antizi", "minus") } : {},
            ...m.approximately === true ? { degreeNum: fw("gase", "about") } : {}
          },
          m
        );
      const isSelf = m.head === "self" && m.kind === "noun";
      const head = isSelf ? fw("maivo", "Self") : m.kind === "adjective" ? content("adj", m.head) : content("noun", m.head);
      const out = { kind: m.kind === "adjective" ? "adj" : "noun", head, adjectives: [] };
      if (isSelf) out.det = fw("li", "the");
      if (m.quantifier !== void 0) {
        const q = m.quantifier === "more" ? "kasi" : m.quantifier === "less" ? "menu" : data.quantifiers[m.quantifier];
        if (q !== void 0) out.quant = fw(q, m.quantifier);
        if (m.quantifier === "all" && m.definite === "the") out.det = fw("li", "the");
      }
      if (m.definite === "how many") out.quant = fw("ki-muya", "how many");
      else if (m.definite === "whose") {
        return wrap(
          { kind: "kiword", head: fw("ki-nela", "who"), adjectives: [], de: { ...out } },
          m
        );
      } else if (m.definite !== void 0 && m.definite !== null && !(m.quantifier === "all")) {
        const d = data.determiners[m.definite];
        if (d !== void 0) out.det = fw(d, m.definite);
      }
      if (m.ordinal !== void 0)
        out.ord = { ...numeral2(m.ordinal), form: `${numeral2(m.ordinal).form}${ix.ordinalSuffix}` };
      if (m.negativeNumber === true) out.sign = fw("antizi", "minus");
      if (m.approximately === true) out.degreeNum = fw("gase", "about");
      if (m.number !== void 0) out.num = numeral2(m.number);
      for (const a of m.adjectives) {
        let adj = en.choose("adj", a.lemma).word;
        if (adj === null) {
          const asNoun = en.choose("noun", a.lemma).word;
          const san = asNoun?.root === void 0 ? null : ix.formOf(asNoun.root, "a");
          if (san !== null)
            adj = { form: san, root: asNoun?.root ?? "", role: "a", english: a.lemma };
        }
        const word2 = adj ?? content("adj", a.lemma);
        const degree = a.degree === void 0 ? void 0 : fw(a.degree in data.degree ? data.degree[a.degree] ?? a.degree : a.degree, a.degree);
        out.adjectives.push({ ...degree === void 0 ? {} : { degree }, adj: word2 });
      }
      if (m.plural === true && m.number === void 0 && !(out.det?.form === "eli" || out.det?.form === "ola"))
        out.head = { ...out.head, suffixes: ["ri"] };
      if (m.diminutive === true)
        out.head = { ...out.head, suffixes: ["ti", ...out.head.suffixes ?? []] };
      let result = out;
      if (m.owner !== void 0) {
        const owner = np(m.owner, "pp");
        if (owner.kind === "pron") {
          result = { ...owner, de: stripArticle(out) };
        } else {
          if (out.det === void 0 && out.quant === void 0) out.det = fw("li", "the");
          result = { ...out, de: owner };
        }
      }
      if (m.of !== void 0) {
        const of = np(m.of, "pp");
        if (of.de !== void 0 && of.kind === "pron") {
          const inner = of.de;
          const adjForm = inner.head.root === void 0 ? null : ix.formOf(inner.head.root, "a");
          if (adjForm !== null) {
            result = {
              ...of,
              de: {
                ...stripArticle(out),
                adjectives: [
                  { adj: { form: adjForm, root: inner.head.root ?? "", role: "a" } },
                  ...out.adjectives
                ]
              }
            };
            flags.push(
              `2.5:G96: "${m.head} of ${m.of.head}" rephrased with an adjective, so no de chain groups from the right`
            );
          } else {
            result = { ...result, de: of };
            flags.push(
              `2.5:G96: a three-part de chain reads from the left: (X de ${of.head.form}) de ${inner.head.form}; check the meaning`
            );
          }
        } else result = { ...result, de: of };
      }
      if (m.relative !== void 0) {
        const rel = clause(m.relative, { relativeHead: m });
        rel.linker = fw("raho", "who / which");
        result = { ...result, relative: rel };
        if (role === "subject" && (rel.object !== void 0 || rel.adjuncts.length > 0 || rel.objectClause !== void 0))
          result.relativeComma = true;
      }
      if (m.and !== void 0)
        result = {
          ...result,
          and: {
            linker: fw(m.and.linker === "and" ? "ata" : "oro", m.and.linker),
            np: np(m.and.np, role)
          }
        };
      return wrap(result, m);
    }
    const wrap = (out, m) => {
      if (m.focus !== void 0) {
        const s = data.scope[m.focus] ?? (m.focus === "it is" ? "vinto" : void 0);
        if (s !== void 0) return { ...out, scope: fw(s, m.focus) };
      }
      if (m.negated === true) return { ...out, scope: fw("ne", "not") };
      return out;
    };
    const stripArticle = (x) => {
      if (x.det?.form !== "li") return x;
      const { det: _det, ...rest } = x;
      return rest;
    };
    const withArticle = (x) => x.det === void 0 && x.kind !== "pron" ? { ...x, det: fw("li", "the") } : x;
    function adjunct(a, c) {
      switch (a.role) {
        case "time": {
          if (a.word === "in" && a.np !== void 0)
            return { kind: "measure", word: fw("krotiapo", "in"), np: np(a.np, "pp") };
          const t = data.time_adverbs[a.word ?? ""];
          if (t !== void 0) return { kind: "adv", word: fw(t, a.word) };
          const f = data.frame_words[a.word ?? ""];
          if (f !== void 0) return { kind: "adv", word: fw(f, a.word) };
          if (a.np !== void 0) return { kind: "pp", word: fw("en", "in"), np: np(a.np, "pp") };
          return null;
        }
        case "place": {
          if (a.word !== void 0 && a.np === void 0) {
            const p = data.place_adverbs[a.word];
            if (p !== void 0) return { kind: "adv", word: fw(p, a.word) };
          }
          return pp(a);
        }
        case "manner": {
          if (a.word === "each other" || a.word === "one another") return null;
          const adj = content("adj", a.word ?? "");
          const degree = a.degree === void 0 ? void 0 : fw(a.degree, a.degree);
          const out = { kind: "la", adj, ...degree === void 0 ? {} : { degree } };
          if (a.np !== void 0) out.np = np(a.np, "pp");
          return out;
        }
        case "ago":
          return a.np === void 0 ? null : { kind: "measure", word: fw("kroti", "ago"), np: np(a.np, "pp") };
        case "duration":
          flags.push(
            `I-17: "${a.word ?? "for"} …" (a duration) has no ruled form yet; it is left out`
          );
          return null;
        case "comparison":
          if (a.word === "about" && a.np !== void 0)
            return { kind: "pp", word: fw("de", "about"), np: np(a.np, "pp") };
          return a.np === void 0 ? null : { kind: "tamo", np: np(a.np, "pp") };
        case "simile":
          return a.np === void 0 ? null : { kind: "gase", np: withArticle(np(a.np, "pp")) };
        case "question": {
          const q = data.question_words[a.word ?? ""]?.word;
          return q === void 0 ? null : { kind: "kiword", word: fw(q, a.word) };
        }
        case "means":
        case "companion":
        case "medium":
        case "goal":
        case "source":
        case "beneficiary":
        case "purpose":
        case "frequency":
          return pp(a);
      }
    }
    function pp(a) {
      const prep = data.prepositions[a.word ?? ""];
      if (prep === void 0 || a.np === void 0) return null;
      const obj = np(a.np, "pp");
      let word2 = prep.word;
      if (a.word === "with" && data.tool_classes.includes(nounClass(obj.head)))
        word2 = prep.tool ?? "yuta";
      const timeNoun = word2 === "en" && ix.timeNouns.has(obj.head.form) && obj.adjectives.length === 0;
      const np2 = prep.article === true ? withArticle(obj) : timeNoun ? stripArticle(obj) : obj;
      return { kind: "pp", word: fw(word2, a.word), np: np2 };
    }
    function ops(m, opts = {}) {
      const o = data.operators;
      const out = [];
      if (m.counterfactual === true) {
        out.push(fw("po", "past"), fw(o.counterfactual, "contrary to fact"));
      } else if (m.tense === "past" && opts.inherit !== true && m.noLonger !== true)
        out.push(fw(o.tense.past, "past"));
      else if (m.tense === "future" && opts.inherit !== true) out.push(fw(o.tense.future, "will"));
      if (m.negated === true) out.push(fw(o.negation, "not"));
      if (m.modal !== void 0) {
        const key = m.modal === "can" ? "can" : m.modal === "hope" ? "hope to" : m.modal;
        const w = data.modals[key];
        if (w !== void 0) out.push(fw(w, m.modal));
      }
      if (m.approach !== void 0) {
        const w = o.approach[m.approach];
        if (w !== void 0) out.push(fw(w, m.approach));
      }
      if (m.phase !== void 0) out.push(fw(o.phase[m.phase] ?? "", m.phase));
      if (m.effort !== void 0) out.push(fw(o.effort[m.effort] ?? "", m.effort));
      if (m.aspect !== void 0 && !(m.aspect === "completed" && m.counterfactual === true))
        out.push(fw(o.aspect[m.aspect] ?? "", m.aspect));
      if (m.iteration !== void 0) out.push(fw(o.iteration[m.iteration] ?? "", m.iteration));
      return out;
    }
    function predicateOf(m) {
      const comp = m.complement;
      if (comp === void 0) return { kind: "gap" };
      if (comp.kind === "adjective") {
        if (comp.degree === "ki-modo")
          return { kind: "kiword", word: fw("ki-modo", "how"), adj: content("adj", comp.lemma) };
        const deg = comp.degree === void 0 ? void 0 : fw(data.degree[comp.degree] ?? comp.degree, comp.degree);
        const out = {
          kind: "adj",
          adj: content("adj", comp.lemma),
          ...deg === void 0 ? {} : deg.form === "tonsi" ? { tonsi: deg } : { degree: deg }
        };
        if (comp.than !== void 0) out.tamo = np(comp.than, "pp");
        if (comp.as !== void 0) out.gase = np(comp.as, "pp");
        if (m.chain?.verb !== null && m.chain?.verb !== void 0) {
          const sb = emptyClause();
          sb.pred = { kind: "verb", verb: content("verb", m.chain.verb.lemma) };
          out.sidu = sb;
        }
        return out;
      }
      if (comp.kind === "np") return { kind: "np", np: np(comp.np, "object") };
      const a = comp.adjunct;
      if (a.np === void 0 && a.word !== void 0) {
        const p = data.place_adverbs[a.word];
        if (p !== void 0) return { kind: "adv", word: fw(p, a.word) };
      }
      const ad = pp(a);
      return ad === null ? { kind: "gap" } : { kind: "pp", prep: ad.word ?? fw("en"), np: ad.np ?? null };
    }
    function copula(m) {
      const comp = m.complement;
      if (m.noLonger === true) return fw("kapoki", "was, and no longer is");
      if (m.lasting === true) return fw("ka", "is (lasting)");
      if (m.lasting === false) return fw("ke", "is (now)");
      if (choice.lasting !== void 0) return fw(choice.lasting ? "ka" : "ke", "is");
      const timeCue = m.adjuncts.some(
        (a) => ["now", "today", "tonight", "this morning", "this evening"].includes(a.word ?? "")
      );
      if (comp?.kind === "place") return fw("ke", "is (now)");
      if (m.tense === "past" || timeCue) return fw("ke", "was (at that time)");
      if (comp?.kind === "adjective") {
        if (data.state_adjectives.words.includes(comp.lemma)) return fw("ke", "is (now)");
        flags.push(
          `2.5:G93: "${comp.lemma}" read as lasting (ka); write ke if it holds only now or for a time`
        );
        return fw("ka", "is (lasting)");
      }
      return fw("ka", "is (lasting)");
    }
    function clause(m, opts = {}) {
      const c = emptyClause();
      const fronted = m.adjuncts.filter((a) => a.fronted === true);
      const rest = m.adjuncts.filter((a) => a.fronted !== true);
      for (const s0 of m.subordinates.filter((x) => x.fronted === true)) {
        const s = s0.link === "condition" && m.counterfactual === true && s0.aspect === "completed" ? { ...s0, counterfactual: true, aspect: void 0 } : s0;
        if (s.aspect === void 0) delete s.aspect;
        const sc = clause(s, {
          inherit: s.tense === m.tense && s.link !== "since" && s.counterfactual !== true
        });
        sc.linker = fw(linkWord(s.link), s.link);
        c.before.push({ clause: sc, comma: true });
      }
      for (const a of fronted) {
        const la = adjunct(a);
        if (la !== null) c.frame.push({ adjunct: la, comma: true });
      }
      if (m.link === "therefore" && (m.subject !== null || m.verb !== null)) {
        c.linker = fw("tonsi", "therefore");
        c.linkerComma = true;
      } else if (m.link !== void 0 && m.subject === null && m.verb === null && opts.main === true) {
        c.linker = fw(linkWord(m.link), m.link);
      }
      if (m.please === true) c.interjections.push({ word: fw("fisa", "please"), comma: true });
      if (m.topic !== void 0) c.topic = np(m.topic, "subject");
      if (m.type === "command") c.subject = null;
      else if (m.type === "hortative") c.subject = "hortative";
      else if (m.subject !== null) c.subject = np(m.subject, "subject");
      c.ops = ops(m, { inherit: opts.inherit === true });
      const v = m.verb;
      if (v === null) {
        c.pred = { kind: "none" };
      } else if (v.kind === "exist") {
        c.pred = {
          kind: "exist",
          miyo: fw("miyo", "there is"),
          np: m.object === void 0 ? { kind: "noun", head: fw("⟨?⟩"), adjectives: [] } : np(m.object)
        };
      } else if (v.kind === "be") {
        c.pred = { kind: "copula", cop: copula(m), predicate: predicateOf(m) };
      } else if (v.kind === "become") {
        c.pred = { kind: "copula", cop: fw("loya", "become"), predicate: predicateOf(m) };
      } else if (m.causative !== void 0) {
        const opWord = data.causatives[m.causative.kind] ?? "vaku";
        c.pred = {
          kind: "valency",
          op: fw(opWord, m.causative.kind),
          actor: np(m.causative.actor),
          actorOps: [],
          verb: content("verb", v.lemma)
        };
      } else if (m.passive !== void 0) {
        const verb = content("verb", v.lemma);
        if (ix.transitive.size > 0 && !ix.transitive.has(verb.form))
          flags.push(
            `2.5:G110: ${verb.form} is not attested with an object; gome may not passivise it`
          );
        c.pred = {
          kind: "passive",
          gome: fw("gome", "is … -ed"),
          verb,
          ...m.passive.agent === void 0 ? {} : { agent: { gagu: fw("gagu", "by"), np: np(m.passive.agent) } }
        };
      } else {
        c.pred = { kind: "verb", verb: content("verb", v.lemma === "have" ? "have" : v.lemma) };
      }
      if (c.pred.kind === "none" && c.subject !== null && c.subject !== "hortative" && c.subject.relativeComma === true)
        delete c.subject.relativeComma;
      if (m.object !== void 0 && v?.kind !== "exist") c.object = np(m.object);
      if (m.recipient !== void 0) {
        const r = np(m.recipient);
        const verbForm = c.pred.kind === "verb" ? c.pred.verb.form : "";
        const give = verbForm in ix.source.flags.give_type;
        if (m.recipient.kind === "pronoun" && give && choice.recipientAla !== true && c.object !== void 0)
          c.recipient = r;
        else c.adjuncts.push({ kind: "pp", word: fw("ala", "to"), np: r });
      }
      if (m.objectClause !== void 0) {
        const oc = clause(m.objectClause, { inherit: m.objectClause.tense === m.tense });
        const link = m.objectClause.link;
        if (link === "whether") oc.linker = fw("ki-oro", "whether");
        else if (link === "relative")
          oc.linker = fw("raho", "what");
        else if (link === "question") {
          const q = data.question_words[m.objectClause.question?.word ?? ""]?.word ?? "ki-coda";
          oc.linker = fw(q, m.objectClause.question?.word);
        } else oc.linker = fw("fime", "that");
        c.objectClause = oc;
      }
      if (m.chain !== void 0 && m.complement === void 0) {
        const ch = clause(m.chain, { inherit: true });
        c.adjuncts.push({ kind: "chain", clause: ch });
      }
      for (const a of rest) {
        const la = adjunct(a);
        if (la !== null) c.adjuncts.push(la);
      }
      if (opts.relativeHead !== void 0 && (m.question?.word === "where" || m.question?.word === "when")) {
        c.adjuncts.push({
          kind: "pp",
          word: fw("en", "in"),
          np: { kind: "pron", head: fw("ito", "it"), adjectives: [] }
        });
      }
      if (opts.relativeHead !== void 0 && m.question?.word === "whose" && c.object !== void 0) {
        const owner = opts.relativeHead.kind === "noun" && ix.source.flags.noun_class[en.choose("noun", opts.relativeHead.head).word?.form ?? ""] === "person" ? "saivo" : "saivo";
        const { scope: _scope, ...owned } = c.object;
        c.object = {
          kind: "pron",
          head: fw(owner, "whose"),
          adjectives: [],
          de: stripArticle(owned)
        };
      }
      if (m.adjuncts.some((a) => a.word === "each other" || a.word === "one another"))
        c.closing.push(fw("fuyi", "each other"));
      if (m.attitude !== void 0) {
        const at = m.attitude === "certainly" ? "seye" : m.attitude === "probably" ? "mufe" : m.attitude === "perhaps" ? "poye" : m.attitude === "hope" ? "pifu" : "zoke";
        c.closing.push(fw(at, m.attitude));
      }
      if (m.type === "question" && opts.main === true) {
        c.ki = true;
        const kiAdj = c.adjuncts.findIndex((a) => a.kind === "kiword");
        const kiAdjunct = c.adjuncts[kiAdj];
        if (kiAdj >= 0 && kiAdjunct?.word !== void 0 && c.subject !== null) {
          c.kiFront = kiAdjunct.word;
          c.adjuncts.splice(kiAdj, 1);
        }
      }
      for (const s of m.subordinates.filter((x) => x.fronted !== true)) {
        const shared = s.subject === null && (s.link === "and" || s.link === "but" || s.link === "or");
        const sameSubjectPurpose = s.link === "purpose" && s.subject === null;
        const sc = clause(s, {
          inherit: (s.tense === m.tense || s.link === "purpose" && s.tense === "future") && s.link !== "since" && s.link !== "and" && s.link !== "but" && s.link !== "or"
        });
        if (shared || sameSubjectPurpose) sc.subject = null;
        sc.linker = fw(linkWord(s.link), s.link);
        const comma2 = s.link === "purpose" && s.modal === "might" || s.semicolon === true;
        if (s.semicolon === true) delete sc.linker;
        c.after.push({ clause: sc, comma: comma2, ...s.semicolon === true ? { punct: ";" } : {} });
      }
      if (m.vocative !== void 0) c.vocative = np(m.vocative);
      return c;
    }
    const linkWord = (link) => {
      if (link === void 0) return "";
      const sub = Object.values(data.subordinators).find((s) => s.link === link);
      if (sub !== void 0) return sub.word;
      if (link === "and") return "ata";
      if (link === "but") return "nara";
      if (link === "or") return "oro";
      if (link === "therefore") return "tonsi";
      return "";
    };
    const main = clause(ms.clause, { main: true });
    const end = ms.clause.type === "command" && ms.clause.please !== true || ms.clause.type === "hortative" || ms.clause.type === "exclamation" ? "!" : ms.clause.type === "question" ? "?" : ".";
    if (ms.clause.type === "exclamation" && ms.clause.question?.role === "exclamation")
      main.ki = false;
    return { sentence: { main, end }, flags, gaps, alternatives };
  }
  function emptyClause() {
    return {
      frame: [],
      interjections: [],
      subject: null,
      ops: [],
      pred: { kind: "none" },
      adjuncts: [],
      closing: [],
      ki: false,
      before: [],
      after: []
    };
  }
  function signature(c) {
    const out = [];
    const npSig = (n, role) => {
      if (n === void 0 || n === null) return;
      out.push(`${role}:${n.head.form}`);
      for (const a of n.adjectives) out.push(`${role}.adj:${a.adj.form}`);
      if (n.det !== void 0) out.push(`${role}.det:${n.det.form}`);
      if (n.num !== void 0) out.push(`${role}.num:${n.num.form}`);
      if (n.de !== void 0) npSig(n.de, `${role}.de`);
      if (n.relative !== void 0)
        for (const s of signature(n.relative)) out.push(`${role}.rel.${s}`);
    };
    if (c.subject === "hortative") out.push("subject:yava");
    else npSig(c.subject, "subject");
    for (const o of c.ops) out.push(`op:${o.form}`);
    const p = c.pred;
    if (p.kind === "verb") out.push(`verb:${p.verb.form}`);
    else if (p.kind === "copula") out.push(`copula:${p.cop.form}`);
    else if (p.kind === "valency") {
      out.push(`valency:${p.op.form}`, `verb:${p.verb.form}`);
      npSig(p.actor, "actor");
    } else if (p.kind === "passive") out.push(`passive:${p.verb.form}`);
    else if (p.kind === "exist") npSig(p.np, "exists");
    npSig(c.recipient, "recipient");
    npSig(c.object, "object");
    if (c.objectClause !== void 0)
      for (const s of signature(c.objectClause)) out.push(`clause.${s}`);
    for (const w of c.closing) out.push(`closing:${w.form}`);
    if (c.ki) out.push("ki");
    return out;
  }
  function createTranslator(src) {
    const checker = createChecker(src.grammar);
    const en = buildEnglishIndex(checker.index, src.synonyms ?? {}, src.english.aliases);
    const reader = createEnglishReader(src.english, {
      isVerb: (l) => en.choose("verb", l).word !== null,
      isNoun: (l) => en.choose("noun", l).word !== null,
      isAdj: (l) => en.choose("adj", l).word !== null,
      isName: (w) => checker.index.names.has(w.toLowerCase())
    });
    const ctx = { ix: checker.index, en, data: src.english, numerals: src.numerals };
    const glossText = (s) => s.gloss.map((g) => (g.gloss.split(/[;(]/)[0] ?? g.word).trim()).filter((x) => x !== "").join(" ");
    function one(ms) {
      const tried = [];
      const variants = [
        {},
        { recipientAla: true },
        { lasting: false },
        { lasting: true }
      ];
      let first = null;
      for (const v of variants) {
        const built = buildLSentence(ctx, ms, v);
        first ?? (first = built);
        const text = realize(built.sentence);
        const r = checker.checkLine(text);
        const s = r.sentences[0] ?? null;
        const failures = r.findings.filter((f) => f.severity === "error").map((f) => `${f.rule}: ${f.message}`);
        for (const w of ms.unread) {
          const lw = w.toLowerCase();
          const listed = ["noun", "verb", "adj"].some((want2) => en.choose(want2, lw).word !== null) || reader.verbOf(lw) !== null || reader.nounLemma(lw) !== null;
          failures.push(
            listed ? `could not read "${w}" in this construction` : `no listed word for "${w}"`
          );
        }
        if (built.gaps.length > 0)
          failures.push(
            ...built.gaps.map(
              (g) => `no listed ${g.want} for "${g.english}"${g.nearest.length > 0 ? `; nearest: ${g.nearest.map((w) => `${w.form} (${w.gloss ?? ""})`).join(", ")}` : ""}`
            )
          );
        if (failures.length > 0 || s === null) {
          tried.push({ liraasa: text, failures });
          continue;
        }
        const back = fromParse(s);
        const want = signature(built.sentence.main);
        const got = signature(back.main);
        const differences = [
          ...want.filter((x) => !got.includes(x)).map((x) => `lost ${x}`),
          ...got.filter((x) => !want.includes(x)).map((x) => `gained ${x}`)
        ];
        const matches = differences.length === 0 && realize(back) === text;
        if (!matches) {
          tried.push({
            liraasa: text,
            failures: [
              `the back-translation differs: ${differences.join("; ") || "the regenerated text differs"}`
            ]
          });
          continue;
        }
        const flags = [
          ...built.flags,
          ...s.findings.filter((f) => f.severity !== "error").map((f) => `${f.severity} ${f.rule}: ${f.message}`),
          ...ms.unread.map((w) => `not read: "${w}"`)
        ];
        return {
          english: ms.english,
          liraasa: text,
          ok: true,
          frame: ms,
          structure: built.sentence,
          check: s,
          gloss: s.gloss,
          backTranslation: { english: glossText(s), matches: true, differences: [] },
          flags,
          gaps: [],
          alternatives: built.alternatives,
          tried
        };
      }
      return {
        english: ms.english,
        liraasa: null,
        ok: false,
        frame: ms,
        structure: first?.sentence ?? null,
        check: null,
        gloss: [],
        backTranslation: { english: "", matches: false, differences: [] },
        flags: [...first?.flags ?? [], ...ms.unread.map((w) => `not read: "${w}"`)],
        gaps: first?.gaps ?? [],
        alternatives: first?.alternatives ?? {},
        tried
      };
    }
    return { checker, translate: (english) => reader.read(english).map(one) };
  }
  exports.createChecker = createChecker;
  exports.createTranslator = createTranslator;
  exports.fromParse = fromParse;
  exports.realize = realize;
  exports.signature = signature;
  exports.tokenize = tokenize$1;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
