"""Segment the manuscript into paragraphs with stable ids (c01-p0042), one JSONL file per chapter.

    python translation/tools/segment.py

Reads translation/source/manuscript.txt (pdftotext of the PDF). Drops the running header
"2100 DREAMS" and page numbers, rejoins a paragraph split across a page break, fixes the
manuscript-check typos (each logged as a source-typo decision), keeps chapter titles, part
headings and journal datelines as their own segments, and splits paragraphs over ~120 words at
sentence boundaries.
"""
import json
import os
import re

import common
import xlsx

NUM_WORDS = {
    "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8,
    "NINE": 9, "TEN": 10, "ELEVEN": 11, "TWELVE": 12,
}
DATELINE = re.compile(
    r"^(January|February|March|April|May|June|July|August|September|October|November|December) "
    r"\d{1,2}(st|nd|rd|th)?, \d{4}\b"
)
END = re.compile(r"[.!?…:;\"”’)\]]$")


def typos():
    rows = xlsx.sheets(common.MASTER)["Manuscript check"][1:]
    return [(r[0], r[1]) for r in rows if len(r) > 1 and r[0]]


def split_long(text, limit=120):
    if len(text.split()) <= limit:
        return [text]
    sents = re.split(r"(?:(?<=[.!?…])|(?<=[.!?…][\"”’)]))\s+(?=[\"“A-Z0-9])", text)
    out, cur = [], ""
    for s in sents:
        if cur and len((cur + " " + s).split()) > limit:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        out.append(cur)
    return out


def main():
    lines = open(common.SOURCE_TXT, encoding="utf-8").read().split("\n")
    fixes = typos()
    # strip headers and page numbers, remember where page breaks were
    clean = []
    page_break = False
    for raw in lines:
        l = raw.strip()
        if l == "" and not clean:
            continue
        if l == "2100 DREAMS" or re.fullmatch(r"[0-9ivxlc]+", l):
            page_break = True
            continue
        if l == "":
            continue
        clean.append((l, page_break))
        page_break = False
    # the contents page and the title page are not translated: start at CHAPTER ONE, but keep the dedication
    start = next(i for i, (l, _) in enumerate(clean) if l == "CHAPTER ONE")
    ded = next((i for i, (l, _) in enumerate(clean) if l == "DEDICATION"), None)
    front = []
    if ded is not None:
        front = [("heading", clean[ded][0]), ("paragraph", clean[ded + 1][0])]
    body = clean[start:]
    # rejoin paragraphs broken across a page: the previous line ends mid-sentence
    paras = []
    for l, pb in body:
        if pb and paras and paras[-1][0] == "paragraph" and not END.search(paras[-1][1]) and not (
            l.isupper() or DATELINE.match(l)
        ):
            paras[-1] = ("paragraph", paras[-1][1] + " " + l)
            continue
        if l.startswith("CHAPTER "):
            paras.append(("chapter", l))
        elif re.fullmatch(r"PART \d+:", l):
            paras.append(("part", l))
        elif paras and paras[-1][0] == "chapter" and l.isupper() and "—" not in paras[-1][1]:
            paras[-1] = ("chapter", paras[-1][1] + " — " + l)
        elif paras and paras[-1][0] == "part" and l.isupper() and "—" not in paras[-1][1]:
            paras[-1] = ("part", paras[-1][1] + " " + l)
        elif DATELINE.match(l):
            paras.append(("dateline", l))
        else:
            paras.append(("paragraph", l))
    os.makedirs(common.SEGMENTS, exist_ok=True)
    decisions = []
    chapter = 0
    chapters = {0: []}
    for kind, text in front + [("_", None)] + paras:
        if kind == "_":
            continue
        if kind == "chapter":
            word = text.split(" — ")[0].split(" ", 1)[1].strip()
            chapter = NUM_WORDS.get(word, chapter + 1)
            chapters[chapter] = []
        for a, b in fixes:
            if re.search(re.escape(a), text, re.I):
                text = re.sub(
                    re.escape(a), lambda m: b.upper() if m.group(0).isupper() else b, text, flags=re.I
                )
                decisions.append({"type": "source-typo", "printed": a, "meant": b, "chapter": chapter})
        pieces = split_long(text) if kind == "paragraph" else [text]
        for piece in pieces:
            chapters[chapter].append({"kind": kind, "english": piece})
    total = 0
    for ch, segs in chapters.items():
        if not segs:
            continue
        path = os.path.join(common.SEGMENTS, f"ch{ch:02d}.jsonl")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            for i, s in enumerate(segs, 1):
                s = {"id": f"c{ch:02d}-p{i:04d}", **s}
                f.write(json.dumps(s, ensure_ascii=False) + "\n")
        total += len(segs)
        print(f"ch{ch:02d}: {len(segs)} segments, {sum(len(s['english'].split()) for s in segs)} words")
    with open(os.path.join(common.ROOT, "source_typos.json"), "w", encoding="utf-8") as f:
        json.dump(decisions, f, ensure_ascii=False, indent=1)
    print(f"{total} segments; {len(decisions)} source typos fixed")


if __name__ == "__main__":
    main()
