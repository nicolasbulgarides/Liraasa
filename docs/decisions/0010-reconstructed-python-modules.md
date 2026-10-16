# ADR-0010 — `liraasa_core.py` and `liraasa_lexicon.py`, reconstructed

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 1.1 integration

## Context

ADR-0007 keeps `data/source/validate.py` in the repository as an **independent**
check on whatever JSON the app writes — a second opinion with a different
implementation, which is only worth having if it runs.

It did not run. It imports two modules that were never supplied:

```python
from liraasa_core import (FORM_KEYS, seven_forms, edit_distance, syllable_count,
                         syllabify, new_root_phonotactics,
                         function_word_phonotactics, is_unused, tokenize)
from liraasa_lexicon import Lexicon
```

`build_1_0.py` needs `liraasa_core` too. So the only way to validate the 1.1
integration with the project's actual validator was to reconstruct them.

## Decision

Both modules are reconstructed in `data/source/`, with every rule taken from
`liraasa_1_0.json` itself (`phonology`, `morphology`, `motion_prefixes`) and
from the Grammar Guide. Nothing is invented.

**The reconstruction is validated by parity, not by inspection.** Running the
unmodified `validate.py` against `liraasa_1_0.json` must reproduce
`validation_1_0.json`. It does:

- all 24 checks report the same status;
- every finding count is identical (all zero);
- the summary counts are identical (1099 / 386 / 713 / 7693 / 4608 / 149 / 27);
- the only differences are the two notes that count corpus lines, 0 against
  493, because `corpus/` was not supplied. The 447 example sentences match
  exactly, and 447 + 493 = 940, the author's own check-21 count.

That parity is the argument. A reconstruction that merely looked plausible
would not have survived it — the first attempt failed check 14 with 22 unknown
words, which turned out to be four genuine gaps in the parser:

| Gap                  | What was missing                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Motion prefixes      | `va-pagopa`, `revo-lirala` … — `motion_prefixes.canon` licenses `PREFIX-VERBFORM` on motion verbs and the curated metaphors |
| Hyphenated fractions | `una-de-dossa`, i.e. `NUMBER-de-NUMBER` (settled question 6)                                                                |
| `-ri` on time words  | `deyari`, `montari`, `montafamari`                                                                                          |
| —                    | (the fourth was the same `-ri` gap on a third time word)                                                                    |

Each is a real feature of the language that a parser has to know, and the
parity test is what surfaced them.

## What the modules contain

**`liraasa_core.py`** — `FORM_KEYS`, `UNUSED`, the inventories, `verb_of`,
`seven_forms`, `syllabify`, `syllable_count`, `stress_syllable`,
`edit_distance` (with the `cap` early exit `validate.py` relies on),
`new_root_phonotactics`, `function_word_phonotactics`, `is_unused`, `tokenize`.

**`liraasa_lexicon.py`** — `Lexicon`, indexing forms, derivations and every
closed class, with a **lexicon-first** parser: exact form, then closed classes,
then numerals, then derivations, then `-ti`/`-ri`, then motion prefixes, then
hyphenated fractions, then the legacy map (ruling 1.0:G19), then a capitalised
proper name. A known spelling always beats a decomposition, because many roots
end in letters that look like suffixes (`navu`, `sevu`, `trana`, `pago`).

## Consequences

- `validate.py` runs, so ADR-0007's independent check is real rather than
  aspirational, and check 12 now executes against the genuine 0.8-rc2 baseline
  (whose sha256 matches `snapshot_0_8.source_sha256`).
- These files are **reconstructions in `data/source/`**, which is otherwise
  read-only. They are clearly marked as such in their own docstrings. If the
  author's originals turn up, replace them and re-run the parity check; a
  difference in behaviour is then a finding worth reading.
- One platform note: `validate.py` opens files without an explicit encoding, so
  on Windows it needs `PYTHONUTF8=1`. The script is not edited to fix this;
  the commands in `CLAUDE.md` set the variable.
- The Phase 2 TypeScript validator now has a working reference implementation
  to match, which is a much better starting point than the prose.
