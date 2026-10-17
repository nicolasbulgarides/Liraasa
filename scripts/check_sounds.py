#!/usr/bin/env python3
"""Sound-collision checker for proposed Liraasa words.

    python scripts/check_sounds.py LEXICON.json [--candidates CANDIDATES.json]
                                   [--audit] [--json REPORT.json]

Standard library only. It never writes the lexicon.

A candidate is {"concept", "spelling", "kind"}, where kind is one of root,
function_word, compound or derivation. Optional keys: "domain" (for the
singability check), "components" (a compound's two headwords) and
"base"/"suffix" (a derivation's stem and suffix; inferred when absent). The
candidates file is either a list of candidates or {"candidates": [...]}.

Two inventories are built from the lexicon:

  ACTIVE    every spelling a reader can meet today: the seven forms of every
            headword, the lexicalised derivations, function words, pronouns,
            correlatives, numerals, time words, colour shades, discourse
            particles and the curated motion-prefix metaphors.
  RESERVED  every retired or respelled spelling (legacy.migration_forms and
            the old forms of legacy.retired_roots / respelled_roots) and every
            sound_ledger entry. All are reserved until at least 2.0.

Five checks run on each candidate; ERROR blocks, WARN is reported:

  1 template      new_root_template / function_word_template          ERROR
  2 collision     the full paradigm against ACTIVE, RESERVED and
                  every other candidate's paradigm                     ERROR
  3 distance      a root or function word within one edit of an
                  ACTIVE or RESERVED word is an ERROR (validate.py
                  check 18 counts reserved spellings too); any other generated form
                  one edit from an ACTIVE word is a WARN. Pairs in
                  phonology.declared_distance_1_pairs are exempt.
  4 parse         the guide's word-index procedure, run with and
                  without the candidate: an existing word that reads
                  differently, a compound that gains a second split,
                  or a candidate form that strips to a known stem      ERROR
  5 singability   same first syllable and vowel pattern as a word in
                  the same domain; the rhyme families its forms join   WARN

--audit runs the same checks over the lexicon's own headwords and function
words and reports what it finds. It changes nothing.

The exit status is 1 when any candidate has an ERROR (in --audit mode, when
any pre-existing ERROR is found), else 0.
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
from dataclasses import dataclass, field

# ----------------------------------------------------------------- phonology
# Mirrors the lexicon's `phonology` block and data/source/liraasa_core.py.

VOWELS = set("aeiou")
CONSONANTS = set("lmnrsvy") | set("bdptghzkcfj")
GRANDFATHERED_CLUSTERS = ("kr", "tr")
CONSONANT_FINAL_EXEMPT = ("amor", "apok")
RESTRICTED_DIGRAPHS = ("sh", "ch")  # colour and number words only

FORM_KEYS = (
    "root",
    "ascended",
    "negative",
    "verb",
    "negative_adjective",
    "adjective",
    "ascended_adjective",
)
DERIVATIONS = ("yo", "vu", "pago")
# ROOT + (one form OR one derivation) + -ti + -ri  (morphology.suffix_order)
INFLECTIONS = ("", "ti", "ri", "tiri")


def verb_of(word: str) -> str:
    """The 1.0 verb rule. Only the first letter decides; opi is irregular."""
    if word == "opi":
        return "opioa"
    first = word[0]
    if first == "n":
        return word + "nia"
    if first == "s":
        return word + "sia"
    if first in VOWELS:
        return word + "a"
    return word + first + "a"


def seven_forms(word: str) -> dict[str, str]:
    return {
        "root": word,
        "ascended": word + "asa",
        "negative": word + "na",
        "verb": verb_of(word),
        "negative_adjective": word + "nasan",
        "adjective": word + "san",
        "ascended_adjective": word + "asasan",
    }


def syllabify(word: str) -> list[str]:
    """Every vowel is a nucleus; adjacent vowels are separate syllables.

    Between two nuclei a single consonant opens the next syllable and a
    cluster gives its last consonant to it (dor-va-a-sa, tal-be), except a
    grandfathered kr/tr, which stays whole. The count is the vowel count.
    """
    w = word.lower()
    nuclei = [i for i, ch in enumerate(w) if ch in VOWELS]
    if not nuclei:
        return [w]
    cuts = []
    for a, b in zip(nuclei, nuclei[1:]):
        cluster = w[a + 1 : b]
        if len(cluster) <= 1:
            cuts.append(a + 1)
        elif cluster[-2:] in GRANDFATHERED_CLUSTERS:
            cuts.append(b - 2)
        else:
            cuts.append(b - 1)
    bounds = [0] + cuts + [len(w)]
    return [w[x:y] for x, y in zip(bounds, bounds[1:])]


def syllable_count(word: str) -> int:
    return sum(1 for ch in word.lower() if ch in VOWELS)


def stressed(word: str) -> str:
    """Syllables with the penultimate in capitals: lu-MI-na."""
    syl = syllabify(word)
    i = max(len(syl) - 2, 0)
    return "-".join(s.upper() if j == i else s for j, s in enumerate(syl))


def vowel_pattern(word: str) -> str:
    return "".join(ch for ch in word if ch in VOWELS)


def edit_distance(a: str, b: str, cap: int | None = None) -> int:
    if a == b:
        return 0
    if cap is not None and abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i]
        for j in range(1, len(b) + 1):
            cur.append(
                min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] != b[j - 1]))
            )
        if cap is not None and min(cur) > cap:
            return cap + 1
        prev = cur
    return prev[-1]


def shape_problems(
    word: str,
    min_syl: int,
    max_syl: int,
    consonant_initial: bool,
    allow_grandfathered: bool,
    any_doubled: bool,
) -> list[str]:
    """Phonotactic problems shared by the root and function-word templates."""
    w = word.lower()
    if not w:
        return ["empty"]
    problems = []
    n = syllable_count(w)
    if n < min_syl or n > max_syl:
        want = str(min_syl) if min_syl == max_syl else f"{min_syl}-{max_syl}"
        problems.append(f"{n} syllable(s), template wants {want}")
    for ch in sorted(set(w)):
        if ch not in VOWELS and ch not in CONSONANTS:
            problems.append(f"letter {ch!r} outside the inventory")
    for dg in RESTRICTED_DIGRAPHS:
        if dg in w:
            problems.append(f"{dg!r} is only for colour and number words")
    if consonant_initial and w[0] not in CONSONANTS:
        problems.append("not consonant-initial")
    if w[-1] not in VOWELS and not w.endswith(CONSONANT_FINAL_EXEMPT):
        problems.append("not vowel-final")
    if len(w) > 1 and w[0] in CONSONANTS and w[1] in CONSONANTS:
        if not (allow_grandfathered and w.startswith(GRANDFATHERED_CLUSTERS)):
            note = " (kr-, tr- are grandfathered, not open to new roots)" if w.startswith(GRANDFATHERED_CLUSTERS) else ""
            problems.append(f"initial cluster {w[:2]!r}{note}")
    for i in range(len(w) - 2):
        if all(c in CONSONANTS for c in w[i : i + 3]):
            problems.append(f"three-consonant cluster {w[i:i+3]!r}")
    for i in range(len(w) - 1):
        if w[i] == w[i + 1] and (any_doubled or w[i] not in VOWELS):
            problems.append(f"doubled letter {w[i:i+2]!r}")
    return problems


def root_template(word: str, audit: bool = False) -> list[str]:
    """phonology.new_root_template. In audit mode kr-/tr- are grandfathered."""
    return shape_problems(word, 2, 2, True, allow_grandfathered=audit, any_doubled=not audit)


def function_word_template(word: str) -> list[str]:
    """phonology.function_word_template; hyphenated particles part by part."""
    parts = [p for p in word.split("-") if p] if "-" in word else [word]
    out = []
    for part in parts:
        for prob in shape_problems(part, 1, 3, False, allow_grandfathered=True, any_doubled=False):
            out.append(f"{part}: {prob}" if len(parts) > 1 else prob)
    return out


# ------------------------------------------------------------- distance index


class NearIndex:
    """Finds every word exactly one edit from a query without a full scan."""

    def __init__(self, words) -> None:
        self.words = set(words)
        self.by_sub: dict[tuple[int, str], set[str]] = collections.defaultdict(set)
        self.by_del: dict[str, set[str]] = collections.defaultdict(set)
        for w in self.words:
            for i in range(len(w)):
                d = w[:i] + w[i + 1 :]
                self.by_sub[(i, d)].add(w)
                self.by_del[d].add(w)

    def within_one(self, q: str) -> set[str]:
        out: set[str] = set()
        for i in range(len(q)):
            d = q[:i] + q[i + 1 :]
            out |= self.by_sub.get((i, d), set())  # substitution
            if d in self.words:  # q has one letter more
                out.add(d)
        out |= self.by_del.get(q, set())  # q has one letter fewer
        out.discard(q)
        return out


# ---------------------------------------------------------------- inventories


@dataclass
class Lexicon:
    """The lexicon, indexed the way the guide's word-index procedure reads it."""

    raw: dict
    heads: dict[str, dict] = field(default_factory=dict)
    form_refs: dict[str, list[tuple[str, str]]] = field(default_factory=lambda: collections.defaultdict(list))
    closed: dict[str, str] = field(default_factory=dict)
    deriv: dict[str, tuple[str, str]] = field(default_factory=dict)
    numerals: set[str] = field(default_factory=set)
    legacy: dict[str, str] = field(default_factory=dict)
    motion_prefixes: list[str] = field(default_factory=list)
    active: dict[str, set[str]] = field(default_factory=lambda: collections.defaultdict(set))
    reserved: dict[str, set[str]] = field(default_factory=lambda: collections.defaultdict(set))
    declared: set[tuple[str, str]] = field(default_factory=set)
    rhyme: dict[str, list[str]] = field(default_factory=dict)

    @classmethod
    def load(cls, path: str) -> "Lexicon":
        with open(path, encoding="utf-8") as f:
            return cls.build(json.load(f))

    @classmethod
    def build(cls, raw: dict) -> "Lexicon":
        lx = cls(raw)
        lx.declared = {tuple(sorted(p)) for p in raw["phonology"]["declared_distance_1_pairs"]}
        lx.motion_prefixes = [p.rstrip("-") for p in raw.get("motion_prefixes", {}).get("canon", {})]
        for h in raw["headwords"]:
            lx.add_headword(h["root"], h["forms"], h.get("type", "Primal"), h.get("components"), h.get("domain"))
        for spelling, gloss in raw["morphology"].get("lexicalised_derivations", {}).items():
            lx.active[spelling].add(f"lexicalised derivation ({gloss.split(':')[0]})")

        def closed(form: str, kind: str) -> None:
            for tok in form.split():
                if tok.startswith("-") or not tok:
                    continue
                lx.closed.setdefault(tok, kind)
                lx.active[tok].add(kind)

        for w in raw.get("function_words", []):
            closed(w["form"], "function word")
        for w in raw.get("pronouns", []):
            closed(w["form"], "pronoun")
            lx.closed[w["form"]] = "pronoun"
        for w in raw.get("correlatives", []):
            closed(w["form"], "correlative")
        for w in raw.get("time_and_dates", []):
            closed(w["form"], "time word")
        for w in raw.get("discourse_particles", []):
            closed(w["form"], "discourse particle")
        for c in raw.get("colors", []):
            for key, value in c.items():
                if key in ("Family", "Example meanings / notes") or not isinstance(value, str):
                    continue
                closed(value, "colour")
        numbers = raw.get("numbers", {})
        for v in numbers.get("lookup_0_999", {}).values():
            lx.numerals.add(v)
        for r in numbers.get("rules", []):
            if r.get("Group") == "Scale":
                lx.numerals.add(r["Liraasa"])
        for v in sorted(lx.numerals):
            lx.closed.setdefault(v, "numeral")
            lx.active[v].add("numeral")
            lx.active[v + "-ne"].add("ordinal")
        for rule in raw.get("motion_prefixes", {}).get("canon", {}).values():
            marker = "curated metaphors:" if "curated metaphors:" in rule else "curated metaphor:"
            if marker in rule:
                listed = rule.split(marker)[1].split(")")[0]
                for m in listed.split(","):
                    lx.active[m.strip()].add("curated motion metaphor")

        legacy = raw.get("legacy", {})
        for old, m in legacy.get("migration_forms", {}).items():
            lx.legacy[old] = m["to"]
            lx.reserved[old].add(f"legacy {m['kind']} → {m['to']}")
        for r in legacy.get("retired_roots", []):
            for f in (r.get("old_forms") or {}).values():
                lx.reserved[f].add(f"retired root {r['old']}")
        for r in legacy.get("respelled_roots", []):
            for f in (r.get("old_forms") or {}).values():
                lx.reserved[f].add(f"respelled root {r['old']} → {r['new']}")
        for r in legacy.get("retired_compounds", []):
            lx.reserved[r["old"]].add(f"retired compound → {r.get('new')}")
        for s in raw.get("sound_ledger", []):
            lx.reserved[s["spelling"]].add(f"sound ledger {s['state']} (reusable from {s['reusable_from']})")

        for fam in raw.get("rhyme_families", []):
            lx.rhyme[fam["ending"]] = fam["members"]
        return lx

    def is_declared(self, x: str, y: str) -> bool:
        """A declared distance-1 pair, or two words built on one by the same suffix."""
        for a, b in self.declared:
            for p, q in ((a, b), (b, a)):
                if x.startswith(p) and y.startswith(q) and x[len(p) :] == y[len(q) :]:
                    return True
        return False

    def add_headword(self, root, forms, type_="Primal", components=None, domain=None) -> None:
        self.heads[root] = {"root": root, "forms": forms, "type": type_, "components": components, "domain": domain}
        for slot, f in forms.items():
            self.form_refs[f].append((root, slot))
            self.active[f].add(f"{root} ({slot})")
        for d in DERIVATIONS:
            if root == "mavo" and d == "pago":
                continue  # blocked by morphology: mavopago is only "society"
            self.deriv.setdefault(root + d, (root, d))

    def copy_with(self, candidates: list["Candidate"]) -> "Lexicon":
        """A shallow-copied index with the candidates added as readers would see them."""
        lx = Lexicon(
            self.raw,
            dict(self.heads),
            collections.defaultdict(list, {k: list(v) for k, v in self.form_refs.items()}),
            dict(self.closed),
            dict(self.deriv),
            set(self.numerals),
            dict(self.legacy),
            list(self.motion_prefixes),
            collections.defaultdict(set, {k: set(v) for k, v in self.active.items()}),
            self.reserved,
            self.declared,
            self.rhyme,
        )
        for c in candidates:
            if c.kind in ("root", "compound"):
                lx.add_headword(c.spelling, seven_forms(c.spelling), "Compound" if c.kind == "compound" else "Primal", c.components)
            elif c.kind == "function_word":
                lx.closed.setdefault(c.spelling, "function word")
            elif c.kind == "derivation" and c.base:
                lx.deriv.setdefault(c.spelling, (c.base, c.suffix or ""))
        return lx

    # ------------------------------------------------- the word-index procedure

    def known_stem(self, s: str) -> bool:
        return s in self.form_refs or s in self.deriv or s in self.closed

    def parse(self, w: str):
        """The guide's order: exact form, closed class, numeral, derivation,
        suffix stripping, motion prefix, fraction, legacy. Returns a hashable
        reading, or None for "not a word of Liraasa". Names are not modelled."""
        if w in self.form_refs:
            return ("lexical", tuple(sorted(self.form_refs[w])), ())
        if w in self.closed:
            return (self.closed[w], w, ())
        body = w[:-3] if w.endswith("-ne") else w
        parts = body.split("-")
        if parts and all(p in self.numerals for p in parts):
            return ("numeral", w, ())
        if w in self.deriv:
            return ("derivation", self.deriv[w], ())
        stem, sfx = w, []
        if stem.endswith("ri") and len(stem) > 4:
            stem, sfx = stem[:-2], ["ri"]
            if not self.known_stem(stem) and stem.endswith("ti") and len(stem) > 4:
                if self.known_stem(stem[:-2]):
                    stem, sfx = stem[:-2], ["ti", "ri"]
        elif stem.endswith("ti") and len(stem) > 4:
            stem, sfx = stem[:-2], ["ti"]
        if sfx:
            if stem in self.form_refs:
                return ("lexical", tuple(sorted(self.form_refs[stem])), tuple(sfx))
            if stem in self.deriv:
                return ("derivation", self.deriv[stem], tuple(sfx))
            if stem in self.closed:
                return (self.closed[stem], stem, tuple(sfx))
        for p in self.motion_prefixes:
            for pre in (p + "-", p):
                if w.startswith(pre):
                    refs = [r for r in self.form_refs.get(w[len(pre) :], []) if r[1] == "verb"]
                    if refs:
                        return ("motion", (pre, tuple(sorted(refs))), ())
        if "-de-" in w:
            left, right = w.split("-de-", 1)
            if left in self.numerals and right in self.numerals:
                return ("fraction", w, ())
        if w in self.legacy:
            return ("legacy", self.legacy[w], ())
        return None

    def segmentations(self, word: str) -> list[tuple[str, str]]:
        """Every split of `word` into two headword spellings (validate.py check 17)."""
        return [(word[:i], word[i:]) for i in range(2, len(word) - 1) if word[:i] in self.heads and word[i:] in self.heads]


