# The translator and the grammar editor: diagnosis (2.5)

What the 2.3 tools did, measured against the 2.5 grammar, and what replaced them. The numbers come from `npx tsx scripts/diagnose_2_5.ts`, which writes every case to `review/translator_diagnosis_2_5.data.json`.

## How the 2.3 tools worked

**The composer** (the Compose tab in `editor/index.html`, about 2,000 lines of the page's inline script) called itself "an assisted composer, not a translator".

- It read English word by word. A word went through a hand-written lookup table (`MARKERS`, `STRUCTURAL`, `COPULA_EN`, `IRREGULAR`, `DETERMINER_EN`, `TIME_UNITS`, `GIVE_EN`, `VALENCY_EN`) and then through a substring match on dictionary glosses.
- It joined the chosen words by heuristics:
  - the verb is the first chunk whose top option is a verb;
  - a noun after a copula becomes its adjective;
  - of two nouns, the first becomes its `-san`;
  - an implicit `po` is added for an English past.
- **It never ran the checker on its own draft.** A line was checked only after you inserted it into the page.
- It kept its own copy of the grammar in those tables: the slot order, the copulas, which English means which particle. Nothing tied that copy to the rulings, so every ruling since 1.2 had to be re-implemented there by hand, and many were not.

**The checker** (`editor/checker/`, 2.3) read words correctly, and its 20-slot walk (`slots.js`) placed operators well. But it had three structural gaps:

- **Form against slot was checked only in the verb slot.** An adjective standing as a subject or an object, a verb form after an article, a noun where an adjective belongs: none of these was an error unless the word sat between the operators and the object. This is the hole the album fell through.
- **It was tuned to pass the album.** Six of its rule files carry comments where a rule was loosened because the album used the construction (`clauses.js:171`, `order.js:19`, `:63`, `:352`, `:475`, `:643`). Under 2.2:G68 that was correct. Under 2.5:G87 it is not.
- **Grammar was code.** The rule logic and its messages were hard-coded JavaScript with ruling ids as string literals. A new ruling meant new code, and a superseded one stayed live until someone edited the file.

**No LLM was involved.** No step of either tool made a network call. Nothing trusted generated text: the problem was rule-based text that was never checked.

## What they did with the 2.5 examples

| | 2.3 checker | 2.5 strict checker |
| --- | --- | --- |
| The patch's 104 ✓ examples, read clean | 98 (6 wrongly flagged) | 104 |
| The patch's 20 ✗ examples, rejected | 7 (none citing the right rule) | 20, each citing its ruling |
| The 275 album lines, flagged | 1 (AR-10) | 47 |

The 2.3 checker accepted 13 of the 20 ✗ examples. Several are things a 2.3 checker could already have seen:

- a bare `-ri` adjective (`benasanri`);
- `eli lirari`;
- `la molusan` before the verb;
- `fuyi` before a closing time word;
- a clause-initial `tonsi` without its comma;
- `Kipo hozi, lirala.` with no subject.

It flagged six ✓ examples:

- `la ruli molusan` and `la kasi molusan`: it read `la` as needing a noun phrase;
- `Maivo lirala taivo baba lira.` (2.5:G112);
- `lunosavalila` and `lunosavalisan`: image-compound forms, 2.5:G124;
- `antizi dossa` (2.5:G125).

| | 2.3 composer | 2.5 translator |
| --- | --- | --- |
| The patch's 76 ✓ sentences, composed from their English: output that passes the 2.5 checker | 46 | 75 |
| … exactly the patch's Liraasa | 28 | 51 |

The one sentence the 2.5 translator does not render is "I recognize you." It reports that no listed word means "recognize" (see questions §7).

## The failures, classified

Every case is in the data file. By kind:

1. **English words left in the output.** "gently", "have", "by nature", "you'll", "witness", "as for", "about" were copied into the Liraasa:
   - `maivo lirala gently`
   - `maivo have kasi lirari`
   - `li sora ke benasan by nature`

   The composer had no notion that a word without a listed Liraasa form is a gap to report. It showed some gaps, but passed English through when a lookup half-matched.
2. **A word in the wrong form for its slot.**
   - `Kipo bumresan ito`: an adjective where the verb belongs. This is the album's error, made by the tool.
   - `li lira ke sarbisan` for "is written": an adjective for a passive.
   - `zafra, li dorbi po ke lallela`: a copula plus a verb.
3. **Wrong function words from substring matches.**
   - "as soon as" → `gase soon gase`
   - "as for" → `gase vobi`
   - "so that" → `tonsi fime`
   - "to sing" for purpose → `sidu` (2.5:G113)
4. **Word order.**
   - `Taivo sabesia poye fime maivo lirala`: the attitude word before the subordinate clause, against 2.5:G89.
   - `maivo toda-krono lirala`: a time word before the verb.
   - `maivori toda-krono lirala fuyi pifu`.
5. **Edges of the clause.**
   - A FRAME without its comma (`Eli-pago maivo lirala`, `Deyaapo maivo po lirala`).
   - A vocative not set off (`… ligo maivo maivo de amor ki?`).
   - A missing semicolon or linker between two clauses.
6. **Rules recalled from an older edition.**
   - `po viki` for "would have" (2.5:G114).
   - The raho clause with its own object, not closed by a comma (2.5:G115).
   - `fime` + `nosi` for hopeful purpose (2.5:G116).

   Each was right in some earlier edition and was copied into the tables.
7. **Approvals of what the rules forbid.** These are the 13 ✗ examples the 2.3 checker accepted, and the 46 album lines it passed that 2.5 rejects.

## What replaced them

- **One strict checker** (`src/core/grammar`), shared by the editor and the translator.
  - It reads every word into all its readings.
  - It parses each sentence against the 2.5 clause template with its edges (2.5:G126) and the noun-phrase template (2.5:G98).
  - It checks each word's form against its slot.
  - Every finding names its rule. What the author has not ruled is `unruled`.
  - Word lists and rule parameters are data: the reference, `data/checker/lexicon_flags.json` and `data/checker/rules_2_5.json`.
- **The translator** (`src/core/translate`) is a pipeline:
  - English → a meaning frame;
  - the frame → the 2.5 templates, by the rulings;
  - words from the dictionary only;
  - the strict checker;
  - a back-translation that must regenerate the same frame.

  It returns no Liraasa that fails, says why when nothing passes, and fails a line whose English it could not fully read rather than dropping words.
- **The editor** takes its grammar findings from the strict checker alone. Compose shows the gloss and flags. There is no approve button: "Propose a ruling" records the sentence and leaves it failing. The 2.3 checker still supplies what the strict one does not do: the English pairing check, calques and register notes. The 2.3 composer is one click away for its word-by-word options.

No feature the author uses was removed.
