"""liraasa_lexicon.py — the lexicon index and the lexicon-first parser.

Reconstructed for this repository: the module is imported by `validate.py` but
was not supplied with it. Works on both 0.8 and 1.0 JSON, as the tools README
states, and on 1.1, which adds headwords and nothing else.

**Lexicon-first, never blind suffix stripping.** Many roots end in letters that
look like suffixes (`navu`, `sevu`, `trana`, `pago`), so a known spelling is
always preferred to a decomposition.

The reconstruction is checked by parity: running the unmodified `validate.py`
against `liraasa_1_0.json` must reproduce `validation_1_0.json` exactly.
"""

from liraasa_core import FORM_KEYS, tokenize, is_unused

# Attach to the root, never to a form, and never alongside a form.
DERIVATIONS = ("yo", "vu", "pago")

# Order is fixed: ROOT + (one form OR one derivation) + -ti + -ri.
SUFFIXES = ("ti", "ri")


class Lexicon(object):
    """Indexes every spelling the language currently licenses."""

    def __init__(self, data):
        self.data = data
        self.headwords = {h["root"]: h for h in data["headwords"]}

        # form -> [(root, slot)]
        self.forms = {}
        for h in data["headwords"]:
            for key in FORM_KEYS:
                spelling = h["forms"][key]
                self.forms.setdefault(spelling, []).append((h["root"], key))

        # derivation -> [(root, '-yo'|'-vu'|'-pago')]
        self.derivations = {}
        for h in data["headwords"]:
            for suffix in DERIVATIONS:
                # morphology.suffixes: mavo+pago is blocked.
                if suffix == "pago" and h["root"] == "mavo":
                    continue
                self.derivations.setdefault(h["root"] + suffix, []).append(
                    (h["root"], "-" + suffix)
                )

        self.function_words = set()
        for f in data.get("function_words", []):
            for part in str(f["form"]).split(" / "):
                part = part.strip()
                if part:
                    self.function_words.add(part)

        self.pronouns = {p["form"] for p in data.get("pronouns", [])}
        self.correlatives = {c["form"] for c in data.get("correlatives", [])}
        self.particles = {d["form"] for d in data.get("discourse_particles", [])}
        self.time_words = {t["form"] for t in data.get("time_and_dates", [])}

        self.numbers = set()
        for rule in data.get("numbers", {}).get("rules", []):
            value = str(rule.get("Liraasa", "")).strip()
            if value and " " not in value:
                self.numbers.add(value)
        for value in data.get("numbers", {}).get("lookup_0_999", {}).values():
            self.numbers.add(value)
        # Scale words appear only inside larger numerals.
        self.numbers.update(("mililumi", "megalumi", "centa"))

        self.colors = set()
        for c in data.get("colors", []):
            base = c.get("Base color")
            if not base:
                continue
            self.colors.add(base)
            for key in ("Dark + narvo", "Life + bio", "Gem + juba", "Light + lumi"):
                if c.get(key):
                    self.colors.add(c[key])

        # motion_prefixes.canon: a closed list, licensed only on motion verbs
        # and the curated metaphors. Not productive (motion_prefixes.rule).
        self.motion_prefixes = tuple(
            data.get("motion_prefixes", {}).get("canon", {}).keys()
        )
        self.retired_prefixes = tuple(
            data.get("motion_prefixes", {}).get("retired", {}).keys()
        )

        # Pre-1.0 spellings, resolvable under ruling 1.0:G19.
        self.legacy = {}
        for old, entry in data.get("legacy", {}).get("migration_forms", {}).items():
            self.legacy[old] = entry

        self.closed = (
            self.function_words
            | self.pronouns
            | self.correlatives
            | self.particles
            | self.time_words
            | self.numbers
            | self.colors
        )

    # ------------------------------------------------------------------ helpers

    def gloss(self, root, slot):
        """The gloss of one slot, or None when it is unused."""
        h = self.headwords.get(root)
        if h is None:
            return None
        g = h["glosses"].get(slot)
        return None if is_unused(g) else g

    def _known_stem(self, stem):
        """True when a stem is already a spelling the lexicon licenses."""
        return (
            stem in self.forms
            or stem in self.derivations
            or stem in self.pronouns
            or stem in self.correlatives
            or stem in self.time_words
            or stem in self.colors
        )

    def _strip_suffixes(self, token):
        """Peel -ri then -ti, returning (stem, suffixes) in attachment order.

        **Lexicon-first.** After peeling -ri, stop if what remains is already a
        known spelling: `lumibitiri` is lumibiti + -ri, not lumibi + -ti + -ri,
        and `lumibiti` is a headword while `lumibi` is nothing. Peeling greedily
        would lose the word.
        """
        stem = token
        found = []
        if stem.endswith("ri") and len(stem) > 4:
            stem, found = stem[:-2], ["-ri"] + found
            if self._known_stem(stem):
                return stem, found
        if stem.endswith("ti") and len(stem) > 4:
            candidate = stem[:-2]
            if self._known_stem(candidate) or not found:
                stem, found = candidate, ["-ti"] + found
        return stem, found

    def _number_parse(self, token):
        """A numeral, possibly hyphenated, possibly an ordinal in -ne."""
        body = token
        ordinal = False
        if body.endswith("-ne"):
            body, ordinal = body[:-3], True
        parts = body.split("-")
        if not parts or not all(p in self.numbers for p in parts):
            return None
        return ("number", (body, parts, ordinal))

    # ------------------------------------------------------------------- parser

    def parse(self, token):
        """Parse one token. Returns (kind, analysis); kind is None if unknown.

        For a lexical word the analysis is `(stem, [(root, slot), ...], suffixes)`,
        so `analysis[1]` lists every entry that claims the spelling. A spelling
        can belong to more than one namespace, and the first matching namespace
        in this order wins.
        """
        if not token:
            return (None, None)

        word = token.lower()

        # 1. exact lexical form, before any decomposition
        if word in self.forms:
            return ("lexical", (word, list(self.forms[word]), []))

        # 2. closed classes, in the order the validator treats them
        if word in self.function_words:
            return ("function", (word,))
        if word in self.pronouns:
            return ("pronoun", (word, []))
        if word in self.correlatives:
            return ("correlative", (word,))
        if word in self.particles:
            return ("particle", (word,))
        if word in self.time_words:
            return ("time", (word,))
        if word in self.colors:
            return ("color", (word,))

        number = self._number_parse(word)
        if number is not None:
            return number

        # 3. a productive derivation on the root
        if word in self.derivations:
            return ("derivation", (word, list(self.derivations[word]), []))

        # 4. -ti / -ri, which attach after a form or a derivation
        stem, suffixes = self._strip_suffixes(word)
        if suffixes:
            if stem in self.forms:
                return ("lexical", (stem, list(self.forms[stem]), suffixes))
            if stem in self.derivations:
                return ("derivation", (stem, list(self.derivations[stem]), suffixes))
            if stem in self.pronouns:
                return ("pronoun", (stem, suffixes))
            if stem in self.correlatives:
                return ("correlative", (stem,))
            if stem in self.time_words:
                return ("time", (stem, suffixes))
            if stem in self.colors:
                return ("color", (stem,))

        # 5. a canon motion prefix on a verb form (motion_prefixes.canon)
        for prefix in self.motion_prefixes:
            if word.startswith(prefix):
                rest = word[len(prefix) :]
                if rest in self.forms:
                    owners = [o for o in self.forms[rest] if o[1] == "verb"]
                    if owners:
                        return ("motion", (prefix, rest, owners))

        # 6. a hyphenated fraction: NUMBER-de-NUMBER (settled question 6)
        if "-de-" in word:
            left, _, right = word.partition("-de-")
            if self._number_parse(left) and self._number_parse(right):
                return ("fraction", (left, right))

        # 7. a pre-1.0 spelling (ruling 1.0:G19)
        if word in self.legacy:
            return ("legacy", (word, self.legacy[word]))

        # 8. a proper name: capitalised in the source and nothing else fits
        if token[:1].isupper():
            return ("name", (token,))

        return (None, None)

    def parse_text(self, line):
        """Yield (token, kind, analysis) for every word token in a line."""
        out = []
        for token in tokenize(line):
            kind, analysis = self.parse(token)
            out.append((token, kind, analysis))
        return out

    def unknown_words(self, line):
        """Just the tokens that do not parse."""
        return [t for (t, kind, _) in self.parse_text(line) if kind is None]
