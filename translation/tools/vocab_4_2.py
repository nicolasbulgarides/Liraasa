"""Liraasa 4.2: the exact words whose meaning shifted in the 2100 Dreams draft.

    python translation/tools/vocab_4_2.py

The scorer's notes name the shifts precisely ("'skinny' became 'small'", "'watchmaker' became 'the
person who built it'"). This collects the English side of every such note, most frequent first,
leaves out what 4.1 or the registry already names, and runs the same ask-and-check as 4.1
(vocab_4_1.py): an existing word, or one compound of existing headwords, each checked; verb forms,
jokes, slogans and the editor's EXCLUDE list are left out. Writes
data/proposals/liraasa_4_2_patch.json. No root is added; no spelling changes.
"""
import argparse
import os
import re
from collections import Counter

import common
import run
import vocab_4_1 as v41

OUT = os.path.join(common.REPO, "data", "proposals", "liraasa_4_2_patch.json")
CACHE = os.path.join(common.ROOT, "vocab_4_2_answers.json")
SHIFT = re.compile(r"['‘\"“]([A-Za-z][A-Za-z' -]{1,28})['’\"”]\s+(?:became|was rendered as|rendered as|softened to|turned into|was replaced by|replaced by|weakened to|flattened to)", re.I)


def shifts(book, limit):
    c = Counter()
    for ch in book.segs:
        for r in book.out[ch].values():
            for m in SHIFT.finditer(str(r.get("lost", ""))):
                w = m.group(1).strip().lower().strip("'")
                if 0 < len(w.split()) <= 2 and not v41.SKIP.match(w):
                    c[w] += 1
    have = set(book.registry.get("coinages", {}))
    ref = common.load(common.LEXICON)
    aliased = {e.strip().lower() for e in ";".join(ref["english_aliases"]["by_form"].values()).split(";")}
    return [w for w, _ in c.most_common() if w not in have and w not in aliased][:limit]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=360)
    a = ap.parse_args()
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    words = shifts(book, a.limit)
    answers = common.load(CACHE, {}) or {}
    todo = [w for w in words if w not in answers]
    for k in range(0, len(todo), 45):
        batch = todo[k : k + 45]
        entries = book.entries(batch, cap=700, per=8)
        try:
            reply = run.json_array(run.claude(state, v41.ASK.format(entries="\n".join(entries), words="\n".join(batch)),
                                              run.MODEL_STRONG, "vocab-4.2"))
        except run.Flagged:
            continue
        for x in reply:
            if isinstance(x, dict) and x.get("english"):
                answers[str(x["english"]).lower()] = x
        for w in batch:
            answers.setdefault(w, {"english": w})
        common.save(CACHE, answers)
        run.log(f"vocab 4.2: {min(k + 45, len(todo))} of {len(todo)} asked")
    v41.OUT = OUT
    v41.write_patch(book, words, answers)
    # the patch shape names the edition it builds
    p = common.load(OUT)
    p.update({"patch": "Liraasa 4.2: the exact words whose meaning shifted in the 2100 Dreams draft",
              "base_version": "4.1", "target_version": "4.2", "base_file": "liraasa_4_1.json",
              "modules": {"core": "The exact words whose meaning shifted in the 2100 Dreams draft"}})
    for c in p["compounds_add"]:
        c["note"] = "For a word whose meaning shifted in the 2100 Dreams draft (4.2, the author's request of 2026-10-27)."
    common.save(OUT, p)
    for q in run.PARSERS:
        q.close()


if __name__ == "__main__":
    main()
