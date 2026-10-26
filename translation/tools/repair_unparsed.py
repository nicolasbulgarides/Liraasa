"""One more repair pass, with the strongest model, on every segment that still fails the checker.

    python translation/tools/repair_unparsed.py

Plain mode (rung 3), six segments a call; a repair is kept only if it passes the checker or has
fewer errors, then the changed segments are back-translated and re-scored, and a rewrite that
scores lower than a passing original is reverted. Usage limits are waited out, as in run.py.
"""
import os

import common
import report
import run


def main():
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    todo = [r for ch in book.segs for r in book.out[ch].values() if not r.get("check", {}).get("ok") and not r.get("unparsed_repair")]
    state.event(f"repair of the {len(todo)} segments that fail the checker (rung 3, {run.MODEL_STRONG})")
    groups = [todo[k : k + 6] for k in range(0, len(todo), 6)]
    for g in groups:
        before = {r["id"]: (r["liraasa"], r.get("score", 0)) for r in g}
        run.repair(state, book, g, 3, run.MODEL_STRONG)
        for r in g:
            r["unparsed_repair"] = True
            r["status"] = "parsed" if r["check"]["ok"] else "unparsed"
        changed = [r for r in g if r["liraasa"] != before[r["id"]][0]]
        chs = {f"ch{r['id'][1:3]}.jsonl" for r in g}
        for ch in chs:
            mine = [r for r in changed if f"ch{r['id'][1:3]}.jsonl" == ch]
            if mine:
                run.score_batch(state, book, ch, mine, run.MODEL_BULK)
            with run.LOCK:
                for r in g:
                    if f"ch{r['id'][1:3]}.jsonl" == ch:
                        book.out[ch][r["id"]] = r
            book.save_chapter(ch)
        book.save_registry()
    ok = sum(1 for r in todo if r["check"]["ok"])
    state.event(f"repair of failing segments done: {ok} of {len(todo)} now pass")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