def describe(reading) -> str:
    if reading is None:
        return "not a word"
    kind, what, sfx = reading
    tail = "".join(f" + -{s}" for s in sfx)
    if kind == "lexical":
        return " / ".join(f"{r} ({s})" for r, s in what) + tail
    if kind == "derivation":
        return f"{what[0]} + -{what[1]}{tail}"
    if kind == "motion":
        return f"{what[0]} + " + " / ".join(f"{r} (verb)" for r, _ in what[1])
    return f"{kind} {what}{tail}"


# ----------------------------------------------------------------- candidates


@dataclass
class Candidate:
    concept: str
    spelling: str
    kind: str
    domain: str | None = None
    components: list[str] | None = None
    base: str | None = None
    suffix: str | None = None

    @classmethod
    def from_json(cls, d: dict) -> "Candidate":
        kind = d.get("kind", "root")
        if kind not in ("root", "function_word", "compound", "derivation"):
            raise ValueError(f"{d.get('spelling')}: unknown kind {kind!r}")
        return cls(
            d.get("concept", ""),
            d["spelling"].strip().lower(),
            kind,
            d.get("domain"),
            d.get("components"),
            d.get("base"),
            d.get("suffix"),
        )


@dataclass
class Finding:
    check: int
    severity: str  # ERROR | WARN | INFO
    message: str

    def as_json(self) -> dict:
        return {"check": self.check, "severity": self.severity, "message": self.message}


