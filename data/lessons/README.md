# data/lessons/

The learning module's author data (ADR-0015). Lessons themselves are
generated from the lexicon and the corpus at runtime; this folder holds only
what the author decides on top of them.

`overrides.json`, keyed by id, never by spelling:

| Key              | What                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| `pins`           | nodes to teach first, in order (`root:lx_…`, `concept:slot:TENSE`)              |
| `levels`         | item or concept id → `core` or `advanced`                                       |
| `notes`          | item, concept or ruling id → `{explanation, mnemonic}` (Markdown, `[[id]]` links) |
| `lessons`        | custom lessons: `{id, title, after: node, refs, body}`                          |
| `rulingLinks`    | ruling id → the concepts it belongs to                                          |
| `exclude`        | concepts left out of the curriculum (project policy, not grammar)               |
| `rulingExamples` | ruling id → sentence keys the author confirmed illustrate it                    |

Edit it in the editor (Learn → Author), then **Download overrides.json** into
this folder and run `npm run build:learn`. `npm run learn:report` writes the
curriculum and every gap to `review/learn_report.md`.
