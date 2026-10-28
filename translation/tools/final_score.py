"""The book's meaning kept, measured once: every segment scored twice in one sitting, one setup.

    python translation/tools/final_score.py

The scorer drifts between runs by about 0.05 (tools/calibrate.py), so scores taken in different
runs are not comparable. This scores every segment twice with the same dictionary index and
system prompt, sets its score to the mean, and records both in `final_scores`. A segment the
scorer declines stays unscored. Resumable: a segment with final_scores is skipped.
"""
from concurrent.futures import ThreadPoolExecutor

import calibrate
import report
import run


def group(state, book, ch, recs):
    try:
        a = calibrate.score(state, book, recs)
        b = calibrate.score(state, book, recs)
    except run.Flagged:
        return
    with run.LOCK:
        for r in recs:
            xs = [d[r["id"]] for d in (a, b) if r["id"] in d]
            if not xs:
                continue
            r["final_scores"] = xs
            r["score"] = round(sum(xs) / len(xs), 3)
            r["confidence"] = run.confidence(r)
            book.out[ch][r["id"]] = r
    book.save_chapter(ch)


def main():
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    jobs = []
    for ch in book.segs:
        todo = [r for r in book.out[ch].values() if "final_scores" not in r and r.get("liraasa") and not r.get("score_refused")]
        jobs += [(ch, todo[k : k + 20]) for k in range(0, len(todo), 20)]
    state.event(f"final scoring: {sum(len(g) for _, g in jobs)} segments, twice each, one sitting")
    with ThreadPoolExecutor(max_workers=3) as pool:
        for f in [pool.submit(group, state, book, ch, g) for ch, g in jobs]:
            f.result()
    state.event("final scoring done")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