def paradigm(c: Candidate) -> dict[str, str]:
    """Every form a reader can build: form -> how it was built."""
    out: dict[str, str] = {}
    if c.kind == "function_word":
        return {c.spelling: "function word"}
    if c.kind == "derivation":
        bases = {c.spelling: "derivation"}
    else:
        bases = {f: slot for slot, f in seven_forms(c.spelling).items()}
        for d in DERIVATIONS:
            if not (c.spelling == "mavo" and d == "pago"):
                bases[c.spelling + d] = f"-{d}"
    for base, how in bases.items():
        for inf in INFLECTIONS:
            if inf.startswith("ti") and base.endswith("ti") and c.kind == "derivation" and c.suffix == "ti":
                continue  # a -ti derivation takes -ri only
            out.setdefault(base + inf, how + "".join(f" + -{s}" for s in (["ti", "ri"] if inf == "tiri" else [inf] if inf else [])))
    return out


def resolve_derivation(c: Candidate, lx: Lexicon, others: list[Candidate]) -> list[Finding]:
    """Infer base and suffix; check the suffix order (ROOT + derivation + -ti + -ri)."""
    findings: list[Finding] = []
    stems = set(lx.heads) | {o.spelling for o in others if o.kind in ("root", "compound")}
    if c.base is None:
        for suf in ("pago", "yo", "vu", "ti"):
            if c.spelling.endswith(suf) and c.spelling[: -len(suf)]:
                c.base, c.suffix = c.spelling[: -len(suf)], suf
                if c.base in stems:
                    break
        else:
            findings.append(Finding(4, "ERROR", "does not end in -yo, -vu, -pago or -ti"))
            return findings
    if c.base + (c.suffix or "") != c.spelling:
        findings.append(Finding(4, "ERROR", f"base {c.base!r} + suffix {c.suffix!r} is not {c.spelling!r}"))
    if c.base in stems:
        head = lx.heads.get(c.base)
        if head and head["type"] == "Compound":
            findings.append(Finding(4, "INFO", f"derivation on a compound ({'+'.join(head['components'] or [])}), as tisebitivu is"))
        if c.base == "mavo" and c.suffix == "pago":
            findings.append(Finding(4, "ERROR", "mavo + -pago is blocked: mavopago means only society"))
        return findings
    owners = lx.form_refs.get(c.base, [])
    if owners:
        where = ", ".join(f"{r} ({s})" for r, s in owners)
        findings.append(Finding(4, "ERROR", f"suffix order: -{c.suffix} attaches to the root, but {c.base!r} is a form of {where}"))
    elif c.base.endswith(DERIVATIONS) and c.suffix == "ti":
        findings.append(Finding(4, "INFO", f"{c.base!r} is itself a derivation; ROOT + derivation + -ti is in order"))
    else:
        findings.append(Finding(4, "ERROR", f"base {c.base!r} is not a headword"))
    return findings


