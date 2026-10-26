"""Re-check every translated segment with the current checker bridge, with no model calls.

    python translation/tools/recheck.py

Run while the driver is stopped (it holds the records in memory). Used after the author's
decision of 2026-10-26 to count quote-first dialogue as unruled: segments that failed only on
that order now pass, with an unruled note.
"""
import os

import common
from parse import Parser
from run import Book, confidence


def main():
    book = Book()
    coined = book.coined_map()
    p = Parser()
    changed = 0
    for ch in book.segs:
        for r in book.out[ch].values():
            if not r.get("liraasa"):
                continue
            c = p.check(r["liraasa"], coined)
            was = r.get("check", {}).get("ok")
            r["check"] = {"ok": c.get("ok", False), "errors": c.get("errors", []), "unruled": c.get("unruled", []),
                          "warnings": c.get("warnings", []), "checker_gloss": c.get("gloss", "")}
            r["status"] = "parsed" if r["check"]["ok"] else "unparsed"
            if r.get("score") is not None:
                r["confidence"] = confidence(r)
            if was != r["check"]["ok"]:
                changed += 1
                r["rechecked"] = "2026-10-26: quote-first dialogue counted unruled"
        book.save_chapter(ch)
    p.close()
    print(f"re-checked every segment; {changed} changed status")


if __name__ == "__main__":
    main()
