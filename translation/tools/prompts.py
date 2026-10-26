"""The fixed system prompt (one file, reused by every call so it is cached) and the request texts.

    python translation/tools/prompts.py   # writes translation/prompts/system.md
"""
import json
import os

import common

SYSTEM = os.path.join(common.ROOT, "prompts", "system.md")

# Section 6 of the brief, smoke-tested through the strict checker on 2026-10-25 (report.md lists
# the results). G-2 is no longer open: the author ruled it (3.5:G152).
DEFAULTS = """\
## Provisional grammar defaults (tag every use with its id in `calls`, type "grammar-default")

| ID | Open question | Use tonight | If the checker rejects it |
|---|---|---|---|
| G-1 | Order of two adjectives before one noun | English order (opinion, size, age, shape, colour, origin, material, purpose). The checker reports it "unruled", which is allowed | Move one adjective into a raho clause: li lira raho ka molusan |
| G-2 | maivori and the listener | SETTLED by 3.5:G152: maivori is "we", with or without the listener; write maivo ata taivo only when "you and I" matters | — |
| G-3 | Comparing an action with no manner adjective | la kasi + adjective + tamo X: Maivo lirala la kasi benasan tamo taivo | Two clauses with a manner adjective each |
| G-4 | Durations ("for two days") | en + number + time noun: Maivo po lisrola en dossa deya | A clause: …, ata dossa deya po pagopa |
| G-5 | "to + verb" beyond purpose | a fime clause (Maivo desida fime taivo lisrola), sidu for the same subject | — |
| G-6 | "destined to" | fatofa sidu VERB (Saivo fatofa sidu lirala); never ke sidu | — |
| G-7 | Quantifier measures with kroti / krotiapo | avoid; rephrase | — |
| G-8 | Decimals | a fraction (NUMBER de NUMBER) or a rounded number | — |
"""

STYLE = """\
## Style guide: the voice of 2100 Dreams

- Alianii's journal is first person, ironic, warm and digressive. Keep the rhythm. Split very long English sentences into linked clauses (ata, nara, kasa, fime, raho, a comma).
- Mental health: use the 3.6 mind family with its images: mavonibe (psychosis, mind-fog), mavofaru (mania), mavofaruti (hypomania), lorevopra (bipolar), mavohelna (psychiatry), zeldonibe (antipsychotic). Never sensationalise. Dopamine is dopamina and serotonin is serotonina (copied names).
- Robots: kibo is the everyday word. germanamre (metalhead) is affectionate slang; keep the speaker's attitude.
- Coarse language: translate it with garza (Garza! = fuck/damn; garzasan = damned/fucking; garzaga = to swear), Rupu! (shit), rupunela, larnenela, dapalore (3.6:G154). Do not soften it and do not add any.
- Names: characters are copied as names (2.0:G45), capitalised: Alianii, Amanda, Saraswati, Sara, Hugo, Melody. Places and institutions use the name sheet in the request (Light's Hope = Lumiopi, Everse = Rinbavemi, LearnQuest = Lemujomru, Steelslum = Germarupu, Metal Alliance = Germayano). An unlisted in-world name is copied and logged as a call of type "name".
- Real-world references (Pokémon, Disney, Kindle, Roomba, Espeon, Suicune …) are copied as names (3.5:G151) and logged once as type "reference".
- The book's own words, already in the lexicon: lunovurfa (moonfox), pelipebuvelma (sneakerette), kibosonbu (zeep zoop, a robot's chime), vayesonbu (wazoop!), linuvalmila (to tottle along), mirufarvibudi (Hydrocune), lumiyelmi (zazzle), auruminela (a goldie).
- Wordplay ("non-binary binary bots", the "Hope Tax"): keep the joke's function in Liraasa; log type "wordplay" with the literal rendering as an alternative.
- Idioms and phrasal verbs: translate the meaning, not the words; log type "idiom". Reuse a registered rendering when it recurs.
- Headings: CHAPTER and PART titles and journal datelines are translated too (a dateline keeps its numbers as Liraasa numerals or as written digits, with the month as in the time words).
"""

RULES = """\
## How you work

- Every word you write is a word of the reference below: a listed form, a closed-class word, a numeral, a listed derivation or a word built by its rules (-ti, -ri, -yo …), a motion-prefixed verb, a -san adjective by 3.3:G148 / 3.6:G153, a name, or a registered coinage. Never invent a root. Never use an unused slot ("— (unused)").
- When English needs a word Liraasa lacks, first paraphrase with existing words. Coin only when a word recurs or no paraphrase works: a coinage is a compound of two existing headwords (or a colour base / time noun), modifier first, head last, spelled as the two joined (2.0:G38–G42, 3.2:G142). Reuse a registered coinage for the same sense; never coin a second word for it.
- Your output is checked by the author's strict grammar checker. Write the clause in the template's order: FRAME · SUBJECT · TENSE · ne · MODAL · VERB · OBJECT · ADJUNCTS · ATTITUDE · ki.
"""


