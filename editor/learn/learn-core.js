var LiraasaLearn = function(exports) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const VOWELS = "aeiou";
  function isVowel(ch) {
    return VOWELS.includes(ch);
  }
  const VERB_RULE = {
    irregular: { opi: "opioa" },
    nInitial: "nia",
    sInitial: "sia",
    vowelInitial: "a"
    /** otherwise: first consonant + 'a' */
  };
  const SUFFIXES = {
    ti: { spelling: "ti" },
    ri: { spelling: "ri" }
  };
  const DERIVATION_KEYS = ["yo", "vu", "pago"];
  const BLOCKED_DERIVATIONS = [
    { root: "mavo", derivation: "pago" }
  ];
  function isBlockedDerivation(root, derivation) {
    return BLOCKED_DERIVATIONS.some((b) => b.root === root && b.derivation === derivation);
  }
  const FORM_SLOTS = [
    "root",
    "ascended",
    "negative",
    "verb",
    "negativeAdjective",
    "adjective",
    "ascendedAdjective"
  ];
  const SLOT_RAW_KEY = {
    root: "root",
    ascended: "ascended",
    negative: "negative",
    verb: "verb",
    negativeAdjective: "negative_adjective",
    adjective: "adjective",
    ascendedAdjective: "ascended_adjective"
  };
  const SLOT_SUFFIX = {
    root: "",
    ascended: "asa",
    negative: "na",
    verb: null,
    negativeAdjective: "nasan",
    adjective: "san",
    ascendedAdjective: "asasan"
  };
  function isUnusedGloss(gloss) {
    return gloss === void 0 || gloss === null || gloss.trim().startsWith("—");
  }
  const COLOR_MODIFIERS = ["narvo", "bio", "juba", "lumi"];
  const COLOR_FAMILIES = [
    { family: "Red", base: "rubi" },
    { family: "Orange", base: "ojo" },
    { family: "Yellow", base: "aurumi" },
    { family: "Blue", base: "azuri" },
    { family: "Green", base: "verde" },
    { family: "Violet", base: "vio" },
    { family: "Black", base: "shada" },
    { family: "White", base: "vana" },
    { family: "Brown", base: "erta" }
  ];
  function spellColor(base, modifier) {
    return base + modifier;
  }
  function colorGrid() {
    return COLOR_FAMILIES.flatMap(({ family, base }) => [
      { form: base, base, family, modifier: null },
      ...COLOR_MODIFIERS.map((modifier) => ({
        form: spellColor(base, modifier),
        base,
        family,
        modifier
      }))
    ]);
  }
  const imageCompoundId = (modifier, head) => `ic:${modifier}+${head}`;
  function push(map, key, value) {
    const existing = map.get(key);
    if (existing === void 0) map.set(key, [value]);
    else existing.push(value);
  }
  function glossWords(gloss) {
    if (isUnusedGloss(gloss)) return [];
    return gloss.toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 2);
  }
  function buildIndexes(lexicon) {
    const byId = /* @__PURE__ */ new Map();
    const headwordBySpelling = /* @__PURE__ */ new Map();
    const byForm = /* @__PURE__ */ new Map();
    const byComponent = /* @__PURE__ */ new Map();
    const byDerivation = /* @__PURE__ */ new Map();
    const bySynonym = /* @__PURE__ */ new Map();
    const byGloss = /* @__PURE__ */ new Map();
    const byRhyme = /* @__PURE__ */ new Map();
    let unusedGlossSlots = 0;
    let primalRoots = 0;
    let compounds = 0;
    for (const h of lexicon.headwords) {
      byId.set(h.id, { namespace: "headword", spelling: h.spelling });
      headwordBySpelling.set(h.spelling, h);
      if (h.type === "primal") primalRoots += 1;
      else compounds += 1;
      for (const slot of FORM_SLOTS) {
        push(byForm, h.forms[slot], {
          namespace: "headword",
          entryId: h.id,
          spelling: h.spelling,
          slot
        });
        if (isUnusedGloss(h.glosses[slot])) unusedGlossSlots += 1;
      }
      for (const derivation of DERIVATION_KEYS) {
        if (isBlockedDerivation(h.spelling, derivation)) continue;
        const derived = h.spelling + derivation;
        push(byDerivation, h.spelling, derived);
        push(byForm, derived, {
          namespace: "derivation",
          entryId: h.id,
          spelling: h.spelling,
          derivation
        });
      }
      if (h.components !== null) {
        const [modifier, head] = h.components;
        push(byComponent, modifier, { spelling: h.spelling, entryId: h.id, role: "modifier" });
        push(byComponent, head, { spelling: h.spelling, entryId: h.id, role: "head" });
      }
      for (const synonym of h.englishSynonyms) {
        const key = synonym.trim().toLowerCase();
        if (key.length > 0) push(bySynonym, key, h.id);
      }
      for (const slot of FORM_SLOTS) {
        for (const word of glossWords(h.glosses[slot])) push(byGloss, word, h.id);
      }
      if (h.spelling.length >= 4) {
        push(byRhyme, h.spelling.slice(-4), h.spelling);
      }
    }
    const addClosed = (namespace, rows) => {
      for (const row of rows) {
        byId.set(row.id, { namespace, spelling: row.form });
        push(byForm, row.form, { namespace, entryId: row.id, spelling: row.form });
      }
    };
    addClosed("functionWord", lexicon.functionWords);
    addClosed("pronoun", lexicon.pronouns);
    addClosed("correlative", lexicon.correlatives);
    addClosed("timeWord", lexicon.timeWords);
    addClosed("discourseParticle", lexicon.discourseParticles);
    const colorIdByBase = new Map(lexicon.colors.map((c) => [c.base, c.id]));
    for (const c of lexicon.colors) {
      byId.set(c.id, { namespace: "color", spelling: c.base });
    }
    for (const cell of colorGrid()) {
      const entryId = colorIdByBase.get(cell.base);
      if (entryId === void 0) continue;
      push(byForm, cell.form, { namespace: "color", entryId, spelling: cell.base });
    }
    const patternPairs = /* @__PURE__ */ new Map();
    const pattern = lexicon.imageCompounds;
    if (pattern !== null) {
      const spellingOfId = new Map(lexicon.headwords.map((h) => [h.id, h]));
      const attestedBySpelling = new Map(pattern.attested.map((h) => [h.spelling, h]));
      for (const h of pattern.attested) {
        byId.set(h.id, { namespace: "imageCompound", spelling: h.spelling });
        for (const slot of FORM_SLOTS) {
          push(byForm, h.forms[slot], {
            namespace: "imageCompound",
            entryId: h.id,
            spelling: h.spelling,
            slot
          });
        }
        for (const derivation of DERIVATION_KEYS) {
          push(byForm, h.spelling + derivation, {
            namespace: "derivation",
            entryId: h.id,
            spelling: h.spelling,
            derivation
          });
        }
      }
      for (const [modId, mod] of pattern.modifiers) {
        const m = spellingOfId.get(modId);
        if (m === void 0) continue;
        for (const [headId] of pattern.heads) {
          const hd = spellingOfId.get(headId);
          if (hd === void 0) continue;
          const spelling = m.spelling + hd.spelling;
          if (headwordBySpelling.has(spelling)) continue;
          const attested = attestedBySpelling.get(spelling) ?? null;
          const headSense = (hd.glosses.root.split(";")[0] ?? hd.spelling).trim().toLowerCase();
          const pair = {
            id: attested?.id ?? imageCompoundId(modId, headId),
            spelling,
            modifier: modId,
            head: headId,
            attested,
            reading: `${mod.asModifier} ${headSense}`
          };
          patternPairs.set(spelling, pair);
          if (attested === null) {
            push(byForm, spelling, {
              namespace: "imageCompound",
              entryId: pair.id,
              spelling,
              slot: "root"
            });
          }
        }
      }
    }
    const legacyForms = new Map(lexicon.migrationForms.map((m) => [m.from, m]));
    const reserved = new Map(lexicon.soundLedger.map((s) => [s.spelling, s]));
    const multiNamespaceSpellings = [...byForm.values()].filter(
      (refs) => new Set(refs.map((r) => r.namespace)).size > 1
    ).length;
    return {
      byId,
      headwordBySpelling,
      byForm,
      byComponent,
      byDerivation,
      bySynonym,
      byGloss,
      byRhyme,
      legacyForms,
      patternPairs,
      reserved,
      stats: {
        headwords: lexicon.headwords.length,
        primalRoots,
        compounds,
        forms: lexicon.headwords.length * FORM_SLOTS.length,
        unusedGlossSlots,
        functionWords: lexicon.functionWords.length,
        distinctSpellings: byForm.size,
        multiNamespaceSpellings
      }
    };
  }
  function resolveSpelling(indexes, spelling) {
    const direct = indexes.byForm.get(spelling);
    if (direct !== void 0 && direct.length > 0) return { refs: direct };
    const legacy = indexes.legacyForms.get(spelling);
    if (legacy === void 0) return { refs: [] };
    if (legacy.isPhrase) {
      return { refs: [], viaLegacy: legacy, phrase: legacy.to };
    }
    return { refs: indexes.byForm.get(legacy.to) ?? [], viaLegacy: legacy };
  }
  function rulingRef(edition, id) {
    return `${edition}:${id}`;
  }
  const ENTRY_REGISTERS = ["everyday", "poetic"];
  function isEntryRegister(value) {
    return ENTRY_REGISTERS.includes(value);
  }
  function plain(rawKey, key = rawKey) {
    return {
      rawKey,
      key,
      decode: (raw) => raw[rawKey],
      encode: (value) => value
    };
  }
  function optional(rawKey, key = rawKey) {
    return { ...plain(rawKey, key), optional: true };
  }
  function mapped(rawKey, key, decode, encode, opts = {}) {
    return opts.optional === true ? { rawKey, key, decode, encode, optional: true } : { rawKey, key, decode, encode };
  }
  function enumField(rawKey, key, toInternal, opts = {}) {
    const toRaw = new Map(Object.entries(toInternal).map(([r, i]) => [i, r]));
    return mapped(
      rawKey,
      key,
      (raw) => {
        const value = raw[rawKey];
        if (typeof value !== "string") return value;
        return toInternal[value] ?? value;
      },
      (value, raw) => {
        const original = raw[rawKey];
        if (typeof original === "string" && (toInternal[original] ?? original) === value) {
          return original;
        }
        return toRaw.get(value) ?? value;
      },
      opts
    );
  }
  function decodeRecord(map, raw) {
    const out = {};
    for (const field of map.fields) {
      const spec = field;
      const value = spec.decode(raw);
      if (spec.optional === true && value === void 0) continue;
      out[spec.key] = value;
    }
    return out;
  }
  const ID_PREFIX = {
    headword: "lx",
    functionWord: "fw",
    pronoun: "pn",
    correlative: "cr",
    timeWord: "tw",
    color: "cl",
    discourseParticle: "dp"
  };
  function slugify(spelling) {
    const slug = spelling.toLowerCase().replace(/[^a-z]/g, "");
    return slug.length > 0 ? slug.slice(0, 24) : "x";
  }
  function formatId(kind, spelling, sequence) {
    const n = sequence.toString().padStart(4, "0");
    return `${ID_PREFIX[kind]}_${slugify(spelling)}_${n}`;
  }
  function emptyIdMap(edition) {
    return { version: 1, edition, minted: {}, next: {} };
  }
  class IdAssigner {
    constructor(file = emptyIdMap("")) {
      __publicField(this, "minted");
      __publicField(this, "next");
      __publicField(this, "used", /* @__PURE__ */ new Set());
      __publicField(this, "mintedCount", 0);
      this.minted = /* @__PURE__ */ new Map();
      this.next = /* @__PURE__ */ new Map();
      for (const [kind, entries] of Object.entries(file.minted)) {
        const inner = new Map(Object.entries(entries));
        this.minted.set(kind, inner);
        for (const id of inner.values()) this.used.add(id);
      }
      for (const [kind, n] of Object.entries(file.next)) {
        this.next.set(kind, n);
      }
    }
    /** How many ids this assigner has minted (as opposed to reused). */
    get newlyMinted() {
      return this.mintedCount;
    }
    /**
     * The id for a natural key, minting one on first sight.
     *
     * `preexisting` is an `id` already present in the data; when given it is
     * adopted rather than replaced, so an inline id always wins over the sidecar.
     */
    assign(kind, naturalKey, preexisting) {
      let inner = this.minted.get(kind);
      if (inner === void 0) {
        inner = /* @__PURE__ */ new Map();
        this.minted.set(kind, inner);
      }
      if (preexisting !== void 0 && preexisting.length > 0) {
        inner.set(naturalKey, preexisting);
        this.used.add(preexisting);
        return preexisting;
      }
      const existing = inner.get(naturalKey);
      if (existing !== void 0) return existing;
      let sequence = this.next.get(kind) ?? 1;
      let id = formatId(kind, naturalKey, sequence);
      while (this.used.has(id)) {
        sequence += 1;
        id = formatId(kind, naturalKey, sequence);
      }
      inner.set(naturalKey, id);
      this.used.add(id);
      this.next.set(kind, sequence + 1);
      this.mintedCount += 1;
      return id;
    }
    /** Serialise for `data/lexicon/ids.json`, with keys sorted for a stable diff. */
    toFile(edition) {
      const minted = {};
      for (const [kind, inner] of [...this.minted.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        minted[kind] = Object.fromEntries(
          [...inner.entries()].sort(([a], [b]) => a.localeCompare(b))
        );
      }
      const next = Object.fromEntries(
        [...this.next.entries()].sort(([a], [b]) => a.localeCompare(b))
      );
      return { version: 1, edition, minted, next };
    }
  }
  function decodeSlots(raw) {
    const out = {};
    for (const slot of FORM_SLOTS) {
      out[slot] = raw[SLOT_RAW_KEY[slot]] ?? "";
    }
    return out;
  }
  function encodeSlots(value, raw) {
    const out = { ...raw };
    for (const slot of FORM_SLOTS) out[SLOT_RAW_KEY[slot]] = value[slot];
    return out;
  }
  function slotsField(rawKey, key) {
    return mapped(
      rawKey,
      key,
      (raw) => decodeSlots(raw[rawKey]),
      (value, raw) => encodeSlots(value, raw[rawKey])
    );
  }
  function f(spec) {
    return spec;
  }
  const HEADWORD_TYPE = { Primal: "primal", Compound: "compound" };
  const HEADWORD_STATUS = {
    CARRIED: "carried",
    NEW: "new",
    REPLACED: "replaced",
    REDEFINED: "redefined",
    REWRITTEN: "rewritten",
    MERGED: "merged"
  };
  const headwordMap = {
    fields: [
      f(plain("root", "spelling")),
      f(enumField("type", "type", HEADWORD_TYPE)),
      f(
        mapped(
          "components",
          "components",
          (raw) => {
            const c = raw.components;
            if (c === null) return null;
            const [modifier, head] = c;
            if (c.length !== 2 || modifier === void 0 || head === void 0) {
              throw new Error(`${raw.root}: expected 2 components, got ${String(c.length)}`);
            }
            return [modifier, head];
          },
          (value) => value === null ? null : [...value]
        )
      ),
      slotsField("forms", "forms"),
      slotsField("glosses", "glosses"),
      f(plain("register")),
      f(plain("domain")),
      f(
        /**
         * An array on all 1099 entries in 1.0. The string branch exists only for
         * a future 0.8 reader, where it was semicolon-separated on 888 entries
         * (ADR-0001, finding 7); each entry exports back in its original shape.
         */
        mapped(
          "english_synonyms",
          "englishSynonyms",
          (raw) => typeof raw.english_synonyms === "string" ? raw.english_synonyms.split(";").map((s) => s.trim()).filter((s) => s.length > 0) : raw.english_synonyms,
          (value, raw) => typeof raw.english_synonyms === "string" ? value.join("; ") : [...value]
        )
      ),
      f(enumField("status_1_0", "status", HEADWORD_STATUS)),
      f(plain("since")),
      f(optional("replaces")),
      f(
        mapped(
          "history_0_8",
          "history08",
          (raw) => raw.history_0_8 === null ? null : { status: raw.history_0_8.status, editorialNote: raw.history_0_8.editorial_note },
          (value, raw) => value === null ? null : { ...raw.history_0_8, status: value.status, editorial_note: value.editorialNote }
        )
      ),
      f(plain("notes")),
      f(plain("protected"))
    ]
  };
  const functionWordMap = {
    fields: [
      f(plain("form")),
      f(plain("meaning")),
      f(plain("position")),
      f(plain("example")),
      f(plain("example_gloss", "exampleGloss")),
      f(plain("class", "slotClass")),
      f(plain("status_1_0", "status")),
      f(plain("since")),
      f(optional("notes")),
      f(optional("examples"))
    ]
  };
  const pronounMap = {
    fields: [
      f(plain("form")),
      f(plain("person")),
      f(plain("number")),
      f(plain("possessive")),
      f(plain("reflexive"))
    ]
  };
  const correlativeMap = {
    fields: [
      f(plain("form")),
      f(plain("determiner")),
      f(plain("concept")),
      f(plain("gloss"))
    ]
  };
  const timeWordMap = {
    fields: [f(plain("form")), f(plain("english"))]
  };
  const colorMap = {
    fields: [
      f(plain("Family", "family")),
      f(plain("Base color", "base")),
      f(plain("Dark + narvo", "dark")),
      f(plain("Life + bio", "life")),
      f(plain("Gem + juba", "gem")),
      f(plain("Light + lumi", "light")),
      f(plain("Example meanings / notes", "notes"))
    ]
  };
  const discourseParticleMap = {
    fields: [
      f(plain("form")),
      f(plain("function", "pragmaticFunction")),
      f(plain("positions")),
      f(plain("register")),
      f(plain("examples"))
    ]
  };
  const EXAMPLE_STATUS = {
    CARRIED: "carried",
    NEW: "new",
    MIGRATED: "migrated",
    HISTORICAL: "historical",
    FORMULA: "formula"
  };
  const exampleMap = {
    fields: [
      f(plain("liraasa")),
      f(plain("english")),
      f(plain("feature")),
      f(enumField("status", "status", EXAMPLE_STATUS)),
      f(plain("source")),
      f(
        mapped(
          "changes",
          "changes",
          (raw) => raw.changes ?? [],
          // 412 of 452 examples carry `changes`; the other 40 must stay absent.
          (value, raw) => raw.changes === void 0 && value.length === 0 ? void 0 : [...value],
          { optional: true }
        )
      )
    ]
  };
  const RAW = Symbol("raw");
  function attachRaw(value, raw) {
    Object.defineProperty(value, RAW, { value: raw, enumerable: false, writable: false });
    return value;
  }
  class ImportError extends Error {
  }
  const MIGRATION_KINDS = [
    "retired",
    "respelled",
    "merged",
    "rewritten",
    "archived-phrase"
  ];
  function decodeSection(map, rows, kind, naturalKey, assigner) {
    return rows.map((raw) => {
      const decoded = decodeRecord(map, raw);
      const preexisting = raw.id;
      decoded.id = assigner.assign(
        kind,
        naturalKey(raw),
        typeof preexisting === "string" ? preexisting : void 0
      );
      return attachRaw(decoded, raw);
    });
  }
  function decodeRulings(rows, edition) {
    return rows.map((raw) => {
      const refines = Array.isArray(raw.refines) ? raw.refines.map(String) : [];
      const examples = Array.isArray(raw.examples) ? raw.examples.filter((e) => Array.isArray(e) && typeof e[0] === "string").map(([liraasa, english]) => ({ liraasa, english })) : [];
      return {
        ref: rulingRef(edition, raw.id),
        edition,
        localId: raw.id,
        topic: raw.topic,
        ruling: raw.ruling,
        refines,
        examples
      };
    });
  }
  function compoundSuffix(h) {
    const raw = h[RAW];
    return typeof raw?.suffix === "string" ? raw.suffix : "";
  }
  function importLexicon(raw, options = {}) {
    const warnings = [];
    const assigner = new IdAssigner(options.ids ?? emptyIdMap(raw.version));
    if (typeof raw.version !== "string" || raw.version.length === 0) {
      throw new ImportError("lexicon has no version");
    }
    const headwords = decodeSection(
      headwordMap,
      raw.headwords,
      "headword",
      (h) => h.root,
      assigner
    );
    for (const h of headwords) {
      const register = h.register;
      if (!isEntryRegister(register)) {
        warnings.push(`${h.spelling}: unexpected entry register "${register}"`);
      }
      if (h.type === "compound" && h.components === null) {
        warnings.push(`${h.spelling}: compound with no components`);
      }
      if (h.type === "primal" && h.components !== null) {
        warnings.push(`${h.spelling}: primal with components`);
      }
      if (h.components !== null && h.components.join("") + compoundSuffix(h) !== h.spelling) {
        warnings.push(`${h.spelling}: spelling is not its components concatenated`);
      }
    }
    const functionWords = decodeSection(
      functionWordMap,
      raw.function_words,
      "functionWord",
      (f2) => f2.form,
      assigner
    ).map((f2) => Object.assign(f2, { isMultiWord: f2.form.includes(" ") }));
    const pronouns = decodeSection(
      pronounMap,
      raw.pronouns,
      "pronoun",
      (p) => p.form,
      assigner
    );
    const correlatives = decodeSection(
      correlativeMap,
      raw.correlatives,
      "correlative",
      (c) => c.form,
      assigner
    );
    const seenTimeForms = /* @__PURE__ */ new Set();
    const timeWords = decodeSection(
      timeWordMap,
      raw.time_and_dates,
      "timeWord",
      (t) => {
        const key = seenTimeForms.has(t.form) ? `${t.form}#${t.english}` : t.form;
        seenTimeForms.add(t.form);
        return key;
      },
      assigner
    );
    const colors = decodeSection(
      colorMap,
      raw.colors,
      "color",
      (c) => c["Base color"],
      assigner
    );
    const discourseParticles = decodeSection(discourseParticleMap, raw.discourse_particles, "discourseParticle", (d) => d.form, assigner);
    const examples = raw.examples.map((rawExample) => {
      const decoded = decodeRecord(exampleMap, rawExample);
      decoded.isLive = decoded.status !== "historical";
      return attachRaw(decoded, rawExample);
    });
    const rulings = [
      ...decodeRulings(raw.rulings_1_0, "1.0"),
      ...decodeRulings(raw.rulings_0_8_carried, "0.8"),
      ...Object.keys(raw).filter((k) => /^rulings_\d+_\d+$/.test(k) && k !== "rulings_1_0").flatMap(
        (k) => decodeRulings(
          raw[k] ?? [],
          k.slice("rulings_".length).replace("_", ".")
        )
      )
    ];
    const rawPattern = raw.image_compounds;
    const imageCompounds = rawPattern === void 0 ? null : {
      ruling: rawPattern.ruling,
      rule: rawPattern.rule,
      modifiers: new Map(
        Object.entries(rawPattern.modifiers).map(([id, m]) => [
          id,
          { asModifier: m.as_modifier, sense: m.sense }
        ])
      ),
      heads: new Map(
        Object.entries(rawPattern.heads).map(([id, h]) => [id, { template: h.template }])
      ),
      attested: decodeSection(
        headwordMap,
        rawPattern.attested,
        "headword",
        (h) => h.root,
        assigner
      ),
      keptAsHeadwords: new Map(Object.entries(rawPattern.kept_as_headwords))
    };
    const defaults = raw.morphology.derivation_defaults;
    const rhymeFamilies2 = raw.rhyme_families.map((r) => ({
      ending: r.ending,
      members: r.members,
      count: r.count
    }));
    const migrationForms = Object.entries(raw.legacy.migration_forms).map(
      ([from, m]) => {
        if (!MIGRATION_KINDS.includes(m.kind)) {
          warnings.push(`${from}: unknown migration kind "${m.kind}"`);
        }
        return {
          from,
          to: m.to,
          slot: m.slot,
          via: m.via,
          kind: m.kind,
          isPhrase: m.to.includes(" ")
        };
      }
    );
    const soundLedger = raw.sound_ledger.map((s) => ({
      spelling: s.spelling,
      state: s.state,
      replacement: s.replacement,
      reusableFrom: s.reusable_from,
      whyReserved: s.why_reserved
    }));
    const settledQuestions = raw.settled_open_questions_0_8.map((q) => ({
      question: q.q,
      answer: q.answer
    }));
    const lexicon = Object.defineProperty(
      {
        language: raw.language,
        version: raw.version,
        builtUtc: raw.built_utc,
        source: raw.source,
        headwords,
        imageCompounds,
        derivationDefaults: defaults ?? null,
        functionWords,
        pronouns,
        correlatives,
        timeWords,
        colors,
        discourseParticles,
        examples,
        rulings,
        rhymeFamilies: rhymeFamilies2,
        migrationForms,
        soundLedger,
        settledQuestions
      },
      RAW,
      { value: raw, enumerable: false, writable: false }
    );
    return {
      lexicon,
      ids: assigner.toFile(raw.version),
      newlyMinted: assigner.newlyMinted,
      warnings
    };
  }
  const CLOSED$1 = /* @__PURE__ */ new Set(["functionWord", "pronoun", "correlative", "discourseParticle", "timeWord"]);
  function humanize(name) {
    return name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
  }
  const formConcept = (slot) => `form:${slot}`;
  const slotConcept = (name) => `slot:${name}`;
  const suffixConcept = (suffix) => `suffix:${suffix.replace(/^-/, "")}`;
  const rulingConcept = (ref) => `rule:${ref}`;
  const CLAUSE = "clause";
  const COMPOUND = "compound";
  const NOUN_PHRASE = "nounPhrase";
  const NUMBERS$1 = "numbers";
  const MOTION = "motion";
  function slotWords(indexes, descriptions) {
    const out = [];
    for (const d of descriptions) {
      for (const w of d.toLowerCase().replace(/\([^)]*\)/g, " ").match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
        for (const r of resolveSpelling(indexes, w).refs) {
          if (CLOSED$1.has(r.namespace) && !out.includes(r.entryId)) out.push(r.entryId);
        }
      }
    }
    return out;
  }
  function deriveConcepts(lexicon, raw, indexes, overrides) {
    const concepts = /* @__PURE__ */ new Map();
    const gaps = [];
    const add = (c) => {
      concepts.set(c.id, { words: [], prereqs: [], ...c });
    };
    const morphology = raw.morphology;
    const grammar = raw.grammar;
    const builds = morphology.seven_forms ?? [];
    const verbRule = Object.entries(morphology.verb_rule ?? {}).map(([k, v]) => `${k}: ${v}`).join("; ");
    FORM_SLOTS.forEach((slot, i) => {
      const build = builds[i] ?? "";
      add({
        id: formConcept(slot),
        kind: "form",
        title: `The ${humanize(slot)} form`,
        description: slot === "verb" && verbRule ? `${build} — verb rule: ${verbRule}` : build,
        source: `morphology.seven_forms[${String(i)}]`,
        formSlot: slot,
        prereqs: slot === "root" ? [] : [formConcept("root")]
      });
    });
    for (const [suffix, meaning] of Object.entries(morphology.suffixes ?? {})) {
      add({
        id: suffixConcept(suffix),
        kind: "suffix",
        title: `${suffix}: ${meaning}`,
        description: [meaning, morphology.suffix_order].filter(Boolean).join(" — "),
        source: `morphology.suffixes.${suffix}`,
        prereqs: [formConcept("root")]
      });
    }
    add({
      id: COMPOUND,
      kind: "compound",
      title: "Compounds",
      description: morphology.compounding ?? "",
      source: "morphology.compounding",
      prereqs: [formConcept("root")]
    });
    add({
      id: NOUN_PHRASE,
      kind: "nounPhrase",
      title: "The noun phrase",
      description: grammar.noun_phrase ?? "",
      source: "grammar.noun_phrase",
      // the closed words the pattern spells out: its articles, de, raho …
      words: slotWords(indexes, [grammar.noun_phrase ?? ""]),
      prereqs: [formConcept("adjective")]
    });
    const motion = raw.motion_prefixes;
    if (motion.canon !== void 0) {
      add({
        id: MOTION,
        kind: "motion",
        title: "Motion prefixes",
        description: [
          Object.entries(motion.canon).map(([p, m]) => `${p} ${m}`).join("; "),
          motion.rule
        ].filter(Boolean).join(" — "),
        source: "motion_prefixes",
        prereqs: [formConcept("verb")]
      });
    }
    add({
      id: CLAUSE,
      kind: "clause",
      title: "The clause",
      description: grammar.clause_template ?? "",
      source: "grammar.clause_template",
      prereqs: [formConcept("verb")]
    });
    for (const s of grammar.slots ?? []) {
      const words2 = slotWords(indexes, s.words ?? []);
      add({
        id: slotConcept(s.slot),
        kind: "slot",
        title: `Slot ${String(s.n)}: ${humanize(s.slot)}`,
        description: [(s.words ?? []).join(", "), s.notes].filter(Boolean).join(" — "),
        source: `grammar.slots[${String(s.n - 1)}]`,
        slot: s.n,
        words: words2,
        prereqs: [CLAUSE]
      });
    }
    if (raw.numbers?.lookup_0_999 !== void 0) {
      add({
        id: NUMBERS$1,
        kind: "numbers",
        title: "Numbers",
        description: "The number words 0–999 from the data’s number table.",
        source: "numbers",
        prereqs: [formConcept("root")]
      });
    }
    const slotNames = (grammar.slots ?? []).map((s) => s.slot);
    const wordToSlot = /* @__PURE__ */ new Map();
    for (const c of concepts.values()) {
      if (c.kind !== "slot") continue;
      for (const id of c.words) wordToSlot.set(id, c.id);
    }
    const suffixes = Object.keys(morphology.suffixes ?? {});
    const rulingRefs = new Set(lexicon.rulings.map((r) => r.ref));
    for (const r of lexicon.rulings) {
      const id = rulingConcept(r.ref);
      const links = /* @__PURE__ */ new Set();
      const override = overrides.rulingLinks[r.ref];
      if (override !== void 0) {
        for (const c of override) links.add(c);
      } else {
        for (const ref of r.refines) {
          const slot = slotNames.find((name) => new RegExp(`\\b${name}\\b`).test(ref));
          if (slot !== void 0) links.add(slotConcept(slot));
          if (rulingRefs.has(ref)) links.add(rulingConcept(ref));
        }
        const text = `${r.topic} ${r.ruling}`;
        for (const name of slotNames) {
          if (new RegExp(`\\b${name}\\b`).test(text)) links.add(slotConcept(name));
        }
        for (const w of text.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) ?? []) {
          for (const ref of resolveSpelling(indexes, w).refs) {
            const slot = wordToSlot.get(ref.entryId);
            if (slot !== void 0) links.add(slot);
          }
        }
        for (const suffix of suffixes) {
          if (text.includes(suffix)) links.add(suffixConcept(suffix));
        }
        if (/\bcompound/i.test(text)) links.add(COMPOUND);
        if (/\bnoun phrase/i.test(text)) links.add(NOUN_PHRASE);
      }
      links.delete(id);
      const prereqs = [...links].filter((c) => c !== id);
      if (prereqs.length === 0 && !overrides.exclude.includes(id)) {
        gaps.push({
          severity: "note",
          code: "ruling-unlinked",
          ref: r.ref,
          message: `${r.ref} (“${r.topic}”) mentions no slot, closed word or suffix, so it is taught after the clause. Link it with rulingLinks to place it.`
        });
      }
      add({
        id,
        kind: "ruling",
        title: `${r.ref} — ${r.topic}`,
        description: r.ruling,
        source: `rulings (${r.edition})`,
        ruleRef: r.ref,
        prereqs: prereqs.length > 0 ? prereqs : [CLAUSE]
      });
    }
    for (const [ref, ids] of Object.entries(overrides.rulingLinks)) {
      if (!rulingRefs.has(ref)) {
        gaps.push({
          severity: "error",
          code: "override-unknown-ruling",
          ref,
          message: `rulingLinks names ${ref}, which is not a ruling in ${lexicon.version}.`
        });
      }
      for (const c of ids) {
        if (!concepts.has(c)) {
          gaps.push({
            severity: "error",
            code: "override-unknown-concept",
            ref,
            message: `rulingLinks for ${ref} names concept ${c}, which does not exist.`
          });
        }
      }
    }
    for (const c of concepts.values()) {
      const kept = c.prereqs.filter((p) => !reaches(concepts, p, c.id));
      if (kept.length !== c.prereqs.length) concepts.set(c.id, { ...c, prereqs: kept });
    }
    return { concepts, gaps };
  }
  function reaches(concepts, from, to) {
    const seen = /* @__PURE__ */ new Set();
    const stack = [from];
    while (stack.length > 0) {
      const c = stack.pop();
      if (c === void 0) break;
      if (c === to) return true;
      if (seen.has(c)) continue;
      seen.add(c);
      for (const p of concepts.get(c)?.prereqs ?? []) stack.push(p);
    }
    return false;
  }
  const DIGITS = [
    "zira",
    "una",
    "dossa",
    "tressa",
    "cuara",
    "penta",
    "sesa",
    "seta",
    "ocha",
    "niva"
  ];
  const DECADES = {
    10: "unzira",
    20: "dozira",
    30: "trezira",
    40: "cuazira",
    50: "penzira",
    60: "sesazira",
    70: "setazira",
    80: "ochazira",
    90: "nivazira"
  };
  const HUNDRED = "centa";
  const THOUSAND = "mililumi";
  const MILLION = "megalumi";
  const MAX_NUMBER = 999999999;
  class NumberRangeError extends Error {
  }
  function digit(n) {
    const d = DIGITS[n];
    if (d === void 0) throw new NumberRangeError(`not a digit: ${String(n)}`);
    return d;
  }
  function decade(tens) {
    const d = DECADES[tens * 10];
    if (d === void 0) throw new NumberRangeError(`not a decade: ${String(tens * 10)}`);
    return d;
  }
  function under100(n) {
    if (n < 10) return digit(n);
    const tens = Math.floor(n / 10);
    const unit = n % 10;
    return unit === 0 ? decade(tens) : `${decade(tens)}-${digit(unit)}`;
  }
  function under1000(n) {
    if (n < 100) return under100(n);
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = hundreds === 1 ? HUNDRED : digit(hundreds) + HUNDRED;
    return rest === 0 ? head : `${head}-${under100(rest)}`;
  }
  function spellNumber(n) {
    if (!Number.isInteger(n)) throw new NumberRangeError(`not an integer: ${String(n)}`);
    if (n < 0) throw new NumberRangeError("negative numbers are not defined");
    if (n > MAX_NUMBER) throw new NumberRangeError(`above ${String(MAX_NUMBER)}: ${String(n)}`);
    if (n < 1e3) return under1000(n);
    const millions = Math.floor(n / 1e6);
    const thousands = Math.floor(n % 1e6 / 1e3);
    const rest = n % 1e3;
    const groups = [];
    if (millions === 1) groups.push(MILLION);
    else if (millions > 1) groups.push(`${under1000(millions)}-${MILLION}`);
    if (thousands === 1) groups.push(THOUSAND);
    else if (thousands > 1) groups.push(`${under1000(thousands)}-${THOUSAND}`);
    if (rest > 0) groups.push(under1000(rest));
    return groups.join("-");
  }
  function spellOrdinal(n) {
    return `${spellNumber(n)}-ne`;
  }
  function spellFraction(numerator, denominator) {
    return `${spellNumber(numerator)} de ${spellNumber(denominator)}`;
  }
  const NOMINAL = /* @__PURE__ */ new Set(["headword", "imageCompound", "derivation", "pronoun", "timeWord"]);
  const ORDINAL_MARK = spellOrdinal(1).slice(spellNumber(1).length);
  const FRACTION_JOIN = spellFraction(1, 2).slice(spellNumber(1).length, -spellNumber(2).length);
  const WORD$1 = /[A-Za-z]+(?:-[A-Za-z]+)*/g;
  function words$1(text) {
    const masked = text.replace(/\([^)]*\)|\[[^\]]*\]/g, (m) => " ".repeat(m.length));
    return [...masked.matchAll(WORD$1)].map((m) => ({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length
    }));
  }
  function entry(ctx, spelling) {
    const r = resolveSpelling(ctx.indexes, spelling);
    if (r.refs.length === 0) return null;
    const refs = r.refs.map((f2) => ({
      id: f2.entryId,
      namespace: f2.namespace,
      ...f2.slot !== void 0 ? { slot: f2.slot } : {},
      ...f2.derivation !== void 0 ? { derivation: f2.derivation } : {}
    }));
    if (r.viaLegacy !== void 0) {
      return { kind: "entry", refs, via: "legacy", legacyFrom: r.viaLegacy.from };
    }
    return { kind: "entry", refs };
  }
  function suffixed(ctx, lower) {
    const plural = SUFFIXES.ri.spelling;
    const diminutive = SUFFIXES.ti.spelling;
    for (const [suffix, via] of [
      [plural, "plural"],
      [diminutive, "diminutive"]
    ]) {
      if (!lower.endsWith(suffix) || lower.length <= suffix.length + 2) continue;
      let stem = lower.slice(0, -suffix.length);
      let link = entry(ctx, stem);
      if (link === null && suffix === plural && stem.endsWith(diminutive)) {
        stem = stem.slice(0, -diminutive.length);
        link = entry(ctx, stem);
      }
      if (link === null || link.kind !== "entry") continue;
      const refs = link.refs.filter((r) => NOMINAL.has(r.namespace));
      if (refs.length > 0) return { kind: "entry", refs, via };
    }
    return null;
  }
  function linkWord(ctx, text) {
    const lower = text.toLowerCase();
    const exact = entry(ctx, lower);
    if (exact !== null) return exact;
    const value = ctx.numbers.get(lower);
    if (value !== void 0) return { kind: "number", value };
    if (lower.endsWith(ORDINAL_MARK)) {
      const n = ctx.numbers.get(lower.slice(0, -ORDINAL_MARK.length));
      if (n !== void 0) return { kind: "number", value: n, form: "ordinal" };
    }
    const joined = FRACTION_JOIN.trim().replace(/^/, "-") + "-";
    const cut = lower.indexOf(joined);
    if (cut > 0) {
      const top = ctx.numbers.get(lower.slice(0, cut));
      const bottom = ctx.numbers.get(lower.slice(cut + joined.length));
      if (top !== void 0 && bottom !== void 0 && bottom !== 0) {
        return { kind: "number", value: top / bottom, form: "fraction" };
      }
    }
    const viaSuffix = suffixed(ctx, lower);
    if (viaSuffix !== null) return viaSuffix;
    for (const prefix of ctx.motionPrefixes) {
      if (!lower.startsWith(prefix)) continue;
      const verb = entry(ctx, lower.slice(prefix.length));
      if (verb !== null && verb.kind === "entry") {
        const refs = verb.refs.filter((r) => r.slot === "verb");
        if (refs.length > 0) return { kind: "entry", refs, via: "motion", prefix };
      }
    }
    const diminutive = SUFFIXES.ti.spelling;
    if (ctx.names.has(lower) || lower.endsWith(diminutive) && ctx.names.has(lower.slice(0, -diminutive.length))) {
      return { kind: "name" };
    }
    return { kind: "unknown" };
  }
  function linkLine(ctx, text) {
    return words$1(text).map((w) => ({ ...w, link: linkWord(ctx, w.text) }));
  }
  function idsOf(tokens) {
    const out = [];
    for (const t of tokens) {
      if (t.link.kind !== "entry") continue;
      for (const r of t.link.refs) if (!out.includes(r.id)) out.push(r.id);
    }
    return out;
  }
  function linkedShare(tokens) {
    if (tokens.length === 0) return 0;
    return tokens.filter((t) => t.link.kind !== "unknown").length / tokens.length;
  }
  function textKey(text) {
    let h = 2166136261;
    for (const ch of text.normalize("NFC").trim()) {
      h ^= ch.codePointAt(0) ?? 0;
      h = Math.imul(h, 16777619) >>> 0;
    }
    return "ex:" + h.toString(16).padStart(8, "0");
  }
  const EN = /^#\s*EN:\s?(.*)$/;
  const MISLABELLED_SHARE = 0.75;
  const LINE_ALIGNED_SHARE = 0.6;
  function readCorpus(ctx, file) {
    const lines = [];
    let mislabelled = 0;
    let english = [];
    const flushEnglish = () => {
      if (english.length === 0) return;
      const joined = english.join(" ").replace(/\s+/g, " ").trim();
      english = [];
      const tokens = linkLine(ctx, joined);
      if (tokens.length >= 2 && linkedShare(tokens) >= MISLABELLED_SHARE) {
        mislabelled += 1;
        lines.push({ n: lines.length + 1, liraasa: joined, english: null, tokens });
        return;
      }
      const last = lines[lines.length - 1];
      if (last !== void 0 && last.english === null) {
        lines[lines.length - 1] = { ...last, english: joined };
      }
    };
    for (const raw of file.text.split(/\r?\n/)) {
      const line = raw.trim();
      const en = EN.exec(line);
      if (en !== null) {
        english.push(en[1] ?? "");
        continue;
      }
      if (line === "" || line.startsWith("#")) {
        flushEnglish();
        continue;
      }
      flushEnglish();
      lines.push({ n: lines.length + 1, liraasa: line, english: null, tokens: linkLine(ctx, line) });
    }
    flushEnglish();
    const gaps = [];
    const translated = lines.filter((l) => l.english !== null).length;
    if (lines.length > 0 && translated / lines.length < LINE_ALIGNED_SHARE) {
      for (const [i, l] of lines.entries()) lines[i] = { ...l, english: null };
      if (translated > 0) {
        gaps.push({
          severity: "note",
          code: "corpus-english-not-line-aligned",
          ref: file.id,
          message: `${String(translated)} of ${String(lines.length)} lines in ${file.source} are followed by English, too few to be a line-by-line translation: the English is read as stanza notes and not paired with lines.`
        });
      }
    }
    if (mislabelled > 0) {
      gaps.push({
        severity: "warn",
        code: "corpus-mislabelled-english",
        ref: file.id,
        message: `${String(mislabelled)} "# EN:" block(s) in ${file.source} read as Liraasa, not English: probably lines mislabelled in extraction. They are taught as Liraasa lines with no translation.`
      });
    }
    const untranslated = lines.filter((l) => l.english === null).length;
    if (untranslated > 0) {
      gaps.push({
        severity: "note",
        code: "corpus-no-english",
        ref: file.id,
        message: `${String(untranslated)} of ${String(lines.length)} lines in ${file.source} have no English, so comprehension questions cannot be drawn from them.`
      });
    }
    return { text: { id: file.id, title: file.title, source: file.source, lines }, gaps };
  }
  function writingToCorpusFile(writing) {
    const english = writing.englishLines ?? [];
    const text = writing.text.split(/\r?\n/).map((line, i) => {
      const en = english[i]?.trim();
      return line.trim() === "" ? "" : line + (en ? "\n# EN: " + en : "");
    }).join("\n");
    return { id: "writing:" + writing.id, title: writing.title, source: "songbook", text };
  }
  const EMPTY_OVERRIDES = {
    version: 1,
    pins: [],
    levels: {},
    notes: {},
    lessons: [],
    rulingLinks: {},
    exclude: [],
    rulingExamples: {},
    formNotes: {}
  };
  class OverridesError extends Error {
  }
  const isRecord = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
  const strings = (x, where) => {
    if (x === void 0) return [];
    if (!Array.isArray(x) || x.some((s) => typeof s !== "string")) {
      throw new OverridesError(`${where} must be a list of strings`);
    }
    return x;
  };
  function parseOverrides(input) {
    if (input === void 0 || input === null) return EMPTY_OVERRIDES;
    if (!isRecord(input)) throw new OverridesError("overrides must be an object");
    if (input.version !== void 0 && input.version !== 1) {
      throw new OverridesError(`overrides version ${JSON.stringify(input.version)} is not supported`);
    }
    const levels = {};
    for (const [id, level] of Object.entries(isRecord(input.levels) ? input.levels : {})) {
      if (level !== "core" && level !== "advanced") {
        throw new OverridesError(`levels.${id} must be "core" or "advanced"`);
      }
      levels[id] = level;
    }
    const notes = {};
    for (const [id, note] of Object.entries(isRecord(input.notes) ? input.notes : {})) {
      if (!isRecord(note)) throw new OverridesError(`notes.${id} must be an object`);
      notes[id] = {
        ...typeof note.explanation === "string" ? { explanation: note.explanation } : {},
        ...typeof note.mnemonic === "string" ? { mnemonic: note.mnemonic } : {}
      };
    }
    const lessons = [];
    const rawLessons = input.lessons ?? [];
    if (!Array.isArray(rawLessons)) throw new OverridesError("lessons must be a list");
    for (const [i, l] of rawLessons.entries()) {
      if (!isRecord(l) || typeof l.id !== "string" || typeof l.title !== "string") {
        throw new OverridesError(`lessons[${String(i)}] needs an id and a title`);
      }
      lessons.push({
        id: l.id,
        title: l.title,
        ...typeof l.after === "string" ? { after: l.after } : {},
        refs: strings(l.refs, `lessons[${String(i)}].refs`),
        body: typeof l.body === "string" ? l.body : ""
      });
    }
    const rulingLinks = {};
    for (const [ref, ids] of Object.entries(isRecord(input.rulingLinks) ? input.rulingLinks : {})) {
      rulingLinks[ref] = strings(ids, `rulingLinks.${ref}`);
    }
    const formNotes = {};
    for (const [key, note] of Object.entries(isRecord(input.formNotes) ? input.formNotes : {})) {
      if (typeof note !== "string") throw new OverridesError(`formNotes.${key} must be a string`);
      if (!/^[^|]+\|[A-Za-z]+$/.test(key)) {
        throw new OverridesError(`formNotes key ${key} must be "<entry id>|<form slot>"`);
      }
      formNotes[key] = note;
    }
    return {
      version: 1,
      pins: strings(input.pins, "pins"),
      levels,
      notes,
      lessons,
      rulingLinks,
      exclude: strings(input.exclude, "exclude"),
      rulingExamples: Object.fromEntries(
        Object.entries(isRecord(input.rulingExamples) ? input.rulingExamples : {}).map(
          ([ref, keys]) => [ref, strings(keys, `rulingExamples.${ref}`)]
        )
      ),
      formNotes
    };
  }
  function headwordItem(h, indexes, edition, gaps, colourIds = /* @__PURE__ */ new Map()) {
    const forms = FORM_SLOTS.map((slot) => ({
      slot,
      form: h.forms[slot],
      gloss: h.glosses[slot],
      meaningful: !isUnusedGloss(h.glosses[slot])
    }));
    const meaning = forms.find((f2) => f2.slot === "root" && f2.meaningful)?.gloss ?? forms.find((f2) => f2.meaningful)?.gloss ?? "";
    if (meaning === "") {
      gaps.push({
        severity: "error",
        code: "item-no-meaning",
        ref: h.id,
        message: `${h.spelling} has no meaningful gloss in any of its seven forms.`
      });
    }
    let components = null;
    if (h.components !== null) {
      const ids = h.components.map(
        (c, i) => indexes.headwordBySpelling.get(c)?.id ?? (i === 0 ? colourIds.get(c) : void 0)
      );
      const [modifier, head] = ids;
      if (modifier !== void 0 && head !== void 0) {
        components = [modifier, head];
      } else {
        gaps.push({
          severity: "error",
          code: "compound-component-missing",
          ref: h.id,
          message: `${h.spelling} is built from ${h.components.join(" + ")}, but not every part is a headword.`
        });
      }
    }
    const raw = h[RAW];
    const status = raw[`status_${edition.replace(".", "_")}`];
    return {
      id: h.id,
      kind: h.type === "compound" ? "compound" : "root",
      spelling: h.spelling,
      meaning,
      theme: h.domain,
      register: h.register,
      forms,
      synonyms: h.englishSynonyms,
      components,
      usedIn: (indexes.byComponent.get(h.spelling) ?? []).map((u) => u.entryId),
      since: h.since,
      status: typeof status === "string" ? status : null
    };
  }
  function closedItems(lexicon, pronounEnglish, indexes) {
    const base = {
      register: null,
      forms: [],
      synonyms: [],
      components: null,
      usedIn: [],
      status: null
    };
    return [
      ...lexicon.functionWords.map((w) => ({
        ...base,
        id: w.id,
        kind: "functionWord",
        spelling: w.form,
        meaning: w.meaning,
        theme: "Function words",
        since: w.since
      })),
      ...lexicon.pronouns.map((p) => ({
        ...base,
        id: p.id,
        kind: "pronoun",
        spelling: p.form,
        meaning: (pronounEnglish[p.form] !== void 0 ? `${pronounEnglish[p.form] ?? ""} (${p.person}, ${p.number})` : `${p.person}, ${p.number}`).toLowerCase(),
        theme: "Pronouns",
        since: ""
      })),
      ...lexicon.correlatives.map((c) => ({
        ...base,
        id: c.id,
        kind: "correlative",
        spelling: c.form,
        meaning: c.gloss,
        theme: "Correlatives",
        since: ""
      })),
      ...lexicon.timeWords.map((t) => ({
        ...base,
        id: t.id,
        kind: "timeWord",
        spelling: t.form,
        meaning: t.english,
        theme: "Time words",
        since: ""
      })),
      ...lexicon.colors.map((c) => ({
        ...base,
        id: c.id,
        kind: "color",
        spelling: c.base,
        meaning: c.family.toLowerCase(),
        theme: "Colours",
        since: "",
        // a colour base may be a compound's modifier (2.0:G38)
        usedIn: (indexes.byComponent.get(c.base) ?? []).map((u) => u.entryId)
      })),
      ...lexicon.discourseParticles.map((d) => ({
        ...base,
        id: d.id,
        kind: "particle",
        spelling: d.form,
        meaning: d.pragmaticFunction,
        theme: "Discourse particles",
        since: ""
      }))
    ];
  }
  function conceptsOf(tokens, items, wordToSlot, concepts, structural) {
    const out = /* @__PURE__ */ new Set();
    let verb = false;
    for (const t of tokens) {
      if (t.link.kind === "number") out.add(NUMBERS$1);
      if (t.link.kind !== "entry") continue;
      if (t.link.via === "motion") out.add(MOTION);
      if (t.link.via === "plural") out.add(suffixConcept(SUFFIXES.ri.spelling));
      if (t.link.via === "diminutive") out.add(suffixConcept(SUFFIXES.ti.spelling));
      for (const r of t.link.refs) {
        if (r.slot !== void 0) {
          out.add(formConcept(r.slot));
          if (r.slot === "verb") verb = true;
        }
        if (r.derivation !== void 0) out.add(suffixConcept(r.derivation));
        const k = items.get(r.id)?.kind;
        if (k === "compound" || k === "imageCompound" || r.namespace === "imageCompound")
          out.add(COMPOUND);
        const slot = wordToSlot.get(r.id);
        if (slot !== void 0) out.add(slot);
      }
    }
    if (verb || [...out].some((c) => c.startsWith("slot:"))) {
      out.add(CLAUSE);
      for (const c of structural) out.add(c);
    }
    return [...out].filter((c) => concepts.has(c));
  }
  function buildLearnSource(input) {
    const overrides = input.overrides ?? EMPTY_OVERRIDES;
    const { lexicon } = importLexicon(
      input.lexicon,
      input.ids !== void 0 ? { ids: input.ids } : {}
    );
    const indexes = buildIndexes(lexicon);
    const edition = lexicon.version;
    const gaps = [];
    const numbers = /* @__PURE__ */ new Map();
    for (const [value, word] of Object.entries(input.lexicon.numbers.lookup_0_999)) {
      numbers.set(word.toLowerCase(), Number(value));
    }
    const names = new Set((input.names ?? []).map((n) => n.toLowerCase()));
    const motionPrefixes = Object.keys(
      input.lexicon.motion_prefixes?.canon ?? {}
    );
    const context = { indexes, numbers, names, motionPrefixes };
    const items = /* @__PURE__ */ new Map();
    const colourIds = new Map(lexicon.colors.map((c) => [c.base, c.id]));
    for (const h of lexicon.headwords)
      items.set(h.id, headwordItem(h, indexes, edition, gaps, colourIds));
    for (const h of lexicon.imageCompounds?.attested ?? []) {
      items.set(h.id, {
        ...headwordItem(h, indexes, edition, gaps, colourIds),
        kind: "imageCompound"
      });
    }
    const patternReadings = /* @__PURE__ */ new Map();
    for (const pair of indexes.patternPairs.values()) {
      if (pair.attested === null) patternReadings.set(pair.id, pair.reading);
    }
    for (const item of closedItems(lexicon, input.pronounEnglish ?? {}, indexes))
      items.set(item.id, item);
    const derived = deriveConcepts(lexicon, input.lexicon, indexes, overrides);
    gaps.push(...derived.gaps);
    const concepts = derived.concepts;
    const wordToSlot = /* @__PURE__ */ new Map();
    for (const c of concepts.values()) {
      if (c.kind === "slot" || c.kind === "nounPhrase") {
        for (const id of c.words) if (!wordToSlot.has(id)) wordToSlot.set(id, c.id);
      }
    }
    const structural = [...concepts.values()].filter((c) => c.kind === "slot" && c.words.length === 0).map((c) => c.id);
    const examples = [];
    const seen = /* @__PURE__ */ new Map();
    const unknown = /* @__PURE__ */ new Map();
    const addExample = (liraasa, english, source, extra = {}) => {
      const text = liraasa.trim();
      const key = textKey(text);
      if (text === "") return;
      const earlier = seen.get(key);
      if (earlier !== void 0 && source !== "corpus") {
        const rule = extra.ruleRef !== void 0 ? rulingConcept(extra.ruleRef) : void 0;
        if (rule !== void 0 && !earlier.concepts.includes(rule)) {
          earlier.concepts.push(rule);
        }
        return;
      }
      const tokens = extra.tokens ?? linkLine(context, text);
      for (const t of tokens) {
        if (t.link.kind === "unknown") unknown.set(t.text, (unknown.get(t.text) ?? 0) + 1);
      }
      const linked = conceptsOf(tokens, items, wordToSlot, concepts, structural);
      if (extra.ruleRef !== void 0) linked.unshift(rulingConcept(extra.ruleRef));
      const example = {
        key,
        liraasa: text,
        english: english === null || english.trim() === "" ? null : english.trim(),
        source,
        ...extra.ruleRef !== void 0 ? { ruleRef: extra.ruleRef } : {},
        ...extra.where !== void 0 ? { where: extra.where } : {},
        tokens,
        ids: idsOf(tokens),
        concepts: linked
      };
      examples.push(example);
      if (earlier === void 0) seen.set(key, example);
    };
    for (const r of lexicon.rulings) {
      for (const e of r.examples) addExample(e.liraasa, e.english, "ruling", { ruleRef: r.ref });
    }
    for (const e of lexicon.examples) {
      if (e.isLive && e.status !== "formula") addExample(e.liraasa, e.english, "examples");
    }
    for (const w of lexicon.functionWords) {
      if (w.example) addExample(w.example, w.exampleGloss ?? null, "functionWord");
      for (const e of w.examples ?? []) {
        const [liraasa, english] = Array.isArray(e) ? e : [e.liraasa, e.english];
        if (typeof liraasa === "string") {
          addExample(liraasa, typeof english === "string" ? english : null, "functionWord");
        }
      }
    }
    for (const d of lexicon.discourseParticles) {
      for (const e of d.examples) addExample(e.liraasa, e.english, "particle");
    }
    const texts = [];
    for (const file of input.corpus ?? []) {
      const read = readCorpus(context, file);
      texts.push(read.text);
      gaps.push(...read.gaps);
      for (const line of read.text.lines) {
        addExample(line.liraasa, line.english, "corpus", {
          where: `${file.id}:${String(line.n)}`,
          tokens: line.tokens
        });
      }
    }
    const frequency = /* @__PURE__ */ new Map();
    const bump = (id, corpus) => {
      const f2 = frequency.get(id) ?? { corpus: 0, examples: 0 };
      if (corpus) f2.corpus += 1;
      else f2.examples += 1;
      frequency.set(id, f2);
    };
    for (const e of examples) {
      for (const id of e.ids) {
        bump(id, e.source === "corpus");
        for (const part of items.get(id)?.components ?? []) bump(part, e.source === "corpus");
      }
    }
    const byKey = new Map(examples.map((e) => [e.key, e]));
    for (const [ref, keys] of Object.entries(overrides.rulingExamples)) {
      const concept = rulingConcept(ref);
      for (const key of keys) {
        const e = byKey.get(key);
        if (e === void 0 || !concepts.has(concept)) {
          gaps.push({
            severity: "error",
            code: "override-unknown-example",
            ref,
            message: `rulingExamples for ${ref} names ${key}, which is no sentence${concepts.has(concept) ? "" : " (and no such ruling)"} in ${edition}. The sentence may have changed.`
          });
          continue;
        }
        if (!e.concepts.includes(concept)) e.concepts.push(concept);
      }
    }
    if (unknown.size > 0) {
      const list = [...unknown].sort((a, b) => b[1] - a[1]);
      gaps.push({
        severity: "note",
        code: "unknown-words",
        ref: "corpus",
        message: `${String(list.length)} spellings in examples and texts link to no entry, number or name, so lessons skip them: ${list.slice(0, 30).map(([w, n]) => `${w}×${String(n)}`).join(", ")}${list.length > 30 ? ", …" : ""}`
      });
    }
    const data = {
      edition,
      items,
      concepts,
      examples,
      texts,
      frequency,
      numbers,
      names,
      patternReadings,
      gaps
    };
    const replacementFor = (spelling) => {
      const m = indexes.legacyForms.get(spelling);
      if (m === void 0 || m.isPhrase) return void 0;
      return indexes.headwordBySpelling.get(m.to)?.id;
    };
    return { data, lexicon, indexes, context, replacementFor };
  }
  function buildLearnData(input) {
    return buildLearnSource(input).data;
  }
  const AUDIO_DIR = "data/audio";
  function safePath(path) {
    return path.length > 0 && !path.startsWith("/") && !/^[a-z]+:/i.test(path) && !path.includes("\\") && !path.split("/").includes("..");
  }
  function readAudioManifest(raw, data) {
    const out = { files: {}, unknownKeys: [], badPaths: [] };
    const files = raw !== null && typeof raw === "object" ? raw.files : void 0;
    if (files === null || typeof files !== "object") return out;
    const sentences = new Set(data.examples.map((e) => e.key));
    for (const [key, path] of Object.entries(files)) {
      if (!data.items.has(key) && !sentences.has(key)) {
        out.unknownKeys.push(key);
        continue;
      }
      if (typeof path !== "string" || !safePath(path)) {
        out.badPaths.push(key);
        continue;
      }
      out.files[key] = path;
    }
    return out;
  }
  function audioCoverage(data, have) {
    const headwords = [...data.items.values()].filter(
      (i) => i.kind === "root" || i.kind === "compound"
    );
    const count = (items) => ({
      have: items.filter((i) => have.has(i.id)).length,
      total: items.length
    });
    const use = (i) => {
      const f2 = data.frequency.get(i.id);
      return (f2?.corpus ?? 0) + (f2?.examples ?? 0) + i.usedIn.length;
    };
    const missing = headwords.filter((i) => !have.has(i.id)).sort(
      (a, b) => Number(b.kind === "root") - Number(a.kind === "root") || use(b) - use(a) || a.spelling.localeCompare(b.spelling)
    ).map((i) => i.id);
    return {
      roots: count(headwords.filter((i) => i.kind === "root")),
      compounds: count(headwords.filter((i) => i.kind === "compound")),
      sentences: {
        have: data.examples.filter((e) => have.has(e.key)).length,
        total: data.examples.length
      },
      missing
    };
  }
  function normalize(text) {
    return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[.,!?;:"“”'‘’()[\]{}…—–]/g, " ").replace(/\s+/g, " ").trim();
  }
  function editDistance(a, b, max = Infinity) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev2 = [];
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const row = [i];
      let best = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          v = Math.min(v, (prev2[j - 2] ?? 0) + 1);
        }
        row.push(v);
        if (v < best) best = v;
      }
      if (best > max) return max + 1;
      prev2 = prev;
      prev = row;
    }
    return prev[b.length] ?? 0;
  }
  const typoBudget = (length) => length <= 4 ? 1 : length <= 9 ? 2 : 3;
  function unique(list, key) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const x of list) {
      const k = key(x);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return out;
  }
  const STOP = new Set(
    "a an the to of in on at for with and or but is are am was were be been being it its this that these those my your his her our their i you he she we they me him us them do does did not no so as by from".split(
      " "
    )
  );
  function englishContent(text) {
    return normalize(text).replace(/-/g, " ").split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map((w) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "") || w);
  }
  const NAMED = /* @__PURE__ */ new Set(["functionWord", "pronoun", "correlative", "discourseParticle", "timeWord"]);
  function idsNamedBy(context, text) {
    const out = [];
    for (const t of linkLine(context, text)) {
      if (t.link.kind !== "entry" || t.link.via !== void 0) continue;
      for (const r of t.link.refs) {
        const named = NAMED.has(r.namespace) || r.namespace === "derivation";
        if (named && !out.includes(r.id)) out.push(r.id);
      }
    }
    return out;
  }
  function candidateExamples(data, context, ref, limit = 5) {
    const concept = data.concepts.get(`rule:${ref}`);
    if (concept === void 0) return [];
    const named = idsNamedBy(context, `${concept.title} ${concept.description}`);
    if (named.length === 0) return [];
    return unique(
      data.examples.filter((e) => e.english !== null),
      (e) => e.key
    ).map((example) => ({ example, matched: named.filter((id) => example.ids.includes(id)) })).filter((c) => c.matched.length > 0 && !c.example.concepts.includes(concept.id)).sort(
      (a, b) => b.matched.length - a.matched.length || a.example.liraasa.length - b.example.liraasa.length || (a.example.key < b.example.key ? -1 : 1)
    ).slice(0, limit);
  }
  const PREFER = ["pronoun", "functionWord", "correlative", "discourseParticle", "timeWord", "color"];
  function glossToken(data, token) {
    const base = { text: token.text, start: token.start, end: token.end };
    const link = token.link;
    if (link.kind === "number") {
      const tag = link.form ?? "number";
      return { ...base, id: null, ids: [], gloss: String(link.value), tags: [tag], kind: "number" };
    }
    if (link.kind === "name")
      return { ...base, id: null, ids: [], gloss: token.text, tags: ["name"], kind: "name" };
    if (link.kind === "unknown")
      return { ...base, id: null, ids: [], gloss: "?", tags: [], kind: "unknown" };
    const refs = [...link.refs].sort(
      (a, b) => (PREFER.includes(a.namespace) ? PREFER.indexOf(a.namespace) : 99) - (PREFER.includes(b.namespace) ? PREFER.indexOf(b.namespace) : 99)
    );
    const ref = refs[0];
    const item = ref === void 0 ? void 0 : data.items.get(ref.id);
    const tags = [];
    let gloss = item?.meaning ?? (ref === void 0 ? void 0 : data.patternReadings.get(ref.id)) ?? "?";
    if (item !== void 0 && ref?.slot !== void 0) {
      const form = item.forms.find((f2) => f2.slot === ref.slot);
      if (form?.meaningful === true) gloss = form.gloss;
      if (ref.slot !== "root") tags.push(humanize(ref.slot));
    }
    if (item?.kind === "pronoun") gloss = gloss.replace(/\s*\(.*\)$/, "");
    if (ref?.derivation !== void 0) tags.push("-" + ref.derivation);
    if (link.via === "plural") tags.push("PL");
    if (link.via === "diminutive") tags.push("DIM");
    if (link.via === "motion" && link.prefix !== void 0) tags.push(link.prefix);
    if (link.via === "legacy" && link.legacyFrom !== void 0)
      tags.push(`pre-1.0 ${link.legacyFrom}`);
    return {
      ...base,
      id: ref?.id ?? null,
      ids: refs.map((r) => r.id),
      gloss,
      tags,
      kind: "entry"
    };
  }
  const glossLine = (data, tokens) => tokens.map((t) => glossToken(data, t));
  function usagesOf(data, id, limit = 6) {
    const rank = (e) => (e.english === null ? 100 : 0) + (e.source === "corpus" ? 0 : 5) + e.liraasa.length / 40;
    return unique(
      data.examples.filter((e) => e.ids.includes(id)),
      (e) => e.liraasa
    ).sort((a, b) => rank(a) - rank(b) || (a.key < b.key ? -1 : 1)).slice(0, limit);
  }
  const interlinear = (data, e) => ({
    liraasa: e.liraasa,
    english: e.english,
    source: e.source,
    ...e.where !== void 0 ? { where: e.where } : {},
    tokens: glossLine(data, e.tokens)
  });
  const refOf = (data, id) => {
    const item = data.items.get(id);
    return { id, spelling: item?.spelling ?? id, meaning: item?.meaning ?? "" };
  };
  function rootCard(data, id, overrides) {
    const item = data.items.get(id);
    if (item === void 0) return null;
    return {
      item,
      parts: (item.components ?? []).map((p) => refOf(data, p)),
      compounds: item.usedIn.map((c) => refOf(data, c)),
      usages: usagesOf(data, id).map((e) => interlinear(data, e)),
      note: overrides.notes[id] ?? null
    };
  }
  function explainer(data, id, overrides, limit = 6) {
    const concept = data.concepts.get(id);
    if (concept === void 0) return null;
    const order = concept.kind === "ruling" ? { ruling: 0, examples: 1, functionWord: 2, particle: 3, corpus: 4 } : { examples: 0, functionWord: 1, particle: 2, corpus: 3, ruling: 4 };
    const examples = unique(
      data.examples.filter((e) => e.concepts.includes(id)),
      (e) => e.liraasa
    ).sort(
      (a, b) => order[a.source] - order[b.source] || (a.english === null ? 1 : 0) - (b.english === null ? 1 : 0) || a.liraasa.length - b.liraasa.length
    ).slice(0, limit);
    const note = overrides.notes[id] ?? (concept.ruleRef !== void 0 ? overrides.notes[concept.ruleRef] : void 0);
    return {
      concept,
      prereqs: concept.prereqs.map((p) => ({ id: p, title: data.concepts.get(p)?.title ?? p })),
      words: concept.words.map((w) => refOf(data, w)),
      examples: examples.map((e) => interlinear(data, e)),
      note: note ?? null
    };
  }
  function reading(data, textId) {
    const text = data.texts.find((t) => t.id === textId);
    if (text === void 0) return null;
    const counts = /* @__PURE__ */ new Map();
    const lines = text.lines.map((l) => {
      const tokens = glossLine(data, l.tokens);
      for (const t of tokens) if (t.id !== null) counts.set(t.id, (counts.get(t.id) ?? 0) + 1);
      return {
        liraasa: l.liraasa,
        english: l.english,
        source: "corpus",
        where: `${text.id}:${String(l.n)}`,
        tokens
      };
    });
    const vocabulary = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([id]) => id);
    return { text, lines, vocabulary };
  }
  function unitLesson(data, graph, overrides, unitIndex) {
    const unit = graph.units[unitIndex];
    if (unit === void 0) return [];
    const blocks = [];
    for (const id of unit.nodes) {
      const node = graph.nodes.get(id);
      if (node === void 0) continue;
      if (node.kind === "concept") {
        const e = explainer(data, node.ref, overrides);
        if (e !== null) blocks.push({ kind: "explainer", node: id, explainer: e });
      } else if (node.kind === "root") {
        const card = rootCard(data, node.ref, overrides);
        if (card !== null) blocks.push({ kind: "card", node: id, card });
      } else {
        blocks.push({
          kind: "pattern",
          node: id,
          root: refOf(data, node.ref),
          members: (node.members ?? []).map((m) => refOf(data, m))
        });
      }
      for (const l of overrides.lessons) {
        if (l.after === id)
          blocks.push({ kind: "custom", id: l.id, title: l.title, body: l.body, refs: l.refs });
      }
    }
    return blocks;
  }
  const EXERCISE_TYPES = [
    "recognition",
    "recall",
    "formBuild",
    "formIdentify",
    "decompose",
    "compoundBuild",
    "assemble",
    "translateFrom",
    "translateTo",
    "cloze",
    "matching",
    "listen"
  ];
  const cardId = (target, skill, direction) => `${target}|${skill}|${direction}`;
  const HEADWORD$1 = /* @__PURE__ */ new Set(["root", "compound", "imageCompound"]);
  const meaningful = (item) => item.forms.filter((f2) => f2.meaningful).map((f2) => f2.slot);
  const formOf$1 = (item, slot) => item.forms.find((f2) => f2.slot === slot)?.form ?? item.spelling;
  const glossOf = (item, slot) => {
    const f2 = item.forms.find((x) => x.slot === slot);
    return f2?.meaningful === true ? f2.gloss : item.meaning;
  };
  function sameMeaning(a, b) {
    if (normalize(a.meaning) === normalize(b.meaning)) return true;
    const syn = new Set(a.synonyms.map(normalize));
    return b.synonyms.some((s) => syn.has(normalize(s)));
  }
  function distractorItems(ctx, item, n, rng, accept = () => true) {
    const group = HEADWORD$1.has(item.kind) ? (k) => HEADWORD$1.has(k) : (k) => k === item.kind;
    const scored = [];
    for (const other of ctx.data.items.values()) {
      if (other.id === item.id || !group(other.kind) || !accept(other)) continue;
      if (normalize(other.spelling) === normalize(item.spelling) || sameMeaning(item, other))
        continue;
      let score = 0;
      if (other.theme === item.theme) score += 3;
      const d = editDistance(other.spelling, item.spelling, 3);
      if (d <= 2) score += 3;
      else if (d <= 3) score += 1;
      if (other.kind === item.kind) score += 1;
      if (other.register === item.register) score += 0.5;
      if (Math.abs(other.spelling.length - item.spelling.length) <= 1) score += 0.5;
      if (score > 0) scored.push({ item: other, score: score + rng.next() * 0.1 });
    }
    scored.sort((a, b) => b.score - a.score);
    const pool = scored.slice(0, Math.max(n * 3, n));
    const chosen = [];
    for (const { item: other } of rng.shuffle(pool)) {
      if (chosen.length >= n) break;
      if (chosen.some(
        (c) => sameMeaning(c, other) || normalize(c.spelling) === normalize(other.spelling)
      )) {
        continue;
      }
      chosen.push(other);
    }
    return chosen;
  }
  function choicesOf(rng, correct, wrong, n = 4, forbidden = []) {
    const seen = /* @__PURE__ */ new Set([normalize(correct.text), ...forbidden.map(normalize)]);
    const out = [correct];
    for (const c of wrong) {
      if (out.length >= n) break;
      const key = normalize(c.text);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return rng.shuffle(out);
  }
  const usable = (e, min = 2, max = 10) => e.english !== null && e.tokens.length >= min && e.tokens.length <= max && e.tokens.every((t) => t.link.kind !== "unknown");
  function recognition(ctx, id, rng, slot) {
    const item = ctx.data.items.get(id);
    if (item === void 0 || item.meaning === "") return null;
    const s = slot ?? "root";
    const form = item.forms.length > 0 ? formOf$1(item, s) : item.spelling;
    const meaning = item.forms.length > 0 ? glossOf(item, s) : item.meaning;
    const wrong = distractorItems(ctx, item, 6, rng).map((d) => ({
      id: d.id,
      text: d.forms.length > 0 ? glossOf(d, s) : d.meaning,
      liraasa: false
    }));
    const choices = choicesOf(rng, { id: item.id, text: meaning, liraasa: false }, wrong, 4, [
      ...item.synonyms,
      item.meaning
    ]);
    if (choices.length < 3) return null;
    return {
      id: `recognition:${id}:${s}`,
      type: "recognition",
      skill: "meaning",
      direction: "recognize",
      card: cardId(id, "meaning", "recognize"),
      target: id,
      items: [id, ...choices.filter((c) => c.id !== id).map((c) => c.id)],
      concepts: s === "root" ? [] : [`form:${s}`],
      instruction: "What does this mean?",
      prompt: { liraasa: form },
      choices,
      answer: { kind: "choice", correct: item.id },
      ...ctx.audio?.has(id) === true ? { audio: id } : {}
    };
  }
  function recall(ctx, id) {
    const item = ctx.data.items.get(id);
    if (item === void 0 || item.meaning === "") return null;
    const accepted = [item.spelling];
    for (const other of ctx.data.items.values()) {
      if (other.id !== id && normalize(other.meaning) === normalize(item.meaning))
        accepted.push(other.spelling);
    }
    return {
      id: `recall:${id}`,
      type: "recall",
      skill: "meaning",
      direction: "produce",
      card: cardId(id, "meaning", "produce"),
      target: id,
      items: [id],
      concepts: [],
      instruction: "Write this in Liraasa.",
      prompt: { english: item.meaning },
      answer: { kind: "typed", lang: "liraasa", accepted }
    };
  }
  function formBuild(ctx, id, rng, slot) {
    const item = ctx.data.items.get(id);
    if (item === void 0 || item.forms.length === 0) return null;
    const options = meaningful(item).filter((s2) => s2 !== "root");
    const s = slot ?? rng.pick(options);
    if (s === void 0 || !options.includes(s)) return null;
    return {
      id: `formBuild:${id}:${s}`,
      type: "formBuild",
      skill: "morphology",
      direction: "produce",
      card: cardId(id, "morphology", "produce"),
      target: id,
      items: [id],
      concepts: [`form:${s}`],
      instruction: `Give the ${humanize(s)} form.`,
      prompt: { liraasa: item.spelling, english: glossOf(item, s) },
      answer: { kind: "typed", lang: "liraasa", accepted: [formOf$1(item, s)] }
    };
  }
  function formIdentify(ctx, id, rng, slot) {
    const item = ctx.data.items.get(id);
    if (item === void 0 || item.forms.length === 0) return null;
    const options = meaningful(item).filter((s2) => s2 !== "root");
    const s = slot ?? rng.pick(options);
    if (s === void 0 || !options.includes(s)) return null;
    const others = rng.shuffle(FORM_SLOTS.filter((x) => x !== s)).slice(0, 3);
    const choices = rng.shuffle(
      [s, ...others].map((x) => ({ id: x, text: humanize(x), liraasa: false }))
    );
    return {
      id: `formIdentify:${id}:${s}`,
      type: "formIdentify",
      skill: "morphology",
      direction: "recognize",
      card: cardId(id, "morphology", "recognize"),
      target: id,
      items: [id],
      concepts: [`form:${s}`],
      instruction: "Which form is this?",
      prompt: { liraasa: formOf$1(item, s), english: glossOf(item, s) },
      choices,
      answer: { kind: "choice", correct: s }
    };
  }
  function partTiles(ctx, compound, rng) {
    if (compound.components === null) return null;
    const parts = compound.components.map((p) => ctx.data.items.get(p));
    const [a, b] = parts;
    if (a === void 0 || b === void 0) return null;
    const wrong = [
      ...distractorItems(ctx, a, 2, rng, (o) => o.kind === "root"),
      ...distractorItems(ctx, b, 2, rng, (o) => o.kind === "root")
    ].filter((d) => d.id !== a.id && d.id !== b.id && compound.spelling !== d.spelling + b.spelling);
    const tiles = [];
    const seen = /* @__PURE__ */ new Set();
    for (const it of [a, b, ...wrong]) {
      if (seen.has(it.spelling)) continue;
      seen.add(it.spelling);
      tiles.push({ id: it.id, text: it.spelling });
    }
    return { tiles: rng.shuffle(tiles.slice(0, 5)), correct: [a.id, b.id] };
  }
  function decompose(ctx, id, rng) {
    const item = ctx.data.items.get(id);
    if (item?.kind !== "compound") return null;
    const t = partTiles(ctx, item, rng);
    if (t === null) return null;
    return {
      id: `decompose:${id}`,
      type: "decompose",
      skill: "morphology",
      direction: "recognize",
      card: cardId(id, "morphology", "recognize"),
      target: id,
      items: [id, ...t.tiles.map((x) => x.id)],
      concepts: ["compound"],
      instruction: "Break this word into its two parts, modifier first.",
      prompt: { liraasa: item.spelling, english: item.meaning },
      answer: { kind: "order", tiles: t.tiles, correct: t.correct }
    };
  }
  function compoundBuild(ctx, id, rng) {
    const item = ctx.data.items.get(id);
    if (item?.kind !== "compound") return null;
    const t = partTiles(ctx, item, rng);
    if (t === null) return null;
    return {
      id: `compoundBuild:${id}`,
      type: "compoundBuild",
      skill: "morphology",
      direction: "produce",
      card: cardId(id, "morphology", "produce"),
      target: id,
      items: [id, ...t.tiles.map((x) => x.id)],
      concepts: ["compound"],
      instruction: "Build the word for this meaning from two parts: modifier, then head.",
      prompt: { english: item.meaning },
      answer: { kind: "order", tiles: t.tiles, correct: t.correct }
    };
  }
  const sentenceCard = (target, e, dir) => cardId(target !== "" ? target : e.concepts[0] ?? e.key, "grammar", dir);
  function assemble(ctx, e, rng, target = "") {
    if (!usable(e, 3, 9)) return null;
    const tiles = e.tokens.map((t, i) => ({ id: `t${String(i)}`, text: t.text }));
    let shuffled = rng.shuffle(tiles);
    for (let i = 0; i < 4 && shuffled.every((t, j) => t.text === tiles[j]?.text); i += 1) {
      shuffled = rng.shuffle(tiles);
    }
    if (shuffled.every((t, j) => t.text === tiles[j]?.text)) return null;
    return {
      id: `assemble:${e.key}`,
      type: "assemble",
      skill: "grammar",
      direction: "produce",
      card: sentenceCard(target, e, "produce"),
      target: target || (e.concepts[0] ?? e.key),
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "Put the words in order.",
      prompt: { english: e.english ?? "" },
      answer: { kind: "order", tiles: shuffled, correct: tiles.map((t) => t.id) },
      source: e.key,
      ...ctx.audio?.has(e.key) === true ? { audio: e.key } : {}
    };
  }
  function translateFrom(ctx, e, target = "") {
    if (!usable(e)) return null;
    return {
      id: `translateFrom:${e.key}`,
      type: "translateFrom",
      skill: "grammar",
      direction: "recognize",
      card: sentenceCard(target, e, "recognize"),
      target: target || (e.concepts[0] ?? e.key),
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "Translate into English.",
      prompt: { liraasa: e.liraasa, tokens: glossLine(ctx.data, e.tokens) },
      answer: { kind: "typed", lang: "english", accepted: [e.english ?? ""] },
      source: e.key,
      ...ctx.audio?.has(e.key) === true ? { audio: e.key } : {}
    };
  }
  function translateTo(_ctx, e, target = "") {
    if (!usable(e)) return null;
    return {
      id: `translateTo:${e.key}`,
      type: "translateTo",
      skill: "grammar",
      direction: "produce",
      card: sentenceCard(target, e, "produce"),
      target: target || (e.concepts[0] ?? e.key),
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "Translate into Liraasa.",
      prompt: { english: e.english ?? "" },
      answer: { kind: "typed", lang: "liraasa", accepted: [e.liraasa] },
      source: e.key
    };
  }
  function cloze(ctx, e, rng, want, target = "") {
    if (!usable(e, 3, 14)) return null;
    const candidates = e.tokens.map((t, i) => ({ t, i })).filter(({ t }) => {
      if (t.link.kind !== "entry") return false;
      const ids = t.link.refs.map((r) => r.id);
      if (want?.item !== void 0) return ids.includes(want.item);
      if (want?.words !== void 0) return ids.some((id) => want.words?.includes(id));
      return ids.some((id) => HEADWORD$1.has(ctx.data.items.get(id)?.kind ?? ""));
    });
    const gap = rng.pick(candidates);
    if (gap === void 0 || gap.t.link.kind !== "entry") return null;
    const answer = gap.t.text;
    const refs = gap.t.link.refs;
    const ref = (want?.item !== void 0 ? refs.find((r) => r.id === want.item) : void 0) ?? refs[0];
    const item = ref === void 0 ? void 0 : ctx.data.items.get(ref.id);
    if (item === void 0) return null;
    const slot = ref?.slot;
    const wrong = distractorItems(ctx, item, 6, rng).map((d) => ({
      id: d.id,
      text: slot !== void 0 && d.forms.length > 0 ? formOf$1(d, slot) : d.spelling,
      liraasa: true
    }));
    const choices = choicesOf(rng, { id: "answer", text: answer, liraasa: true }, wrong);
    const before = e.liraasa.slice(0, gap.t.start);
    const after = e.liraasa.slice(gap.t.end);
    return {
      id: `cloze:${e.key}:${String(gap.i)}`,
      type: "cloze",
      skill: "grammar",
      direction: "produce",
      card: target !== "" ? cardId(target, "grammar", "produce") : cardId(item.id, "meaning", "produce"),
      target: target || item.id,
      items: [...e.ids, ...choices.filter((c) => c.id !== "answer").map((c) => c.id)],
      concepts: [...e.concepts],
      instruction: "Fill the gap.",
      prompt: { english: e.english ?? "", gap: { before, after } },
      choices,
      answer: { kind: "typed", lang: "liraasa", accepted: [answer] },
      source: e.key
    };
  }
  function matching(ctx, ids, rng) {
    const items = [];
    for (const id of ids) {
      const item = ctx.data.items.get(id);
      if (item === void 0 || item.meaning === "") continue;
      if (items.some((x) => sameMeaning(x, item) || x.spelling === item.spelling)) continue;
      items.push(item);
    }
    if (items.length < 3) return null;
    const chosen = items.slice(0, 5);
    const left = chosen.map((i) => ({ id: i.id, text: i.spelling, liraasa: true }));
    const right = rng.shuffle(
      chosen.map((i) => ({ id: `m:${i.id}`, text: i.meaning, liraasa: false }))
    );
    return {
      id: `matching:${chosen.map((i) => i.id).join(",")}`,
      type: "matching",
      skill: "meaning",
      direction: "recognize",
      card: cardId(chosen[0]?.id ?? "", "meaning", "recognize"),
      target: chosen[0]?.id ?? "",
      items: chosen.map((i) => i.id),
      concepts: [],
      instruction: "Match each word to its meaning.",
      prompt: {},
      answer: {
        kind: "pairs",
        left,
        right,
        pairs: Object.fromEntries(chosen.map((i) => [i.id, `m:${i.id}`]))
      }
    };
  }
  function listen(ctx, key, rng) {
    if (ctx.audio?.has(key) !== true) return null;
    const item = ctx.data.items.get(key);
    if (item !== void 0) {
      const base2 = recognition(ctx, key, rng);
      if (base2 === null) return null;
      const { prompt: _prompt, ...rest } = base2;
      return {
        ...rest,
        id: `listen:${key}`,
        type: "listen",
        instruction: "Listen. What does it mean?",
        prompt: {},
        audio: key
      };
    }
    const e = ctx.data.examples.find((x) => x.key === key);
    if (e === void 0 || !usable(e)) return null;
    const base = translateTo(ctx, e);
    if (base === null) return null;
    return {
      ...base,
      id: `listen:${key}`,
      type: "listen",
      direction: "recognize",
      card: cardId(base.target, "grammar", "recognize"),
      instruction: "Listen, and write what you hear.",
      prompt: {},
      audio: key
    };
  }
  function unknownCount(ctx, e) {
    if (ctx.known === void 0) return 0;
    let n = 0;
    for (const id of e.ids) {
      if (HEADWORD$1.has(ctx.data.items.get(id)?.kind ?? "") && !ctx.known.has(id)) n += 1;
    }
    return n;
  }
  function examplesOf(ctx, concept) {
    const list = ctx.data.examples.filter((e) => e.concepts.includes(concept) && usable(e, 2, 12));
    if (ctx.known === void 0) return list;
    const scored = list.map((e) => ({ e, u: unknownCount(ctx, e) }));
    const best = Math.min(...scored.map((x) => x.u));
    return scored.filter((x) => x.u <= best).sort((a, b) => a.e.tokens.length - b.e.tokens.length).map((x) => x.e);
  }
  function exercisesForNode(ctx, node, rng) {
    const out = [];
    const [kind, ...rest] = node.split(":");
    const ref = rest.join(":");
    if (kind === "root") {
      const item = ctx.data.items.get(ref);
      if (item === void 0) return [];
      out.push(
        recognition(ctx, ref, rng),
        recall(ctx, ref),
        formBuild(ctx, ref, rng),
        formIdentify(ctx, ref, rng)
      );
      if (item.kind === "compound") out.push(decompose(ctx, ref, rng), compoundBuild(ctx, ref, rng));
      const usage = rng.pick(
        ctx.data.examples.filter((e) => e.ids.includes(ref) && usable(e, 3, 14))
      );
      if (usage !== void 0) out.push(cloze(ctx, usage, rng, { item: ref }));
      out.push(listen(ctx, ref, rng));
    } else if (kind === "concept") {
      const concept = ctx.data.concepts.get(ref);
      if (concept === void 0) return [];
      const sentences = rng.shuffle(examplesOf(ctx, ref).slice(0, 12)).slice(0, 6);
      for (const [i, e] of sentences.entries()) {
        if (i % 3 === 0) out.push(assemble(ctx, e, rng, ref));
        if (i % 3 === 1) out.push(translateFrom(ctx, e, ref));
        if (i % 3 === 2) out.push(translateTo(ctx, e, ref));
        if (concept.words.length > 0) out.push(cloze(ctx, e, rng, { words: concept.words }, ref));
      }
      if (concept.formSlot !== void 0 && concept.formSlot !== "root") {
        const slot = concept.formSlot;
        const items = [...ctx.data.items.values()].filter(
          (i) => i.forms.some((f2) => f2.slot === slot && f2.meaningful)
        );
        for (const item of rng.shuffle(items).slice(0, 3)) {
          out.push(formBuild(ctx, item.id, rng, slot), formIdentify(ctx, item.id, rng, slot));
        }
      }
    } else if (kind === "pattern") {
      const item = ctx.data.items.get(ref);
      for (const m of rng.shuffle(item?.usedIn ?? []).slice(0, 4)) {
        out.push(rng.next() < 0.5 ? compoundBuild(ctx, m, rng) : decompose(ctx, m, rng));
      }
    }
    return out.filter((x) => x !== null);
  }
  function mixedSession(ctx, nodes, rng, length, types) {
    const byType = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      for (const ex of exercisesForNode(ctx, node, rng)) {
        if (types !== void 0 && !types.has(ex.type)) continue;
        byType.set(ex.type, [...byType.get(ex.type) ?? [], ex]);
      }
    }
    const items = nodes.filter((n) => n.startsWith("root:")).map((n) => n.slice("root:".length));
    if (items.length >= 3 && (types === void 0 || types.has("matching"))) {
      const m = matching(ctx, rng.shuffle(items), rng);
      if (m !== null) byType.set("matching", [m]);
    }
    const queues = rng.shuffle([...byType.values()].map((list) => rng.shuffle(list)));
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    while (out.length < length && queues.some((q) => q.length > 0)) {
      for (const q of queues) {
        const ex = q.shift();
        if (ex === void 0 || seen.has(ex.id)) continue;
        seen.add(ex.id);
        out.push(ex);
        if (out.length >= length) break;
      }
    }
    return out;
  }
  function exerciseForCard(ctx, card, rng) {
    const [target = "", skill, direction] = card.split("|");
    const item = ctx.data.items.get(target);
    const tries = [];
    if (item !== void 0) {
      const usage = () => rng.pick(ctx.data.examples.filter((e) => e.ids.includes(target) && usable(e, 3, 14)));
      if (skill === "meaning" && direction === "recognize") {
        tries.push(() => recognition(ctx, target, rng));
        if (ctx.audio?.has(target) === true) tries.push(() => listen(ctx, target, rng));
      } else if (skill === "meaning") {
        tries.push(() => recall(ctx, target));
        tries.push(() => {
          const e = usage();
          return e === void 0 ? null : cloze(ctx, e, rng, { item: target });
        });
      } else if (skill === "morphology" && direction === "produce") {
        tries.push(
          () => item.kind === "compound" ? compoundBuild(ctx, target, rng) : formBuild(ctx, target, rng)
        );
        tries.push(() => formBuild(ctx, target, rng));
      } else {
        tries.push(
          () => item.kind === "compound" ? decompose(ctx, target, rng) : formIdentify(ctx, target, rng)
        );
        tries.push(() => formIdentify(ctx, target, rng));
      }
    } else if (ctx.data.concepts.has(target)) {
      const concept = ctx.data.concepts.get(target);
      const e = rng.pick(examplesOf(ctx, target).slice(0, 12));
      if (e !== void 0) {
        if (direction === "recognize") tries.push(() => translateFrom(ctx, e, target));
        else {
          tries.push(() => assemble(ctx, e, rng, target));
          tries.push(() => translateTo(ctx, e, target));
          if (concept !== void 0 && concept.words.length > 0) {
            tries.push(() => cloze(ctx, e, rng, { words: concept.words }, target));
          }
        }
      }
    }
    for (const make of rng.shuffle(tries)) {
      const ex = make();
      if (ex !== null) return { ...ex, card };
    }
    return null;
  }
  const PATTERN_MIN = 4;
  const DEFAULT_GRAPH_OPTIONS = {
    rootsPerUnit: 8,
    themeWindow: 120,
    corpusWeight: 3
  };
  const rootNode = (id) => `root:${id}`;
  const conceptNode = (id) => `concept:${id}`;
  const patternNode = (id) => `pattern:${id}`;
  function buildSkillGraph(data, overrides, options = {}) {
    const opt = { ...DEFAULT_GRAPH_OPTIONS, ...options };
    const drafts = /* @__PURE__ */ new Map();
    const pinRank = new Map(overrides.pins.map((id, i) => [id, i]));
    const usage = /* @__PURE__ */ new Map();
    for (const e of data.examples) for (const c of e.concepts) usage.set(c, (usage.get(c) ?? 0) + 1);
    const excluded = new Set(overrides.exclude);
    for (const c of data.concepts.values()) {
      if (excluded.has(c.id)) continue;
      drafts.set(conceptNode(c.id), {
        id: conceptNode(c.id),
        kind: "concept",
        ref: c.id,
        prereqs: c.prereqs.map(conceptNode),
        level: overrides.levels[c.id] ?? "core",
        score: usage.get(c.id) ?? 0,
        theme: null
      });
    }
    for (const item of data.items.values()) {
      if (item.kind !== "root" && item.kind !== "compound") continue;
      const f2 = data.frequency.get(item.id) ?? { corpus: 0, examples: 0 };
      const occurs = f2.corpus + f2.examples > 0;
      const parts = (item.components ?? []).filter((c) => {
        const k = data.items.get(c)?.kind;
        return k === "root" || k === "compound";
      });
      const prereqs = item.components !== null ? [...parts.map(rootNode), conceptNode(COMPOUND)] : [conceptNode(formConcept("root"))];
      drafts.set(rootNode(item.id), {
        id: rootNode(item.id),
        kind: "root",
        ref: item.id,
        prereqs: [...new Set(prereqs)],
        level: overrides.levels[item.id] ?? (occurs ? "core" : "advanced"),
        score: f2.corpus * opt.corpusWeight + f2.examples + item.usedIn.length * 0.5,
        theme: item.theme
      });
      if (item.usedIn.length >= PATTERN_MIN) {
        drafts.set(patternNode(item.id), {
          id: patternNode(item.id),
          kind: "pattern",
          ref: item.id,
          prereqs: [rootNode(item.id), conceptNode(COMPOUND)],
          level: "core",
          score: item.usedIn.length,
          theme: item.theme,
          members: [...item.usedIn]
        });
      }
    }
    const promote = (id) => {
      const d = drafts.get(id);
      if (d === void 0 || d.kind !== "root") return;
      for (const p of d.prereqs) {
        const pre = drafts.get(p);
        if (pre?.kind === "root" && pre.level === "advanced" && overrides.levels[pre.ref] === void 0) {
          pre.level = "core";
          promote(p);
        }
      }
    };
    for (const d of [...drafts.values()]) if (d.kind === "root" && d.level === "core") promote(d.id);
    const rank = (a, b) => {
      const pa = pinRank.get(a.id) ?? Infinity;
      const pb = pinRank.get(b.id) ?? Infinity;
      if (pa !== pb) return pa - pb;
      if (a.level !== b.level) return a.level === "core" ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    };
    const byKind = (kind) => [...drafts.values()].filter((d) => d.kind === kind).sort(rank);
    const pending = {
      concept: byKind("concept"),
      root: byKind("root"),
      pattern: byKind("pattern")
    };
    const placed = /* @__PURE__ */ new Set();
    const ready = (d) => d.prereqs.every((p) => placed.has(p) || !drafts.has(p));
    const order = [];
    const unitOf = /* @__PURE__ */ new Map();
    const units = [];
    const take = (list, d, unit, nodes2) => {
      list.splice(list.indexOf(d), 1);
      placed.add(d.id);
      order.push(d.id);
      unitOf.set(d.id, unit);
      nodes2.push(d.id);
    };
    while (pending.concept.length + pending.root.length + pending.pattern.length > 0) {
      const index = units.length;
      const nodes2 = [];
      const concept = pending.concept.find(ready);
      if (concept !== void 0) take(pending.concept, concept, index, nodes2);
      const available = pending.root.filter(ready);
      const seed = available[0];
      if (seed !== void 0) {
        const chosen = [];
        const pinned = available.filter((d) => pinRank.has(d.id));
        for (const d of pinned) if (chosen.length < opt.rootsPerUnit) chosen.push(d);
        const theme2 = (chosen[0] ?? seed).theme;
        for (const d of available.slice(0, opt.themeWindow)) {
          if (chosen.length >= opt.rootsPerUnit) break;
          if (d.theme === theme2 && d.level === seed.level && !chosen.includes(d)) chosen.push(d);
        }
        for (const d of available) {
          if (chosen.length >= opt.rootsPerUnit) break;
          if (d.level === seed.level && !chosen.includes(d)) chosen.push(d);
        }
        for (const d of chosen) take(pending.root, d, index, nodes2);
      }
      const pattern = pending.pattern.find(ready);
      if (pattern !== void 0) take(pending.pattern, pattern, index, nodes2);
      if (nodes2.length === 0) break;
      const themes = /* @__PURE__ */ new Map();
      for (const id of nodes2) {
        const t = drafts.get(id)?.theme;
        if (t !== void 0 && t !== null) themes.set(t, (themes.get(t) ?? 0) + 1);
      }
      const theme = [...themes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      units.push({ id: `unit:${String(index + 1)}`, index, theme, nodes: nodes2 });
    }
    const position = new Map(order.map((id, i) => [id, i]));
    const nodes = /* @__PURE__ */ new Map();
    for (const d of drafts.values()) {
      nodes.set(d.id, {
        id: d.id,
        kind: d.kind,
        ref: d.ref,
        prereqs: d.prereqs,
        level: d.level,
        unit: unitOf.get(d.id) ?? -1,
        order: position.get(d.id) ?? -1,
        ...d.members !== void 0 ? { members: d.members } : {}
      });
    }
    return { edition: data.edition, nodes, units, order };
  }
  function isUnlocked(graph, id, mastery, threshold = 0.8) {
    const node = graph.nodes.get(id);
    if (node === void 0) return false;
    return node.prereqs.every((p) => !graph.nodes.has(p) || mastery(p) >= threshold);
  }
  const DAY$3 = 864e5;
  const MINUTE = 6e4;
  const FSRS_WEIGHTS = [
    0.4872,
    1.4003,
    3.7145,
    13.8206,
    5.1618,
    1.2298,
    0.8975,
    0.031,
    1.6474,
    0.1367,
    1.0461,
    2.1072,
    0.0793,
    0.3246,
    1.587,
    0.2272,
    2.8755
  ];
  const DECAY = -0.5;
  const FACTOR = 19 / 81;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  function fsrs(retention = 0.9, weights = FSRS_WEIGHTS) {
    const w = (i) => weights[i] ?? 0;
    const d0 = (g) => clamp(w(4) - (g - 3) * w(5), 1, 10);
    const interval = (s) => Math.max(1, Math.round(s / FACTOR * (retention ** (1 / DECAY) - 1)));
    const r = (state, now) => state.last === 0 || state.stability <= 0 ? 0 : (1 + FACTOR * (now - state.last) / DAY$3 / state.stability) ** DECAY;
    return {
      name: "fsrs",
      init: (now) => ({
        stability: 0,
        difficulty: 0,
        due: now,
        last: 0,
        reps: 0,
        lapses: 0,
        streak: 0
      }),
      retrievability: r,
      review(state, g, now) {
        if (state.reps === 0 || state.stability <= 0) {
          const stability = w(g - 1);
          const due = g === 1 ? now + 5 * MINUTE : now + interval(stability) * DAY$3;
          return {
            stability,
            difficulty: d0(g),
            due,
            last: now,
            reps: 1,
            lapses: g === 1 ? 1 : 0,
            streak: g === 1 ? 0 : 1
          };
        }
        const R = r(state, now);
        const D = clamp(w(7) * d0(3) + (1 - w(7)) * (state.difficulty - w(6) * (g - 3)), 1, 10);
        let S;
        if (g === 1) {
          S = w(11) * state.difficulty ** -w(12) * ((state.stability + 1) ** w(13) - 1) * Math.exp(w(14) * (1 - R));
          S = Math.min(S, state.stability);
        } else {
          const hard = g === 2 ? w(15) : 1;
          const easy = g === 4 ? w(16) : 1;
          S = state.stability * (Math.exp(w(8)) * (11 - state.difficulty) * state.stability ** -w(9) * (Math.exp(w(10) * (1 - R)) - 1) * hard * easy + 1);
        }
        return {
          stability: S,
          difficulty: D,
          due: g === 1 ? now + 10 * MINUTE : now + interval(S) * DAY$3,
          last: now,
          reps: state.reps + 1,
          lapses: state.lapses + (g === 1 ? 1 : 0),
          streak: g === 1 ? 0 : state.streak + 1
        };
      }
    };
  }
  function sm2() {
    const quality = { 1: 1, 2: 3, 3: 4, 4: 5 };
    return {
      name: "sm2",
      init: (now) => ({
        stability: 0,
        difficulty: 2.5,
        due: now,
        last: 0,
        reps: 0,
        lapses: 0,
        streak: 0
      }),
      retrievability: (s, now) => s.last === 0 || s.stability <= 0 ? 0 : Math.exp(Math.log(0.9) * (now - s.last) / DAY$3 / s.stability),
      review(state, g, now) {
        const q = quality[g];
        const ease = Math.max(1.3, state.difficulty + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        if (q < 3) {
          return {
            ...state,
            difficulty: ease,
            stability: 1,
            due: now + 10 * MINUTE,
            last: now,
            reps: state.reps + 1,
            lapses: state.lapses + 1,
            streak: 0
          };
        }
        const streak = state.streak + 1;
        const days = streak === 1 ? 1 : streak === 2 ? 6 : Math.round(state.stability * ease);
        return {
          stability: days,
          difficulty: ease,
          due: now + days * DAY$3,
          last: now,
          reps: state.reps + 1,
          lapses: state.lapses,
          streak
        };
      }
    };
  }
  function schedulerFor(name, retention = 0.9) {
    return name === "sm2" ? sm2() : fsrs(retention);
  }
  const PROGRESS_SCHEMA = 1;
  const DAY$2 = 864e5;
  const DEFAULT_SETTINGS = {
    newPerDay: 10,
    reviewsPerDay: 200,
    scheduler: "fsrs",
    retention: 0.9,
    threshold: 0.8,
    leechLapses: 6,
    passMark: 0.8
  };
  function createProfile(id, name, edition, now) {
    return {
      id,
      name,
      created: now,
      settings: { ...DEFAULT_SETTINGS },
      edition,
      cards: {},
      log: [],
      checkpoints: {},
      seen: {}
    };
  }
  function createStore(edition, now, name = "Me") {
    const p = createProfile("p1", name, edition, now);
    return { schema: PROGRESS_SCHEMA, active: p.id, profiles: { [p.id]: p }, audio: {} };
  }
  class ProgressError extends Error {
  }
  function migrateStore(raw) {
    if (typeof raw !== "object" || raw === null)
      throw new ProgressError("progress must be an object");
    const r = raw;
    const schema = r.schema ?? 0;
    if (schema > PROGRESS_SCHEMA) {
      throw new ProgressError(
        `progress schema ${String(schema)} is newer than this app (${String(PROGRESS_SCHEMA)})`
      );
    }
    const profiles = {};
    for (const [id, p] of Object.entries(r.profiles ?? {})) {
      profiles[id] = {
        ...p,
        id,
        settings: { ...DEFAULT_SETTINGS, ...p.settings },
        cards: p.cards ?? {},
        log: p.log ?? [],
        checkpoints: p.checkpoints ?? {},
        seen: p.seen ?? {}
      };
    }
    const first = Object.keys(profiles)[0];
    if (first === void 0) throw new ProgressError("progress has no profile");
    return {
      ...r,
      schema: PROGRESS_SCHEMA,
      active: r.active !== void 0 && profiles[r.active] !== void 0 ? r.active : first,
      profiles,
      audio: r.audio ?? {}
    };
  }
  function exportStore(store) {
    const sort = (v) => {
      if (Array.isArray(v)) return v.map(sort);
      if (typeof v === "object" && v !== null) {
        return Object.fromEntries(
          Object.keys(v).sort().map((k) => [k, sort(v[k])])
        );
      }
      return v;
    };
    return JSON.stringify(sort(store), null, 1);
  }
  function importStore(json) {
    return migrateStore(JSON.parse(json));
  }
  const activeProfile = (store) => {
    const p = store.profiles[store.active];
    if (p === void 0) throw new ProgressError("no active profile");
    return p;
  };
  function snapshotOf(data, target) {
    const item = data.items.get(target);
    if (item !== void 0) return { spelling: item.spelling, meaning: item.meaning };
    const concept = data.concepts.get(target);
    if (concept !== void 0) return { spelling: concept.title, meaning: concept.description };
    return { spelling: target, meaning: "" };
  }
  function ensureCard(profile, data, id, now, scheduler) {
    const existing = profile.cards[id];
    if (existing !== void 0) return existing;
    const [target = "", skill = "meaning", direction = "recognize"] = id.split("|");
    const card = {
      id,
      target,
      skill,
      direction,
      state: scheduler.init(now),
      edition: data.edition,
      snapshot: snapshotOf(data, target),
      added: now
    };
    profile.cards[id] = card;
    return card;
  }
  function cardsForNode(data, graph, node) {
    const n = graph.nodes.get(node);
    if (n === void 0) return [];
    if (n.kind === "root") {
      const item = data.items.get(n.ref);
      if (item === void 0) return [];
      const out = [cardId(n.ref, "meaning", "recognize"), cardId(n.ref, "meaning", "produce")];
      if (item.forms.some((f2) => f2.meaningful && f2.slot !== "root"))
        out.push(cardId(n.ref, "morphology", "produce"));
      if (item.kind === "compound") out.push(cardId(n.ref, "morphology", "recognize"));
      return out;
    }
    if (n.kind === "concept") {
      const used = data.examples.some((e) => e.concepts.includes(n.ref));
      return used ? [cardId(n.ref, "grammar", "produce"), cardId(n.ref, "grammar", "recognize")] : [];
    }
    return (n.members ?? []).map((m) => cardId(m, "morphology", "produce"));
  }
  function introduce(profile, data, graph, node, now) {
    var _a;
    const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
    (_a = profile.seen)[node] ?? (_a[node] = now);
    for (const id of cardsForNode(data, graph, node)) ensureCard(profile, data, id, now, scheduler);
  }
  function recordReview(profile, data, card, grade2, type, now, ms = 0) {
    const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
    const c = ensureCard(profile, data, card, now, scheduler);
    c.state = scheduler.review(c.state, grade2.rating, now);
    if (c.state.lapses >= profile.settings.leechLapses) c.leech = true;
    if (grade2.verdict === "correct" && c.changed !== void 0) delete c.changed;
    profile.log.push({ at: now, card, type, verdict: grade2.verdict, rating: grade2.rating, ms });
    return c;
  }
  function cardMastery(profile, card, now) {
    if (card.retired !== void 0 || card.state.reps === 0) return 0;
    const scheduler = schedulerFor(profile.settings.scheduler, profile.settings.retention);
    return scheduler.retrievability(card.state, now) * Math.min(1, card.state.streak / 2);
  }
  function cardsOfNode(profile, graph, node) {
    const n = graph.nodes.get(node);
    if (n === void 0) return [];
    const targets = new Set(n.kind === "pattern" ? n.members ?? [] : [n.ref]);
    return Object.values(profile.cards).filter(
      (c) => targets.has(c.target) && (n.kind !== "pattern" || c.skill === "morphology")
    );
  }
  function nodeMastery(profile, graph, node, now) {
    const cards = cardsOfNode(profile, graph, node);
    if (cards.length === 0) return 0;
    return cards.reduce((sum, c) => sum + cardMastery(profile, c, now), 0) / cards.length;
  }
  function nodeAvailable(profile, graph, node, now, pending = /* @__PURE__ */ new Set()) {
    const n = graph.nodes.get(node);
    if (n === void 0 || !unitOpen(profile, n.unit)) return false;
    return isUnlocked(
      graph,
      node,
      (p) => {
        const sameUnit = graph.nodes.get(p)?.unit === n.unit;
        if (sameUnit && (profile.seen[p] !== void 0 || pending.has(p))) return 1;
        if (profile.seen[p] === void 0) return 0;
        return Math.max(nodeMastery(profile, graph, p, now), unitDone(profile, graph, p));
      },
      profile.settings.threshold
    );
  }
  function unitDone(profile, graph, node) {
    const unit = graph.nodes.get(node)?.unit ?? -1;
    return profile.checkpoints[String(unit)]?.passed === true ? 1 : 0;
  }
  function unitOpen(profile, unit) {
    return unit <= 0 || profile.checkpoints[String(unit - 1)]?.passed === true;
  }
  const startOfDay = (now) => now - now % DAY$2;
  function dailyQueue(profile, graph, now) {
    const today = startOfDay(now);
    const reviewedToday = profile.log.filter((l) => l.at >= today).length;
    const introducedToday = Object.values(profile.seen).filter((t) => t >= today).length;
    const due = Object.values(profile.cards).filter(
      (c) => c.retired === void 0 && c.state.reps > 0 && (c.state.due <= now || c.changed !== void 0)
    ).sort(
      (a, b) => (a.changed !== void 0 ? -1 : 0) - (b.changed !== void 0 ? -1 : 0) || a.state.due - b.state.due
    ).slice(0, Math.max(0, profile.settings.reviewsPerDay - reviewedToday));
    const fresh = [];
    const room = Math.max(0, profile.settings.newPerDay - introducedToday);
    for (const node of graph.order) {
      if (fresh.length >= room) break;
      if (profile.seen[node] !== void 0) continue;
      if (nodeAvailable(profile, graph, node, now, new Set(fresh))) fresh.push(node);
    }
    return { due, fresh, reviewedToday, introducedToday };
  }
  const leeches = (profile) => Object.values(profile.cards).filter((c) => c.leech === true && c.retired === void 0);
  function forecast(profile, now, days = 14) {
    const out = new Array(days).fill(0);
    const today = startOfDay(now);
    for (const c of Object.values(profile.cards)) {
      if (c.retired !== void 0 || c.state.reps === 0) continue;
      const d = Math.max(0, Math.floor((c.state.due - today) / DAY$2));
      if (d < days) out[d] = (out[d] ?? 0) + 1;
    }
    return out;
  }
  function activity(profile, now, days = 30) {
    const out = new Array(days).fill(0);
    const today = startOfDay(now);
    for (const l of profile.log) {
      const ago = Math.floor((today - startOfDay(l.at)) / DAY$2);
      if (ago >= 0 && ago < days) out[days - 1 - ago] = (out[days - 1 - ago] ?? 0) + 1;
    }
    return out;
  }
  function masteryByTheme(profile, data, graph, now) {
    const groups = /* @__PURE__ */ new Map();
    for (const n of graph.nodes.values()) {
      if (n.kind !== "root") continue;
      const theme = data.items.get(n.ref)?.theme ?? "—";
      const g = groups.get(theme) ?? { sum: 0, started: 0, total: 0 };
      g.total += 1;
      if (profile.seen[n.id] !== void 0) {
        g.started += 1;
        g.sum += nodeMastery(profile, graph, n.id, now);
      }
      groups.set(theme, g);
    }
    return [...groups].map(([key, g]) => ({
      key,
      mastery: g.started === 0 ? 0 : g.sum / g.started,
      started: g.started,
      total: g.total
    })).sort((a, b) => b.started - a.started || (a.key < b.key ? -1 : 1));
  }
  function masteryByConcept(profile, data, graph, now) {
    return [...graph.nodes.values()].filter((n) => n.kind === "concept").map((n) => ({
      key: n.ref,
      mastery: nodeMastery(profile, graph, n.id, now),
      started: profile.seen[n.id] !== void 0 ? 1 : 0,
      total: 1
    })).filter((g) => g.started > 0 || data.concepts.has(g.key));
  }
  function weakest(profile, now, n = 12) {
    return Object.values(profile.cards).filter((c) => c.retired === void 0 && c.state.reps > 0).map((c) => ({ c, m: cardMastery(profile, c, now) - c.state.lapses * 0.05 })).sort((a, b) => a.m - b.m || (a.c.id < b.c.id ? -1 : 1)).slice(0, n).map(({ c }) => c);
  }
  function recordCheckpoint(profile, unit, results, now) {
    const score = results.length === 0 ? 0 : results.reduce((s, r) => s + r.score, 0) / results.length;
    const weak = [...new Set(results.filter((r) => r.score < 1).map((r) => r.target))];
    const prior = profile.checkpoints[String(unit)];
    const passed = score >= profile.settings.passMark || prior?.passed === true;
    const cp = { unit, passed, score, at: now, weak };
    profile.checkpoints[String(unit)] = cp;
    return cp;
  }
  function writingNodes(profile, graph, ids, concepts, now) {
    const nodes = /* @__PURE__ */ new Set();
    for (const id of ids) if (graph.nodes.has(`root:${id}`)) nodes.add(`root:${id}`);
    for (const c of concepts) if (graph.nodes.has(`concept:${c}`)) nodes.add(`concept:${c}`);
    return [...nodes].sort(
      (a, b) => nodeMastery(profile, graph, a, now) - nodeMastery(profile, graph, b, now) || (graph.nodes.get(a)?.order ?? 0) - (graph.nodes.get(b)?.order ?? 0)
    );
  }
  function reconcile(profile, data, graph, now, replacementFor) {
    const out = { renamed: [], reglossed: [], retired: [] };
    for (const card of Object.values(profile.cards)) {
      if (card.retired !== void 0) continue;
      const exists = data.items.has(card.target) || data.concepts.has(card.target);
      if (!exists) {
        const replacement = data.items.has(card.target) ? void 0 : replacementFor(card.snapshot.spelling);
        card.retired = {
          reason: replacement !== void 0 ? "replaced" : "removed",
          ...replacement !== void 0 ? { replacement } : {},
          edition: data.edition,
          at: now
        };
        out.retired.push({
          card: card.id,
          target: card.target,
          spelling: card.snapshot.spelling,
          ...replacement !== void 0 ? { replacement } : {}
        });
        if (replacement !== void 0 && graph.nodes.has(`root:${replacement}`)) {
          introduce(profile, data, graph, `root:${replacement}`, now);
          const twin = profile.cards[cardId(replacement, card.skill, card.direction)];
          if (twin !== void 0) {
            twin.changed = {
              reason: "rewritten",
              from: card.snapshot.spelling,
              to: snapshotOf(data, replacement).spelling,
              edition: data.edition,
              at: now
            };
          }
        }
        continue;
      }
      const now_ = snapshotOf(data, card.target);
      if (now_.spelling !== card.snapshot.spelling && data.items.has(card.target)) {
        card.changed = {
          reason: "renamed",
          from: card.snapshot.spelling,
          to: now_.spelling,
          edition: data.edition,
          at: now
        };
        out.renamed.push({
          card: card.id,
          target: card.target,
          from: card.snapshot.spelling,
          to: now_.spelling
        });
      } else if (now_.meaning !== card.snapshot.meaning) {
        const reason = data.items.has(card.target) ? "reglossed" : "rewritten";
        card.changed = {
          reason,
          from: card.snapshot.meaning,
          to: now_.meaning,
          edition: data.edition,
          at: now
        };
        out.reglossed.push({
          card: card.id,
          target: card.target,
          from: card.snapshot.meaning,
          to: now_.meaning
        });
      }
      card.snapshot = now_;
      if (card.changed !== void 0 && card.state.reps > 0)
        card.state = { ...card.state, due: Math.min(card.state.due, now) };
    }
    profile.edition = data.edition;
    return out;
  }
  const HALL_SCHEMA = 1;
  const DAY$1 = 864e5;
  const STAR_COUNTS = [5, 10, 15, 20];
  const DRILL_LENGTHS = [10, 20, 30];
  const LOOM_LENGTHS = { quick: 5, standard: 10, deep: 25 };
  const DEFAULT_HALL_SETTINGS = {
    stars: 10,
    drill: 20,
    loom: "standard",
    leniency: "exact",
    gloss: "onRequest",
    hints: "onRequest"
  };
  class HallError extends Error {
  }
  const HALL_SETTING_VALUES = {
    stars: STAR_COUNTS,
    drill: DRILL_LENGTHS,
    loom: Object.keys(LOOM_LENGTHS),
    leniency: ["exact", "lenient"],
    gloss: ["always", "onRequest", "hidden"],
    hints: ["off", "onRequest", "always"]
  };
  const SETTING_KEYS = Object.keys(DEFAULT_HALL_SETTINGS);
  const valid = (key, value) => HALL_SETTING_VALUES[key].includes(value);
  const time = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null;
  function readHallSettings(raw, base = DEFAULT_HALL_SETTINGS) {
    const r = typeof raw === "object" && raw !== null ? raw : {};
    const out = { ...base };
    for (const key of SETTING_KEYS) if (valid(key, r[key])) Object.assign(out, { [key]: r[key] });
    return out;
  }
  function hallOf(profile) {
    const raw = profile.hall;
    if (raw === void 0 || raw === null) {
      return {
        schema: HALL_SCHEMA,
        settings: { ...DEFAULT_HALL_SETTINGS },
        lastVisit: null,
        previousVisit: null
      };
    }
    if (typeof raw !== "object") throw new HallError("hall state must be an object");
    const r = raw;
    const schema = typeof r.schema === "number" ? r.schema : 0;
    if (schema > HALL_SCHEMA) {
      throw new HallError(
        `hall schema ${String(schema)} is newer than this app (${String(HALL_SCHEMA)})`
      );
    }
    return {
      ...r,
      schema: HALL_SCHEMA,
      settings: readHallSettings(r.settings),
      lastVisit: time(r.lastVisit),
      previousVisit: time(r.previousVisit)
    };
  }
  function setHall(profile, state) {
    profile.hall = state;
  }
  function updateHallSettings(profile, patch) {
    const state = hallOf(profile);
    const settings = readHallSettings(patch, state.settings);
    setHall(profile, { ...state, settings });
    return settings;
  }
  function recordVisit(profile, now) {
    const state = hallOf(profile);
    const sameDay = state.lastVisit !== null && dayOf(state.lastVisit) === dayOf(now);
    const next = {
      ...state,
      lastVisit: now,
      previousVisit: sameDay ? state.previousVisit : state.lastVisit
    };
    setHall(profile, next);
    return next;
  }
  const dayOf = (t) => Math.floor(t / DAY$1);
  function greeting(state) {
    if (state.previousVisit === null || state.lastVisit === null) return "first";
    return dayOf(state.lastVisit) - dayOf(state.previousVisit) >= 2 ? "back" : "again";
  }
  function hallSummary(profile, data, now) {
    const byTarget = /* @__PURE__ */ new Map();
    let due = 0;
    for (const c of Object.values(profile.cards)) {
      if (c.retired !== void 0) continue;
      const list = byTarget.get(c.target) ?? [];
      list.push(cardMastery(profile, c, now));
      byTarget.set(c.target, list);
      if (c.state.reps > 0 && c.state.due <= now) due += 1;
    }
    let wordsMet = 0;
    let wordsSteady = 0;
    for (const [target, mastery] of byTarget) {
      const kind = data.items.get(target)?.kind;
      if (kind !== "root" && kind !== "compound" && kind !== "imageCompound") continue;
      wordsMet += 1;
      if (mastery.every((m) => m >= profile.settings.threshold)) wordsSteady += 1;
    }
    const practised = /* @__PURE__ */ new Set();
    for (const l of profile.log) {
      const target = profile.cards[l.card]?.target;
      if (target !== void 0 && data.concepts.has(target)) practised.add(target);
    }
    const weekStart = (dayOf(now) - 6) * DAY$1;
    let ms = 0;
    const days = /* @__PURE__ */ new Set();
    for (const l of profile.log) {
      if (l.at < weekStart || l.at > now) continue;
      ms += l.ms;
      days.add(dayOf(l.at));
    }
    return {
      wordsMet,
      wordsSteady,
      rulesPracticed: practised.size,
      minutesThisWeek: Math.round(ms / 6e4),
      daysThisWeek: days.size,
      due
    };
  }
  function courseLessons(course) {
    const out = [];
    course.parts.forEach((p, part) => {
      for (const lesson of p.lessons)
        out.push({ n: out.length + 1, part: part + 1, partTitle: p.title, lesson });
    });
    return out;
  }
  function courseStudied(profile) {
    const raw = hallOf(profile).courseStudied;
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter((x) => Number.isInteger(x) && x > 0))].sort(
      (a, b) => a - b
    );
  }
  function setCourseStudied(profile, n, studied) {
    const now = new Set(courseStudied(profile));
    if (studied) now.add(n);
    else now.delete(n);
    setHall(profile, { ...hallOf(profile), courseStudied: [...now].sort((a, b) => a - b) });
  }
  function courseNext(course, profile) {
    const done = new Set(courseStudied(profile));
    return courseLessons(course).find((l) => !done.has(l.n))?.n ?? null;
  }
  const words = (s) => s.toLowerCase().replace(/[.,!?;:“”"’‘()]/g, " ").split(/\s+/).filter((w) => w !== "");
  function checkCourseAnswer(given, answer) {
    const g = words(given);
    const a = words(answer);
    const left = [...g];
    const missing = [];
    for (const w of a) {
      const i = left.indexOf(w);
      if (i === -1) missing.push(w);
      else left.splice(i, 1);
    }
    const extra = left;
    if (missing.length === 0 && extra.length === 0)
      return { verdict: g.join(" ") === a.join(" ") ? "right" : "order", missing, extra };
    return {
      verdict: missing.length <= 1 && extra.length <= 1 ? "close" : "different",
      missing,
      extra
    };
  }
  function snapshotEdition(data) {
    const items = {};
    for (const i of data.items.values())
      items[i.id] = [i.spelling, i.meaning, i.kind, i.forms.map((f2) => f2.gloss)];
    const concepts = {};
    for (const c of data.concepts.values()) concepts[c.id] = [c.title, c.description];
    return { edition: data.edition, items, concepts };
  }
  function diffSnapshots(prev, curr, replacementFor = () => void 0) {
    const d = {
      from: prev.edition,
      to: curr.edition,
      renamed: [],
      reglossed: [],
      added: [],
      removed: [],
      rulesAdded: [],
      rulesChanged: [],
      rulesRemoved: []
    };
    const byId = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    for (const id of Object.keys(curr.items).sort(byId)) {
      const now = curr.items[id];
      const was = prev.items[id];
      if (now === void 0) continue;
      if (was === void 0) {
        d.added.push({ id, spelling: now[0], meaning: now[1], kind: now[2] });
        continue;
      }
      if (was[0] !== now[0]) {
        d.renamed.push({ id, from: was[0], to: now[0], meaning: now[1] });
        continue;
      }
      const slots = now[3].map((to, slot) => ({ slot, from: was[3][slot] ?? "", to })).filter((x) => x.from !== x.to);
      if (was[1] !== now[1] || slots.length > 0) {
        d.reglossed.push({ id, spelling: now[0], from: was[1], to: now[1], slots });
      }
    }
    for (const id of Object.keys(prev.items).sort(byId)) {
      const was = prev.items[id];
      if (was === void 0 || curr.items[id] !== void 0) continue;
      const replacement = replacementFor(was[0]);
      d.removed.push({
        id,
        spelling: was[0],
        meaning: was[1],
        ...replacement !== void 0 ? { replacement } : {}
      });
    }
    const rule = (id) => id.startsWith("rule:");
    for (const id of Object.keys(curr.concepts).filter(rule).sort(byId)) {
      const now = curr.concepts[id];
      const was = prev.concepts[id];
      if (now === void 0) continue;
      if (was === void 0) d.rulesAdded.push({ id, title: now[0] });
      else if (was[1] !== now[1])
        d.rulesChanged.push({ id, title: now[0], from: was[1], to: now[1] });
    }
    for (const id of Object.keys(prev.concepts).filter(rule).sort(byId)) {
      const was = prev.concepts[id];
      if (was !== void 0 && curr.concepts[id] === void 0)
        d.rulesRemoved.push({ id, title: was[0] });
    }
    return d;
  }
  const diffIsEmpty = (d) => d.renamed.length + d.reglossed.length + d.added.length + d.removed.length + d.rulesAdded.length + d.rulesChanged.length + d.rulesRemoved.length === 0;
  const VERB_CLASSES = ["n-initial", "s-initial", "vowel-initial", "otherwise"];
  const CLASS_LETTER = { "n-initial": "n", "s-initial": "s" };
  function suffixOf(pattern) {
    const m = /^R(?:\s*\+\s*([a-z]+))?$/.exec(pattern.trim());
    return m === null ? null : m[1] ?? "";
  }
  function vowelsOf(phonology) {
    const raw = phonology?.vowels;
    if (typeof raw !== "string") return null;
    const letters = (raw.split("(")[0] ?? "").match(/\b[a-z]\b/g);
    return letters === null ? null : letters.join("");
  }
  function readFormRules(morphology, edition, phonology) {
    const gaps = [];
    const gap = (code, ref, message) => {
      gaps.push({ severity: "error", code, ref, message });
    };
    const patterns = morphology.seven_forms;
    if (patterns.length !== FORM_SLOTS.length) {
      gap(
        "forms-rule-shape",
        "morphology.seven_forms",
        `seven_forms lists ${String(patterns.length)} patterns; the engine reads them in the order ${FORM_SLOTS.join(", ")}.`
      );
    }
    const slots = FORM_SLOTS.map((slot, i) => {
      const pattern = patterns[i] ?? "";
      if (pattern.trim() === "VERB") return { slot, pattern, kind: "verb" };
      const suffix = suffixOf(pattern);
      if (suffix !== null) return { slot, pattern, kind: "suffix", suffix };
      gap(
        "forms-rule-unreadable",
        `form:${slot}`,
        `The ${slot} pattern "${pattern}" is not R, R+suffix or VERB.`
      );
      return { slot, pattern, kind: "unknown" };
    });
    const verb = [];
    const irregularVerbs = {};
    const known = new Set(VERB_CLASSES);
    for (const [key, value] of Object.entries(morphology.verb_rule)) {
      if (!known.has(key)) {
        irregularVerbs[key] = value;
        continue;
      }
      const cls = key;
      const ending = cls === "otherwise" ? /^R\s*\+\s*first consonant\s*\+\s*([a-z]+)$/.exec(value.trim())?.[1] : suffixOf(value) ?? void 0;
      if (ending === void 0) {
        gap(
          "verb-rule-unreadable",
          `verb_rule.${key}`,
          `The verb rule "${key}: ${value}" cannot be read.`
        );
        continue;
      }
      const letter = CLASS_LETTER[cls];
      verb.push({ cls, pattern: value, ending, ...letter !== void 0 ? { letter } : {} });
    }
    verb.sort((a, b) => VERB_CLASSES.indexOf(a.cls) - VERB_CLASSES.indexOf(b.cls));
    for (const cls of VERB_CLASSES) {
      if (!verb.some((v) => v.cls === cls)) {
        gap("verb-rule-missing", `verb_rule.${cls}`, `verb_rule has no "${cls}" class.`);
      }
    }
    const vowels = vowelsOf(phonology);
    if (vowels === null && phonology !== void 0) {
      gaps.push({
        severity: "warn",
        code: "vowels-unreadable",
        ref: "phonology.vowels",
        message: `phonology.vowels could not be read; using ${VOWELS}.`
      });
    }
    const lexicalised = [];
    for (const [spelling, text] of Object.entries({
      ...morphology.lexicalised_derivations,
      ...morphology.lexicalised_diminutives ?? {}
    })) {
      const cut = text.lastIndexOf(": ");
      const m = /^([a-z]+)\s*\+\s*-([a-z]+)$/.exec(cut < 0 ? "" : text.slice(cut + 2).trim());
      const base = m?.[1];
      const suffix = m?.[2];
      if (base === void 0 || suffix === void 0 || base + suffix !== spelling) {
        gaps.push({
          severity: "warn",
          code: "lexicalised-unreadable",
          ref: spelling,
          message: `lexicalised_derivations.${spelling} ("${text}") is not "gloss: base + -suffix" spelling ${spelling}.`
        });
        continue;
      }
      lexicalised.push({ spelling, base, suffix, gloss: text.slice(0, cut).trim() });
    }
    return {
      rules: {
        edition,
        slots,
        verb,
        irregularVerbs,
        vowels: vowels ?? VOWELS,
        lexicalised,
        suffixes: Object.entries(morphology.suffixes).map(([key, meaning]) => ({
          spelling: key.replace(/^-/, ""),
          meaning
        }))
      },
      gaps
    };
  }
  function verbClassFor(rules, spelling) {
    const first = spelling[0] ?? "";
    return rules.verb.find(
      (v) => v.letter !== void 0 ? first === v.letter : v.cls === "vowel-initial" ? rules.vowels.includes(first) : v.cls === "otherwise"
    );
  }
  function ruleForm(rules, spelling, slot) {
    const rule = rules.slots.find((s) => s.slot === slot);
    if (rule === void 0 || rule.kind === "unknown") {
      return { form: null, parts: [{ text: spelling, role: "root" }], pattern: rule?.pattern ?? "" };
    }
    const root = { text: spelling, role: "root" };
    if (rule.kind === "suffix") {
      const parts = rule.suffix === "" ? [root] : [root, { text: rule.suffix, role: "marker" }];
      return { form: spelling + rule.suffix, parts, pattern: rule.pattern };
    }
    const cls = verbClassFor(rules, spelling);
    if (cls === void 0) return { form: null, parts: [root], pattern: rule.pattern };
    const ending = cls.cls === "otherwise" ? (spelling[0] ?? "") + cls.ending : cls.ending;
    return {
      form: spelling + ending,
      parts: [root, { text: ending, role: "marker" }],
      pattern: cls.pattern,
      verbClass: cls.cls
    };
  }
  const SOURCE_ORDER = {
    corpus: 0,
    examples: 1,
    ruling: 2,
    functionWord: 3,
    particle: 4
  };
  function createFormsEngine(input) {
    const { data } = input;
    const read = readFormRules(input.morphology, data.edition, input.phonology);
    const { rules } = read;
    const notes = input.overrides?.formNotes ?? {};
    const bySpelling = /* @__PURE__ */ new Map();
    for (const item of data.items.values()) {
      if (item.forms.length > 0) bySpelling.set(item.spelling, item.id);
    }
    const verdict = (spelling, slot, stored) => {
      const rule = ruleForm(rules, spelling, slot);
      if (rule.form === null || rule.form === stored) return { rule, reason: null };
      const listed = slot === "verb" && rules.irregularVerbs[spelling] === stored;
      return { rule, reason: listed ? "listed" : "unexplained" };
    };
    const irregular = /* @__PURE__ */ new Set();
    const unexplained = /* @__PURE__ */ new Map();
    for (const item of data.items.values()) {
      for (const f2 of item.forms) {
        const { reason } = verdict(item.spelling, f2.slot, f2.form);
        if (reason === null) continue;
        irregular.add(item.id);
        if (reason === "unexplained") {
          const list = unexplained.get(f2.slot) ?? [];
          list.push(item.id);
          unexplained.set(f2.slot, list);
        }
      }
    }
    for (const [word, form] of Object.entries(rules.irregularVerbs)) {
      const id = bySpelling.get(word);
      const stored = id === void 0 ? void 0 : data.items.get(id)?.forms.find((f2) => f2.slot === "verb");
      if (stored === void 0 || stored.form !== form) {
        read.gaps.push({
          severity: "error",
          code: "irregular-unmatched",
          ref: `verb_rule.${word}`,
          message: stored === void 0 ? `verb_rule lists ${word} → ${form}, but ${word} is no headword in ${data.edition}.` : `verb_rule lists ${word} → ${form}, but the stored verb is ${stored.form}.`
        });
      }
    }
    for (const [slot, ids] of unexplained) {
      read.gaps.push({
        severity: "error",
        code: "form-off-rule",
        ref: formConcept(slot),
        message: `${String(ids.length)} stored ${slot} forms differ from the rule ${rules.slots.find((s) => s.slot === slot)?.pattern ?? ""} and the data does not list them as irregular: ${ids.slice(0, 12).join(", ")}${ids.length > 12 ? ", …" : ""}. If the rule changed, the forms need a changeset; if the forms are right, the rule needs one.`
      });
    }
    const ref = (id) => {
      const i = data.items.get(id);
      return i === void 0 ? null : { id, spelling: i.spelling, meaning: i.meaning };
    };
    const derivationsOf = /* @__PURE__ */ new Map();
    const lexicalisedBySpelling = new Map(rules.lexicalised.map((d) => [d.spelling, d]));
    const rootOf = (base, seen = /* @__PURE__ */ new Set()) => {
      const inner = lexicalisedBySpelling.get(base);
      if (bySpelling.has(base) || inner === void 0 || seen.has(base)) return base;
      seen.add(base);
      return rootOf(inner.base, seen);
    };
    for (const d of rules.lexicalised) {
      const home = rootOf(d.base);
      if (!bySpelling.has(home)) {
        read.gaps.push({
          severity: "warn",
          code: "lexicalised-no-base",
          ref: d.spelling,
          message: `The lexicalised derivation ${d.spelling} is built on ${d.base}, which is no headword in ${data.edition}; no study card shows it.`
        });
      }
      const list = derivationsOf.get(home) ?? [];
      list.push(d);
      derivationsOf.set(home, list);
    }
    const getForms = (id, options = {}) => {
      const item = data.items.get(id);
      if (item === void 0) return null;
      const was = options.previous?.items[id];
      const head = item.components !== null ? data.items.get(item.components[1]) : void 0;
      const forms = [];
      const unused = [];
      for (const [i, f2] of item.forms.entries()) {
        if (!f2.meaningful && options.includeUnused !== true) {
          unused.push(f2.slot);
          continue;
        }
        const { rule, reason } = verdict(item.spelling, f2.slot, f2.form);
        const off = reason !== null;
        const note = notes[`${id}|${f2.slot}`];
        const verbClass = f2.slot !== "verb" ? void 0 : reason === "listed" ? "listed" : rule.verbClass;
        const headClass = f2.slot === "verb" && head !== void 0 && rule.verbClass !== void 0 ? verbClassFor(rules, head.spelling)?.cls : void 0;
        const glossWas = was?.[3][i];
        forms.push({
          category: f2.slot,
          form: f2.form,
          gloss: f2.gloss,
          meaningful: f2.meaningful,
          ruleId: formConcept(f2.slot),
          pattern: rule.pattern,
          parts: off ? [{ text: f2.form, role: "whole" }] : rule.parts,
          irregular: off,
          irregularReason: reason,
          irregularNote: note ?? null,
          regularWouldBe: off ? rule.form : null,
          ...verbClass !== void 0 ? { verbClass } : {},
          ...headClass !== void 0 && headClass !== rule.verbClass && !off ? { classFromModifier: { headClass } } : {},
          ...glossWas !== void 0 && glossWas !== f2.gloss ? { glossWas } : {}
        });
      }
      const root = item.forms.find((f2) => f2.slot === "root");
      const senses = (root?.meaningful === true ? root.gloss : item.meaning).split(";").map((s) => s.trim()).filter((s) => s !== "");
      const alt = new Set(senses.slice(1));
      alt.delete(item.meaning);
      const limit = options.examples ?? 3;
      const examples = data.examples.filter((e) => e.ids.includes(id)).sort((a, b) => SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source]).slice(0, limit).map((e) => {
        const slots = /* @__PURE__ */ new Set();
        for (const t of e.tokens) {
          if (t.link.kind !== "entry") continue;
          for (const r of t.link.refs) if (r.id === id && r.slot !== void 0) slots.add(r.slot);
        }
        return {
          key: e.key,
          liraasa: e.liraasa,
          english: e.english,
          source: e.source,
          ...e.where !== void 0 ? { where: e.where } : {},
          slots: FORM_SLOTS.filter((s) => slots.has(s)),
          gloss: glossLine(data, e.tokens)
        };
      });
      return {
        root: {
          id,
          kind: item.kind,
          spelling: item.spelling,
          gloss: item.meaning,
          sense: alt.size > 0 ? senses[0] ?? item.meaning : item.meaning,
          altMeanings: [...alt],
          theme: item.theme,
          register: item.register,
          version: item.since,
          status: item.status,
          ...was !== void 0 && was[0] !== item.spelling ? { spellingWas: was[0] } : {},
          parts: item.components === null ? null : item.components.map(ref).filter((r) => r !== null)
        },
        forms,
        unused,
        compounds: item.usedIn.map(ref).filter((r) => r !== null),
        derivations: (derivationsOf.get(item.spelling) ?? []).map((d) => ({
          ...d,
          ruleId: suffixConcept(d.suffix)
        })),
        examples,
        hasIrregular: irregular.has(id)
      };
    };
    let surprising = null;
    const surprisingIds = () => {
      if (surprising !== null) return surprising;
      const out = new Set(irregular);
      for (const item of data.items.values()) {
        if (item.forms.length === 0) continue;
        const w = getForms(item.id, { examples: 0 });
        if (w === null) continue;
        if (w.derivations.length > 0) out.add(item.id);
        if (w.forms.some((f2) => f2.classFromModifier !== void 0)) out.add(item.id);
      }
      surprising = [...out];
      return surprising;
    };
    return {
      rules,
      getForms,
      isIrregular: (id) => irregular.has(id),
      irregularIds: () => [...irregular],
      surprisingIds,
      gaps: read.gaps
    };
  }
  const PARTICLE = /* @__PURE__ */ new Set(["functionWord", "correlative", "discourseParticle", "timeWord"]);
  const rating = (verdict, fast) => verdict === "wrong" ? 1 : verdict === "almost" ? 2 : fast ? 4 : 3;
  function grade(verdict, score, expected, diagnoses, fast) {
    return { verdict, score, expected, diagnoses, rating: rating(verdict, fast) };
  }
  const itemLink = (id) => ({ kind: "item", id });
  const conceptLink = (id) => ({ kind: "concept", id });
  function meaningOf(data, link) {
    if (link.kind !== "entry") return "";
    const ref = link.refs[0];
    const item = ref === void 0 ? void 0 : data.items.get(ref.id);
    if (item === void 0) return "";
    const form = item.forms.find((f2) => f2.slot === ref?.slot);
    return form?.meaningful === true ? form.gloss : item.meaning;
  }
  function diagnoseWord(ctx, got, expected) {
    const g = normalize(got);
    const e = normalize(expected);
    if (g === e) return null;
    const want = linkWord(ctx.link, e);
    const have = linkWord(ctx.link, g);
    const wantRef = want.kind === "entry" ? want.refs[0] : void 0;
    const wantId = wantRef?.id;
    if (have.kind === "entry") {
      const ids = have.refs.map((r) => r.id);
      if (have.via === "legacy" && wantId !== void 0 && ids.includes(wantId)) {
        return {
          kind: "old-spelling",
          message: `“${got}” is the pre-1.0 spelling; it is now “${expected}”.`,
          expected,
          got,
          link: itemLink(wantId)
        };
      }
      if (wantId !== void 0 && ids.includes(wantId)) {
        const slot = have.refs.find((r) => r.id === wantId)?.slot;
        const wantSlot = wantRef?.slot;
        const what = slot !== void 0 && wantSlot !== void 0 && slot !== wantSlot ? `the ${humanize(slot)} form; this needs the ${humanize(wantSlot)} form` : "the right word with the wrong ending";
        return {
          kind: "wrong-form",
          message: `“${got}” is ${what}: “${expected}”.`,
          expected,
          got,
          link: wantSlot !== void 0 ? conceptLink(`form:${wantSlot}`) : itemLink(wantId)
        };
      }
      return {
        kind: "wrong-root",
        message: `“${got}” is a different word (“${meaningOf(ctx.data, have)}”). The answer is “${expected}”${wantId !== void 0 ? ` (“${meaningOf(ctx.data, want)}”)` : ""}.`,
        expected,
        got,
        ...wantId !== void 0 ? { link: itemLink(wantId) } : {}
      };
    }
    if (editDistance(g, e, typoBudget(e.length)) <= typoBudget(e.length)) {
      return {
        kind: "typo",
        message: `Almost: check the spelling. It is “${expected}”.`,
        expected,
        got,
        ...wantId !== void 0 ? { link: itemLink(wantId) } : {}
      };
    }
    return {
      kind: "not-a-word",
      message: `“${got}” is not a word of Liraasa. The answer is “${expected}”.`,
      expected,
      got,
      ...wantId !== void 0 ? { link: itemLink(wantId) } : {}
    };
  }
  function gradeWord(ctx, typed, accepted, fast) {
    const first = accepted[0] ?? "";
    if (accepted.some((a) => normalize(a) === normalize(typed)))
      return grade("correct", 1, first, [], fast);
    const best = [...accepted].sort(
      (a, b) => editDistance(normalize(typed), normalize(a)) - editDistance(normalize(typed), normalize(b))
    )[0];
    const d = diagnoseWord(ctx, typed, best ?? first);
    const soft = d !== null && (d.kind === "typo" || d.kind === "old-spelling");
    return grade(
      soft ? "almost" : "wrong",
      soft ? 0.8 : 0,
      best ?? first,
      d === null ? [] : [d],
      false
    );
  }
  function lcs(a, b) {
    const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i2 = a.length - 1; i2 >= 0; i2 -= 1) {
      for (let j2 = b.length - 1; j2 >= 0; j2 -= 1) {
        const row = t[i2];
        if (row === void 0) continue;
        row[j2] = a[i2] === b[j2] ? (t[i2 + 1]?.[j2 + 1] ?? 0) + 1 : Math.max(t[i2 + 1]?.[j2] ?? 0, row[j2 + 1] ?? 0);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        out.push([i, j]);
        i += 1;
        j += 1;
      } else if ((t[i + 1]?.[j] ?? 0) >= (t[i]?.[j + 1] ?? 0)) i += 1;
      else j += 1;
    }
    return out;
  }
  function gradeSentence(ctx, typed, expected, fast = false) {
    const got = words$1(typed).map((w2) => w2.text);
    const want = words$1(expected).map((w2) => w2.text);
    const g = got.map(normalize);
    const w = want.map(normalize);
    if (g.join(" ") === w.join(" ")) return grade("correct", 1, expected, [], fast);
    const diagnoses = [];
    const sorted = (x) => [...x].sort().join(" ");
    if (sorted(g) === sorted(w)) {
      diagnoses.push({
        kind: "wrong-order",
        message: "All the right words, in the wrong order. Liraasa order is fixed by the clause template.",
        expected,
        got: typed,
        link: conceptLink("clause")
      });
      return grade("wrong", 0.5, expected, diagnoses, false);
    }
    const matched = lcs(g, w);
    const usedG = new Set(matched.map(([i]) => i));
    const usedW = new Set(matched.map(([, j]) => j));
    const restG = g.map((x, i) => ({ x, i, raw: got[i] ?? x })).filter(({ i }) => !usedG.has(i));
    let soft = true;
    for (const [j, e] of w.entries()) {
      if (usedW.has(j)) continue;
      let best;
      let bestScore = Infinity;
      for (const r of restG) {
        const sameEntry = (() => {
          const a = linkWord(ctx.link, r.x);
          const b = linkWord(ctx.link, e);
          if (a.kind !== "entry" || b.kind !== "entry") return false;
          return a.refs.some((x) => b.refs.some((y) => y.id === x.id));
        })();
        const score2 = sameEntry ? 0 : editDistance(r.x, e, 4);
        if (score2 < bestScore) {
          bestScore = score2;
          best = r;
        }
      }
      if (best !== void 0 && bestScore <= Math.max(2, typoBudget(e.length))) {
        restG.splice(restG.indexOf(best), 1);
        const d = diagnoseWord(ctx, best.raw, want[j] ?? e);
        if (d !== null) {
          diagnoses.push(d);
          if (d.kind !== "typo" && d.kind !== "old-spelling") soft = false;
        }
        continue;
      }
      soft = false;
      const link = linkWord(ctx.link, e);
      const ref = link.kind === "entry" ? link.refs[0] : void 0;
      const particle = ref !== void 0 && PARTICLE.has(ref.namespace);
      diagnoses.push({
        kind: particle ? "missing-particle" : "missing-word",
        message: `Missing ${particle ? "the particle" : "the word"} “${want[j] ?? e}”${ref !== void 0 ? ` (“${meaningOf(ctx.data, link)}”)` : ""}.`,
        expected: want[j] ?? e,
        ...ref !== void 0 ? { link: itemLink(ref.id) } : {}
      });
    }
    for (const r of restG) {
      soft = false;
      const link = linkWord(ctx.link, r.x);
      diagnoses.push({
        kind: link.kind === "unknown" ? "not-a-word" : "extra-word",
        message: link.kind === "unknown" ? `“${r.raw}” is not a word of Liraasa.` : `“${r.raw}” does not belong in this sentence.`,
        got: r.raw
      });
    }
    const score = matched.length / Math.max(1, w.length);
    return grade(soft ? "almost" : "wrong", score, expected, diagnoses, false);
  }
  function synonymsFor(data, ids) {
    const groups = /* @__PURE__ */ new Map();
    for (const id of ids) {
      const item = data.items.get(id);
      if (item === void 0) continue;
      const words2 = new Set(
        [
          item.meaning,
          ...item.synonyms,
          ...item.forms.filter((f2) => f2.meaningful).map((f2) => f2.gloss)
        ].flatMap(englishContent)
      );
      for (const w of words2) groups.set(w, /* @__PURE__ */ new Set([...groups.get(w) ?? [], ...words2]));
    }
    return groups;
  }
  function gradeEnglish(data, typed, accepted, itemIds, fast = false) {
    const expected = accepted[0] ?? "";
    const want = englishContent(expected);
    const got = new Set(englishContent(typed));
    if (want.length === 0)
      return grade(
        normalize(typed) === normalize(expected) ? "correct" : "wrong",
        1,
        expected,
        [],
        fast
      );
    const syn = synonymsFor(data, itemIds);
    const missed = [];
    for (const w of want) {
      const ok = got.has(w) || [...syn.get(w) ?? []].some((s) => got.has(s));
      if (!ok) missed.push(w);
    }
    const score = 1 - missed.length / want.length;
    const verdict = score >= 0.75 ? "correct" : score >= 0.45 ? "almost" : "wrong";
    const diagnoses = missed.length === 0 || verdict === "correct" ? [] : [
      {
        kind: "meaning-missing",
        message: `Your translation misses: ${missed.join(", ")}. A full answer: “${expected}”.`,
        expected,
        got: typed
      }
    ];
    return grade(verdict, score, expected, diagnoses, fast && verdict === "correct");
  }
  function gradeExercise(ctx, ex, response, ms = Infinity) {
    const fast = ms < 6e3;
    const a = ex.answer;
    if (a.kind === "choice") {
      const expected2 = ex.choices?.find((c) => c.id === a.correct)?.text ?? a.correct;
      if (response.kind !== "choice") return grade("wrong", 0, expected2, [], false);
      if (response.id === a.correct) return grade("correct", 1, expected2, [], fast);
      const chosen = ex.choices?.find((c) => c.id === response.id);
      const item = ctx.data.items.get(response.id);
      const message = ex.type === "formIdentify" ? `That is not the ${chosen?.text ?? response.id} form: it is the ${expected2} form.` : item !== void 0 ? `“${chosen?.text ?? ""}” is what “${item.spelling}” means. The answer is “${expected2}”.` : `The answer is “${expected2}”.`;
      return grade(
        "wrong",
        0,
        expected2,
        [
          {
            kind: "wrong-choice",
            message,
            expected: expected2,
            ...chosen !== void 0 ? { got: chosen.text } : {},
            link: ex.type === "formIdentify" ? conceptLink(`form:${a.correct}`) : itemLink(item !== void 0 ? item.id : ex.target)
          }
        ],
        false
      );
    }
    if (a.kind === "typed") {
      const text = response.kind === "typed" ? response.text : response.kind === "choice" ? ex.choices?.find((c) => c.id === response.id)?.text ?? "" : "";
      if (a.lang === "english") return gradeEnglish(ctx.data, text, a.accepted, ex.items, fast);
      const multi = a.accepted.some((x) => words$1(x).length > 1);
      if (multi) {
        const best = [...a.accepted].map((x) => gradeSentence(ctx, text, x, fast)).sort((p, q) => q.score - p.score);
        return best[0] ?? gradeSentence(ctx, text, a.accepted[0] ?? "", fast);
      }
      const g = gradeWord(ctx, text, a.accepted, fast);
      return g;
    }
    if (a.kind === "order") {
      const textOf = (id) => a.tiles.find((t) => t.id === id)?.text ?? id;
      const want = a.correct.map(textOf);
      const expected2 = ex.type === "assemble" ? want.join(" ") : want.join(" + ");
      if (response.kind !== "order") return grade("wrong", 0, expected2, [], false);
      const got = response.ids.map(textOf);
      if (got.map(normalize).join(" ") === want.map(normalize).join(" ")) {
        return grade("correct", 1, expected2, [], fast);
      }
      if (ex.type === "assemble") {
        const g = gradeSentence(ctx, got.join(" "), want.join(" "));
        return { ...g, expected: expected2 };
      }
      const diagnoses2 = [];
      if ([...got].sort().join() === [...want].sort().join()) {
        diagnoses2.push({
          kind: "wrong-order",
          message: "The right parts, the wrong way round: the modifier comes first, the head last.",
          expected: expected2,
          link: conceptLink("compound")
        });
      } else {
        for (const id of response.ids) {
          if (a.correct.includes(id)) continue;
          const item = ctx.data.items.get(id);
          diagnoses2.push({
            kind: "wrong-part",
            message: `“${textOf(id)}” means “${item?.meaning ?? ""}”, which is not part of this word.`,
            got: textOf(id),
            link: itemLink(id)
          });
        }
      }
      const right2 = response.ids.filter((id, i) => a.correct[i] === id).length;
      return grade("wrong", right2 / a.correct.length, expected2, diagnoses2, false);
    }
    if (a.kind === "multi") {
      const text = (id) => ex.choices?.find((c) => c.id === id)?.text ?? id;
      const expected2 = a.correct.map(text).join(", ");
      if (response.kind !== "multi") return grade("wrong", 0, expected2, [], false);
      const want = new Set(a.correct);
      const got = new Set(response.ids);
      const hits = [...got].filter((id) => want.has(id)).length;
      const extra = [...got].filter((id) => !want.has(id));
      const missed = a.correct.filter((id) => !got.has(id));
      if (extra.length === 0 && missed.length === 0) return grade("correct", 1, expected2, [], fast);
      const diagnoses2 = [
        ...extra.map(
          (id) => ({
            kind: "wrong-choice",
            message: `“${text(id)}” does not fit.`,
            got: text(id)
          })
        ),
        ...missed.map(
          (id) => ({
            kind: "missed-choice",
            message: `“${text(id)}” fits too.`,
            expected: text(id)
          })
        )
      ];
      const score2 = Math.max(0, (hits - extra.length) / want.size);
      const verdict2 = extra.length + missed.length === 1 ? "almost" : "wrong";
      return grade(verdict2, score2, expected2, diagnoses2, false);
    }
    const expected = a.left.map((l) => `${l.text} = ${a.right.find((r) => r.id === a.pairs[l.id])?.text ?? ""}`).join("; ");
    if (response.kind !== "pairs") return grade("wrong", 0, expected, [], false);
    const diagnoses = [];
    let right = 0;
    for (const l of a.left) {
      if (response.pairs[l.id] === a.pairs[l.id]) {
        right += 1;
        continue;
      }
      const item = ctx.data.items.get(l.id);
      const partner = a.right.find((r) => r.id === a.pairs[l.id])?.text ?? "";
      diagnoses.push(
        item !== void 0 ? {
          kind: "wrong-choice",
          message: `“${l.text}” means “${item.meaning}”.`,
          expected: item.meaning,
          link: itemLink(l.id)
        } : {
          // a pair that is not a word, e.g. a form and its name (Form Match)
          kind: "wrong-choice",
          message: `“${l.text}” goes with “${partner}”.`,
          expected: partner
        }
      );
    }
    const score = right / a.left.length;
    const verdict = score === 1 ? "correct" : a.left.length - right <= 1 ? "almost" : "wrong";
    return grade(verdict, score, expected, diagnoses, fast && verdict === "correct");
  }
  const DRILL_MODES = [
    "recognize",
    "recall",
    "forge",
    "pattern",
    "match",
    "listen",
    "slot"
  ];
  const meaningfulForms = (forms, id) => forms.getForms(id, { examples: 0 })?.forms ?? [];
  function spotPattern(ctx, ids, rng, ask) {
    const { data } = ctx.exercise;
    const verbOf2 = (id) => meaningfulForms(ctx.forms, id).find((f2) => f2.category === "verb");
    const drawn = ids.filter((id) => verbOf2(id) !== void 0);
    if (drawn.length === 0) return null;
    const others = rng.shuffle(
      [...data.items.values()].filter((i) => (i.kind === "root" || i.kind === "compound") && !ids.includes(i.id)).filter((i) => i.forms.some((f2) => f2.slot === "verb" && f2.meaningful)).map((i) => i.id)
    );
    const grid = rng.shuffle(
      [.../* @__PURE__ */ new Set([...rng.shuffle(drawn).slice(0, 4), ...others.slice(0, 6)])].slice(0, 6)
    );
    const classOf = (id) => verbOf2(id)?.verbClass;
    const irregular = grid.filter((id) => verbOf2(id)?.irregular === true);
    const present = VERB_CLASSES.filter((c) => grid.some((id) => classOf(id) === c));
    const target = ask ?? (irregular.length > 0 && rng.next() < 0.5 ? "irregular" : rng.pick(present.filter((c) => grid.some((id) => classOf(id) !== c))));
    if (target === void 0) return null;
    const correct = target === "irregular" ? irregular : grid.filter((id) => classOf(id) === target);
    if (correct.length === 0 || correct.length === grid.length) return null;
    const pattern = ctx.forms.rules.verb.find((v) => v.cls === target)?.pattern ?? "";
    const choices = grid.map((id) => ({
      id,
      text: verbOf2(id)?.form ?? "",
      liraasa: true
    }));
    const first = correct.find((id) => ids.includes(id)) ?? drawn[0] ?? "";
    return {
      id: `spotPattern:${target}:${grid.join(",")}`,
      type: "spotPattern",
      skill: "morphology",
      direction: "recognize",
      card: cardId(first, "morphology", "recognize"),
      target: first,
      items: grid,
      concepts: ["form:verb"],
      instruction: target === "irregular" ? "Which of these verbs go their own way, not the rule?" : `Which of these verbs follow the pattern “${pattern}”?`,
      prompt: {},
      choices,
      answer: { kind: "multi", correct }
    };
  }
  function formMatch(ctx, id, rng) {
    const forms = meaningfulForms(ctx.forms, id);
    if (forms.length < 3) return null;
    const chosen = rng.shuffle(forms).slice(0, 4);
    const left = chosen.map((f2) => ({ id: `f:${f2.category}`, text: f2.form, liraasa: true }));
    const right = rng.shuffle(
      chosen.map((f2) => ({ id: `n:${f2.category}`, text: humanize(f2.category), liraasa: false }))
    );
    return {
      id: `formMatch:${id}:${chosen.map((f2) => f2.category).join(",")}`,
      type: "formMatch",
      skill: "morphology",
      direction: "recognize",
      card: cardId(id, "morphology", "recognize"),
      target: id,
      items: [id],
      concepts: chosen.map((f2) => f2.ruleId),
      instruction: "Match each form to its name.",
      prompt: {},
      answer: {
        kind: "pairs",
        left,
        right,
        pairs: Object.fromEntries(chosen.map((f2) => [`f:${f2.category}`, `n:${f2.category}`]))
      }
    };
  }
  function starsDrill(ctx, ids, rng, options) {
    const ex = ctx.exercise;
    const modes = new Set(options.modes);
    const buckets = /* @__PURE__ */ new Map();
    const add = (mode, e) => {
      if (e === null || !modes.has(mode)) return;
      buckets.set(mode, [...buckets.get(mode) ?? [], e]);
    };
    for (const id of ids) {
      const forms = meaningfulForms(ctx.forms, id);
      const slots = forms.map((f2) => f2.category).filter((s) => s !== "root");
      add("recognize", recognition(ex, id, rng));
      for (const s of slots) add("recognize", recognition(ex, id, rng, s));
      add("recall", recall(ex, id));
      for (const s of slots) add("forge", formBuild(ex, id, rng, s));
      add("match", formMatch(ctx, id, rng));
      add("listen", listen(ex, id, rng));
      const sentences = ex.data.examples.filter((e) => e.ids.includes(id));
      for (const e of rng.shuffle(sentences).slice(0, 2))
        add("slot", cloze(ex, e, rng, { item: id }));
    }
    if (ids.length >= 3) add("match", matching(ex, rng.shuffle(ids), rng));
    if (modes.has("pattern")) {
      const grids = /* @__PURE__ */ new Set();
      for (let k = 0; k < 24 && grids.size < 6; k += 1) {
        const e = spotPattern(ctx, ids, rng, VERB_CLASSES[k % VERB_CLASSES.length]);
        if (e === null || grids.has(e.id)) continue;
        grids.add(e.id);
        add("pattern", e);
      }
    }
    if (ids.some((id) => ctx.forms.isIrregular(id)))
      add("pattern", spotPattern(ctx, ids, rng, "irregular"));
    const queues = rng.shuffle([...buckets.values()].map((list) => rng.shuffle(list)));
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    let turn = 0;
    for (const id of rng.shuffle(ids)) {
      if (out.length >= options.length) break;
      for (let k = 0; k < queues.length; k += 1) {
        const q = queues[(turn + k) % queues.length] ?? [];
        const at = q.findIndex((e) => e.target === id && !seen.has(e.id));
        const next = at < 0 ? void 0 : q.splice(at, 1)[0];
        if (next === void 0) continue;
        seen.add(next.id);
        out.push(next);
        turn = (turn + k + 1) % queues.length;
        break;
      }
    }
    while (out.length < options.length && queues.some((q) => q.length > 0)) {
      for (const q of queues) {
        const next = q.shift();
        if (next === void 0 || seen.has(next.id)) continue;
        seen.add(next.id);
        out.push(next);
        if (out.length >= options.length) break;
      }
    }
    const spread = [];
    const left = [...out];
    while (left.length > 0) {
      const prev = spread[spread.length - 1]?.target;
      const counts = /* @__PURE__ */ new Map();
      for (const e of left) counts.set(e.target, (counts.get(e.target) ?? 0) + 1);
      const crowded = [...counts].find(([t, n]) => t !== prev && n * 2 > left.length)?.[0];
      const at = crowded !== void 0 ? left.findIndex((e) => e.target === crowded) : left.findIndex((e) => e.target !== prev);
      spread.push(...left.splice(Math.max(at, 0), 1));
    }
    return spread;
  }
  function typedText(ex, response) {
    if (ex.answer.kind !== "typed" || ex.answer.lang !== "liraasa") return null;
    if (response.kind === "typed") return response.text;
    if (response.kind === "choice")
      return ex.choices?.find((c) => c.id === response.id)?.text ?? null;
    return null;
  }
  const askedSlot = (ex) => FORM_SLOTS.find((s) => ex.concepts.includes(`form:${s}`));
  function gradeStars(gctx, forms, ex, response, ms, leniency) {
    const g = gradeExercise(gctx, ex, response, ms);
    if (g.verdict === "correct") return g;
    const typed = typedText(ex, response);
    if (typed === null || ex.answer.kind !== "typed") return g;
    const got = normalize(typed);
    const slot = ex.type === "formBuild" ? askedSlot(ex) : void 0;
    if (slot !== void 0) {
      const f2 = forms.getForms(ex.target, { includeUnused: true, examples: 0 })?.forms.find((x) => x.category === slot);
      if (f2?.irregular === true && f2.regularWouldBe !== null && normalize(f2.regularWouldBe) === got) {
        return {
          ...g,
          verdict: "almost",
          score: 0.5,
          rating: 2,
          diagnoses: [
            {
              kind: "rule-for-irregular",
              message: `The rule (${f2.pattern}) makes “${f2.regularWouldBe}”, and this word goes its own way: “${f2.form}”.`,
              expected: f2.form,
              got: typed,
              link: { kind: "concept", id: f2.ruleId }
            }
          ]
        };
      }
    }
    if (leniency === "lenient") {
      const vowels = forms.rules.vowels;
      const squeeze = (s) => [...s].filter((ch, i) => !(vowels.includes(ch) && s[i - 1] === ch)).join("");
      const match = ex.answer.accepted.find((a) => squeeze(normalize(a)) === squeeze(got));
      if (match !== void 0) {
        return {
          verdict: "correct",
          score: 1,
          expected: match,
          rating: 3,
          diagnoses: [
            {
              kind: "vowel-length",
              message: `Forgiven: the exact spelling is “${match}”.`,
              expected: match,
              got: typed
            }
          ]
        };
      }
    }
    return g;
  }
  function drillResults(ids, results) {
    const worth = { correct: 1, almost: 0.5, wrong: 0 };
    return ids.map((id) => {
      const mine = results.filter((r) => r.ex.target === id);
      const right = mine.filter((r) => r.grade.verdict === "correct").length;
      const score = mine.length === 0 ? 0 : mine.reduce((sum, r) => sum + worth[r.grade.verdict], 0) / mine.length;
      return { id, asked: mine.length, right, score };
    });
  }
  const SERIOUS = /* @__PURE__ */ new Set(["error", "warn"]);
  const seriousProblems = (ps) => ps.filter((p) => SERIOUS.has(p.severity));
  const memo = /* @__PURE__ */ new WeakMap();
  function problemsOf(check, line) {
    let m = memo.get(check);
    if (m === void 0) {
      m = /* @__PURE__ */ new Map();
      memo.set(check, m);
    }
    const hit = m.get(line);
    if (hit !== void 0) return hit;
    const out = seriousProblems(check(line));
    m.set(line, out);
    return out;
  }
  const isClean = (check, line) => problemsOf(check, line).length === 0;
  const CLOSED = /* @__PURE__ */ new Set(["functionWord", "correlative", "timeWord", "particle"]);
  const HEADWORD = /* @__PURE__ */ new Set(["root", "compound", "imageCompound"]);
  const SUBJECTISH = /* @__PURE__ */ new Set(["root", "compound", "imageCompound", "pronoun"]);
  function sentenceOf(e) {
    let rest = e.liraasa;
    for (const t of [...e.tokens].reverse()) rest = rest.slice(0, t.start) + rest.slice(t.end);
    const leftover = rest.replace(/\s+/g, "");
    if (leftover !== "" && !/^[.!?]$/.test(leftover)) return null;
    if (leftover !== "" && !/[.!?]\s*$/.test(e.liraasa)) return null;
    const end = leftover === "" ? "." : leftover;
    const words2 = e.tokens.map(
      (t, i) => i === 0 && t.link.kind !== "name" ? t.text.charAt(0).toLowerCase() + t.text.slice(1) : t.text
    );
    return { words: words2, end };
  }
  function renderSentence(words2, end) {
    const line = words2.join(" ");
    return line.charAt(0).toUpperCase() + line.slice(1) + end;
  }
  const unknownHeadwords = (ctx, e) => ctx.known === void 0 ? 0 : e.ids.filter((id) => HEADWORD.has(ctx.data.items.get(id)?.kind ?? "") && !ctx.known?.has(id)).length;
  function loomSentences(ctx, concept, limit = 12) {
    const ex = ctx.exercise;
    const list = unique(
      ex.data.examples.filter(
        (e) => e.concepts.includes(concept) && e.english !== null && e.tokens.length >= 2 && e.tokens.length <= 12 && e.tokens.every((t) => t.link.kind !== "unknown") && sentenceOf(e) !== null
      ),
      (e) => e.liraasa
    );
    return list.map((e) => ({ e, u: unknownHeadwords(ex, e) })).sort(
      (a, b) => a.u - b.u || a.e.tokens.length - b.e.tokens.length || (a.e.key < b.e.key ? -1 : 1)
    ).map((x) => x.e).filter((e) => isClean(ctx.check, e.liraasa)).slice(0, limit);
  }
  const DASH = " — ";
  function ruleCard(ctx, id, overrides, limit = 4) {
    const data = ctx.exercise.data;
    const concept = data.concepts.get(id);
    if (concept === void 0) return null;
    const cut = concept.description.indexOf(DASH);
    const patterned = concept.kind !== "ruling" && concept.kind !== "numbers" && concept.kind !== "motion";
    const pattern = !patterned ? null : cut < 0 ? concept.description : concept.description.slice(0, cut);
    const explanation = !patterned ? concept.description : cut < 0 ? "" : concept.description.slice(cut + DASH.length);
    const title = (c) => ({
      id: c,
      title: data.concepts.get(c)?.title ?? c
    });
    const note = overrides.notes[id] ?? (concept.ruleRef !== void 0 ? overrides.notes[concept.ruleRef] : void 0);
    return {
      concept,
      title: concept.title,
      pattern,
      explanation,
      note: note ?? null,
      version: concept.ruleRef?.split(":")[0] ?? data.edition,
      prereqs: concept.prereqs.map(title),
      leadsTo: [...data.concepts.values()].filter((c) => c.prereqs.includes(id)).map((c) => title(c.id)),
      words: unique(
        concept.words.map((w) => {
          const it = data.items.get(w);
          return { id: w, spelling: it?.spelling ?? w, meaning: it?.meaning ?? "" };
        }),
        (w) => w.spelling
      ),
      examples: loomSentences(ctx, id, limit).map((e) => ({
        key: e.key,
        liraasa: e.liraasa,
        english: e.english,
        gloss: glossLine(data, e.tokens)
      }))
    };
  }
  function ruleMap(ctx, overrides) {
    const data = ctx.exercise.data;
    const excluded = new Set(overrides.exclude);
    const depth = /* @__PURE__ */ new Map();
    const depthOf = (id, seen = /* @__PURE__ */ new Set()) => {
      const known = depth.get(id);
      if (known !== void 0) return known;
      if (seen.has(id)) return 0;
      seen.add(id);
      const c = data.concepts.get(id);
      const d = c === void 0 || c.prereqs.length === 0 ? 0 : 1 + Math.max(...c.prereqs.map((p) => depthOf(p, seen)));
      depth.set(id, d);
      return d;
    };
    const groupOf = (c) => c.kind === "ruling" ? "rulings" : c.kind === "slot" || c.id === CLAUSE ? "clause" : c.id === NOUN_PHRASE ? "phrase" : "forms";
    const slotN = (c) => c.slot ?? 0;
    return [...data.concepts.values()].filter((c) => !excluded.has(c.id)).map((c) => ({
      id: c.id,
      title: c.title,
      group: groupOf(c),
      depth: depthOf(c.id),
      prereqs: c.prereqs,
      sentences: loomSentences(ctx, c.id, 99).length,
      version: c.ruleRef?.split(":")[0] ?? data.edition,
      n: slotN(c)
    })).sort((a, b) => a.depth - b.depth || a.n - b.n || (a.id < b.id ? -1 : 1)).map(({ n: _n, ...rest }) => rest);
  }
  const LOOM_TYPES = [
    "weave",
    "transform",
    "mend",
    "unravel",
    "choose",
    "translate",
    "reverse"
  ];
  const closedAt = (data, e, i) => {
    const t = e.tokens[i];
    if (t?.link.kind !== "entry") return false;
    return t.link.refs.some((r) => CLOSED.has(data.items.get(r.id)?.kind ?? ""));
  };
  function slotNumbers(data, t) {
    if (t.link.kind !== "entry") return [];
    const ids = new Set(t.link.refs.map((r) => r.id));
    const out = [];
    for (const c of data.concepts.values()) {
      if (c.kind === "slot" && c.slot !== void 0 && c.words.some((w) => ids.has(w)))
        out.push(c.slot);
    }
    return out;
  }
  function transform(ctx, e, slot, rng) {
    const data = ctx.exercise.data;
    const concept = data.concepts.get(slot);
    const base = sentenceOf(e);
    if (concept?.kind !== "slot" || concept.words.length === 0 || base === null) return null;
    const present = new Set(e.ids);
    if (concept.words.some((w) => present.has(w))) return null;
    const word = rng.pick(
      concept.words.map((w) => data.items.get(w)).filter((w) => w !== void 0 && w.kind === "functionWord")
    );
    if (word === void 0) return null;
    const subjectSlot = [...data.concepts.values()].find((c) => c.id === "slot:SUBJECT")?.slot ?? 0;
    const first = e.tokens[0];
    const opensWithSubject = first !== void 0 && first.link.kind === "entry" && first.link.refs.some((r) => SUBJECTISH.has(data.items.get(r.id)?.kind ?? ""));
    const from = (concept.slot ?? 0) > subjectSlot && opensWithSubject ? 1 : 0;
    const n = concept.slot ?? 0;
    const slotsAt = e.tokens.map((t) => slotNumbers(data, t));
    const inOrder = (at) => slotsAt.slice(0, at).every((s) => s.length === 0 || s.some((m) => m <= n)) && slotsAt.slice(at).every((s) => s.length === 0 || s.some((m) => m >= n));
    const answers = [];
    for (let at = from; at <= base.words.length; at += 1) {
      if (!inOrder(at)) continue;
      const words2 = [...base.words.slice(0, at), word.spelling, ...base.words.slice(at)];
      const line = renderSentence(words2, base.end);
      if (isClean(ctx.check, line)) answers.push(line);
    }
    if (answers.length === 0 || answers.length > 2) return null;
    const original = renderSentence(base.words, base.end);
    return {
      id: `transform:${e.key}:${word.id}`,
      type: "transform",
      skill: "grammar",
      direction: "produce",
      card: cardId(slot, "grammar", "produce"),
      target: slot,
      items: [...e.ids, word.id],
      concepts: [slot],
      instruction: `Add “${word.spelling}” (${word.meaning}) where it belongs.`,
      prompt: { liraasa: original, english: e.english ?? "", tokens: glossLine(data, e.tokens) },
      prefill: original,
      answer: { kind: "typed", lang: "liraasa", accepted: answers },
      source: e.key
    };
  }
  function mutants(ctx, e, rng, want = 3) {
    const data = ctx.exercise.data;
    const base = sentenceOf(e);
    if (base === null) return [];
    const tries = [];
    base.words.forEach((_, i) => {
      if (!closedAt(data, e, i)) return;
      for (let to = 0; to < base.words.length; to += 1) {
        if (to === i) continue;
        const words2 = [...base.words];
        const [moved] = words2.splice(i, 1);
        if (moved === void 0) continue;
        words2.splice(to, 0, moved);
        tries.push(words2);
      }
    });
    e.tokens.forEach((t, i) => {
      if (t.link.kind !== "entry" || t.link.refs.length !== 1) return;
      const ref = t.link.refs[0];
      const item = ref === void 0 ? void 0 : data.items.get(ref.id);
      if (item === void 0 || ref?.slot === void 0 || t.link.via !== void 0) return;
      if (!HEADWORD.has(item.kind)) return;
      for (const f2 of item.forms) {
        if (!f2.meaningful || f2.slot === ref.slot) continue;
        const words2 = [...base.words];
        words2[i] = f2.form;
        tries.push(words2);
      }
    });
    const original = renderSentence(base.words, base.end);
    const out = [];
    const seen = /* @__PURE__ */ new Set([original]);
    for (const words2 of rng.shuffle(tries)) {
      const line = renderSentence(words2, base.end);
      if (seen.has(line)) continue;
      seen.add(line);
      const problem = problemsOf(ctx.check, line)[0];
      if (problem === void 0) continue;
      out.push({ line, problem });
      if (out.length >= want) break;
    }
    return out;
  }
  function mend(ctx, e, rng, target) {
    const base = sentenceOf(e);
    const [m] = mutants(ctx, e, rng, 1);
    if (base === null || m === void 0) return null;
    const original = renderSentence(base.words, base.end);
    return {
      id: `mend:${e.key}:${m.line}`,
      type: "mend",
      skill: "grammar",
      direction: "produce",
      card: cardId(target, "grammar", "produce"),
      target,
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "One thing is wrong. Mend the sentence.",
      prompt: { liraasa: m.line, english: e.english ?? "" },
      prefill: m.line,
      answer: { kind: "typed", lang: "liraasa", accepted: [original] },
      explain: { wrong: m.problem.message },
      source: e.key
    };
  }
  function choose(ctx, e, rng, target) {
    const base = sentenceOf(e);
    const ms = mutants(ctx, e, rng, 2);
    if (base === null || ms.length < 2) return null;
    const choices = rng.shuffle([
      { id: "ok", text: renderSentence(base.words, base.end), liraasa: true },
      ...ms.map((m, i) => ({ id: `m${String(i)}`, text: m.line, liraasa: true }))
    ]);
    return {
      id: `choose:${e.key}`,
      type: "choose",
      skill: "grammar",
      direction: "recognize",
      card: cardId(target, "grammar", "recognize"),
      target,
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "Which one is grammatical?",
      prompt: { english: e.english ?? "" },
      choices,
      answer: { kind: "choice", correct: "ok" },
      explain: Object.fromEntries(ms.map((m, i) => [`m${String(i)}`, m.problem.message])),
      source: e.key
    };
  }
  function unravel(ctx, e, rng, target) {
    const gloss = glossLine(ctx.exercise.data, e.tokens);
    const picked = [];
    const labels = /* @__PURE__ */ new Set();
    const texts = /* @__PURE__ */ new Set();
    gloss.forEach((t, i) => {
      if (t.kind !== "entry" || t.gloss === "") return;
      const label = t.tags.length > 0 ? `${t.gloss} · ${t.tags.join(" · ")}` : t.gloss;
      const key = normalize(t.text);
      if (labels.has(label) || texts.has(key)) return;
      labels.add(label);
      texts.add(key);
      picked.push({ i, t, label });
    });
    if (picked.length < 3) return null;
    const chosen = picked.slice(0, 5);
    return {
      id: `unravel:${e.key}`,
      type: "unravel",
      skill: "grammar",
      direction: "recognize",
      card: cardId(target, "grammar", "recognize"),
      target,
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "Gloss each word.",
      prompt: { liraasa: e.liraasa, english: e.english ?? "" },
      answer: {
        kind: "pairs",
        left: chosen.map((c) => ({ id: `u:${String(c.i)}`, text: c.t.text, liraasa: true })),
        right: rng.shuffle(
          chosen.map((c) => ({ id: `g:${String(c.i)}`, text: c.label, liraasa: false }))
        ),
        pairs: Object.fromEntries(chosen.map((c) => [`u:${String(c.i)}`, `g:${String(c.i)}`]))
      },
      source: e.key
    };
  }
  function reverse(ctx, e, rng, target) {
    const data = ctx.exercise.data;
    if (e.english === null) return null;
    const mine = normalize(e.english);
    const ids = new Set(e.ids);
    const others = unique(
      rng.shuffle(data.examples.filter((x) => x.english !== null && normalize(x.english) !== mine)).sort(
        (a, b) => b.ids.filter((i) => ids.has(i)).length - a.ids.filter((i) => ids.has(i)).length
      ),
      (x) => normalize(x.english ?? "")
    ).slice(0, 2);
    if (others.length < 2) return null;
    return {
      id: `reverse:${e.key}`,
      type: "reverse",
      skill: "grammar",
      direction: "recognize",
      card: cardId(target, "grammar", "recognize"),
      target,
      items: [...e.ids],
      concepts: [...e.concepts],
      instruction: "What does it mean?",
      prompt: { liraasa: e.liraasa, tokens: glossLine(data, e.tokens) },
      choices: rng.shuffle([
        { id: "ok", text: e.english, liraasa: false },
        ...others.map((o, i) => ({ id: `o${String(i)}`, text: o.english ?? "", liraasa: false }))
      ]),
      answer: { kind: "choice", correct: "ok" },
      source: e.key
    };
  }
  const transformSentences = (ctx, slot) => loomSentences(ctx, CLAUSE, 60).filter((e) => !slot.words.some((w) => e.ids.includes(w)));
  function exercisesForRule(ctx, id, rng, types = LOOM_TYPES) {
    const out = /* @__PURE__ */ new Map();
    const add = (type, ex) => {
      if (ex === null || !types.includes(type)) return;
      out.set(type, [...out.get(type) ?? [], ex]);
    };
    const concept = ctx.exercise.data.concepts.get(id);
    if (concept === void 0) return out;
    const sentences = loomSentences(ctx, id, 8);
    for (const e of sentences) {
      const asWeave = assemble(ctx.exercise, e, rng, id);
      add("weave", asWeave === null ? null : { ...asWeave, card: cardId(id, "grammar", "produce") });
      if (types.includes("mend")) add("mend", mend(ctx, e, rng, id));
      if (types.includes("choose")) add("choose", choose(ctx, e, rng, id));
      add("unravel", unravel(ctx, e, rng, id));
      const asTranslate = translateTo(ctx.exercise, e, id);
      add(
        "translate",
        asTranslate === null ? null : { ...asTranslate, card: cardId(id, "grammar", "produce") }
      );
      add("reverse", reverse(ctx, e, rng, id));
    }
    if (concept.kind === "slot" && concept.words.length > 0 && types.includes("transform")) {
      let made = 0;
      for (const e of rng.shuffle(transformSentences(ctx, concept))) {
        const t = transform(ctx, e, id, rng);
        if (t === null) continue;
        add("transform", t);
        made += 1;
        if (made >= 4) break;
      }
    }
    return out;
  }
  function loomSession(ctx, rules, rng, options) {
    const byType = /* @__PURE__ */ new Map();
    for (const id of rules) {
      for (const [type, list] of exercisesForRule(ctx, id, rng, options.types)) {
        byType.set(type, [...byType.get(type) ?? [], ...list]);
      }
    }
    const queues = rng.shuffle([...byType.values()].map((q) => rng.shuffle(q)));
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    while (out.length < options.length && queues.some((q) => q.length > 0)) {
      for (const q of queues) {
        const next = q.shift();
        if (next === void 0 || seen.has(next.id)) continue;
        seen.add(next.id);
        out.push(next);
        if (out.length >= options.length) break;
      }
    }
    for (let i = 1; i < out.length; i += 1) {
      if (out[i]?.source === void 0 || out[i]?.source !== out[i - 1]?.source) continue;
      const j = out.findIndex((x, k) => k > i && x.source !== out[i - 1]?.source);
      if (j < 0) break;
      const a = out[i];
      const b = out[j];
      if (a === void 0 || b === void 0) break;
      out[i] = b;
      out[j] = a;
    }
    return out;
  }
  function withPrereqs(data, id) {
    const out = [];
    const walk = (c) => {
      if (out.includes(c)) return;
      out.push(c);
      for (const p of data.concepts.get(c)?.prereqs ?? []) walk(p);
    };
    walk(id);
    return out;
  }
  const wordsOf = (line) => normalize(line).split(/\s+/).filter((w) => w !== "");
  function contentOf(link, data, line) {
    return wordsOf(line).filter((w) => {
      const l = linkWord(link, w);
      if (l.kind !== "entry") return true;
      return !l.refs.every((r) => CLOSED.has(data.items.get(r.id)?.kind ?? ""));
    });
  }
  const sameBag = (a, b) => a.length === b.length && [...a].sort().join(" ") === [...b].sort().join(" ");
  const typedOf = (ex, r) => {
    if (r.kind === "typed") return r.text;
    if (r.kind === "order" && ex.answer.kind === "order") {
      const tiles = ex.answer.tiles;
      return r.ids.map((id) => tiles.find((t) => t.id === id)?.text ?? "").join(" ");
    }
    return null;
  };
  function gradeLoom(ctx, ex, response, ms) {
    const data = ctx.exercise.data;
    const g = gradeExercise({ data, link: ctx.link }, ex, response, ms);
    const explain = (id) => {
      const why = ex.explain?.[id];
      return why === void 0 ? [] : [{ kind: "checker", message: why }];
    };
    if (g.verdict === "correct") return g;
    if (ex.type === "choose" && response.kind === "choice") {
      return { ...g, diagnoses: [...g.diagnoses, ...explain(response.id)] };
    }
    const text = typedOf(ex, response);
    const a = ex.answer;
    const reference = a.kind === "typed" ? a.accepted[0] ?? "" : a.kind === "order" ? a.correct.map((id) => a.tiles.find((t) => t.id === id)?.text ?? "").join(" ") : "";
    if (text === null || text.trim() === "" || reference === "") return g;
    if (!["assemble", "transform", "mend", "translateTo"].includes(ex.type)) return g;
    const problems = problemsOf(ctx.check, renderLine(text));
    if (problems.length === 0) {
      const mine = wordsOf(text);
      const want = wordsOf(reference);
      const sameOrder = contentOf(ctx.link, data, text).join(" ") === contentOf(ctx.link, data, reference).join(" ");
      if (sameBag(mine, want) && sameOrder) {
        return {
          verdict: "correct",
          score: 1,
          expected: reference,
          rating: 3,
          diagnoses: [
            {
              kind: "other-order",
              message: `Also right. The reference has: “${reference}”.`,
              expected: reference
            }
          ]
        };
      }
      if (ex.type === "translateTo") {
        return {
          verdict: "almost",
          score: 0.5,
          expected: reference,
          rating: 2,
          diagnoses: [
            {
              kind: "unverified",
              message: `The checker finds nothing wrong, but cannot tell whether it means the same. Compare: “${reference}”.`,
              expected: reference
            }
          ]
        };
      }
      return g;
    }
    return {
      ...g,
      // each thing said once: the checker's notes on the answer, then why the original was broken
      diagnoses: unique(
        [
          ...g.diagnoses,
          ...problems.slice(0, 2).map((p) => ({ kind: "checker", message: p.message })),
          ...ex.type === "mend" ? explain("wrong") : []
        ],
        (d) => d.message
      )
    };
  }
  function renderLine(text) {
    const t = text.trim();
    const ended = /[.!?]$/.test(t) ? t : `${t}.`;
    return ended.charAt(0).toUpperCase() + ended.slice(1);
  }
  const DAY = 864e5;
  const live = (profile) => Object.values(profile.cards).filter((c) => c.retired === void 0);
  function skyOf(profile, data, forms, now) {
    const byTarget = /* @__PURE__ */ new Map();
    for (const c of live(profile)) {
      const list = byTarget.get(c.target) ?? [];
      list.push(c);
      byTarget.set(c.target, list);
    }
    const ids = new Set(byTarget.keys());
    for (const node of Object.keys(profile.seen))
      if (node.startsWith("root:")) ids.add(node.slice(5));
    const out = [];
    for (const id of ids) {
      const item = data.items.get(id);
      if (item === void 0 || !["root", "compound", "imageCompound"].includes(item.kind)) continue;
      const cards = byTarget.get(id) ?? [];
      const mastery = cards.length === 0 ? 0 : cards.reduce((s, c) => s + cardMastery(profile, c, now), 0) / cards.length;
      const met = Math.min(profile.seen[`root:${id}`] ?? Infinity, ...cards.map((c) => c.added));
      out.push({
        id,
        spelling: item.spelling,
        meaning: item.meaning,
        theme: item.theme,
        mastery,
        irregular: forms.isIrregular(id),
        met: Number.isFinite(met) ? met : now,
        cards: cards.length
      });
    }
    return out.sort((a, b) => a.met - b.met || (a.id < b.id ? -1 : 1));
  }
  function rulesLit(profile, data, now) {
    const by = /* @__PURE__ */ new Map();
    for (const c of live(profile)) {
      if (!data.concepts.has(c.target) || c.state.reps === 0) continue;
      by.set(c.target, [...by.get(c.target) ?? [], c]);
    }
    const reviews = /* @__PURE__ */ new Map();
    for (const l of profile.log) {
      const t = profile.cards[l.card]?.target;
      if (t !== void 0 && by.has(t)) reviews.set(t, (reviews.get(t) ?? 0) + 1);
    }
    return [...by].map(([id, cards]) => ({
      id,
      title: data.concepts.get(id)?.title ?? id,
      mastery: cards.reduce((s, c) => s + cardMastery(profile, c, now), 0) / cards.length,
      reviews: reviews.get(id) ?? 0
    })).sort((a, b) => b.mastery - a.mastery || (a.id < b.id ? -1 : 1));
  }
  function streakOf(profile, now) {
    const days = new Set(profile.log.map((l) => Math.floor(l.at / DAY)));
    const today = Math.floor(now / DAY);
    let d = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
    if (d === null) return 0;
    let n = 0;
    while (days.has(d)) {
      n += 1;
      d -= 1;
    }
    return n;
  }
  function changesFor(profile, data) {
    const seen = new Set(retiredSeen(profile));
    const notes = /* @__PURE__ */ new Map();
    const add = (key, make, card) => {
      const n = notes.get(key) ?? { ...make(), cards: [] };
      n.cards.push(card);
      notes.set(key, n);
    };
    for (const c of Object.values(profile.cards)) {
      if (c.retired !== void 0) {
        if (seen.has(c.target)) continue;
        const replacement = c.retired.replacement;
        add(
          `retired|${c.target}`,
          () => ({
            kind: "retired",
            target: c.target,
            was: c.snapshot.spelling,
            ...replacement !== void 0 ? { replacement } : {},
            edition: c.retired?.edition ?? data.edition,
            cards: []
          }),
          c.id
        );
        continue;
      }
      if (c.changed === void 0) continue;
      const ch = c.changed;
      add(
        `${ch.reason}|${c.target}`,
        () => ({
          kind: ch.reason,
          target: c.target,
          was: ch.reason === "renamed" ? ch.from : c.snapshot.spelling,
          from: ch.from,
          to: ch.to,
          edition: ch.edition,
          cards: []
        }),
        c.id
      );
    }
    const order = { retired: 0, renamed: 1, rewritten: 2, reglossed: 3 };
    return [...notes.values()].sort(
      (a, b) => order[a.kind] - order[b.kind] || (a.was < b.was ? -1 : 1)
    );
  }
  const changedCards = (profile) => live(profile).filter((c) => c.changed !== void 0).map((c) => c.id);
  function retiredSeen(profile) {
    const raw = hallOf(profile).retiredSeen;
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  }
  function acknowledgeRetired(profile, targets) {
    const state = hallOf(profile);
    setHall(profile, { ...state, retiredSeen: [.../* @__PURE__ */ new Set([...retiredSeen(profile), ...targets])] });
  }
  function seedOf(seed) {
    if (typeof seed === "number") return seed >>> 0;
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i += 1) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return h >>> 0;
  }
  function createRng(seed) {
    let a = seedOf(seed);
    const next = () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const int = (n) => Math.floor(next() * n);
    return {
      next,
      int,
      pick: (list) => list.length === 0 ? void 0 : list[int(list.length)],
      shuffle: (list) => {
        const out = [...list];
        for (let i = out.length - 1; i > 0; i -= 1) {
          const j = int(i + 1);
          const tmp = out[i];
          out[i] = out[j];
          out[j] = tmp;
        }
        return out;
      }
    };
  }
  const PHRASE_SLOTS = /* @__PURE__ */ new Set(["SUBJECT", "VERB", "OBJECT", "ADJUNCTS", "TOPIC"]);
  const PAUSE = /followed by a pause|set off by a comma/i;
  const formGloss = (item, slot) => {
    const f2 = item.forms.find((x) => x.slot === slot);
    return f2?.meaningful === true ? f2.gloss : null;
  };
  function determinersOf(data) {
    const template = data.concepts.get(NOUN_PHRASE)?.description ?? "";
    const group = /\[([^\]]*\|[^\]]*)\]/.exec(template)?.[1] ?? "";
    const spellings2 = group.split("|").map((s) => s.trim()).filter((s) => /^[a-z-]+$/.test(s));
    const out = [];
    for (const sp of spellings2) {
      const it = [...data.items.values()].find((i) => i.kind === "functionWord" && i.spelling === sp);
      if (it !== void 0) out.push(it);
    }
    return out;
  }
  const pluralOf = (forms) => forms.rules.suffixes.find((s) => /^plural\b/i.test(s.meaning)) ?? null;
  function sandboxMenus(data, forms, known, perList = 60) {
    const heads = [...data.items.values()].filter((i) => i.kind === "root" || i.kind === "compound");
    const use = (id) => {
      const f2 = data.frequency.get(id);
      return f2 === void 0 ? 0 : f2.corpus * 2 + f2.examples;
    };
    const choose2 = (pool, gloss) => {
      const withGloss = pool.map((i) => ({ i, g: gloss(i) })).filter((x) => x.g !== null && x.g !== "");
      const mine = withGloss.filter((x) => known.has(x.i.id));
      const rest = withGloss.filter((x) => !known.has(x.i.id)).sort((a, b) => use(b.i.id) - use(a.i.id) || (a.i.spelling < b.i.spelling ? -1 : 1)).slice(0, Math.max(0, perList - mine.length));
      return [...mine, ...rest].map((x) => ({ id: x.i.id, spelling: x.i.spelling, meaning: x.g, known: known.has(x.i.id) })).sort((a, b) => a.spelling < b.spelling ? -1 : 1);
    };
    const slots = [...data.concepts.values()].filter((c) => c.kind === "slot" && c.slot !== void 0 && !PHRASE_SLOTS.has(c.id.slice(5))).map((c) => ({
      id: c.id,
      title: c.title,
      slot: c.slot ?? 0,
      words: c.words.map((w) => data.items.get(w)).filter((w) => w !== void 0 && w.kind === "functionWord").filter((w, i, all) => all.findIndex((x) => x.spelling === w.spelling) === i).map((w) => ({ id: w.id, spelling: w.spelling, meaning: w.meaning }))
    })).filter((m) => m.words.length > 0).sort((a, b) => a.slot - b.slot);
    return {
      pronouns: [...data.items.values()].filter((i) => i.kind === "pronoun").map((i) => ({ id: i.id, spelling: i.spelling, meaning: i.meaning, known: true })),
      nouns: choose2(heads, (i) => formGloss(i, "root")),
      verbs: choose2(heads, (i) => formGloss(i, "verb")),
      adjectives: choose2(heads, (i) => formGloss(i, "adjective")),
      determiners: determinersOf(data).map((i) => ({
        id: i.id,
        spelling: i.spelling,
        meaning: i.meaning,
        known: true
      })),
      slots,
      plural: pluralOf(forms)
    };
  }
  const slotNumber = (data, name) => data.concepts.get(slotConcept(name))?.slot ?? 0;
  function buildSandbox(data, forms, spec) {
    const placed = [];
    const rules = [
      { id: CLAUSE, title: data.concepts.get(CLAUSE)?.title ?? CLAUSE, reason: "template" }
    ];
    const rule = (id, reason, word) => {
      if (!data.concepts.has(id) || rules.some((r) => r.id === id && r.word === word)) return;
      rules.push({
        id,
        title: data.concepts.get(id)?.title ?? id,
        reason,
        ...word !== void 0 ? { word } : {}
      });
    };
    const plural = pluralOf(forms);
    const formOf2 = (id, slot) => {
      const w = forms.getForms(id, { includeUnused: true, examples: 0 });
      const f2 = w?.forms.find((x) => x.category === slot);
      if (w === null || f2 === void 0) return null;
      return {
        text: f2.form,
        gloss: f2.meaningful ? f2.gloss : w.root.gloss,
        tags: slot === "root" ? [] : [slot],
        role: "operator",
        id,
        parts: f2.parts
      };
    };
    const nounPhrase = (np, role, at) => {
      const item = data.items.get(np.id);
      if (item === void 0) return;
      let sub = 0;
      const put = (piece) => {
        placed.push({ at, sub, piece: { ...piece, role } });
        sub += 1;
      };
      if (item.kind === "pronoun") {
        put({ text: item.spelling, gloss: item.meaning, tags: [], role, id: item.id, parts: [] });
        return;
      }
      const det = np.determiner === void 0 ? void 0 : data.items.get(np.determiner);
      if (det !== void 0) {
        put({ text: det.spelling, gloss: det.meaning, tags: [], role, id: det.id, parts: [] });
        rule(NOUN_PHRASE, "noun-phrase", det.spelling);
      }
      if (np.adjective !== void 0) {
        const adj = formOf2(np.adjective, "adjective");
        if (adj !== null) {
          put(adj);
          rule(formConcept("adjective"), "form", adj.text);
          rule(NOUN_PHRASE, "noun-phrase", adj.text);
        }
      }
      const noun = formOf2(np.id, "root");
      if (noun === null) return;
      if (np.plural === true && plural !== null) {
        put({
          ...noun,
          text: noun.text + plural.spelling,
          tags: ["PL"],
          parts: [...noun.parts, { text: plural.spelling, role: "marker" }]
        });
        rule(suffixConcept(plural.spelling), "plural", noun.text + plural.spelling);
      } else {
        put(noun);
      }
    };
    if (spec.subject !== void 0) {
      nounPhrase(spec.subject, "subject", slotNumber(data, "SUBJECT"));
      rule(slotConcept("SUBJECT"), "subject");
    }
    if (spec.verb !== void 0) {
      const v = formOf2(spec.verb, "verb");
      if (v !== null) {
        placed.push({ at: slotNumber(data, "VERB"), sub: 0, piece: { ...v, role: "verb" } });
        rule(slotConcept("VERB"), "verb", v.text);
        rule(formConcept("verb"), "form", v.text);
      }
    }
    if (spec.object !== void 0) {
      nounPhrase(spec.object, "object", slotNumber(data, "OBJECT"));
      rule(slotConcept("OBJECT"), "object");
    }
    for (const [slot, id] of Object.entries(spec.ops)) {
      const c = data.concepts.get(slot);
      const w = data.items.get(id);
      if (c?.kind !== "slot" || w === void 0 || !c.words.includes(id)) continue;
      placed.push({
        at: c.slot ?? 0,
        sub: 0,
        piece: {
          text: w.spelling,
          gloss: w.meaning,
          tags: [],
          role: "operator",
          id,
          parts: [],
          // grammar.slots says the frame is "followed by a pause" (and 1.2:G24 keeps its comma)
          ...PAUSE.test(c.description) ? { after: "," } : {}
        }
      });
      rule(slot, "slot", w.spelling);
    }
    const pieces = placed.sort((a, b) => a.at - b.at || a.sub - b.sub).map((p) => p.piece);
    const question = Object.keys(spec.ops).includes(slotConcept("QUESTION"));
    const words2 = pieces.map((p) => p.text + (p.after ?? "")).join(" ");
    const line = words2 === "" ? "" : words2.charAt(0).toUpperCase() + words2.slice(1) + (question ? "?" : ".");
    return {
      pieces,
      line,
      reading: pieces.map(
        (p) => p.tags.includes("PL") && plural !== null ? `${p.gloss} (${plural.meaning.split(/[\s(]/)[0] ?? ""})` : p.gloss
      ).join(" · "),
      rules,
      incomplete: spec.verb === void 0
    };
  }
  const DRAW_ONLY = [
    "all",
    "irregular",
    "surprising",
    "missed",
    "unseen"
  ];
  const DRAW_SHAPES = ["any", "primal", "compound"];
  const DRAW_WEIGHTINGS = ["random", "weak", "new", "due"];
  const DEFAULT_DRAW = {
    count: 10,
    themes: [],
    since: [],
    shape: "any",
    senses: [],
    only: "all",
    weighting: "random"
  };
  function statsOf(profile, now) {
    const out = /* @__PURE__ */ new Map();
    for (const c of Object.values(profile.cards)) {
      if (c.retired !== void 0) continue;
      const s = out.get(c.target) ?? {
        met: true,
        mastery: 0,
        due: false,
        missed: false,
        sum: 0,
        n: 0
      };
      s.sum += cardMastery(profile, c, now);
      s.n += 1;
      s.mastery = s.sum / s.n;
      if (c.state.reps > 0 && c.state.due <= now) s.due = true;
      if (c.state.lapses > 0) s.missed = true;
      out.set(c.target, s);
    }
    for (const l of profile.log) {
      if (l.verdict === "correct") continue;
      const s = out.get(profile.cards[l.card]?.target ?? "");
      if (s !== void 0) s.missed = true;
    }
    return out;
  }
  function drawPool(ctx, options) {
    const { data, forms, profile } = ctx;
    const stats = statsOf(profile, ctx.now);
    const themes = new Set(options.themes);
    const since = new Set(options.since);
    const irregular = new Set(options.only === "irregular" ? forms.irregularIds() : []);
    const surprising = new Set(options.only === "surprising" ? forms.surprisingIds() : []);
    const out = [];
    for (const item of data.items.values()) {
      if (item.kind !== "root" && item.kind !== "compound") continue;
      if (themes.size > 0 && !themes.has(item.theme)) continue;
      if (since.size > 0 && !since.has(item.since)) continue;
      if (options.shape === "primal" && item.kind !== "root") continue;
      if (options.shape === "compound" && item.kind !== "compound") continue;
      if (!options.senses.every((s) => item.forms.some((f2) => f2.slot === s && f2.meaningful)))
        continue;
      const st = stats.get(item.id);
      const met = st !== void 0 || profile.seen[rootNode(item.id)] !== void 0;
      if (options.only === "irregular" && !irregular.has(item.id)) continue;
      if (options.only === "surprising" && !surprising.has(item.id)) continue;
      if (options.only === "missed" && st?.missed !== true) continue;
      if (options.only === "unseen" && met) continue;
      out.push(item.id);
    }
    return out.sort();
  }
  function rankOf(st, weighting, threshold) {
    switch (weighting) {
      case "weak":
        return st !== void 0 && st.mastery < threshold ? { tier: 0, weight: 1 + 4 * (1 - st.mastery) } : { tier: 1, weight: 1 };
      case "new":
        return { tier: st === void 0 ? 0 : 1, weight: 1 };
      case "due":
        return { tier: st?.due === true ? 0 : 1, weight: 1 };
      case "random":
        return { tier: 0, weight: 1 };
    }
  }
  function sample(pool, k, rank, rng) {
    return pool.map((id) => {
      const r = rank(id);
      return { id, tier: r.tier, key: -Math.log(1 - rng.next()) / r.weight };
    }).sort((a, b) => a.tier - b.tier || a.key - b.key || (a.id < b.id ? -1 : 1)).slice(0, k).map((x) => x.id);
  }
  function readDrawOptions(raw) {
    const r = typeof raw === "object" && raw !== null ? raw : {};
    const strings2 = (x) => Array.isArray(x) ? x.filter((s) => typeof s === "string") : [];
    const count = typeof r.count === "number" && Number.isInteger(r.count) ? r.count : DEFAULT_DRAW.count;
    return {
      count: Math.min(50, Math.max(1, count)),
      themes: strings2(r.themes),
      since: strings2(r.since),
      shape: DRAW_SHAPES.includes(r.shape) ? r.shape : DEFAULT_DRAW.shape,
      senses: strings2(r.senses).filter(
        (s) => FORM_SLOTS.includes(s)
      ),
      only: DRAW_ONLY.includes(r.only) ? r.only : DEFAULT_DRAW.only,
      weighting: DRAW_WEIGHTINGS.includes(r.weighting) ? r.weighting : DEFAULT_DRAW.weighting
    };
  }
  function drawStars(ctx, options, seed, keep = []) {
    const pool = drawPool(ctx, options);
    const stats = statsOf(ctx.profile, ctx.now);
    const kept = keep.filter((id) => ctx.data.items.has(id)).slice(0, options.count);
    const rest = pool.filter((id) => !kept.includes(id));
    const drawn = sample(
      rest,
      options.count - kept.length,
      (id) => rankOf(stats.get(id), options.weighting, ctx.profile.settings.threshold),
      createRng(seed)
    );
    return { seed, options, ids: [...kept, ...drawn], pinned: kept, rerolls: 0, pool: pool.length };
  }
  function rerollOne(ctx, draw, id) {
    const at = draw.ids.indexOf(id);
    if (at < 0 || draw.pinned.includes(id)) return draw;
    const pool = drawPool(ctx, draw.options).filter((p) => !draw.ids.includes(p));
    const stats = statsOf(ctx.profile, ctx.now);
    const rerolls = draw.rerolls + 1;
    const [next] = sample(
      pool,
      1,
      (p) => rankOf(stats.get(p), draw.options.weighting, ctx.profile.settings.threshold),
      createRng(`${draw.seed}|reroll|${String(rerolls)}`)
    );
    if (next === void 0) return draw;
    const ids = [...draw.ids];
    ids[at] = next;
    return { ...draw, ids, rerolls };
  }
  function rerollAll(ctx, draw) {
    const rerolls = draw.rerolls + 1;
    const next = drawStars(ctx, draw.options, `${draw.seed}|all|${String(rerolls)}`, draw.pinned);
    return { ...next, seed: draw.seed, rerolls };
  }
  function togglePin(draw, id) {
    if (!draw.ids.includes(id)) return draw;
    const pinned = draw.pinned.includes(id) ? draw.pinned.filter((p) => p !== id) : [...draw.pinned, id];
    return { ...draw, pinned };
  }
  function starsOf(profile, data, defaults) {
    const raw = hallOf(profile).stars;
    const r = typeof raw === "object" && raw !== null ? raw : {};
    const options = readDrawOptions({
      ...DEFAULT_DRAW,
      ...defaults,
      ...r.options
    });
    const retired = [];
    let draw = null;
    const d = r.draw;
    if (d !== null && d !== void 0 && typeof d.seed === "string" && Array.isArray(d.ids)) {
      const ids = d.ids.filter((id) => typeof id === "string");
      for (const id of ids) if (!data.items.has(id)) retired.push(id);
      const live2 = ids.filter((id) => data.items.has(id));
      draw = {
        seed: d.seed,
        options: readDrawOptions(d.options),
        ids: live2,
        pinned: (Array.isArray(d.pinned) ? d.pinned : []).filter(
          (id) => typeof id === "string" && live2.includes(id)
        ),
        rerolls: typeof d.rerolls === "number" ? d.rerolls : 0,
        pool: typeof d.pool === "number" ? d.pool : live2.length
      };
      if (live2.length === 0) draw = null;
    }
    const count = draw?.ids.length ?? 0;
    const index = typeof r.index === "number" ? Math.min(Math.max(0, r.index), Math.max(0, count - 1)) : 0;
    const studied = (Array.isArray(r.studied) ? r.studied : []).filter(
      (id) => typeof id === "string" && (draw?.ids.includes(id) ?? false)
    );
    return {
      state: {
        options,
        draw,
        phase: r.phase === "study" && draw !== null ? "study" : "preview",
        index,
        studied
      },
      retired
    };
  }
  function setStars(profile, state) {
    setHall(profile, { ...hallOf(profile), stars: state });
  }
  function markKnown(profile, data, graph, id, now) {
    const node = rootNode(id);
    introduce(profile, data, graph, node, now);
    for (const card of cardsForNode(data, graph, node)) {
      if ((profile.cards[card]?.state.reps ?? 0) > 0) continue;
      recordReview(profile, data, card, { verdict: "correct", rating: 4 }, "known", now);
    }
  }
  function introduceStudied(profile, data, graph, ids, now) {
    for (const id of ids) introduce(profile, data, graph, rootNode(id), now);
  }
  const REF = /\[\[([^\]]+)\]\]/g;
  function validateCurriculum(data, graph, overrides) {
    const gaps = [...data.gaps];
    const rulingRefs = new Set(
      [...data.concepts.values()].flatMap((c) => c.ruleRef !== void 0 ? [c.ruleRef] : [])
    );
    const known = (id) => data.items.has(id) || data.concepts.has(id) || rulingRefs.has(id) || graph.nodes.has(id);
    const unknown = (ref, where) => {
      gaps.push({
        severity: "error",
        code: "override-unknown-id",
        ref,
        message: `${where} names ${ref}, which is not an item, concept, ruling or node in ${data.edition}. Was it retired or cut? Its progress and notes need a new home.`
      });
    };
    for (const id of overrides.pins) if (!known(id)) unknown(id, "pins");
    for (const id of overrides.exclude) if (!data.concepts.has(id)) unknown(id, "exclude");
    for (const id of Object.keys(overrides.levels)) if (!known(id)) unknown(id, "levels");
    for (const id of Object.keys(overrides.notes)) if (!known(id)) unknown(id, "notes");
    for (const lesson of overrides.lessons) {
      for (const id of lesson.refs) if (!known(id)) unknown(id, `lesson ${lesson.id}`);
      if (lesson.after !== void 0 && !graph.nodes.has(lesson.after)) {
        unknown(lesson.after, `lesson ${lesson.id} (after)`);
      }
      for (const m of lesson.body.matchAll(REF)) {
        const id = (m[1] ?? "").trim();
        if (!known(id)) {
          gaps.push({
            severity: "error",
            code: "lesson-unknown-ref",
            ref: lesson.id,
            message: `Lesson ${lesson.id} refers to [[${id}]], which does not exist in ${data.edition}.`
          });
        }
      }
    }
    const slots = new Set(FORM_SLOTS);
    for (const key of Object.keys(overrides.formNotes ?? {})) {
      const [id = "", slot = ""] = key.split("|");
      const item = data.items.get(id);
      if (item !== void 0 && item.forms.length > 0 && slots.has(slot)) continue;
      gaps.push({
        severity: "error",
        code: "form-note-unknown",
        ref: key,
        message: `formNotes names ${key}, but ${item === void 0 ? `${id} is no entry` : item.forms.length === 0 ? `${id} has no forms` : `${slot} is not a form`} in ${data.edition}.`
      });
    }
    for (const node of graph.nodes.values()) {
      if (node.unit >= 0) continue;
      gaps.push({
        severity: "error",
        code: "node-unplaced",
        ref: node.id,
        message: `${node.id} can never unlock: its prerequisites ${node.prereqs.join(", ")} are not all placeable.`
      });
    }
    const exercised = new Set(data.examples.flatMap((e) => e.concepts));
    const excluded = new Set(overrides.exclude);
    for (const c of data.concepts.values()) {
      if (exercised.has(c.id) || excluded.has(c.id)) continue;
      gaps.push({
        severity: "warn",
        code: "concept-no-examples",
        ref: c.id,
        message: `${c.title}: no example or corpus sentence exercises it, so no exercise can be drawn. Add examples to the data (a ruling's own examples are linked to it directly).`
      });
    }
    const used = new Set(data.examples.flatMap((e) => e.ids));
    for (const item of data.items.values()) {
      if (item.kind !== "root" && item.kind !== "compound" || used.has(item.id)) continue;
      gaps.push({
        severity: "note",
        code: "root-no-examples",
        ref: item.id,
        message: `${item.spelling} (“${item.meaning}”) is in no example or text: it gets a card and form drills, but no sentence exercises.`
      });
    }
    return gaps;
  }
  function verbOf(spelling) {
    const irregular = VERB_RULE.irregular[spelling];
    if (irregular !== void 0) return irregular;
    const first = spelling[0];
    if (first === void 0) throw new Error("verbOf: empty spelling");
    if (first === "n") return spelling + VERB_RULE.nInitial;
    if (first === "s") return spelling + VERB_RULE.sInitial;
    if (isVowel(first)) return spelling + VERB_RULE.vowelInitial;
    return spelling + first + "a";
  }
  function verbClassOf(spelling) {
    if (VERB_RULE.irregular[spelling] !== void 0) return "irregular";
    const first = spelling[0];
    if (first === void 0) throw new Error("verbClassOf: empty spelling");
    if (first === "n") return "n-initial";
    if (first === "s") return "s-initial";
    if (isVowel(first)) return "vowel-initial";
    return "consonant";
  }
  function formOf(spelling, slot) {
    const suffix = SLOT_SUFFIX[slot];
    return suffix === null ? verbOf(spelling) : spelling + suffix;
  }
  function sevenForms(spelling) {
    const out = {};
    for (const slot of FORM_SLOTS) out[slot] = formOf(spelling, slot);
    return out;
  }
  FORM_SLOTS.map((s) => SLOT_RAW_KEY[s]);
  function rhymeFamilies(roots) {
    const families = /* @__PURE__ */ new Map();
    for (const w of roots) {
      const ending = w.slice(-4);
      const list = families.get(ending) ?? [];
      list.push(w);
      families.set(ending, list);
    }
    const byCodePoint = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    return [...families.keys()].sort(byCodePoint).map((ending) => {
      const members = (families.get(ending) ?? []).slice().sort(byCodePoint);
      return { ending, members, count: members.length };
    });
  }
  const lettersOf = (text = "") => (text.split("(")[0] ?? "").match(/\b[a-z]\b/g) ?? [];
  const NUMBERS = { one: 1, two: 2, three: 3, four: 4 };
  function rootTemplateProblems(lex, spelling) {
    const p = lex.phonology;
    const template = p.new_root_template ?? "";
    const vowels = new Set(lettersOf(p.vowels));
    const consonants = /* @__PURE__ */ new Set([...lettersOf(p.consonants_core), ...lettersOf(p.consonants_other)]);
    const grandfathered = [...template.matchAll(/\b([a-z]{2})-/g)].map((m) => m[1] ?? "");
    const syllables = NUMBERS[/(\w+) syllables?/.exec(template)?.[1] ?? ""];
    const w = spelling;
    const out = [];
    if (!/^[a-z]+$/.test(w)) return ["lowercase letters only"];
    const outside = [...w].filter((c) => !vowels.has(c) && !consonants.has(c));
    if (outside.length > 0)
      out.push(`letters outside the inventory: ${[...new Set(outside)].join(" ")}`);
    if (vowels.has(w[0] ?? "")) out.push("must begin with a consonant");
    if (!vowels.has(w[w.length - 1] ?? "")) out.push("must end with a vowel");
    const count = [...w].filter((c) => vowels.has(c)).length;
    if (syllables !== void 0 && count !== syllables)
      out.push(`${String(count)} syllable(s), the template wants ${String(syllables)}`);
    if (!vowels.has(w[1] ?? "") && !grandfathered.includes(w.slice(0, 2)))
      out.push(`initial cluster ${w.slice(0, 2)}`);
    for (let i = 0; i + 2 < w.length; i += 1) {
      if (![...w.slice(i, i + 3)].some((c) => vowels.has(c)))
        out.push(`three-consonant cluster ${w.slice(i, i + 3)}`);
    }
    for (let i = 0; i + 1 < w.length; i += 1)
      if (w[i] === w[i + 1]) out.push(`doubled letter ${w.slice(i, i + 2)}`);
    return out;
  }
  const distance = (a, b) => {
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      let diag = prev[0] ?? 0;
      prev[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const up = prev[j] ?? 0;
        prev[j] = Math.min(up + 1, (prev[j - 1] ?? 0) + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
        diag = up;
      }
    }
    return prev[b.length] ?? 0;
  };
  function spellings(lex, skip) {
    const out = /* @__PURE__ */ new Map();
    for (const h of lex.headwords) {
      if (skip.has(String(h.id))) continue;
      for (const f2 of Object.values(h.forms)) out.set(f2, `a form of ${h.root}`);
    }
    for (const [section, key] of [
      ["function_words", "form"],
      ["pronouns", "form"],
      ["correlatives", "form"],
      ["time_and_dates", "form"],
      ["discourse_particles", "form"]
    ]) {
      for (const row of lex[section]) {
        const v = row[key];
        if (typeof v === "string") out.set(v, `a ${section.replace(/_/g, " ")} entry`);
      }
    }
    for (const n of Object.values(lex.numbers.lookup_0_999)) out.set(n, "a number");
    return out;
  }
  function regenerate(h) {
    const forms = sevenForms(h.root);
    const out = {};
    const keyOf = new Map(FORM_SLOTS.map((s) => [SLOT_RAW_KEY[s], s]));
    for (const key of Object.keys(h.forms)) {
      const slot = keyOf.get(key);
      out[key] = slot !== void 0 ? forms[slot] : h.forms[key] ?? "";
    }
    h.forms = out;
  }
  const WORD = /[A-Za-z]+(?:-[A-Za-z]+)*/g;
  function correctText(text, mapping) {
    let changed = 0;
    const out = text.replace(WORD, (word) => {
      const lower = word.toLowerCase();
      let hit;
      let rest = "";
      if (mapping[lower] !== void 0) hit = mapping[lower];
      else {
        for (const suffix of ["tiri", "ri", "ti"]) {
          const stem = lower.slice(0, -suffix.length);
          if (lower.endsWith(suffix) && mapping[stem] !== void 0) {
            hit = mapping[stem];
            rest = suffix;
            break;
          }
        }
      }
      if (hit === void 0) return word;
      changed += 1;
      const next = hit + rest;
      return /^[A-Z]/.test(word) ? next.charAt(0).toUpperCase() + next.slice(1) : next;
    });
    return { text: out, changed };
  }
  function migrateExamples(lex, mapping) {
    const changes = [];
    const fix = (s) => {
      const r = correctText(s, mapping);
      if (r.changed > 0) changes.push({ from: s, to: r.text });
      return r.text;
    };
    for (const e of lex.examples) {
      e.liraasa = fix(e.liraasa);
      if (e.feature.startsWith("vocab:")) e.feature = correctText(e.feature, mapping).text;
    }
    const rulings = Object.entries(lex).filter(([k]) => k.startsWith("rulings_")).flatMap(([, v]) => Array.isArray(v) ? v : []);
    for (const r of rulings) {
      if (r.superseded_by !== void 0 || r.superseded_in_part !== void 0) continue;
      r.ruling = fix(r.ruling);
      const ex = r.examples;
      if (Array.isArray(ex))
        r.examples = ex.map(
          (pair) => Array.isArray(pair) ? [fix(String(pair[0])), pair[1]] : pair
        );
    }
    for (const w of lex.function_words) {
      if (typeof w.example === "string") w.example = fix(w.example);
      if (Array.isArray(w.examples))
        w.examples = w.examples.map(
          (pair) => Array.isArray(pair) ? [fix(String(pair[0])), pair[1]] : pair
        );
    }
    for (const d of lex.discourse_particles) {
      for (const e of d.examples ?? []) e.liraasa = fix(e.liraasa);
    }
    const notes = [
      ...lex.headwords,
      ...lex.image_compounds?.attested ?? []
    ];
    for (const h of notes) if (typeof h.notes === "string") h.notes = fix(h.notes);
    const canon = lex.motion_prefixes.canon;
    for (const k of Object.keys(canon)) canon[k] = fix(canon[k] ?? "");
    const kept = lex.image_compounds?.kept_as_headwords ?? {};
    for (const k of Object.keys(kept)) kept[k] = fix(kept[k] ?? "");
    return changes;
  }
  function recordMigration(lex, mapping, slots, via, kind) {
    const legacy = lex.legacy;
    for (const [key, row] of Object.entries(legacy.migration_forms)) {
      const next = mapping[row.to];
      if (next === void 0) continue;
      if (next === key) Reflect.deleteProperty(legacy.migration_forms, key);
      else row.to = next;
    }
    for (const [from, to] of Object.entries(mapping)) {
      legacy.migration_forms[from] = { to, slot: slots[from] ?? "root", via, kind };
    }
  }
  const spellingOf = (c) => (c.components ?? []).join("") + (c.suffix ?? "");
  function respellDerivations(lex, renamed, mapping, slots) {
    const table = lex.morphology.lexicalised_derivations;
    let moved = false;
    const next = {};
    for (const [word, gloss] of Object.entries(table)) {
      const m = /^(.*): ([a-z]+) \+ -([a-z]+)$/.exec(gloss);
      const base = m?.[2] ?? "";
      const to = renamed.get(base);
      if (m === null || to === void 0 || word !== base + (m[3] ?? "")) {
        next[word] = gloss;
        continue;
      }
      const spelling = to + (m[3] ?? "");
      next[spelling] = `${m[1] ?? ""}: ${to} + -${m[3] ?? ""}`;
      mapping[word] = spelling;
      slots[word] = "derivation";
      moved = true;
    }
    if (moved) lex.morphology.lexicalised_derivations = next;
  }
  function moveRoot(lex, id, spelling, components, reason, source = "Primal") {
    const heads = lex.headwords;
    const h = heads.find((x) => String(x.id) === id);
    if (h === void 0) throw new Error(`${id}: no headword has this id`);
    if (source === "Primal" && h.components !== null)
      throw new Error(`${h.root} is a compound: respell its parts`);
    if (source === "Compound" && h.components === null)
      throw new Error(`${h.root} is a primal root, not a compound`);
    const oldComponents = h.components;
    const old = h.root;
    const oldForms = { ...h.forms };
    const mapping = {};
    const slots = {};
    h.root = spelling;
    h.type = "Primal";
    h.components = null;
    regenerate(h);
    for (const [k, f2] of Object.entries(oldForms)) {
      const next = h.forms[k];
      if (next !== void 0 && next !== f2) {
        mapping[f2] = next;
        slots[f2] = k;
      }
    }
    const attested = lex.image_compounds?.attested ?? [];
    const compounds = [];
    const renamed = /* @__PURE__ */ new Map([[old, spelling]]);
    let moved = true;
    while (moved) {
      moved = false;
      for (const c of [...heads, ...attested]) {
        if (!c.components?.some((p) => renamed.has(p))) continue;
        const before = c.root;
        const beforeForms = { ...c.forms };
        c.components = c.components.map((p) => renamed.get(p) ?? p);
        c.root = spellingOf(c);
        if (c.root === before) continue;
        regenerate(c);
        renamed.set(before, c.root);
        compounds.push({ id: String(c.id), from: before, to: c.root });
        for (const [k, f2] of Object.entries(beforeForms)) {
          const next = c.forms[k];
          if (next !== void 0 && next !== f2) {
            mapping[f2] = next;
            slots[f2] = k;
          }
        }
        moved = true;
      }
    }
    respellDerivations(lex, renamed, mapping, slots);
    const legacy = lex.legacy;
    for (const row of legacy.respelled_roots) {
      if (row.old === spelling && row.new === old) row.reverted = true;
    }
    legacy.respelled_roots.push({
      old,
      new: spelling,
      ...{},
      ...oldComponents !== null ? { old_components: [...oldComponents] } : {},
      old_forms: oldForms,
      glosses: h.glosses,
      reason
    });
    recordMigration(lex, mapping, slots, old, "respelled");
    const examples = migrateExamples(lex, mapping);
    lex.rhyme_families = rhymeFamilies(heads.map((x) => x.root));
    const from = verbClassOf(old);
    const to = verbClassOf(spelling);
    return { forms: mapping, compounds, verbClass: from === to ? null : { from, to }, examples };
  }
  function respellRootInPlace(lex, id, spelling, reason) {
    return moveRoot(lex, id, spelling, null, reason);
  }
  function respellRoot(raw, id, spelling, reason) {
    const s = spelling.trim().toLowerCase();
    const heads = raw.headwords;
    const h = heads.find((x) => String(x.id) === id);
    if (h === void 0) return { ok: false, problems: [`${id}: no headword has this id`] };
    if (h.components !== null)
      return { ok: false, problems: [`${h.root} is a compound: respell its parts`] };
    if (reason.trim() === "") return { ok: false, problems: ["a change needs a reason"] };
    if (s === h.root) return { ok: false, problems: ["that is already its spelling"] };
    const problems = rootTemplateProblems(raw, s);
    const lex = structuredClone(raw);
    let impact;
    try {
      impact = respellRootInPlace(lex, id, s, reason);
    } catch (e) {
      return { ok: false, problems: [...problems, e.message] };
    }
    const moved = /* @__PURE__ */ new Set([id, ...impact.compounds.map((c) => c.id)]);
    const taken = spellings(raw, moved);
    for (const f2 of Object.values(impact.forms)) {
      const owner = taken.get(f2);
      if (owner !== void 0) problems.push(`${f2} collides with ${owner}`);
    }
    const declared = (raw.phonology?.declared_distance_1_pairs ?? []).flat();
    for (const [word, owner] of taken) {
      if (word.includes("-") || declared.includes(s)) continue;
      if (Math.abs(word.length - s.length) <= 1 && word !== s && distance(word, s) < 2) {
        problems.push(`${s} is one edit from ${word} (${owner})`);
      }
    }
    if (problems.length > 0) return { ok: false, problems: [...new Set(problems)] };
    return { ok: true, lexicon: lex, impact };
  }
  function retireRootInPlace(lex, id, replacementId, reason) {
    const heads = lex.headwords;
    const index = heads.findIndex((x) => String(x.id) === id);
    const h = heads[index];
    const rep = heads.find((x) => String(x.id) === replacementId);
    if (h === void 0) throw new Error(`${id}: no headword has this id`);
    if (rep === void 0) throw new Error(`${replacementId}: no headword has this id`);
    if (rep === h) throw new Error("a root cannot replace itself");
    const users = heads.filter((c) => c.components?.includes(h.root) === true);
    if (users.length > 0) {
      throw new Error(
        `${h.root} is a part of ${users.map((u) => u.root).join(", ")}: rebuild or retire those first`
      );
    }
    const mapping = {};
    const slots = {};
    for (const [k, f2] of Object.entries(h.forms)) {
      const to = rep.forms[k];
      if (to !== void 0) {
        mapping[f2] = to;
        slots[f2] = k;
      }
    }
    heads.splice(index, 1);
    const legacy = lex.legacy;
    legacy.retired_roots.push({
      old: h.root,
      replacement: rep.root,
      components: rep.components,
      old_forms: h.forms,
      old_glosses: h.glosses,
      new_forms: rep.forms,
      new_glosses: rep.glosses,
      reason
    });
    recordMigration(lex, mapping, slots, h.root, "retired");
    const examples = migrateExamples(lex, mapping);
    lex.rhyme_families = rhymeFamilies(heads.map((x) => x.root));
    return { forms: mapping, compounds: [], verbClass: null, examples };
  }
  function retireRoot(raw, id, replacementId, reason) {
    if (reason.trim() === "") return { ok: false, problems: ["a change needs a reason"] };
    const lex = structuredClone(raw);
    try {
      return { ok: true, lexicon: lex, impact: retireRootInPlace(lex, id, replacementId, reason) };
    } catch (e) {
      return { ok: false, problems: [e.message] };
    }
  }
  exports.AUDIO_DIR = AUDIO_DIR;
  exports.CLAUSE = CLAUSE;
  exports.COMPOUND = COMPOUND;
  exports.DEFAULT_DRAW = DEFAULT_DRAW;
  exports.DEFAULT_GRAPH_OPTIONS = DEFAULT_GRAPH_OPTIONS;
  exports.DEFAULT_HALL_SETTINGS = DEFAULT_HALL_SETTINGS;
  exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  exports.DRAW_ONLY = DRAW_ONLY;
  exports.DRAW_SHAPES = DRAW_SHAPES;
  exports.DRAW_WEIGHTINGS = DRAW_WEIGHTINGS;
  exports.DRILL_LENGTHS = DRILL_LENGTHS;
  exports.DRILL_MODES = DRILL_MODES;
  exports.EMPTY_OVERRIDES = EMPTY_OVERRIDES;
  exports.EXERCISE_TYPES = EXERCISE_TYPES;
  exports.FORM_SLOTS = FORM_SLOTS;
  exports.FSRS_WEIGHTS = FSRS_WEIGHTS;
  exports.HALL_SCHEMA = HALL_SCHEMA;
  exports.HALL_SETTING_VALUES = HALL_SETTING_VALUES;
  exports.HallError = HallError;
  exports.LINE_ALIGNED_SHARE = LINE_ALIGNED_SHARE;
  exports.LOOM_LENGTHS = LOOM_LENGTHS;
  exports.LOOM_TYPES = LOOM_TYPES;
  exports.MISLABELLED_SHARE = MISLABELLED_SHARE;
  exports.MOTION = MOTION;
  exports.NOUN_PHRASE = NOUN_PHRASE;
  exports.NUMBERS = NUMBERS$1;
  exports.OverridesError = OverridesError;
  exports.PATTERN_MIN = PATTERN_MIN;
  exports.PROGRESS_SCHEMA = PROGRESS_SCHEMA;
  exports.ProgressError = ProgressError;
  exports.STAR_COUNTS = STAR_COUNTS;
  exports.VERB_CLASSES = VERB_CLASSES;
  exports.acknowledgeRetired = acknowledgeRetired;
  exports.activeProfile = activeProfile;
  exports.activity = activity;
  exports.assemble = assemble;
  exports.audioCoverage = audioCoverage;
  exports.buildLearnData = buildLearnData;
  exports.buildLearnSource = buildLearnSource;
  exports.buildSandbox = buildSandbox;
  exports.buildSkillGraph = buildSkillGraph;
  exports.candidateExamples = candidateExamples;
  exports.cardId = cardId;
  exports.cardMastery = cardMastery;
  exports.cardsForNode = cardsForNode;
  exports.changedCards = changedCards;
  exports.changesFor = changesFor;
  exports.checkCourseAnswer = checkCourseAnswer;
  exports.choose = choose;
  exports.cloze = cloze;
  exports.compoundBuild = compoundBuild;
  exports.conceptNode = conceptNode;
  exports.correctText = correctText;
  exports.courseLessons = courseLessons;
  exports.courseNext = courseNext;
  exports.courseStudied = courseStudied;
  exports.createFormsEngine = createFormsEngine;
  exports.createProfile = createProfile;
  exports.createRng = createRng;
  exports.createStore = createStore;
  exports.dailyQueue = dailyQueue;
  exports.decompose = decompose;
  exports.deriveConcepts = deriveConcepts;
  exports.diffIsEmpty = diffIsEmpty;
  exports.diffSnapshots = diffSnapshots;
  exports.distractorItems = distractorItems;
  exports.drawPool = drawPool;
  exports.drawStars = drawStars;
  exports.drillResults = drillResults;
  exports.editDistance = editDistance;
  exports.englishContent = englishContent;
  exports.ensureCard = ensureCard;
  exports.exerciseForCard = exerciseForCard;
  exports.exercisesForNode = exercisesForNode;
  exports.exercisesForRule = exercisesForRule;
  exports.explainer = explainer;
  exports.exportStore = exportStore;
  exports.forecast = forecast;
  exports.formBuild = formBuild;
  exports.formConcept = formConcept;
  exports.formIdentify = formIdentify;
  exports.formMatch = formMatch;
  exports.fsrs = fsrs;
  exports.glossLine = glossLine;
  exports.glossToken = glossToken;
  exports.gradeEnglish = gradeEnglish;
  exports.gradeExercise = gradeExercise;
  exports.gradeLoom = gradeLoom;
  exports.gradeSentence = gradeSentence;
  exports.gradeStars = gradeStars;
  exports.greeting = greeting;
  exports.hallOf = hallOf;
  exports.hallSummary = hallSummary;
  exports.humanize = humanize;
  exports.idsNamedBy = idsNamedBy;
  exports.idsOf = idsOf;
  exports.importStore = importStore;
  exports.introduce = introduce;
  exports.introduceStudied = introduceStudied;
  exports.isUnlocked = isUnlocked;
  exports.leeches = leeches;
  exports.linkLine = linkLine;
  exports.linkWord = linkWord;
  exports.linkedShare = linkedShare;
  exports.listen = listen;
  exports.loomSentences = loomSentences;
  exports.loomSession = loomSession;
  exports.markKnown = markKnown;
  exports.masteryByConcept = masteryByConcept;
  exports.masteryByTheme = masteryByTheme;
  exports.matching = matching;
  exports.mend = mend;
  exports.migrateStore = migrateStore;
  exports.mixedSession = mixedSession;
  exports.mutants = mutants;
  exports.nodeAvailable = nodeAvailable;
  exports.nodeMastery = nodeMastery;
  exports.normalize = normalize;
  exports.parseOverrides = parseOverrides;
  exports.patternNode = patternNode;
  exports.problemsOf = problemsOf;
  exports.readAudioManifest = readAudioManifest;
  exports.readCorpus = readCorpus;
  exports.readDrawOptions = readDrawOptions;
  exports.readFormRules = readFormRules;
  exports.readHallSettings = readHallSettings;
  exports.reading = reading;
  exports.recall = recall;
  exports.recognition = recognition;
  exports.reconcile = reconcile;
  exports.recordCheckpoint = recordCheckpoint;
  exports.recordReview = recordReview;
  exports.recordVisit = recordVisit;
  exports.renderSentence = renderSentence;
  exports.rerollAll = rerollAll;
  exports.rerollOne = rerollOne;
  exports.respellRoot = respellRoot;
  exports.retireRoot = retireRoot;
  exports.reverse = reverse;
  exports.rootCard = rootCard;
  exports.rootNode = rootNode;
  exports.rootTemplateProblems = rootTemplateProblems;
  exports.ruleCard = ruleCard;
  exports.ruleForm = ruleForm;
  exports.ruleMap = ruleMap;
  exports.rulesLit = rulesLit;
  exports.rulingConcept = rulingConcept;
  exports.sandboxMenus = sandboxMenus;
  exports.schedulerFor = schedulerFor;
  exports.seedOf = seedOf;
  exports.seriousProblems = seriousProblems;
  exports.setCourseStudied = setCourseStudied;
  exports.setHall = setHall;
  exports.setStars = setStars;
  exports.skyOf = skyOf;
  exports.slotConcept = slotConcept;
  exports.sm2 = sm2;
  exports.snapshotEdition = snapshotEdition;
  exports.spotPattern = spotPattern;
  exports.starsDrill = starsDrill;
  exports.starsOf = starsOf;
  exports.streakOf = streakOf;
  exports.suffixConcept = suffixConcept;
  exports.textKey = textKey;
  exports.togglePin = togglePin;
  exports.transform = transform;
  exports.translateFrom = translateFrom;
  exports.translateTo = translateTo;
  exports.typoBudget = typoBudget;
  exports.unique = unique;
  exports.unitLesson = unitLesson;
  exports.unitOpen = unitOpen;
  exports.unravel = unravel;
  exports.updateHallSettings = updateHallSettings;
  exports.usagesOf = usagesOf;
  exports.validateCurriculum = validateCurriculum;
  exports.verbClassFor = verbClassFor;
  exports.weakest = weakest;
  exports.withPrereqs = withPrereqs;
  exports.words = words$1;
  exports.writingNodes = writingNodes;
  exports.writingToCorpusFile = writingToCorpusFile;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  return exports;
}({});
