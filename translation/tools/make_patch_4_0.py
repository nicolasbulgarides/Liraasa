"""Write data/proposals/liraasa_4_0_patch.json: Liraasa 4.0, what translating 2100 Dreams needed.

    python translation/tools/make_patch_4_0.py

The author asked (2026-10-26) that 4.0 be defined by what the draft translation of 2100 Dreams
needed, made by the editor's judgement. It is in the author's patch shape, so it builds through
make_changeset_3_0's additions builder like every 3.x patch:

- compounds: every coinage the draft uses (translation/registry.json, counted in out/), each a
  compound of two existing headwords, colour bases or time nouns; senses that share a compound are
  joined; one already a word of 3.6 is left out;
- English aliases for listed words the draft needed and its lookup missed;
- rulings 4.0:G156-G161: the grammar defaults the draft relied on (quote-first dialogue,
  adjective order, durations, comparing actions, destiny, decimals), each example checked.

No root is added and no spelling changes.
"""
import json
import os
import re
from collections import Counter, defaultdict

import common

OUT = os.path.join(common.REPO, "data", "proposals", "liraasa_4_0_patch.json")

RULINGS = [
    {"id": "4.0:G156", "topic": "A quotation before its verb of saying",
     "rule": "A direct quotation may come before its verb of saying, closed by a comma inside the quotation marks: “…,” saivo po senosia. It may also follow its verb after a colon (2.3:G83). The quotation is its own sentence or sentences; the clause around it is read without it.",
     "examples": [["“Maivo ne pagopa,” saivo po senosia.", "“I am not going,” she said."],
                  ["“Taivo lirala ki?” maivo po masuma.", "“Are you singing?” I asked."]],
     "resolves": "Speech before its verb of saying (the draft's G-9)."},
    {"id": "4.0:G157", "topic": "The order of adjectives",
     "rule": "Two or more adjectives before one noun stand in this order: opinion, size, age, shape, colour, origin, material, purpose. With more than three, put one in a raho clause.",
     "examples": [["Saivo po vimova baba vanisan nolsasan kadu.", "She saw a beautiful new car."],
                  ["Li lira raho ka molusan ka vanisan.", "The song, which is gentle, is beautiful."]],
     "resolves": "The order of two or more adjectives before one noun (A4.22, I-28)."},
    {"id": "4.0:G158", "topic": "Durations",
     "rule": "A duration is en + NUMBER + a time noun after the verb: en dossa deya, for two days. en rinbakrono (3.0:G139) is its unbounded case.",
     "examples": [["Maivo po lisrola en dossa deya.", "I stayed for two days."]],
     "resolves": "A duration (“for two days”) in general (I-17)."},
    {"id": "4.0:G159", "topic": "Comparing actions",
     "rule": "An action is compared with la kasi (or la menu) + an adjective + tamo X: Maivo lirala la kasi benasan tamo taivo, I sing better than you. With no adjective, use benasan (well) or mellisan (much).",
     "examples": [["Maivo lirala la kasi benasan tamo taivo.", "I sing better than you."]],
     "resolves": "Comparing an action with no manner adjective (“I sing more than you”)."},
    {"id": "4.0:G160", "topic": "Destined to",
     "rule": "“Destined to” is fatofa sidu + verb: Saivo fatofa sidu lirala. ke sidu is not used for destiny.",
     "examples": [["Saivo fatofa sidu lirala.", "She is destined to sing."]],
     "resolves": "ke sidu VERB as “destined to” (album 08): fatofa sidu instead."},
    {"id": "4.0:G161", "topic": "Decimals and percentages",
     "rule": "A decimal or a percentage is said as a fraction, NUMBER de NUMBER (trezira-penta de centa, thirty-five per cent), or rounded.",
     "examples": [["Trezira-penta de centa nelari po lirala.", "Thirty-five per cent of the people sang."]],
     "resolves": "Decimals (2.5:G125)."},
]
ALIASES = [
    {"form": "mavopagoasa", "add_english": "heaven"},
    {"form": "lavbujuba", "add_english": "dedication (of a book); offering"},
]


