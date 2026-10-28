"""Check the scorer: re-score a fixed sample under two setups, writing nothing.

    python translation/tools/calibrate.py

Takes 20 segments that scored 0.9 or more and 20 that were re-scored low, and scores each twice
more under the current setup and under the 4.1 setup (its dictionary index and system prompt).
If a setup scores segments that were scored high before markedly lower, the measure has moved.
"""
import json
import os
import random
import statistics
import tempfile

import common
import index
import prompts
import run


def score(state, book, recs):
    """score_batch's back-translation and scoring, without writing anything."""
    reg = [f"{v['liraasa']} ({v['slot']}) = {'+'.join(v['parts'])}: {k}" for k, v in book.registry["coinages"].items()
           if any(v["liraasa"] in r["liraasa"].lower() for r in recs)]
    prompt = prompts.BACK.format(
        entries="\n".join(book.form_entries([r["liraasa"] for r in recs])) or "(none)",
        registry="\n".join(reg) or "(none)",
        segments="\n".join(json.dumps({"id": r["id"], "liraasa": r["liraasa"],
                                       "reading": r.get("check", {}).get("checker_gloss", "")}, ensure_ascii=False) for r in recs),
    )
    back = {b.get("id"): b.get("english", "") for b in run.json_array(run.claude(state, prompt, run.MODEL_BULK, "calibrate", "low")) if isinstance(b, dict)}
    pairs = "\n".join(json.dumps({"id": r["id"], "source": r["english"], "back": back.get(r["id"], "")}, ensure_ascii=False) for r in recs)
    out = {}
    for s in run.json_array(run.claude(state, prompts.SCORE.format(pairs=pairs), run.MODEL_BULK, "calibrate", "low")):
        if isinstance(s, dict):
            try:
                out[s.get("id")] = float(s.get("score", 0))
            except (TypeError, ValueError):
                pass
    return out


def main():
    random.seed(11)
    state = run.State()
    book = run.Book()
    recs = [r for ch in book.segs for r in book.out[ch].values()]
    high = random.sample([r for r in recs if r.get("score", 0) >= 0.9 and "scores" not in r], 20)
    low = random.sample([r for r in recs if r.get("scores") and len(r["scores"]) == 3], 20)
    results = {}
    # setup A: current (4.2)
    prompts.build_system()
    results["4.2"] = {k: [score(state, book, g) for _ in range(2)] for k, g in (("high", high), ("low", low))}
    # setup B: the 4.1 dictionary index and system prompt
    tmp = tempfile.mkdtemp()
    saved = (common.LEXICON, common.INDEX, prompts.SYSTEM)
    common.LEXICON = os.path.join(common.REPO, "handoff", "liraasa_4_1_llm.json")
    common.INDEX = tmp
    prompts.SYSTEM = os.path.join(tmp, "system.md")
    index.main()
    prompts.build_system()
    book.form = common.load(os.path.join(tmp, "form_index.json"))
    results["4.1"] = {k: [score(state, book, g) for _ in range(2)] for k, g in (("high", high), ("low", low))}
    common.LEXICON, common.INDEX, prompts.SYSTEM = saved
    for k, g in (("high", high), ("low", low)):
        first = statistics.mean(r.get("score", 0) if k == "high" else r["scores"][0] for r in g)
        line = f"{k}: stored first score {first:.3f}"
        for setup in ("4.2", "4.1"):
            vals = [d.get(r["id"]) for d in results[setup][k] for r in g if d.get(r["id"]) is not None]
            line += f" | {setup} setup {statistics.mean(vals):.3f} (n={len(vals)})"
        print(line)
    for p in run.PARSERS:
        p.close()


if __name__ == "__main__":
    main()
