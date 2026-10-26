"""The meaning-first pass: raise meaning kept on every segment that scores under 0.85.

    python translation/tools/fidelity.py            # every segment under 0.85, lowest first
    python translation/tools/fidelity.py --limit 12 # a trial on the twelve lowest

Earlier repairs fixed grammar by simplifying, which cost meaning: segments that passed first time
average 0.82, repaired ones 0.72. Here the strongest model sees what the scorer said was lost and
how the Liraasa back-translates, and restores the content without simplifying. One retry fixes
checker findings. A rewrite is kept only if it scores higher and does not newly fail the checker.

Before the pass, the vocabulary suggestions (review/2100_dreams_vocabulary_candidates.md) are
registered as draft coinages, and two existing words the draft missed as renderings. They stay
proposals: nothing becomes a word of Liraasa here.
"""
import argparse
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor

import common
import prompts
import report
import run

CANDIDATES = os.path.join(common.REPO, "review", "2100_dreams_vocabulary_candidates.md")
MISSED = {"heaven": "mavopagoasa (Heaven, listed)", "lilac": "violumi (light purple, listed); adjective violumisan"}


def register_suggestions(book):
    """The first checked suggestion for each gap becomes a draft coinage, if its sense is free."""
    text = open(CANDIDATES, encoding="utf-8").read()
    added = 0
    with run.LOCK:
        for m in re.finditer(r"^\| ([a-z' -]+) \| \d+ \| .*? \| \*([a-z]+)\* \(([a-z]+)\+([a-z]+): ([^)]*)", text, re.M):
            eng, form, a, b, image = m.groups()
            if eng in book.registry["coinages"] or form != a + b:
                continue
            book.registry["coinages"][eng] = {
                "liraasa": form, "parts": [a, b], "slot": "n", "forms": {form: "n", form + "san": "a"},
                "rule": "2.0:G40", "alternatives": [], "confidence": "medium", "uses": [], "first": None,
                "context": "", "origin": "vocabulary suggestion (review/2100_dreams_vocabulary_candidates.md)",
                "image": image.strip(),
            }
            added += 1
        for eng, rendering in MISSED.items():
            book.registry.setdefault("renderings", {})[eng] = rendering
    book.save_registry()
    return added


def fidelity_group(state, book, group):
    ch_of = {r["id"]: f"ch{r['id'][1:3]}.jsonl" for r in group}
    before = {r["id"]: json.loads(json.dumps(r)) for r in group}
    texts = [r["english"] for r in group]
    block = "\n".join(json.dumps({"id": r["id"], "english": r["english"], "liraasa": r["liraasa"],
                                  "back": r.get("back", ""), "lost": r.get("lost", "")}, ensure_ascii=False) for r in group)
    prompt = prompts.FIDELITY.format(
        entries="\n".join(book.entries(texts + [r.get("lost", "") for r in group], cap=700, per=10)) or "(none)",
        registry="\n".join(book.registry_for(texts, cap=400)) or "(none)",
        segments=block,
    )
    reply = run.json_array(run.claude(state, prompt, run.MODEL_STRONG, "fidelity"))
    got = {x.get("id"): x for x in reply if isinstance(x, dict)}
    cands = []
    for r in group:
        x = got.get(r["id"])
        if not x or not str(x.get("liraasa", "")).strip():
            continue
        c = dict(r)
        c.update({"liraasa": str(x["liraasa"]).strip(), "gloss": x.get("gloss", r.get("gloss", "")),
                  "coinages": x.get("coinages") or [], "calls": (r.get("calls") or []) + (x.get("calls") or [])})
        probs = run.take_coinages(book, c, r["id"])
        c["check"] = run.check(book, run.parser(), c)
        c["check"]["errors"] += probs
        c["check"]["ok"] = c["check"]["ok"] and not probs
        cands.append(c)
    # one retry on checker findings, fixing exactly what they name
    bad = [c for c in cands if not c["check"]["ok"]]
    if bad:
        run.repair(state, book, bad, 1, run.MODEL_STRONG)
    # score the candidates (as their own records), keep a rewrite only if it is better
    for ch in set(ch_of.values()):
        mine = [c for c in cands if ch_of[c["id"]] == ch]
        if not mine:
            continue
        shadow = {c["id"]: c for c in mine}
        run.score_batch(state, book, ch, mine, run.MODEL_BULK)
        with run.LOCK:
            for c in mine:
                old = before[c["id"]]
                worse_check = old.get("check", {}).get("ok") and not c["check"]["ok"]
                if not worse_check and c.get("score", 0) > old.get("score", 0):
                    c["fidelity"] = {"from_score": old.get("score"), "from": old.get("liraasa")}
                    c["status"] = "parsed" if c["check"]["ok"] else "unparsed"
                    c["confidence"] = run.confidence(c)
                    book.out[ch][c["id"]] = c
                else:
                    old["fidelity_tried"] = True
                    book.out[ch][c["id"]] = old
            for r in group:
                if ch_of[r["id"]] == ch and r["id"] not in shadow:
                    book.out[ch][r["id"]]["fidelity_tried"] = True
        book.save_chapter(ch)
    book.save_registry()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    state = run.State()
    book = run.Book()
    prompts.build_system()
    n = register_suggestions(book)
    todo = sorted((r for ch in book.segs for r in book.out[ch].values()
                   if r.get("score", 1) < 0.85 and not r.get("fidelity_tried") and not r.get("fidelity")),
                  key=lambda r: r.get("score", 0))
    if a.limit:
        todo = todo[: a.limit]
    state.event(f"meaning-first pass: {len(todo)} segments under 0.85 ({n} vocabulary suggestions registered as draft coinages)")
    groups = [todo[k : k + 6] for k in range(0, len(todo), 6)]
    with ThreadPoolExecutor(max_workers=a.workers, thread_name_prefix="f") as pool:
        for f in [pool.submit(fidelity_group, state, book, g) for g in groups]:
            f.result()
    kept = sum(1 for ch in book.segs for r in book.out[ch].values() if r.get("fidelity"))
    state.event(f"meaning-first pass done: {kept} rewrites kept")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
