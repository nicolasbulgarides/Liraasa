"""Apply hand corrections to the draft, then check and re-score each corrected segment.

    python translation/tools/apply_overrides.py

Corrections live in translation/overrides.json as {segment id: {"liraasa": …, "reason": …}}. Run it
while no pass is running (a pass holds the records in memory and would write over a correction).
A correction is applied once; re-running only re-applies one whose text has changed.
"""
import os

import common
import report
import run

OVERRIDES = os.path.join(common.ROOT, "overrides.json")


def main():
    fixes = common.load(OVERRIDES, {}) or {}
    state = run.State()
    book = run.Book()
    done = []
    for sid, fx in fixes.items():
        ch = f"ch{sid[1:3]}.jsonl"
        r = book.out[ch].get(sid)
        if r is None or r.get("liraasa") == fx["liraasa"]:
            continue
        r["override"] = {"from": r.get("liraasa"), "from_score": r.get("score"), "reason": fx["reason"]}
        r["liraasa"] = fx["liraasa"]
        r["check"] = run.check(book, run.parser(), r)
        r["status"] = "parsed" if r["check"]["ok"] else "unparsed"
        done.append((ch, r))
    for ch in {c for c, _ in done}:
        run.score_batch(state, book, ch, [r for c, r in done if c == ch])
    for ch, r in done:
        print(f"{r['id']}: {r['override']['from']} -> {r['liraasa']}  check {r['check']['ok']}  "
              f"score {r['override']['from_score']} -> {r.get('score')}")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
