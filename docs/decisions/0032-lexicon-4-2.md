# ADR-0032: Liraasa 4.2, the exact words whose meaning shifted in the _2100 Dreams_ draft (proposed)

- **Status:** accepted as a build. 4.2 is proposed, as 4.1 is, until the author ratifies it.
- **Date:** 2026-10-27

## Context

At meaning kept 0.79, the draft's loss notes name word choice as the leading cause, appearing in 927 of the 1,004 segments under 0.85. They name it precisely:

- "'skinny' became 'small'";
- "'watchmaker' became 'the person who built it'";
- "'irony' became 'sarcasm'".

## Decision

### 1. Collecting the shifts

`translation/tools/vocab_4_2.py` collects the English side of every "'X' became 'Y'" note, most frequent first. It leaves out what the registry or the aliases already name, and takes up to 360 words.

### 2. Asking and checking

The words then go through 4.1's ask-and-check (`vocab_4_1.py`):

- the stronger model gives an existing word, or one compound of existing headwords;
- every answer is checked;
- verb forms, jokes, slogans and the editor's `EXCLUDE` list are left out;
- 4.2 adds to `EXCLUDE` the adverbs, adjectives, names and phrases that are not nouns;
- plural English names the singular sense, so "pleasantries" names "pleasantry", while "pants" stays.

### 3. The result

`data/proposals/liraasa_4_2_patch.json` holds 42 compounds and 105 English aliases (an alias only where the dictionary could not already find the English). They include affection, apathy, irony, mood, perspective, embryo, curfew, whiskey, girlfriend, password ("passcode"), login, routine, vocation and byproduct. One compound was an attested image compound and is lexicalised (_lorevaye_). 39 answers were rejected, each with its reason.

### 4. The build

`npm run integrate:4.2` builds 4.2 from frozen 4.1, giving 2,550 headwords. No roots are added and no spelling changes. Every tool reads 4.2, and `PROPOSED_EDITIONS` is `['4.1', '4.2']`. Learn's diff lesson runs 4.1 → 4.2.
