"""Bring every segment to a clean pass of the strict checker.

    python translation/tools/grammar_fix.py

For each segment that fails: up to three whole-segment repairs with the strongest model, each fed
the checker's findings; then, sentence by sentence, every sentence that still fails is fixed on its
own (up to three tries each, with the English for context), and the segment is put back together.
A version is kept only if it passes; a passing version is then re-scored. A segment the model's
safeguards decline is left as it is and reported.
"""
import json
import re

import common
import report
import run

SENTENCE_FIX = """\
# Task: fix one Liraasa sentence the grammar checker rejects

The sentence is part of a translation of the English below. Rewrite only this sentence so that it
passes the checker and keeps its meaning; you may split it into two or more sentences. Keep every
word a listed word.

## The English of the whole segment
{english}

## The sentence
{sentence}

## The checker's findings
{findings}

## Dictionary entries
{entries}

## Reply

JSON only: {{"liraasa": "the corrected sentence or sentences"}}
"""


def sentences(text):
    """Split Liraasa text into sentences, keeping quotations whole."""
    out, cur, depth = [], "", 0
    for ch in text:
        cur += ch
        if ch in "“":
            depth += 1
        elif ch in "”":
            depth = max(0, depth - 1)
        if ch in ".!?" and depth == 0:
            out.append(cur.strip())
            cur = ""
    if cur.strip():
        out.append(cur.strip())
    return out


def fix_sentence(state, book, eng, sent):
    coined = book.coined_map()
    p = run.parser()
    for _ in range(3):
        c = p.check(sent, coined)
        if c.get("ok"):
            return sent
        prompt = SENTENCE_FIX.format(english=eng, sentence=sent, findings="\n".join(c.get("errors", [])[:8]),
                                     entries="\n".join(book.entries([eng, sent], cap=300, per=6)) or "(none)")
        reply = run.claude(state, prompt, run.MODEL_STRONG, "grammar-sentence")
        m = re.search(r"\{.*\}", reply, re.S)
        try:
            new = json.loads(m.group(0))["liraasa"].strip() if m else ""
        except (ValueError, KeyError):
            new = ""
        if new:
            sent = new
    return sent if p.check(sent, coined).get("ok") else None


def fix(state, book, r):
    ch = f"ch{r['id'][1:3]}.jsonl"
    before = json.loads(json.dumps(r))
    try:
        for _ in range(3):
            if r["check"]["ok"]:
                break
            run.repair(state, book, [r], 1, run.MODEL_STRONG)
        if not r["check"]["ok"]:
            parts = []
            for s in sentences(r["liraasa"]):
                fixed = fix_sentence(state, book, r["english"], s)
                if fixed is None:
                    parts = None
                    break
                parts.append(fixed)
            if parts:
                r["liraasa"] = " ".join(parts)
                r["check"] = run.check(book, run.parser(), r)
    except run.Flagged:
        run.log(f"{r['id']}: declined by the model's safeguards; left as it was")
        r.update(before)
        return False
    if r["check"]["ok"]:
        r["status"] = "parsed"
        r["grammar_fix"] = {"from": before["liraasa"], "from_score": before.get("score")}
        run.score_batch(state, book, ch, [r])
        with run.LOCK:
            book.out[ch][r["id"]] = r
        book.save_chapter(ch)
        return True
    r.update(before)
    return False


def main():
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    todo = [r for ch in book.segs for r in book.out[ch].values() if not r.get("check", {}).get("ok")]
    state.event(f"grammar fix: {len(todo)} segments fail the checker")
    fixed = sum(1 for r in todo if fix(state, book, r))
    state.event(f"grammar fix done: {fixed} of {len(todo)} now pass")
    for p in run.PARSERS:
        p.close()
    report.write()


if __name__ == "__main__":
    main()
