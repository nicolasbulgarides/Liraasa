# ADR-0028: The draft translation of _2100 Dreams_

- **Status:** accepted
- **Date:** 2026-10-26

## Context

The author asked for an unattended, overnight first draft of their novel _2100 Dreams_ in Liraasa 3.6. Every hard call was to be made provisionally and logged for review. The author's brief set the pipeline:

- segment the novel;
- translate it with the model;
- validate with the grammar parser, retrying up a repair ladder;
- back-translate and score each segment;
- log decisions, adapting rather than halting.

## Decision

- **Tools.** The tools are in `translation/tools/`. The parser is the strict checker, used through `scripts/check_batch.ts`. Model calls run through `claude -p` on the author's subscription, outside the repository, so no project hook runs. A usage limit pauses the run, and it resumes on its own. The run is launched by `translation/run_overnight.sh`, with a watchdog.
- **Calls at once.** At most N model calls run at once, with N taken from `translation/workers.txt`.
- **Stopping.** A `translation/STOP` file stops the run cleanly.
- **The author's decisions during the run:**
  - **Quote-first dialogue counts as unruled** (G-9). 2.3:G83 rules only VERB: “…”. The speech inside the quotes is still checked as sentences.
  - **The meaning score is measured fairly.** The back-translator sees the checker's word-by-word reading. The scorer does not count what Liraasa does not encode: gender, articles, fine tense, and names.
- **Coinages.** Coinages are compounds of headwords, kept in `translation/registry.json`, and never words of Liraasa until the author adds them. A coined form must be one of the compound's forms by rule.
- **Kept out of git.** The novel's text and the draft are local only: the manuscript, the segments, the outputs, the draft, the decisions and `REVIEW.md`. The tools and `review/2100_dreams_vocabulary_candidates.md` are committed.

## Result

All 1,648 segments are translated.

| Measure                | Result |
| ---------------------- | ------ |
| Pass the checker       | 92%    |
| Meaning kept (average) | 0.74   |
| High confidence        | 465    |
| Medium confidence      | 694    |
| Low confidence         | 489    |

The author reviews `translation/REVIEW.md`, then `decisions.md`. `apply_decisions.py` re-translates only the segments that a change affects. The vocabulary candidates are proposals for a later patch: a new root or gloss stays the author's decision (SPEC §14).
