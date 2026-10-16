# ADR-0006 — Stable ids are the only reference, and generated text is untrusted

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

Two requirements that look unrelated are actually the same requirement:
**nothing in the app may hold a Liraasa spelling as the thing it means.**

SPEC §6.1 asks for stable ids because "spellings change; ids don't. This is
what makes root swaps safe." SPEC §8 asks that every LLM output be
"tokenized, parsed and checked before it's shown", and that a free-form output
"is never saved as canonical without passing checks".

The 1.0 data shows exactly why. 63 primal roots retired and 7 were respelled
in one edition; 509 legacy spellings now need a migration table to resolve;
`legacy.retired_compounds` records 5 compounds that exist only as replacement
phrases. Anything that stored `"yoga"` as a reference is now broken —
`yoga` became `yomla`, and `yoga` is reserved and will never be reused. A text
that stored a token id is fine.

## Decision

### 1. Ids are assigned once and are opaque

Format and namespaces are in SCHEMA §2.1. Three rules:

- **Assigned on first import, never changed.** Not on respell, not on retire,
  not on merge. A merge keeps the surviving entry's id and records the absorbed
  one in `retired.replaced_by`.
- **Opaque.** The spelling slug inside an id is a reading convenience. Nothing
  parses it, and nothing re-derives an id from a spelling. A respelled entry
  keeps `lx_yoga_0712` and now spells `yomla`; that is correct, not a bug, and
  the UI never shows the raw id.
- **Mirrored** to `data/lexicon/ids.json`, so ids survive a round-trip through
  a tool that strips additive fields.

Everything that refers to an entry stores an id: token documents (SCHEMA §3),
lessons, changeset ops, cross-references, learner progress. **A stored
spelling is a bug** — except `surface_snapshot`, whose entire purpose is to be
a frozen spelling so the app can show what changed after an edit.

Retired entries stay in the data with `retired.replaced_by`, so an unmigrated
old text still resolves. G19 version gating uses `edition_written` plus
`legacy.migration_forms` to render a pre-1.0 text under 0.8 rules.

### 2. The provider boundary is a trust boundary

`TranslationProvider` has two implementations with very different
trustworthiness, and the app must not care which it is talking to:

- The **rule-based engine** assembles output from lexicon entries in clause
  order. It is valid by construction.
- The **LLM provider** returns a string. That string is **untrusted text**,
  with no privileged status whatsoever.

So the pipeline is fixed: `provider.translate()` → tokenise → parse → lexical
check → sentence check → _then_ display, with unknown words, invented roots and
grammar violations highlighted and a "retry with these errors" action. Nothing
reaches canonical storage without passing. There is no path that renders model
output directly.

Specifically, and in line with SPEC §14:

- **The app never invents a root.** An unknown word offers two actions: build a
  transparent MODIFIER+HEAD compound from existing headwords, flagged
  noncanonical and stored as a proposal, or add to open questions. Never
  "invent".
- **No gloss is ever written into an unused slot** by any automated path. 4608
  slots read `"— (unused)"` and ruling R2 requires an author decision and a
  ruling reference to activate one.
- **An exercise generator draws only on real entries and canonical meanings.**
  Never an unused slot, never an LLM-generated gloss.

### 3. The API key

Stored in local settings only — never in the repo, never in an exported
bundle, never in a changeset. Requests go browser-direct with the
`anthropic-dangerous-direct-browser-access` header; the model id is a setting,
not a constant. The request carries the Quickstart rules and only the slice of
the lexicon matched from the input.

## Consequences

- Respelling a root is a re-render of every text, not a rewrite: the tokens
  already point at ids, so the impact preview is a diff of rendered surfaces
  against `surface_snapshot`.
- Undo is exact, because the changeset records `from` and `to` per slot and no
  text was mutated.
- The round-trip test must prove ids are stable across an import → respell →
  export → import cycle, not just across a passive round-trip.
- The LLM provider is optional and the app is fully usable without it. If the
  key is absent the translator falls back to the rule-based engine with no
  loss of correctness — only of fluency.
