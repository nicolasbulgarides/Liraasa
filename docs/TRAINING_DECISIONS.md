# Training Hall — decisions

A running log for the Training Hall redesign of Learn (brief: "Liraasa
Training Hall — Design Protocol"; reconnaissance: `review/training_hall_phase0.md`).
Newest last. Each entry: what was decided, why, and who decided.

## D1 — Build on the existing Learn core (author, 2026-10-18)

The Training Hall is a set of new views over `src/core/learn/` (ADR-0015), not
a second program. The scheduler (FSRS/SM-2), progress store, reconcile,
edition diff, grader, exercise generators and the rename/retire tool are
reused. The current Learn views stay available until the author approves the
new ones.

## D2 — Starlight theme (author, 2026-10-18)

The Hall gets a night-sky aesthetic. It is scoped to the Hall (`#learnView`),
so the songbook keeps its paper look. The project rule (light palette on
`:root`, dark under `prefers-color-scheme` and `[data-theme]`) still holds for
the tokens: the Hall defines a night palette and a "dawn" light variant, so
the high-contrast and light-theme settings keep working. Detail in Phase 2.

## D3 — Form rules are read from the data (Claude, Phase 1)

`src/core/learn/forms.ts` reads `morphology.seven_forms`, `verb_rule`,
`lexicalised_derivations` and `phonology.vowels` from the loaded lexicon.
`config/morphology.ts` and `config/slots.ts` remain the typed reference that
the rest of the core uses and that `config.test.ts` checks against the data. A
marker change therefore reaches every Hall table and drill with no code change.
The rest of the core (linker, checker) still follows the typed config and
fails loudly on drift, as before.

## D4 — Stored forms are shown; the rule sits beside them (Claude, Phase 1)

Every headword is `protected`, so the stored form is canon. The engine always
shows it, computes `regularWouldBe` from the data's rule, and marks a form
irregular when they differ:

- `listed`: `verb_rule` names the word (in 1.2, only `opi`). Expected.
- `unexplained`: not listed. It is a finding, summarised as a `form-off-rule`
  gap per slot, and is never corrected.

A real marker change is therefore a changeset that edits the rule **and**
rewrites the forms. A rule edited alone shows up as a finding, never silently.

## D5 — Irregular notes live in overrides (Claude, Phase 1)

The data says nothing about _why_ a form is irregular, and the engine never
writes such a note. `data/lessons/overrides.json` gains `formNotes`, keyed
`"<entry id>|<form slot>"`, for the author's own words. The curriculum
validator reports a key that names no headword or slot (`form-note-unknown`).
It is empty until the author writes one.

## D6 — "Applies" means "has a meaning" (Claude, Phase 1)

The lexicon has no part of speech. A form applies to a word when the data
glosses it with something other than `— (unused)`. `includeUnused` returns
all seven, for "the shape of the word" views.

## D7 — Only attested derivations are shown (Claude, Phase 1)

A study card lists the lexicalised derivations the data records (with their
fixed glosses), not productive `-yo`/`-vu`/`-pago` words built on the fly,
because those would be new words with guessed meanings.

## D8 — Spot the Irregular becomes Spot the Pattern (Claude, proposed)

With one irregular in the whole language, the drill reads verb classes
(`verbClass`), compounds whose verb class comes from the modifier
(`classFromModifier`), and lexicalised derivations. Decided in Phase 4.

## D9 — Audio: recordings and a file manifest (Claude, Phase 8)

Keep in-app recording (IndexedDB), and add `data/audio/manifest.json`
(id → file) bundled by `build:learn`. Coverage counts both. No TTS. Built in
Phase 8: see D35.

## D10 — The Hall is Learn's home; Classic Learn stays one click away (Claude, Phase 2)

Opening Learn lands in the Training Hall. Its nav carries a "Classic Learn"
switch, and Classic's nav a "Training Hall" switch; the choice is remembered
per screen (`A.ui.mode`). Classic's views are unchanged, so nothing is removed
until the author approves the new wings. The Hall registers its views with the
existing router (`go`/`render`/`VIEWS`) rather than adding a second one.

## D11 — Where settings live (Claude, Phase 2)

- **Per learner**, on the profile (`profile.hall`, `HALL_SCHEMA` 1, read by
  `hallOf`): draw size, drill length, Loom length, answer leniency, gloss line,
  hints. They travel with progress export/import. An invalid stored value falls
  back to the default; a newer Hall schema is refused, never half-read.
- **Per screen**, in `localStorage` (`liraasa-learn-ui`, as before): sky, text
  size, contrast, typeface, motion, sound, Hall/Classic.

The daily rhythm and scheduler settings stay where they were, in Classic
Learn → Progress.

## D12 — The starlight theme redefines the songbook's tokens inside Learn (Claude, Phase 2)

`editor/learn/hall.css` sets the songbook's own tokens on `#learnView`
(night by default, Dawn as the light variant, or following the songbook's
theme), so every Learn view — Classic, the exercise runner and Author too —
takes the sky without per-component work. The starfield is CSS gradients only;
nothing is fetched. The twinkle and lift stop under `prefers-reduced-motion`
and under the in-app "Reduced" setting, which has no "full" override.

## D13 — Strings in one file (Claude, Phase 2)

`editor/learn/strings.js` (`LiraasaLearnUI.S`) holds every Hall name and line
of microcopy. Classic Learn's existing inline labels were left alone. The
no-Liraasa scan covers the file: it caught "live", which is also a Liraasa
spelling, so English copy must be checked against it like everything else.

## D14 — Phone width needs a viewport tag the songbook does not have (decided, Phase 8: see D36)

`editor/index.html` has no `<meta name="viewport">`, so a phone renders the
whole songbook at 980px and shrinks it. With the tag injected, the Hall lays out
correctly at 390px (one column of wings, 44px touch targets, no sideways
scroll). Adding it changes the songbook's own phone layout, which only adapts
down to 920px, so it is left for the Phase 8 mobile pass and the author's call.

## D15 — The songbook page renders in quirks mode (decided, Phase 8: see D36)

`editor/index.html` also has no `<!doctype html>`, so it renders in quirks
mode, where tables do not inherit colour or font size. On the night sky the
study card's forms table came out in the songbook's light-theme ink, nearly
invisible. `hall.css` now sets `#learnView table { color: var(--ink) }`. Adding
the doctype would switch the whole songbook to standards mode, so it waits
for the Phase 8 pass alongside the viewport tag (D14).

## D16 — The draw (Claude, Phase 3)

`src/core/learn/stars.ts`. The pool is the current edition's headwords, so a
retired root can never be drawn; a saved draw that names one drops it on load
and the wing says so once. Weightings are **tiers**, not weights: the
favoured words (due, unmet, or met-and-shaky) fill the draw first, in weighted
random order, and the rest of the pool fills what is left. A plain weight lost
a few places to the fifteen hundred other words in every draw. "Words that go
their own way" (D8) is a draw source: the one irregular, compounds whose
meaningful verb takes the modifier's class, and bases of lexicalised
derivations. Part of speech, which the data does not have, becomes "kind of
word" (primal / compound) plus "must have a meaning as" (verb, adjective…).
The draw, its place in the study and the options last used are saved on the
profile (`hall.stars`), so they travel with export and survive a reload.

## D17 — Finishing a study introduces the words (Claude, Phase 3)

Reaching the end of the cards introduces each word (`introduce`), which puts
its cards in the review schedule. "I already know this one" introduces the
word and answers each card as easy, so it returns only at a long interval.
Phase 4 replaced the interim "Practise these now" (Classic Learn's mixed
session) with Ten Stars' own drill (D18).

## D18 — Ten Stars' drill (Claude, Phase 4)

`src/core/learn/drill.ts`. The brief's modes map onto the existing,
tested generators where one fits — Recognize (`recognition`, also on each
form), Recall (`recall`), Form Forge (`formBuild`), Listen (`listen`),
Sentence Slot (`cloze` on the word) and word-meaning Match (`matching`) — and
two are new: **Spot the Pattern** (`spotPattern`, a multi-select grid of
verbs: every one built by a verb class, or every one that goes its own way
when an irregular is drawn; D8) and **Form Match** (`formMatch`, a word's
forms against their names). Every drawn word is asked at least once, then the
modes take turns. Multi-select is a new answer kind (`multi`) in the core
grader and the runner, with a keyboard path (number keys or Enter toggle) and a
tick, not just a colour, on what is chosen.

## D19 — Near misses and leniency are graded with the forms engine (Claude, Phase 4)

`gradeStars` wraps the core grader. A Form Forge answer that is exactly
`regularWouldBe` for an irregular form is **almost**, not wrong, and is named
(`rule-for-irregular`: "That's what the rule would make, and this word goes
its own way: …"), with a link to the rule. Under "Forgive a doubled or single
vowel" an answer that differs from the stored form only in a doubled vowel is
**correct**, with the exact spelling shown (`vowel-length`); under "Exact
spelling" the core grader's own verdict stands. The vowels are the
phonology's, read from the data.

## D20 — Misses come back once; the scheduler is the one Learn already has (Claude, Phase 4)

The runner takes a `requeue` option: a miss is asked again four exercises
later, once. Answers go through `recordReview`, so the drawn words' cards
move on the same FSRS-4.5 scheduler (`scheduler.ts`, with SM-2 behind the same
interface, both already tested). The brief asked for a simple, separate,
tested scheduler; that module already is one, so no second scheduler was
written.

## D21 — Reflect shows how each word went, in light and in words (Claude, Phase 4)

A star's brightness is its share of right answers in the drill, a "nearly"
counting half (`drillResults`): bright from 85%, steady from 50%, faint
below, and "not asked" for a word the drill never reached. Each star also says
it in words, to the eye and to a screen reader. "Drill the shaky ones" runs the
same modes again over the words below bright.

## D22 — The Hall's feedback never shows red (Claude, Phase 4)

`hall.css` restyles feedback for all of Learn: a miss is a calm, dim panel; a
nearly is the gold; a right answer blooms with a little light (not under
reduced motion). The verdict is always words — "Bright." / "Exactly." /
"That one's yours now." for right, "Nearly." and "Not yet." otherwise, in
Ten Stars. Classic Learn keeps its own verdict words.

## D23 — The Loom's engine is the grammar checker, passed in (Claude, Phase 5)

`src/core/learn/loom.ts` is pure, so it cannot import the checker (a browser
script). It takes a `LineCheck` — a line of Liraasa in, the checker's problems
out. The page passes `LiraasaChecker.default`; the tests pass the same checker
loaded into Node (`tests/checker/loadChecker.ts`). Without the checker The Loom
says so and offers no exercises rather than show anything unchecked.

## D24 — Every Loom exercise is one change to a real, clean sentence (Claude, Phase 5)

Sentences come from the data's examples, rulings and the corpus, only those
the checker passes, with English, every word linked and no punctuation inside;
words the learner knows first. Weave, Translate and Reverse use them as they
are; Unravel pairs each word with its gloss; Transform inserts one of a slot's
words (from `grammar.slots`) at every position and keeps the ones the checker
accepts — dropped when it accepts more than two, because then it is not really
checking; Mend and Choose move one closed-class word, or give one headword
another of its own meaningful forms, and keep only versions the checker flags,
whose message becomes the explanation. 1,188 of 1,258 sentences pass the
checker; the other 70 are not used, and are findings for the author (the
checker disagrees with them, mostly forms whose slot is unused).

## D25 — A checker gap: operators before the subject (finding, Phase 5)

The checker passes a tense or negation word placed **before** the subject
("Po maivo …", "Ne maivo …"), though the 20-slot template puts SUBJECT
(slot 3) ahead of every operator. Transform therefore also applies the
template itself: a word from a slot after the subject may not open a clause
that starts with one, and an inserted word may follow only words of earlier or
equal slots and precede only words of later or equal ones (slot numbers from
the data). This is reported here for the checker, not fixed in it.

## D26 — What the Loom accepts, and what it says it cannot judge (Claude, Phase 5)

`gradeLoom` accepts another arrangement of the same words when the checker
passes it **and the content words keep their order**, so particles may move
where the template lets them (time words, `ne`), but subject and object never
swap. A translation that is grammatical but in other words is "nearly", with
"the checker cannot tell whether it means the same" and the reference shown.
"Use it" reads the learner's own sentence the same way: the checker's notes,
and a plain statement that meaning is for the learner to judge.

## D27 — The rule map and lessons (Claude, Phase 5)

Rules are the curriculum's concepts (forms, suffixes, the clause and its 20
slots, the noun phrase, 56 rulings), grouped as threads and ordered by depth in
their prerequisites; nothing is gated. A knot's state is in words — woven,
practised, open, builds on others, no sentences yet — with its mastery as
light. 49 concepts have no clean sentence yet (43 of them 1.0 and 0.8 rulings
the data gives no examples for); their cards say so and point to Author →
Overrides, where the author can confirm sentences for a ruling. A lesson is
See it (the card: the data's pattern and explanation, its words, examples
with interlinear gloss, what it builds on and leads to), Watch it (the first
example arriving word by word; for a form, root + marker sliding together),
Try it (6–10 checked exercises on the rule, or on it and its prerequisites),
Use it (the learner's own sentence, read by the checker).

## D28 — The Sandbox's menus and order come from the data (Claude, Phase 6)

`src/core/learn/sandbox.ts`. The menus: the pronouns; headwords with a
meaningful root (nouns), verb or adjective form, words the learner has met
first and marked, then the most-used (60 a list, or only met words on
request); the determiners the noun-phrase template offers in its `[a|b|c]`
group; and one menu per clause slot that has words of its own (all except
SUBJECT, VERB, OBJECT, ADJUNCTS and TOPIC, which take phrases). The order:
every piece at its slot number from `grammar.slots`; inside a noun phrase,
determiner · adjective · noun · plural suffix, as the template orders them,
the suffix being the one `morphology.suffixes` glosses as plural. A test
renames that suffix in a copy of the data and the Sandbox follows. A slot
whose note says its word is "followed by a pause" (FRAME; 1.2:G24 keeps the
comma) is written with a comma; without it 21 of 300 random builds failed the
checker, with it 299 of 300 pass, and the one left is a stacking exclusion the
data forbids, shown to the learner in the checker's words.

## D29 — The Sandbox builds; the checker judges; the English is a reading (Claude, Phase 6)

Every build is read by the live checker, and its notes are shown as they are.
The "why" panel lists every rule involved — the clause, each slot filled, the
verb form, the noun phrase, the plural ending — each a link to its Loom card.
The English line is the glosses side by side, labelled "a reading of the
glosses side by side, not a translation", because nothing here can translate.

## D30 — No "Save to Codex" or "Send to Translator" (Claude, Phase 6)

The songbook has no way for Learn to hand it a line, and Learn does not write
the learner's writings itself (ADR-0015 keeps the two apart, talking through
events). The Sandbox offers "Copy the sentence" and says the Check tab reads
any line pasted into a writing. A `liraasa:` event for this can be added if
the author wants it.

## D31 — The noun-phrase template has no indefinite article (finding, Phase 6)

`grammar.noun_phrase` lists `[li|eli|ola|OWNER de]`; `baba` ("a / an",
an indefinite article among the function words) is not in it. The Sandbox
offers what the template lists, so `baba` is not a determiner choice. If it
belongs in the template, adding it there adds it to the Sandbox.

## D32 — The Observatory reads the learner's own cards (Claude, Phase 7)

`src/core/learn/observatory.ts`. The sky is every headword the learner has
met (a card or an introduction), oldest first; a star's brightness is the mean
mastery of its cards; a word with an irregular form is drawn as a four-pointed
star, and every star also says it in words to a screen reader, with the same
sky available as a table. The stars sit on a golden-angle spiral, the first met
at the centre: deterministic, no overlaps, nothing random. Threads are the
concepts practised, by mastery. The run of days counts consecutive days with
practice ending today or yesterday; a run that ended is not mentioned at all.

## D33 — "What changed" comes from reconcile, said once for a retirement (Claude, Phase 7)

The changes are what `reconcile` already recorded on the learner's cards —
renamed, reglossed, rewritten (a replacement's twin), retired — one note per
word and kind, whether the change came from a release or from the Roots tool a
minute ago. "Review the cards that changed" builds a session from the badged
cards, and a right answer clears each badge. A retirement stays until the
learner presses "Understood" (`acknowledgeRetired`, kept on the profile so it
travels with export). The edition-wide diff (everything new in the edition,
not only what the learner knew) stays in Classic Learn's What changed, linked
from here.

## D34 — A study card for any word, and links that stay in the Hall (Claude, Phase 7)

The Ten Stars card renders on its own as the `word` view (the same card, with
Back instead of the draw's dots), which the sky's stars open. In Hall mode a
link to a headword opens that card and a link to a concept opens its Loom
lesson; Classic Learn keeps its own card and concept views. Export, import,
full backup and restore sit at the foot of the Observatory as well as in
Settings.

## D35 — The audio manifest (Claude, Phase 8)

`data/audio/manifest.json` maps a key to a path under `data/audio/`: a word's
id or a sentence's key, the same keys the Author view's recordings use. It
ships empty. `build:learn` bundles only the entries whose file exists, and
warns about a key that names nothing, a path that leaves `data/audio/`, or a
missing file (`readAudioManifest`, `src/core/learn/audio.ts`). Learn treats a
manifest file and an in-app recording alike: a play button, a listening
exercise and the `A` key appear only when one of them exists. A recording made
in Learn plays in preference to the file; removing it falls back to the file.
Settings → Audio shows coverage of roots, compounds and sentences
(`audioCoverage`) and the words still to record, roots before compounds and
the most used first, as lines ready to paste into the manifest. Forms are not
keyed separately yet; the brief made them optional. Learn never synthesises
speech.

## D36 — The songbook gets a doctype and a viewport (Claude, Phase 8)

`editor/index.html` now starts with `<!doctype html>` and a viewport tag, and
sets `lang="en"` from a one-line script (an `<html>` element would make the
formatter re-indent all 4,800 lines). In standards mode the songbook looked
the same at 1280px on all six tabs, compared screen by screen; the one visible
difference is the Grammar tab's slot notes, which now take the body's line
height and read less cramped. At 390px the songbook already had a one-column
layout below 920px that the missing viewport had hidden; its gutter widened
from 2.4rem to 3.6rem so line numbers and fix badges clear the margin rule.
The Hall at 390px has no sideways scroll on any wing.

## D37 — The Phase 8 audit (Claude, Phase 8)

Measured in headless Chrome over every Hall view, on the night and dawn skies:

- **Contrast:** every text element meets WCAG AA against the darkest and
  lightest stops of the sky behind it.
- **Names:** no unnamed button, link or summary; no unlabelled field; no
  duplicate id; no positive tabindex.
- **Targets:** every control is at least 44px, or sits inside a 44px label;
  the word card's Back buttons were 32px tall and now meet it.
- **Keyboard:** tabbing reaches every control in reading order with a visible
  ring; `?` opens the shortcut list and Escape closes it. Tile exercises are
  buttons, never drag-and-drop.
- **Motion:** with `prefers-reduced-motion` or the in-app Reduced setting, no
  animation or transition runs on the Hall, Ten Stars or the Loom.
- **Errors:** none in the console across the Hall and the songbook's six tabs.