def check_candidates(lx: Lexicon, cands: list[Candidate], audit_self: str | None = None) -> dict[str, list[Finding]]:
    """Run the five checks. `audit_self` names a headword being audited, whose
    own forms are excluded from the inventories it is compared against."""
    results: dict[str, list[Finding]] = {c.spelling: [] for c in cands}
    paradigms = {c.spelling: paradigm(c) for c in cands}
    for c in cands:
        if c.kind == "derivation":
            results[c.spelling] += resolve_derivation(c, lx, [o for o in cands if o is not c])
        if c.kind == "compound" and not c.components:
            others = {o.spelling for o in cands if o.kind in ("root", "compound") and o is not c}
            heads = set(lx.heads) | others
            splits = [(c.spelling[:i], c.spelling[i:]) for i in range(2, len(c.spelling) - 1) if c.spelling[:i] in heads and c.spelling[i:] in heads]
            if splits:
                c.components = list(splits[0])
    aug = lx.copy_with(cands)
    near = NearIndex(lx.active)
    near_reserved = NearIndex(lx.reserved)

    own: set[str] = set()
    if audit_self is not None:
        own = set(lx.heads[audit_self]["forms"].values()) if audit_self in lx.heads else {audit_self}

    def foreign(word: str, sources: set[str]) -> set[str]:
        """Sources of `word` that do not belong to the entry being audited."""
        if audit_self is None:
            return sources
        return {s for s in sources if not s.startswith(f"{audit_self} (")}

    for c in cands:
        f = results[c.spelling]
        forms = paradigms[c.spelling]

        # 1 template
        if c.kind == "root":
            for p in root_template(c.spelling, audit=audit_self is not None):
                if audit_self is not None and c.spelling in CONSONANT_FINAL_EXEMPT:
                    continue
                f.append(Finding(1, "ERROR", f"root template: {p}"))
        elif c.kind == "function_word":
            for p in function_word_template(c.spelling):
                f.append(Finding(1, "ERROR", f"function-word template: {p}"))

        # 2 collision
        for form, how in forms.items():
            hits = foreign(form, lx.active.get(form, set()))
            if hits:
                f.append(Finding(2, "ERROR", f"{form} [{how}] is already ACTIVE: {'; '.join(sorted(hits))}"))
            if form in lx.reserved:
                f.append(Finding(2, "ERROR", f"{form} [{how}] is RESERVED: {'; '.join(sorted(lx.reserved[form]))}"))
            for o in cands:
                own_derivation = (o.kind == "derivation" and o.base == c.spelling) or (c.kind == "derivation" and c.base == o.spelling)
                if o is not c and o.concept != c.concept and not own_derivation and form in paradigms[o.spelling]:
                    f.append(Finding(2, "ERROR", f"{form} [{how}] is also {o.spelling} [{paradigms[o.spelling][form]}]"))

        # 3 distance
        if c.kind in ("root", "function_word"):
            for w in sorted(near.within_one(c.spelling) - own):
                if lx.is_declared(c.spelling, w):
                    continue
                if c.kind == "function_word" and len(c.spelling) <= 2 and len(w) > 3:
                    continue  # validate.py check 18: a monosyllable is not read against long words
                f.append(Finding(3, "ERROR", f"{c.spelling} is one edit from ACTIVE {w} ({'; '.join(sorted(lx.active[w]))})"))
            for w in sorted(near_reserved.within_one(c.spelling) - own):
                if "-" in w or lx.is_declared(c.spelling, w):
                    continue
                # validate.py check 18: a new word is two edits from reserved spellings too
                f.append(Finding(3, "ERROR", f"{c.spelling} is one edit from RESERVED {w} ({'; '.join(sorted(lx.reserved[w]))})"))
            for o in cands:
                # alternatives for one concept may sit close; anything else will become ACTIVE together
                if o.concept != c.concept and o.kind in ("root", "function_word") and edit_distance(c.spelling, o.spelling, cap=1) <= 1:
                    f.append(Finding(3, "ERROR", f"{c.spelling} is within one edit of candidate {o.spelling} ({o.concept})"))
        for form, how in forms.items():
            if form == c.spelling and c.kind in ("root", "function_word"):
                continue
            for w in sorted(near.within_one(form) - own - set(forms)):
                if lx.is_declared(form, w) or not foreign(w, lx.active[w]):
                    continue
                f.append(Finding(3, "WARN", f"{form} [{how}] is one edit from ACTIVE {w}"))

        # 4 parse
        if c.kind == "derivation":
            base_reading = lx.parse(c.spelling)
            want = ("derivation", (c.base, c.suffix), ())
            ok = base_reading == want or (
                c.suffix == "ti" and base_reading is not None and base_reading[0] in ("lexical", "derivation") and base_reading[2] == ("ti",)
            )
            if base_reading is not None and not ok:
                f.append(Finding(4, "ERROR", f"{c.spelling} already reads as {describe(base_reading)}, not {c.base} + -{c.suffix}"))
        else:
            for form, how in forms.items():
                if form in lx.active or form in lx.reserved:
                    continue  # reported by check 2
                before = lx.parse(form)
                if before is not None:
                    f.append(Finding(4, "ERROR", f"{form} [{how}] already reads as {describe(before)}"))
        new_spellings = set()
        if c.kind in ("root", "compound"):
            new_spellings = set(seven_forms(c.spelling).values()) | {c.spelling + d for d in DERIVATIONS}
        elif c.kind in ("function_word", "derivation"):
            new_spellings = {c.spelling}
        for e in sorted(new_spellings):
            probes = {e + s for s in ("ri", "ti", "tiri")} | {p + e for p in lx.motion_prefixes} | {p + "-" + e for p in lx.motion_prefixes}
            for s in sorted(probes):
                if s in forms:
                    continue
                before, after = lx.parse(s), aug.parse(s)
                if before is not None and before != after:
                    f.append(Finding(4, "ERROR", f"existing {s} read as {describe(before)} would now read as {describe(after)}"))
            if c.kind in ("root", "compound") and e != c.spelling:
                continue
            if c.kind == "derivation" and e[:-2] == c.base:
                continue  # a -ti derivation strips to its own base: the intended reading
            if len(e) > 4 and e.endswith(("ri", "ti")) and lx.known_stem(e[:-2]):
                f.append(Finding(4, "ERROR", f"{e} strips to the known stem {e[:-2]} + -{e[-2:]}"))
        if c.kind in ("root", "compound"):
            for word, h in aug.heads.items():
                if h["type"] != "Compound" or c.spelling not in word or word == c.spelling and c.kind == "compound":
                    continue
                splits = aug.segmentations(word)
                gained = [s for s in splits if c.spelling in s and list(s) != list(h["components"] or [])]
                if gained and audit_self is None:
                    f.append(Finding(4, "ERROR", f"compound {word} ({'+'.join(h['components'] or [])}) gains the split {'+'.join(gained[0])}"))
            if c.kind == "compound":
                splits = aug.segmentations(c.spelling)
                extra = [s for s in splits if list(s) != list(c.components or [])]
                if not splits:
                    f.append(Finding(4, "ERROR", f"{c.spelling} does not split into two headwords"))
                elif extra:
                    f.append(Finding(4, "ERROR", f"{c.spelling} has more than one split: {', '.join('+'.join(s) for s in splits)}"))
                for part in c.components or []:
                    ph = aug.heads.get(part)
                    if ph and ph["type"] == "Compound":
                        f.append(Finding(4, "ERROR", f"component {part} is itself a compound; compounds do not nest"))

        # 5 singability
        if c.kind == "root":
            first, pattern = syllabify(c.spelling)[0], vowel_pattern(c.spelling)
            if c.domain:
                same = [
                    w for w, h in lx.heads.items()
                    if h["type"] == "Primal" and h["domain"] == c.domain and w not in own
                    and syllabify(w)[0] == first and vowel_pattern(w) == pattern
                ]
                if same:
                    f.append(Finding(5, "WARN", f"same first syllable {first!r} and vowels {pattern!r} as {', '.join(sorted(same))} ({c.domain})"))
            ending = c.spelling[-4:]
            members = [m for m in lx.rhyme.get(ending, []) if m != c.spelling]
            if members:
                shown = ", ".join(members[:8]) + (f" … (+{len(members) - 8})" if len(members) > 8 else "")
                f.append(Finding(5, "INFO", f"joins rhyme family -{ending}: {shown}"))
            else:
                f.append(Finding(5, "INFO", f"starts a new rhyme family -{ending}"))
    return results


