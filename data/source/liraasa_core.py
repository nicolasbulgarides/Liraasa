"""liraasa_core.py — phonology, the seven forms, the verb rule, edit distance.

Reconstructed for this repository: the module is imported by `validate.py` and
`build_1_0.py` but was not supplied with them. Every rule here is taken from
`liraasa_1_0.json` itself (`phonology`, `morphology`) and from the Grammar
Guide, not invented.

The reconstruction is checked by parity: running the unmodified `validate.py`
against `liraasa_1_0.json` must reproduce `validation_1_0.json` exactly.
"""

FORM_KEYS = [
    "root",
    "ascended",
    "negative",
    "verb",
    "negative_adjective",
    "adjective",
    "ascended_adjective",
]

UNUSED = "— (unused)"

VOWELS = set("aeiou")

# phonology.consonants_core + phonology.consonants_other
CONSONANTS = set("lmnrsvy") | set("bdptghzkcfj")

# Only these initial clusters are permitted, and only because 1.0 grandfathers
# them (phonology.protected_exceptions).
ALLOWED_INITIAL_CLUSTERS = ("kr", "tr")

# Roots that may end in a consonant (phonology, check 6).
CONSONANT_FINAL_EXEMPT = ("amor", "apok")


def is_unused(gloss):
    """True when a gloss slot carries no meaning."""
    if gloss is None:
        return True
    return str(gloss).strip().startswith("—")


def verb_of(root):
    """The verb form, by the 1.0 verb rule, checked in order.

    opi is the single irregular. Otherwise only the first letter of the whole
    word decides, so a compound takes the class of its modifier.
    """
    if root == "opi":
        return "opioa"
    first = root[0]
    if first == "n":
        return root + "nia"
    if first == "s":
        return root + "sia"
    if first in VOWELS:
        return root + "a"
    return root + first + "a"


def seven_forms(root):
    """All seven forms. Concatenation is literal: dorva + asa = dorvaasa."""
    return {
        "root": root,
        "ascended": root + "asa",
        "negative": root + "na",
        "verb": verb_of(root),
        "negative_adjective": root + "nasan",
        "adjective": root + "san",
        "ascended_adjective": root + "asasan",
    }


def syllabify(word):
    """Split into syllables.

    Every vowel is a nucleus and adjacent vowels do not form diphthongs, so
    `dorvaasa` is dor-va-a-sa. Leading consonants attach to the following
    nucleus; a trailing consonant attaches to the last syllable.
    """
    out = []
    current = ""
    for ch in word.lower():
        if ch in VOWELS:
            out.append(current + ch)
            current = ""
        else:
            current += ch
    if current:
        if out:
            out[-1] += current
        else:
            out.append(current)
    return out


def syllable_count(word):
    """Number of syllables, i.e. of vowels."""
    return sum(1 for ch in word.lower() if ch in VOWELS)


def stress_syllable(word):
    """Index of the stressed syllable: penultimate, or the only one."""
    n = syllable_count(word)
    if n <= 1:
        return 0
    return n - 2


def edit_distance(a, b, cap=None):
    """Levenshtein distance, with an optional early exit once `cap` is passed."""
    if a == b:
        return 0
    if cap is not None and abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i]
        for j in range(1, len(b) + 1):
            cur.append(
                min(
                    cur[j - 1] + 1,
                    prev[j] + 1,
                    prev[j - 1] + (0 if a[i - 1] == b[j - 1] else 1),
                )
            )
        if cap is not None and min(cur) > cap:
            return cap + 1
        prev = cur
    return prev[-1]


def _shape_problems(word, min_syllables, max_syllables, require_consonant_initial):
    """Shared phonotactic checks. Returns a list of problem strings."""
    problems = []
    w = word.lower()

    if not w:
        return ["empty"]

    n = syllable_count(w)
    if n < min_syllables:
        problems.append("%d syllable(s), need at least %d" % (n, min_syllables))
    if max_syllables is not None and n > max_syllables:
        problems.append("%d syllables, at most %d allowed" % (n, max_syllables))

    for ch in w:
        if ch not in VOWELS and ch not in CONSONANTS and ch != "-":
            problems.append("letter %r outside the inventory" % ch)

    if require_consonant_initial and w[0] not in CONSONANTS:
        problems.append("not consonant-initial")

    if w[-1] not in VOWELS and not w.endswith(CONSONANT_FINAL_EXEMPT):
        problems.append("not vowel-final")

    if len(w) > 1 and w[0] in CONSONANTS and w[1] in CONSONANTS:
        if not w.startswith(ALLOWED_INITIAL_CLUSTERS):
            problems.append("initial cluster %r" % w[:2])

    for i in range(len(w) - 2):
        tri = w[i : i + 3]
        if all(c in CONSONANTS for c in tri):
            problems.append("three-consonant cluster %r" % tri)

    for i in range(len(w) - 1):
        if w[i] == w[i + 1] and w[i] not in VOWELS:
            problems.append("doubled consonant %r" % w[i : i + 2])

    return problems


def new_root_phonotactics(word):
    """Problems with a proposed new root, or "" when it fits the template.

    phonology.new_root_template: two syllables, consonant-initial, vowel-final,
    letters from the inventory, no initial cluster (kr-, tr- grandfathered), no
    three-consonant cluster, no doubled letter.
    """
    problems = _shape_problems(word, 2, 2, True)
    return "; ".join(problems)


def function_word_phonotactics(word):
    """Problems with a proposed new function word, or "" when it fits.

    phonology.function_word_template: one to three syllables, vowel-final, no
    initial cluster. Hyphenated compounds such as `ki-oro` are checked part by
    part, since the hyphen marks a transparent two-piece particle.
    """
    if "-" in word:
        out = []
        for part in word.split("-"):
            if not part:
                continue
            problems = _shape_problems(part, 1, 3, False)
            if problems:
                out.append("%s: %s" % (part, "; ".join(problems)))
        return "; ".join(out)
    return "; ".join(_shape_problems(word, 1, 3, False))


def tokenize(text):
    """Word tokens, keeping internal hyphens and apostrophes.

    Punctuation, quotation marks and ellipses are dropped; `ki-oro`,
    `toda-nela` and `dossacenta-unzira-penta` stay single tokens.
    """
    out = []
    current = ""
    for ch in text:
        if ch.isalpha() or (ch in "-'" and current):
            current += ch
        else:
            if current:
                out.append(current)
                current = ""
    if current:
        out.append(current)
    return [t.strip("-'") for t in out if t.strip("-'")]