def main():
    ref = common.load(common.LEXICON)
    domain_of, forms, heads = {}, set(), set()
    for dom, lines in ref["dictionary"]["by_domain"].items():
        for l in lines:
            h = l.split(":", 1)[0].split(" ")[0]
            heads.add(h)
            domain_of[h] = dom
            forms.add(h)
            for seg in l.split(":", 1)[1].split("|"):
                m = re.match(r"\s*(\S+)\s*\((\w+)\)", seg)
                if m and not seg.strip().startswith("("):
                    forms.add(m.group(1))
    reg = common.load(common.REGISTRY)["coinages"]
    recs = [r for ch in common.chapters() for r in common.read_jsonl(os.path.join(common.OUT, ch))]
    toks = Counter(w.lower() for r in recs for w in re.findall(r"[A-Za-z][A-Za-z-]*", r["liraasa"]))
    senses = defaultdict(list)
    verbs = {}
    parts_of = {}
    for eng, v in reg.items():
        used = {f: s for f, s in v["forms"].items() if toks[f] or toks[f + "ri"]}
        if not used:
            continue
        joined = "".join(v["parts"])
        senses[joined].append(eng)
        parts_of[joined] = v["parts"]
        for f, s in used.items():
            if s == "v":
                verbs[joined] = (f, eng)
    compounds, skipped = [], []
    for joined, engs in sorted(senses.items()):
        if joined in forms:
            skipped.append(joined)
            continue
        a, b = parts_of[joined]
        meaning = "; ".join(dict.fromkeys(e.strip() for e in engs))
        fs = {"n": {"form": joined, "meaning": meaning}}
        if joined in verbs:
            f, eng = verbs[joined]
            fs["v"] = {"form": f, "meaning": f"to {eng}" if not eng.startswith("to ") else eng}
        compounds.append({
            "module": "core", "headword": joined, "parts": [a, b],
            "domain": domain_of.get(b) or domain_of.get(a) or "Language & art", "tier": 2,
            "archetype": None, "image_compound": False, "title": False, "forms": fs,
            "note": f"Coined for the 2100 Dreams draft translation ({sum(toks[x] for x in fs and [joined])} uses).",
        })
    base = {"headwords": 2242, "meaningful_forms": 5140}
    patch = {
        "patch": "Liraasa 4.0: what translating 2100 Dreams needed",
        "base_version": "3.6", "target_version": "4.0",
        "status": "PROPOSED: made by the editor at the author's request (2026-10-26), from the draft translation of 2100 Dreams",
        "base_file": "liraasa_3_6.json", "base_counts": base,
        "principles": ["No new roots: every word is a compound of existing headwords, colour bases or time nouns.",
                       "Only what the draft used: a coinage the finished draft does not use is left out.",
                       "The grammar defaults the draft relied on become rulings, each example checked."],
        "modules": {"core": "The vocabulary and grammar the draft translation of 2100 Dreams needed"},
        "function_words_add": [], "rulings_add": RULINGS, "roots_add": [], "compounds_add": compounds,
        "listed_derivations_add": [], "lexicalised_diminutives_add": [], "restored_forms_add": [],
        "rejected_proposals": [{"headword": s, "why": "already a word of 3.6"} for s in skipped],
        "recipes_add": [], "english_aliases_add": ALIASES, "test_sentences": [], "validation": {"errors": []},
        "counts": {"new_roots": 0, "new_compounds": len(compounds),
                   "headwords_after": base["headwords"] + len(compounds),
                   "meaningful_forms_after": base["meaningful_forms"] + sum(len(c["forms"]) for c in compounds)},
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(patch, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {OUT}: {len(compounds)} compounds, {len(RULINGS)} rulings, {len(ALIASES)} aliases; skipped {skipped}")


if __name__ == "__main__":
    main()