def build_system():
    ref = common.load(common.LEXICON)
    keep = ["read_me_first", "hard_rules", "how_to_translate", "clause", "small_words",
            "word_building", "rulings", "recipes", "self_check", "open_questions_do_not_resolve"]
    parts = [
        "You translate the novel 2100 Dreams (by Peter Pietri) from English into Liraasa, a constructed "
        "language built for singing, for its author. You also back-translate and score translations "
        "when asked. You reply with JSON only, exactly in the shape each request gives.",
        RULES,
        DEFAULTS,
        STYLE,
        "## The Liraasa reference (3.6, proposed; everything up to 3.5 is canon)\n\nThe full dictionary is not "
        "included: each request lists the dictionary entries for its words.",
    ]
    for k in keep:
        parts.append(f"### {k}\n\n```json\n{json.dumps(ref[k], ensure_ascii=False)}\n```")
    os.makedirs(os.path.dirname(SYSTEM), exist_ok=True)
    text = "\n\n".join(parts) + "\n"
    with open(SYSTEM, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return text


TRANSLATE = """\
# Task: translate these segments of 2100 Dreams into Liraasa

Strategy for this batch: {strategy}

## Context: the segment before this batch
{context}

## Dictionary entries for the words in this batch
{entries}

## Names in this batch (the name sheet)
{names}

## Registered coinages (reuse them; never coin a second word for the same sense)
{registry}

## The segments
{segments}

## Reply

A JSON array, one object per segment, in order, and nothing else:

[{{"id": "c01-p0042",
  "liraasa": "the whole segment in Liraasa",
  "gloss": "a word-by-word English gloss of your Liraasa",
  "coinages": [{{"english": "balustrade", "liraasa": "zupatobra", "parts": ["zupa", "tobra"], "slot": "n", "rule": "3.2:G142", "alternatives": ["salrutobra"], "confidence": "medium"}}],
  "calls": [{{"type": "idiom|wordplay|reference|register|grammar-default|ambiguity|name|paraphrase", "id": "G-4 (grammar-default only)", "english": "cough up", "rendering": "…", "alternatives": ["…"], "confidence": "low"}}]
}}]

`slot` is n, v or a. A coinage's `liraasa` must be the form you used in the text; for a verb or adjective give that form (and its parts are the noun compound's two headwords).
"""

REPAIR = """\
# Task: repair Liraasa translations the grammar checker rejected

For each segment: the English, your earlier Liraasa, and the checker's findings. Write a new
Liraasa rendering that keeps the meaning and passes the checker. {ladder}

## Dictionary entries for the words in these segments
{entries}

## Registered coinages
{registry}

## The segments
{segments}

## Reply

The same JSON array shape as for a translation: id, liraasa, gloss, coinages, calls. Log any
paraphrase you make as a call of type "paraphrase".
"""

LADDER = {
    1: "Fix exactly what the findings name.",
    2: "Simplify: first split the English into short clauses, then translate each plainly; replace any problem word or phrase with a plain paraphrase of existing words.",
    3: "Plain mode: short simple clauses only, the commonest words, no coinages unless unavoidable; meaning over style.",
}

BACK = """\
# Task: back-translate Liraasa into English

You see only the Liraasa and the dictionary entries for its words, never the English source.
Translate each segment into plain English, as literally as the grammar allows.

## Dictionary entries
{entries}

## Coinages used (compounds awaiting the author)
{registry}

## The segments
{segments}

## Reply

A JSON array: [{{"id": "…", "english": "…"}}], in order, and nothing else.
"""

SCORE = """\
# Task: score meaning agreement

For each segment, compare the source English with the back-translation of its Liraasa. Score
meaning agreement from 0 to 1 (1 = the same meaning; style and word order do not matter, lost
or changed content does). Name what was lost or changed, briefly.

{pairs}

## Reply

A JSON array: [{{"id": "…", "score": 0.0, "lost": "…"}}], in order, and nothing else.
"""


if __name__ == "__main__":
    t = build_system()
    print(f"wrote {SYSTEM}: {len(t)} chars, ~{len(t) // 4} tokens")
