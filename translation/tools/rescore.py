"""Score the weak segments three times and keep the mean, so one unlucky score does not decide.

    python translation/tools/rescore.py            # every segment under 0.85
    python translation/tools/rescore.py --below 0.8

One back-translation and score is noisy: the scorer moves in steps of 0.05 and the
back-translator can misread a word. Each segment under the threshold gets two more independent
back-translations and scores; its score becomes the mean of the three (stored in `scores`). The
mean can go down as well as up: this makes the measure steadier, not kinder.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor

import report
import run


def rescore_group(state, book, ch, group):
    first = {r["id"]: r.get("score", 0) for r in group}
    seen = {r["id"]: [first[r["id"]]] for r in group}
    try:
        for _ in range(2):
            run.score_batch(state, book, ch, group)
            for r in group:
                seen[r["id"]].append(r.get("score", 0))
    except run.Flagged:
        return
    with run.LOCK:
        for r in group:
            s = seen[r["id"]]
            r["scores"] = s
            r["score"] = round(sum(s) / len(s), 3)
            r["confidence"] = run.confidence(r)
            book.out[ch][r["id"]] = r
    book.save_chapter(ch)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--below", type=float, default=0.85)
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    jobs = []
    for ch in book.segs:
        todo = [r for r in book.out[ch].values() if r.get("score", 1) < a.below and "scores" not in r]
        jobs += [(ch, todo[k : k + 20]) for k in range(0, len(todo), 20)]
    state.event(f"rescoring: {sum(len(g) for _, g in jobs)} segments under {a.below}, three scores each")
    with ThreadPoolExecutor(max_workers=a.workers) as pool:
        for f in [pool.submit(rescore_group, state, book, ch, g) for ch, g in jobs]:
            f.result()
    state.event("rescoring done")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
