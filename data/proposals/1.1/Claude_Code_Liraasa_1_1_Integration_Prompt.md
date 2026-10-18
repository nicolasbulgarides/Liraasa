# Claude Code Integration Task: Liraasa 1.0 → 1.1 (Vocabulary ONLY)

You are editing the Liraasa constructed-language repository. Treat `liraasa_1_0.json` as the immutable canonical baseline. The other input is `Liraasa_1_1_Vocabulary_Proposal.json`, containing **21 proposed primal roots and 298 proposed compounds** with a dependency-safe insertion order. The prose companion `Liraasa_1_1_Vocabulary_Proposal.md` explains meanings, rationale, and existing exclusions.

## NON-NEGOTIABLE: NO GRAMMAR CHANGES

This is purely a vocabulary supplement. Make absolutely no changes to 1.0's `phonology`, `morphology`, `motion_prefixes`, `grammar`, `function_words`, `pronouns`, `correlatives`, `numbers`, `time_and_dates`, `colors`, `discourse_particles`, `rulings_1_0`, `rulings_0_8_carried` or preexisting `examples`. Do not add a single grammatical particle, suffix, pronoun, root-compounding convention, tense, operator, argument structure, evidential, or clause slot. Absolutely no respelling or semantic reassignment of an existing entry. Do not overwrite `liraasa_1_0.json`.

## Required outputs

1. `liraasa_1_1.json`: the **new** canonical 1.1 lexicon, preserving 1.0 verbatim except for the version/build/source metadata, added headwords, and addition-specific editorial/audit metadata.
2. `Liraasa_1_1_Vocabulary_Changelog.md`: human-readable new roots, compound additions and component breakdown, denied duplicates, policy outcomes, and any unresolved technical edge cases.
3. `validation_1_1.json`: real validation results (never claim a test passed unless it actually executed).
4. `Liraasa_1_1_LLM_Quickstart.md`: a vocabulary addendum to the unchanged 1.0 grammar, including a list of new fundamental concepts and cautions about misleading lexical metaphors.
5. A reversible integration script or clean, deterministic repository patch, with no untracked modifications of previous editions.

## Integration sequence

1. Confirm the source SHA-256 matches `adc013cf99b79ec597c8cfcb9aee9f942e520010556ab6b072bcaa9a606608f3`. If it differs, compare and halt destructive integration until the change is reconciled.
2. Parse the proposal. Read existing 1.0 headwords and all seven forms, derivations, function words, pronouns, numbers, correlatives, examples, protected spellings, and the version-reserved sound ledger.
3. Insert the proposed **21 primal roots** after collision checks. Follow 1.0 phonotactics: two syllables, consonant-initial, vowel-final; no prohibited clusters; penultimate stress; at least two edit operations from any other active spelling (subject to 1.0's own declared exceptions). Do not mutate a protected 1.0 word to make room. If a proposed new root is blocked, generate a phonologically beautiful new replacement, log its discarded and replacement spellings, and update all dependent compounds deterministically.
4. Add the proposed compounds in `safe_integration_order`. Enforce exactly two active headword components, `MODIFIER+HEAD`, no changes to either component, and no cycles. A derived form is NOT a valid component unless it is already an active lexical headword. Do not inadvertently duplicate a productive -yo/-vu/-pago derivative.
5. For every added lexeme generate the **existing 1.0 seven forms** with the 1.0 verb rule (e.g. `n... → -nia`, `s... → -sia`; otherwise first-consonant copy + `-a`, etc.). The proposal offers seven-form spellings and cautious proposed glosses. Preserve semantically meaningful suggestions; mark other form glosses exactly `— (unused)`. Do not force figurative opposites or sacralizations simply to fill empty slots.
6. Populate every new item with its correct root/name, type `Primal`/`Compound`, component list, seven spellings, real English glosses, synonyms **only when accurate**, domain, everyday/poetic register, `since='1.1'`, new-status field, protected flag, and traceable editorial note. Make all new heads eligible for subsequent transparent compounds; existing entries remain byte-for-byte identical in parsed content.
7. If the proposed English gloss is already covered exactly by a 1.0 headword/derived form or if it asserts false scientific equivalence, **preserve existing canon and skip or narrow the proposal**, documenting why. Candidates flagged `semantic_risk='ELEVATED'` deserve special scrutiny; never silently repurpose a 1.0 form.
8. Update only supplemental vocabulary references and version/audit metadata. Do not repair historical examples, rename old sound slots, rewrite devotionals, or alter any grammar explanation.

## Required validation

- Run the project's actual validator (resolve `liraasa_core` and `liraasa_lexicon` imports first if needed) against `liraasa_1_1.json`, comparing it against the immutable `liraasa_1_0.json` baseline. Do not rely on the 1.0 report as evidence of new-version correctness.
- Independently verify all new headwords are unique; no new word equals any existing headword, any seven-form derivative, or any reserved spelling; no derivative collisions; no prohibited proximity of new root spelling; and no multi-split ambiguity among two-active-component compounds.
- Verify every new compound's `components` are two active **headwords**, not a function word or a merely derived word, and verify all components occur earlier in dependency order. Verify all verb spellings with a fresh implementation of the 1.0 verb rule.
- Confirm none of the 1.0 roots, entries, glosses, protected flags, legacy maps, phonological rules, grammatical metadata, examples, functions, or pronouns changed. Save a machine-readable compare report with checksums.
- Run the original example/corpus checks and then add at least 120 **new** example sentences, distributed across everyday, natural-world, social, philosophical and technological domains, that round-trip through the lexicon. Use each of the 21 new roots at least twice.
- If the existing validator is hard-coded to version 1.0, adapt the validation **wrapper/implementation** to target 1.1, not the language grammar. Do not claim that a bypassed/unexecuted check passed.

## Acceptance criteria

Aim to integrate all **319 proposals** where compatible; do not invent extra roots beyond needed replacements and do not add new grammar. Final expected size, only if every candidate is accepted: **1418 headwords: 407 primal roots and 1011 compounds; 149 existing function-word entries, unchanged.** Actual accepted counts may be lower if honest semantic/validator rejections are documented.

Deliver the new files and report exact totals, exact tested validation results, root-coining decisions, exceptions, skipped duplicates, and any items whose meaning could not be defended. Be decisive where the supplied data and rules settle the issue; preserve editorial honesty where they do not.
