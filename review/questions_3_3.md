# Liraasa 3.3: questions for the author

Liraasa 3.3 is installed whole, as **proposed** (ADR-0023): tier 1 and tier 2, and rulings 3.2:G142–G147 and 3.3:G148. Your ratification of 3.1 is part of the same build. To drop or change an item:

1. Edit `archive/patch_3_3/patches/liraasa_3_3_patch.json`.
2. Run `make_changeset_3_3.ts`, then `integrate:3.3`, then `validate:3.3`.

As you asked, similar sounds and spellings are not raised.

## 1. Four of the patch's sentences break an earlier ruling

The strict checker rejects them, so they are not in the guide's recipes. `tests/grammar/patch_3_3.test.ts` lists them.

- **`Peta da Amerika`** ("Peta from America", 3.2:G147). The ruling's own text says "de + the name means from the place", but the example uses `da`. Either way, 2.5:G98 has no slot for a prepositional phrase after a noun. Which word is meant? Should a noun take a "from" phrase after it? **Answer:**
- **`Saivo milobema la menu.`** ("She smiles slightly", a recipe). `la` takes an adjective (2.5:G105), and `menu` is a degree word. Is `la menu` an exception? **Answer:**
- **`Nayo ola, li linu ke somusia.`** ("Meanwhile, the child is asleep", a recipe). It has two problems:
  - `nayo` opens a clause, not a noun phrase, so `Nayo ola,` ("while that") is not a FRAME;
  - `ke` takes no verb (2.5:G93), so `ke somusia` ("is sleeping") is not a predicate.
  
  How should "meanwhile" and "asleep" be said? **Answer:**
- **`… nayo li dapakadu po kadurivla.`** (a test sentence, "while the taxi was in traffic"). `kadurivla` is listed as a noun only, so `po kadurivla` has no verb. Should it get a verb form, or should the sentence read `… nayo li dapakadu po ke en li kadurivla`? **Answer:**

## 2. A choice the build made

- **Time nouns as modifiers.** 3.2:G142 lets any time noun be a compound's modifier, and `deyanole` (date) = `deya` + `nole` is the first such compound. The build, the validator and Learn now accept a time word in that place, as they accept a colour base (2.0:G38). **Answer:**