def nearest(lx: Lexicon, word: str, k: int = 5) -> list[tuple[str, int]]:
    """The k nearest ACTIVE spellings by Levenshtein distance (length-filtered)."""
    scored = []
    for w in lx.active:
        if "-" in w or abs(len(w) - len(word)) > 2 or w == word:
            continue
        d = edit_distance(word, w, cap=3)
        if d <= 3:
            scored.append((d, w))
    scored.sort()
    return [(w, d) for d, w in scored[:k]]


# ---------------------------------------------------------------------- audit


def audit(lx: Lexicon) -> dict:
    """The checks over the lexicon's own words. Reports; changes nothing."""
    report: dict[str, list] = {
        "template": [],
        "collision": [],
        "distance": [],
        "parse": [],
        "segmentation": [],
        "distance_1_forms": [],
    }
    near = NearIndex(lx.active)
    lexicalised = dict(lx.raw["morphology"].get("lexicalised_derivations", {}))
    for root, h in sorted(lx.heads.items()):
        if h["type"] != "Primal":
            continue
        for p in root_template(root, audit=True):
            if root in CONSONANT_FINAL_EXEMPT and p == "not vowel-final":
                continue
            report["template"].append({"word": root, "problem": p})
        own_forms = set(h["forms"].values())
        for w in sorted(near.within_one(root) - own_forms):
            if not lx.is_declared(root, w):
                report["distance"].append({"word": root, "near": w, "sources": sorted(lx.active[w])})
        cand = Candidate("", root, "root")
        for form, how in paradigm(cand).items():
            if form in own_forms:
                continue
            hits = {s for s in lx.active.get(form, set()) if not s.startswith(f"{root} (")}
            if lexicalised.get(form, "").endswith(f": {root} + -{form[len(root):]}"):
                continue  # this root's own lexicalised derivation (kaldopago, soloti)
            if how.startswith("-") and (lx.heads.get(form) or {}).get("components") == [root, how[1:]]:
                continue  # root + -pago spelled as the compound root + pago: one reading
            if hits:
                report["collision"].append({"word": root, "form": form, "built": how, "is": sorted(hits)})
            if form in lx.reserved:
                report["collision"].append({"word": root, "form": form, "built": how, "is": sorted(lx.reserved[form])})
            for w in sorted(near.within_one(form) - own_forms):
                if not lx.is_declared(form, w):
                    report["distance_1_forms"].append({"word": root, "form": form, "built": how, "near": w})
    for f in lx.raw.get("function_words", []):
        form = f["form"]
        if " " in form or form.startswith("-"):
            continue
        for p in function_word_template(form):
            report["template"].append({"word": form, "problem": f"function word: {p}"})
    # Lexicon-first shadowing: a canon form that would otherwise strip to a known stem.
    for form in sorted(lx.form_refs):
        if len(form) > 4 and form.endswith(("ri", "ti")) and lx.known_stem(form[:-2]):
            report["parse"].append({"word": form, "reads_as": describe(lx.parse(form)), "also": f"{form[:-2]} + -{form[-2:]}"})
    for word, h in sorted(lx.heads.items()):
        if h["type"] != "Compound":
            continue
        splits = lx.segmentations(word)
        if len(splits) > 1:
            report["segmentation"].append({"word": word, "components": h["components"], "splits": ["+".join(s) for s in splits]})
    return report


