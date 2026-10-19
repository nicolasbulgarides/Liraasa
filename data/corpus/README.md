# data/corpus/

Validator corpora. `npm run validate` and `validate_1_1.py` read `*.txt` here;
lines starting `#` are ignored, so English sits on `# EN:` comment lines.

| Directory        | What it is                                                                                                                                                                 | Validated?                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `legacy_0_8/`    | The six songs, extracted from the 0.8 Grammar Guide and Codex PDF. **Pre-1.0 text**, so it still contains retired spellings.                                               | No — ruling 1.0:G19 reads it under 0.8 |
| `songs_1_0/`     | The same six songs run through `migrate_text.py`.                                                                                                                          | Yes                                    |
| `bumrepago_1_0/` | _Bumrepago_, 1.0 revised edition, from the supplied PDF. The play only; the grammar-notes appendix is excluded because its rows mix English headers into Liraasa examples. | Yes                                    |
| `songs_2_3/`     | The six songs carried into the current (2.3) spelling by `scripts/migrate_corpus.ts` (the respellings since 2.0 only; comment lines untouched). What Learn and the MFA export read.                     | Yes                                    |
| `bumrepago_2_3/` | _Bumrepago_ carried into 2.3 spelling the same way.                                                                                                                         | Yes                                    |

`song_migration_report.json` records all 17 substitutions across 7 distinct
spellings, including `rohura → folnipatufa` and `yoga → yomla`, which match the
Migration workbook's own "Song Migration" sheet.

Regenerate the migration with:

```sh
cd data/source
python migrate_text.py ../lexicon/liraasa_1_1.json ../corpus/legacy_0_8 ../corpus/songs_1_0 \
  --report ../corpus/song_migration_report.json
```

`corpus_migration_2_3.json` records every line the respellings since 2.0
changed (ADR-0017, ADR-0018, ADR-0019). Regenerate with `npx tsx scripts/migrate_corpus.ts`.

`album_2_0/` holds the album (twelve tracks and the alternate 05), as
recorded: canon 2.0 text read with 2.0 spellings (2.2:G68). Never edited.
