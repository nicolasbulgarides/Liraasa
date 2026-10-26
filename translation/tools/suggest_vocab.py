"""Suggest a compound for each vocabulary gap the draft met, for the author to accept or not.

    python translation/tools/suggest_vocab.py

Reads the English words in review/2100_dreams_vocabulary_candidates.md, asks the model once (on
the subscription, as run.py does) for one or two MODIFIER+HEAD compounds of existing headwords per
word, keeps only those whose parts are headwords (or colour bases / time nouns) and whose
spelling collides with no existing form, and writes them into the file as a column. Suggestions
only: no word of Liraasa is made here (SPEC §14).
"""
import json
import os
import re

import common
import run

PATH = os.path.join(common.REPO, "review", "2100_dreams_vocabulary_candidates.md")
SKIP = {"dear", "haha", "of course", "at least", "in fact", "march", "thirty-five percent", "join us", "welcome",
        "actually", "basically", "mostly", "technically", "in person", "quotation marks", "indefinitely"}

ASK = """\
# Task: propose Liraasa compounds for vocabulary gaps

For each English word below, propose one or two compounds of existing Liraasa headwords (MODIFIER +
HEAD, head last, spelled as the two joined; 2.0:G38-G42, 3.2:G142), the way 3.6 built hologram as
lumisovla (light-shape). Use only headwords from the dictionary entries given. Where an existing word
already covers the sense well, say so instead of coining. Never invent a root.

## Dictionary entries
{entries}

## Words
{words}

## Reply

A JSON array: [{{"english": "…", "existing": "a listed word that covers it, or empty",
"compounds": [{{"liraasa": "…", "parts": ["…", "…"], "image": "the image in English"}}]}}]
"""


def main():
    text = open(PATH, encoding="utf-8").read()
    rows = re.findall(r"^\| ([a-z' -]+) \| (\d+) \|", text, re.M)
    words = [w for w, n in rows if w not in SKIP][:45]
    book = run.Book()
    state = run.State()
    run.prompts.build_system()
    entries = book.entries(words, cap=600, per=8)
    reply = run.json_array(run.claude(state, ASK.format(entries="\n".join(entries), words="\n".join(words)),
                                      run.MODEL_STRONG, "vocab"))
    forms = set(book.form)
    out = {}
    for r in reply:
        if not isinstance(r, dict):
            continue
        e = str(r.get("english", "")).lower()
        keep = []
        for c in r.get("compounds") or []:
            parts = c.get("parts") or []
            joined = "".join(parts)
            if (len(parts) == 2 and all(p in book.heads or p in book.colours or p in book.timen for p in parts)
                    and c.get("liraasa", "").lower() == joined and joined not in forms):
                keep.append(f"*{joined}* ({'+'.join(parts)}: {c.get('image', '')})")
        ex = str(r.get("existing", "")).strip()
        out[e] = "; ".join(keep) + (f"; or the existing *{ex}*" if ex and keep else f"existing: *{ex}*" if ex else "")
    lines = text.split("\n")
    res = []
    for l in lines:
        if l.startswith("| English | Times | How the draft managed |"):
            l = "| English | Times | How the draft managed | Suggested (not yet Liraasa) |"
        elif l.startswith("|---|---:|---|") and not l.startswith("|---|---:|---|---|"):
            l = "|---|---:|---|---|"
        else:
            m = re.match(r"^\| ([a-z' -]+) \| (\d+) \| (.*) \|$", l)
            if m:
                l = f"| {m.group(1)} | {m.group(2)} | {m.group(3)} | {out.get(m.group(1), '')} |"
        res.append(l)
    open(PATH, "w", encoding="utf-8", newline="\n").write("\n".join(res))
    print(f"suggestions for {sum(1 for v in out.values() if v)} of {len(words)} words")


if __name__ == "__main__":
    main()