# ------------------------------------------------------------------- output


def table(rows: list[list[str]], headers: list[str]) -> str:
    widths = [max(len(str(r[i])) for r in rows + [headers]) for i in range(len(headers))]
    widths[-1] = min(widths[-1], 100)
    line = lambda r: "  ".join(str(v).ljust(widths[i]) if i < len(r) - 1 else str(v) for i, v in enumerate(r))
    return "\n".join([line(headers), "  ".join("-" * w for w in widths)] + [line(r) for r in rows])


def load_candidates(path: str) -> list[Candidate]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    items = data["candidates"] if isinstance(data, dict) else data
    return [Candidate.from_json(d) for d in items]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("lexicon")
    ap.add_argument("--candidates")
    ap.add_argument("--audit", action="store_true", help="check the lexicon's own words")
    ap.add_argument("--json", help="write the report here")
    ap.add_argument("--warnings", action="store_true", help="print every WARN, not only a count")
    args = ap.parse_args(argv)

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    lx = Lexicon.load(args.lexicon)
    print(f"{args.lexicon}: {len(lx.heads)} headwords, {len(lx.active)} ACTIVE spellings, {len(lx.reserved)} RESERVED")
    report: dict = {"lexicon": args.lexicon, "active": len(lx.active), "reserved": len(lx.reserved)}
    failed = False

    if args.audit:
        a = audit(lx)
        report["audit"] = a
        print("\nAUDIT of the existing lexicon (pre-existing; nothing is changed)")
        for key in ("template", "collision", "distance", "parse", "segmentation"):
            print(f"  {key:<13} {len(a[key])}")
            for item in a[key]:
                print("      " + json.dumps(item, ensure_ascii=False))
        print(f"  WARN: {len(a['distance_1_forms'])} generated forms one edit from an ACTIVE word (listed in --json)")
        failed |= any(a[k] for k in ("template", "collision", "distance"))

    if args.candidates:
        cands = load_candidates(args.candidates)
        results = check_candidates(lx, cands)
        rows, out = [], []
        for c in cands:
            fs = results[c.spelling]
            errors = sum(1 for x in fs if x.severity == "ERROR")
            warns = sum(1 for x in fs if x.severity == "WARN")
            failed |= errors > 0
            rows.append([c.concept, c.spelling, c.kind, stressed(c.spelling), verb_of(c.spelling) if c.kind in ("root", "compound") else "", str(errors), str(warns)])
            out.append({
                "concept": c.concept,
                "spelling": c.spelling,
                "kind": c.kind,
                "syllables": syllabify(c.spelling),
                "stress": stressed(c.spelling),
                "verb": verb_of(c.spelling) if c.kind in ("root", "compound") else None,
                "components": c.components,
                "base": c.base,
                "suffix": c.suffix,
                "nearest": [{"word": w, "distance": d} for w, d in nearest(lx, c.spelling)] if c.kind in ("root", "function_word") else [],
                "errors": errors,
                "warnings": warns,
                "findings": [x.as_json() for x in fs],
            })
        report["candidates"] = out
        print("\n" + table(rows, ["concept", "spelling", "kind", "stress", "verb", "ERR", "WARN"]))
        for c in cands:
            for x in results[c.spelling]:
                if x.severity == "ERROR" or args.warnings or x.check == 5 and x.severity == "WARN":
                    print(f"  {c.spelling:<14} {x.severity:<5} [{x.check}] {x.message}")

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=1)
        print(f"\nwrote {args.json}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
