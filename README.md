# Liraasa

**Liraasa** is a constructed language built for singing, created by Peter Pietri. Its name is the word for song, `lira`, raised to its highest degree: _liraasa_, “song of the first stars”. Every vowel is pure and is its own syllable, the weight always falls on the second-to-last syllable, and its vocabulary circles four images: `sola` sun, `lore` heart, `luno` moon, `lira` song.

This repository is the **Liraasa Workbench**: the canonical lexicon, the tools that build and check it, and the documents and apps made from it.

## Start here

|                                   |                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Liraasa: An Invitation**        | A 16-page introduction for anyone curious: how it sounds, how words are made, and the Goddess’s Lament read word by word. [PDF](https://github.com/nicolasbulgarides/Liraasa/blob/codex-latest/Liraasa_Invitation.pdf) |
| **Liraasa 2.0 Reference Grammar** | Every rule, patterns from English, and a treasury of words for songwriters. [PDF](https://github.com/nicolasbulgarides/Liraasa/blob/codex-latest/Liraasa_Reference_Grammar.pdf)                                        |
| **The lexicon**                   | The whole language, words and grammar, in one JSON file for reading and for language tools. [liraasa_lexicon.json](https://github.com/nicolasbulgarides/Liraasa/blob/codex-latest/liraasa_lexicon.json)                |
| **The songbook editor**           | A writing tool in the browser: a journal, an English-to-Liraasa composer, a grammar checker and a training program. [Open it](https://nicolasbulgarides.github.io/Liraasa/)                                            |
| **The album**                     | _Liraasa: Songs of the First Stars_, on [Apple Music](https://music.apple.com/us/album/liraasa-songs-of-the-first-stars/6824147719)                                                                                    |

The documents and the lexicon on the [`codex-latest`](https://github.com/nicolasbulgarides/Liraasa/tree/codex-latest) branch are republished automatically whenever the language changes, under names that stay the same from edition to edition.

## The language today

Liraasa **2.0** has 1,462 headwords (474 roots and 988 compounds), each with seven forms made by rule, plus an _image engine_ of 57 modifiers and 31 heads that makes 1,767 more words with readable meanings. The grammar is the frozen grammar of 1.2. Every edition is built from the one before it by a recorded changeset, and every change carries its reason.

## Working on it

Requires Node.js; the validators also need Python 3.

```sh
npm install
npm run dev            # the Workbench app, with hot reload
npm run check          # the gate: typecheck, lint, format check, tests
npm run build:guide    # rebuild the Reference Grammar and the Invitation into handoff/
npm run validate:2.0   # the lexicon validator for edition 2.0
```

The editor in [`editor/`](editor) needs no build to run: open `editor/index.html` in a browser.

Every command is described in [`CLAUDE.md`](CLAUDE.md), with the rules for changing the language: a word is never invented, a spelling is never changed by hand, and an edit to the lexicon is always a changeset that is validated before it is saved.

## Layout

| Folder                | What it holds                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`data/`](data)       | The lexicon for every edition, the changesets between them, the author’s source files and proposals, the song corpus, and the checker and lesson data |
| [`src/`](src)         | The Workbench: a pure TypeScript core, storage, and the app’s interface                                                                               |
| [`editor/`](editor)   | The standalone songbook editor; the GitHub Pages site                                                                                                 |
| [`scripts/`](scripts) | Command-line tools: build, validate, integrate, export, publish                                                                                       |
| [`tests/`](tests)     | Tests, including golden tests built from the real data                                                                                                |
| [`docs/`](docs)       | The specification, schema, architecture, and the decision records                                                                                     |
| [`handoff/`](handoff) | The generated documents and JSON for each edition                                                                                                     |
| [`review/`](review)   | Generated review lists and audits for the author                                                                                                      |
| [`tools/`](tools)     | The local voice lab                                                                                                                                   |
| [`archive/`](archive) | Superseded guides and documents                                                                                                                       |

## Credits

Liraasa, its lexicon, its grammar and its songs are by **Peter Pietri**.
