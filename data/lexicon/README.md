# data/lexicon/

The **working** canonical lexicon, in the author's schema plus only the
additive fields documented in `docs/SCHEMA.md` §2.

Empty until Phase 1, when `npm run lexicon:import` populates it from
`data/source/liraasa_1_0.json`.

- `liraasa_1_0.json` — the working copy
- `ids.json` — stable id map, so ids survive a tool that strips additive fields
- `backups/` — timestamped backup on every save (gitignored)
