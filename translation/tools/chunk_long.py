"""Re-translate long paragraphs in small pieces, so no detail is dropped to keep a sentence whole.

    python translation/tools/chunk_long.py               # every paragraph over 50 words under 0.85
    python translation/tools/chunk_long.py --limit 12    # a trial

Measured on the draft: paragraphs under 40 words keep 0.83 of their meaning, 40-80 words 0.76,
over 80 words 0.71; the loss notes show long paragraphs drop details. Here the English paragraph
is cut into pieces of one or two sentences; the strongest model translates every piece in one call,
seeing the whole paragraph and the current rendering with what it lost. The pieces are joined,
each sentence that fails the checker is fixed on its own (grammar_fix), and the paragraph is
scored as a whole. The new rendering is kept only if it passes and scores higher.
"""
import argparse
import json
import re
from concurrent.futures import ThreadPoolExecutor

import grammar_fix
import report
import run

PIECES = """\
# Task: translate a long paragraph into Liraasa piece by piece, losing nothing

The paragraph is cut into numbered pieces. Translate every piece in full: every fact, action,
object, name, attitude and image. A piece may become several short Liraasa sentences; never drop
a detail to keep a sentence simple. The current rendering and what it lost are given so you can
see what to restore.

## The whole paragraph (for context)
{english}

## The current rendering, and what a back-translation showed it lost
{current}
Lost: {lost}

## The pieces
{pieces}

## Dictionary entries
{entries}

## Registered coinages (usable in the draft)
{registry}

## Reply

A JSON array, one string per piece, in order: ["…", "…"]
"""


def pieces_of(text, size=2):
    sents = [s for s in re.split(r"(?<=[.!?…])\s+(?=[“\"A-Z0-9])", text.strip()) if s]
    return [" ".join(sents[k : k + size]) for k in range(0, len(sents), size)]


def redo(state, book, r):
    ch = f"ch{r['id'][1:3]}.jsonl"
    before = json.loads(json.dumps(r))
    parts = pieces_of(r["english"])
    if len(parts) < 2:
        return False
    try:
        prompt = PIECES.format(
            english=r["english"], current=r["liraasa"], lost=r.get("lost", ""),
            pieces="\n".join(f"{i + 1}. {p}" for i, p in enumerate(parts)),
            entries="\n".join(book.entries([r["english"], r.get("lost", "")], cap=600, per=8)) or "(none)",
            registry="\n".join(book.registry_for([r["english"]], cap=300)) or "(none)",
        )
        out = run.json_array(run.claude(state, prompt, run.MODEL_STRONG, "chunk"))
        out = [str(x).strip() for x in out if str(x).strip()]
        if len(out) != len(parts):
            return False
        cand = dict(r)
        fixed = []
        for s in grammar_fix.sentences(" ".join(out)):
            f = grammar_fix.fix_sentence(state, book, r["english"], s)
            if f is None:
                return False
            fixed.append(f)
        cand["liraasa"] = " ".join(fixed)
        cand["check"] = run.check(book, run.parser(), cand)
        if not cand["check"]["ok"]:
            return False
        run.score_batch(state, book, ch, [cand])
    except run.Flagged:
        return False
    with run.LOCK:
        if cand.get("score", 0) > before.get("score", 0):
            cand["chunked"] = {"from": before["liraasa"], "from_score": before.get("score"), "pieces": len(parts)}
            cand["status"] = "parsed"
            cand["confidence"] = run.confidence(cand)
            book.out[ch][r["id"]] = cand
            kept = True
        else:
            before["chunk_tried"] = True
            book.out[ch][r["id"]] = before
            kept = False
    book.save_chapter(ch)
    return kept


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--min-words", type=int, default=50)
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    todo = sorted((r for ch in book.segs for r in book.out[ch].values()
                   if r["kind"] == "paragraph" and len(r["english"].split()) > a.min_words
                   and r.get("score", 1) < 0.85 and not r.get("chunked") and not r.get("chunk_tried")
                   and not r.get("fidelity_declined")),
                  key=lambda r: r.get("score", 0))
    if a.limit:
        todo = todo[: a.limit]
    state.event(f"long paragraphs in pieces: {len(todo)} paragraphs over {a.min_words} words under 0.85")
    with ThreadPoolExecutor(max_workers=a.workers) as pool:
        kept = sum(f.result() for f in [pool.submit(redo, state, book, r) for r in todo])
    state.event(f"long paragraphs in pieces done: {kept} of {len(todo)} improved")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
