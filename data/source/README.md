# Liraasa build tools (1.0)

Python 3 + openpyxl; Node + `docx` for the grammar guide. Everything is deterministic: the same inputs give the same outputs.

| Script | Job |
|---|---|
| `liraasa_core.py` | phonology (syllables, stress, phonotactics), seven forms, verb rule, edit distance |
| `liraasa_lexicon.py` | lexicon index + lexicon-first parser (works on 0.8 and 1.0 JSON) |
| `decisions_1_0.py` | **every editorial decision as data** — retirements, keeps, respellings, new roots, compounds, particles, rulings |
| `build_1_0.py` | applies the decisions to the 0.8 JSON and writes `liraasa_1_0.json` |
| `validate.py` | 24 checks on lexicon, migration, dispositions, examples and corpora (grammar order included); exit 1 on any FAIL |
| `migrate_text.py` | converts 0.8 text to 1.0 with `legacy.migration_forms` |
| `gloss.py` | mechanical literal back-translation (independent of any English source) |
| `compare.py` | checks target distinctions survive in the back-translation |
| `stats.py` | word length, particle frequency, rhyme families, vowel balance |
| `build_workbooks.py`, `guide_content.py` + `render_guide.js`, `build_docs.py`, `codex_data.py` | generate the workbooks, grammar guide and Markdown documents |
| `extract_songs.py`, `analyze_candidates.py`, `candgen.py`, `testnames.py`, `find.py` | research helpers used during the upgrade |

**Rebuild everything:** put `lexicon_0_8_rc2.json` in the project root and run `sh tools/rebuild_all.sh lexicon_0_8_rc2.json`.

**For 1.1 and later:** copy `decisions_1_0.py` to a new decisions file, change it, and rebuild with the 1.0 JSON as baseline. Never edit generated files by hand. `validate.py` takes any later JSON with the same schema; add corpora with `--corpus DIR` (lines starting `#` are ignored).

Paths inside `build_1_0.py` point at the two 0.9 workbooks in `/mnt/user-data/uploads/`; change them if you run elsewhere.
