# ADR-0031: Liraasa 4.1, the vocabulary the _2100 Dreams_ draft still paraphrased (proposed)

- **Status:** accepted as a build. 4.1 is proposed until the author ratifies it. Everything up to 4.0 is canon (ADR-0030).
- **Date:** 2026-10-27

## Context

The author asked: "Do everything you can to get the meaning to 85% and grammar to 100%." The draft's own loss notes show that most of the remaining loss is vocabulary: the draft had to paraphrase a word that English has.

## Decision

### 1. Mining the gaps

`translation/tools/vocab_4_1.py` collects the English words and short phrases that the draft's calls logged as paraphrased. It takes the 360 most frequent, leaving out those the coinage registry already names.

### 2. Answers from the stronger model

The stronger model looks at each gap in batches, with the dictionary entries that relate. For each one, it gives either the existing word that covers it, or one MODIFIER+HEAD compound of existing headwords. Its answers are cached in `translation/vocab_4_1_answers.json`.

### 3. Checking the answers

- **A compound passes** only if it is spelled as its two parts joined, both parts are headwords, colour bases or time nouns, and it collides with no existing form and with no other new word.
- **Not dictionary nouns:** verb forms, jokes, slogans and phrases longer than two words are dropped.
- **Plural English** names the singular sense.
- **Read by hand:** the editor dropped 16 more that are adjectives, verb phrases or one-off descriptions from the novel. They are listed in `EXCLUDE`.

### 4. The result

`data/proposals/liraasa_4_1_patch.json` holds 40 compounds and 112 English aliases for existing words. 42 answers were rejected, each with its reason in the patch. Two of the compounds were already attested image compounds, so they are lexicalised and keep their ids.

Some of the compounds:

| English       | Liraasa             |
| ------------- | ------------------- |
| social worker | _mavopagomelvanela_ |
| religion      | _lavbusabe_         |
| respect       | _sirmolore_         |
| relapse       | _ramuralno_         |
| situation     | _pagorinba_         |
| field trip    | _madijomru_         |
| hypocrite     | _fasbinela_         |
| jurisdiction  | _jusepolva_         |

### 5. The build

`scripts/make_changeset_4_1.ts` and `npm run integrate:4.1` build 4.1 from frozen 4.0, giving 2,508 headwords. No roots are added and no spelling changes. `npm run validate:4.1` gives 23 PASS and 2 WARN, and the author's validator gives PASS. Every tool reads 4.1, and `PROPOSED_EDITIONS` is `['4.1']`.

### 6. Grammar

`translation/tools/grammar_fix.py` brings each failing segment to a clean pass of the checker:

- first, up to three whole-segment repairs with the stronger model;
- then, for each sentence that still fails, up to three fixes of that sentence alone.

A version is kept only if it passes.
