"""The author's short review of the draft: what needs a human eye, ranked, in one page each.

    python translation/tools/review_md.py

Writes translation/REVIEW.md (the calls worth reviewing, from decisions.json and the registry)
and review/2100_dreams_vocabulary_candidates.md (the English words the draft had to paraphrase
most, and the coinages it used more than once: candidates for a vocabulary patch, never words of
Liraasa until the author adds them). Every routine paraphrase stays in decisions.md.
"""
import json
import os
import re
from collections import Counter

import common

REPO_REVIEW = os.path.join(common.REPO, "review", "2100_dreams_vocabulary_candidates.md")


def records():
    return [r for ch in common.chapters() for r in common.read_jsonl(os.path.join(common.OUT, ch))]


def main():
    decs = common.load(os.path.join(common.ROOT, "decisions.json"), [])
    reg = (common.load(common.REGISTRY, {}) or {}).get("coinages", {})
    recs = records()
    by = {}
    for d in decs:
        by.setdefault(d["type"], []).append(d)
    named = lambda xs: [d for d in xs if d["title"] and d["title"] != d["type"]]
    out = ["# 2100 Dreams in Liraasa: what to review", "",
           "The draft is complete. This page lists only what needs your eye, most important first; "
           "everything else (about 5,900 routine paraphrases) stays in `decisions.md` and counts as accepted. "
           "To change anything, edit its entry in `decisions.md` and run `python translation/tools/apply_decisions.py`.", ""]
    # grammar defaults
    out += ["## 1. Grammar defaults used (accepted for the draft)", "",
            "| Default | Segments | What the draft did |", "|---|---:|---|"]
    for d in sorted(by.get("grammar-default", []), key=lambda d: -len(d["segments"])):
        out.append(f"| {d['title'][:90]} | {len(d['segments'])} | {str(d['chosen'])[:80] or '—'} |")
    out += ["", "`G-?` are uses the translator tagged as a default without naming which.", ""]
    # coinages
    multi = sorted(((k, v) for k, v in reg.items() if len(v.get("uses", [])) > 1), key=lambda kv: -len(kv[1]["uses"]))
    out += [f"## 2. Coinages ({len(reg)} proposed; {len(multi)} used more than once)", "",
            "Compounds of existing headwords, built by 2.0:G38–G42 and 3.2:G142. They are **not** words of Liraasa until you add them. The recurring ones first:", "",
            "| English | Liraasa | Parts | Uses |", "|---|---|---|---:|"]
    for k, v in multi:
        out.append(f"| {k} | {v['liraasa']} | {'+'.join(v['parts'])} | {len(v['uses'])} |")
    single = sorted((k, v) for k, v in reg.items() if len(v.get("uses", [])) <= 1)
    out += ["", f"Used once ({len(single)}): " + ", ".join(f"{k} = *{v['liraasa']}*" for k, v in single[:120])
            + (" …" if len(single) > 120 else ""), ""]
    # names and references
    names = sorted(named(by.get("name", [])), key=lambda d: -len(d["segments"]))
    out += [f"## 3. Names ({len(names)} named in-world names; characters are copied by 2.0:G45)", "",
            "| Name | Liraasa | Segments |", "|---|---|---:|"]
    for d in names[:40]:
        out.append(f"| {d['title']} | {str(d['chosen'])[:50] or 'copied'} | {len(d['segments'])} |")
    refs = sorted(named(by.get("reference", [])), key=lambda d: -len(d["segments"]))
    out += ["", "Real-world references, copied (3.5:G151): " + ", ".join(f"{d['title']} ({len(d['segments'])})" for d in refs[:40]), ""]
    # idioms, wordplay, register
    idi = sorted(named(by.get("idiom", [])), key=lambda d: -len(d["segments"]))
    out += [f"## 4. Recurring idioms ({sum(1 for d in idi if len(d['segments']) > 1)} that recur)", "",
            "| English | Rendering | Segments |", "|---|---|---:|"]
    for d in [d for d in idi if len(d["segments"]) > 1][:40]:
        out.append(f"| {d['title']} | {str(d['chosen'])[:60]} | {len(d['segments'])} |")
    out += ["", f"## 5. Wordplay ({len(named(by.get('wordplay', [])))})", ""]
    for d in named(by.get("wordplay", [])):
        out.append(f"- **{d['title']}** → {str(d['chosen'])[:100]}")
    out += ["", f"## 6. Coarse register ({len(named(by.get('register', [])))})", ""]
    for d in sorted(named(by.get("register", [])), key=lambda d: -len(d["segments"]))[:25]:
        out.append(f"- **{d['title']}** ({len(d['segments'])}) → {str(d['chosen'])[:100]}")
    # weakest segments
    unparsed = [r for r in recs if not r.get("check", {}).get("ok")]
    low = sorted((r for r in recs if r.get("score") is not None), key=lambda r: r["score"])[:25]
    out += ["", f"## 7. Segments that still fail the checker ({len(unparsed)})", "",
            ", ".join(r["id"] for r in unparsed), "",
            "## 8. The 25 lowest meaning scores", "",
            "Read these in `draft/interlinear.md`. Some are measurement errors: the dedication's *Loredonu* is the lexicon's word for “dedication”, which the back-translator read as “surrender”.", ""]
    for r in low:
        out.append(f"- **{r['id']}** ({r['score']:.2f}): {r.get('lost', '')[:150]}")
    with open(os.path.join(common.ROOT, "REVIEW.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(out) + "\n")

    # vocabulary candidates: no manuscript text, only English words and Liraasa proposals
    par = Counter()
    how = {}
    for r in recs:
        for c in r.get("calls") or []:
            if isinstance(c, dict) and c.get("type") == "paraphrase":
                e = str(c.get("english", "")).strip().lower()
                if 0 < len(e.split()) <= 2 and re.fullmatch(r"[a-z' -]+", e) and not e.startswith("part"):
                    par[e] += 1
                    how.setdefault(e, str(c.get("rendering", ""))[:70])
    v = ["# 2100 Dreams: vocabulary candidates", "",
         "From the draft translation (ADR-0027, `translation/`). These are **candidates for the author**, not words of Liraasa: "
         "the English words the draft most often had to paraphrase, and the compounds it coined more than once. "
         "A new root, a new gloss or a coinage becomes Liraasa only through a patch the author approves (SPEC §14).", "",
         "## English words paraphrased most often", "",
         "| English | Times | How the draft managed | Suggested (not yet Liraasa) |", "|---|---:|---|---|"]
    sugg = common.load(os.path.join(common.REPO, "review", "2100_dreams_vocabulary_suggestions.json"), {}) or {}
    for e, n in par.most_common(60):
        if n < 2:
            break
        v.append(f"| {e} | {n} | {how[e].replace('|', '/')} | {sugg.get(e, '').replace('|', '/')} |")
    v += ["", "## Coinages the draft used more than once", "", "| English | Compound | Parts | Uses |", "|---|---|---|---:|"]
    for k, val in multi:
        v.append(f"| {k} | {val['liraasa']} | {'+'.join(val['parts'])} | {len(val['uses'])} |")
    with open(REPO_REVIEW, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(v) + "\n")
    print(f"wrote translation/REVIEW.md ({len(out)} lines) and review/2100_dreams_vocabulary_candidates.md")


if __name__ == "__main__":
    main()
