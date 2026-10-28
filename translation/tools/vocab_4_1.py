"""Liraasa 4.1: the vocabulary the 2100 Dreams draft still had to paraphrase.

    python translation/tools/vocab_4_1.py            # mine, ask, check, write the patch
    python translation/tools/vocab_4_1.py --limit 60 # a trial on the sixty most frequent gaps

The author asked (2026-10-27) to do everything possible to raise the draft's meaning kept. Most of
the remaining loss is vocabulary: a paraphrase where English has a word. This collects the English
words and short phrases the draft's calls logged as paraphrased, most frequent first, leaves out
those 4.0 already names, and asks the strongest model, in batches with the dictionary entries
that relate, for one MODIFIER+HEAD compound of existing headwords each, or the existing word that
already covers it. Every answer is checked: two parts that are headwords, colour bases or time
nouns, spelled as the two joined, colliding with no existing form or with another new word. What
passes is written as data/proposals/liraasa_4_1_patch.json, in the author's patch shape, with the
existing words as English aliases. No root is added; no spelling changes.
"""
import argparse
import json
import os
import re
from collections import Counter

import common
import run

OUT = os.path.join(common.REPO, "data", "proposals", "liraasa_4_1_patch.json")
CACHE = os.path.join(common.ROOT, "vocab_4_1_answers.json")
# left out by the editor's reading of the answers: adjectives and verb phrases (not nouns), and one-off
# descriptions from the novel that are not concepts a dictionary needs
EXCLUDE = {"barely-burnt", "looked down", "chronologically-bound affection", "presumed torture", "get high",
           "sneaky", "indignant", "de-winged bird", "burly form", "tiny human", "aura type",
           "congratulatory anthem", "sappy talk", "triumphant joy", "tickle attack", "midflight",
           # 4.2: phrases, adverbs and adjectives (no noun to name), names, and a verb
           "ability access", "ability lock", "acquiring talent", "actually intervene", "captured through",
           "same set", "long ago", "coincidentally", "morose", "unique", "sustainable", "periodic",
           "hypersexual", "cadence corner", "guild", "the guild", "predict", "grooming access", "cartoon love",
           "autonomously"}
SKIP = re.compile(r"^(part\b|chapter\b|haha|hm+|ok(ay)?$|oh$|um+$|uh$|yeah$|march|april|may$|june|july|\d)")

ASK = """\
# Task: Liraasa words for English the draft had to paraphrase

For each English word or phrase below, give ONE of:
- an existing Liraasa form that already means it (exact, as listed in the entries), or
- one MODIFIER + HEAD compound of two existing headwords (head last, spelled as the two joined,
  2.0:G38-G42, 3.2:G142), the way hologram is lumisovla (light-shape), with its image.
Prefer the existing word whenever it fits. Use only headwords that appear in the entries. Never
invent a root. A word that is a name, an interjection or a grammar word: skip it.

## Dictionary entries
{entries}

## English
{words}

## Reply

A JSON array: [{{"english": "…", "existing": "form or empty", "liraasa": "compound or empty",
"parts": ["…", "…"], "image": "the image in English"}}]
"""


def gaps(book, limit):
    recs = [r for ch in book.segs for r in book.out[ch].values()]
    c = Counter()
    for r in recs:
        for x in r.get("calls") or []:
            if isinstance(x, dict) and x.get("type") in ("paraphrase", "idiom"):
                e = str(x.get("english", "")).strip().lower().strip(".,!?'\"")
                if 0 < len(e.split()) <= 2 and re.fullmatch(r"[a-z' -]+", e) and not SKIP.match(e):
                    c[e] += 1
    named = set()
    for v in book.lemma.values():
        pass
    reg = book.registry.get("coinages", {})
    out = [w for w, _ in c.most_common() if w not in reg]
    return out[:limit]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=360)
    a = ap.parse_args()
    state = run.State()
    book = run.Book()
    run.prompts.build_system()
    words = gaps(book, a.limit)
    answers = common.load(CACHE, {}) or {}
    todo = [w for w in words if w not in answers]
    for k in range(0, len(todo), 45):
        batch = todo[k : k + 45]
        entries = book.entries(batch, cap=700, per=8)
        try:
            reply = run.json_array(run.claude(state, ASK.format(entries="\n".join(entries), words="\n".join(batch)),
                                              run.MODEL_STRONG, "vocab-4.1"))
        except run.Flagged:
            continue
        for x in reply:
            if isinstance(x, dict) and x.get("english"):
                answers[str(x["english"]).lower()] = x
        for w in batch:
            answers.setdefault(w, {"english": w})
        common.save(CACHE, answers)
        run.log(f"vocab 4.1: {min(k + 45, len(todo))} of {len(todo)} asked")
    write_patch(book, words, answers)
    for p in run.PARSERS:
        p.close()


def write_patch(book, words, answers):
    forms = set(book.form)
    heads, colours, timen = book.heads, book.colours, book.timen
    lines = {}
    for dom, ls in common.load(common.LEXICON)["dictionary"]["by_domain"].items():
        for l in ls:
            lines[l.split(":", 1)[0].split(" ")[0]] = dom
    compounds, aliases, rejected, taken = [], [], [], set()
    for w in words:
        x = answers.get(w) or {}
        ex = str(x.get("existing", "") or "").strip().lower()
        lir = str(x.get("liraasa", "") or "").strip().lower()
        parts = [str(p).lower() for p in (x.get("parts") or [])]
        if ex and ex in forms:
            # an alias only where the dictionary cannot already find the English: an alias for a
            # word it finds adds nothing and can mislead the reader ("study" read as a noun)
            if not book.lemma.get(w):
                aliases.append({"form": ex, "add_english": w})
            continue
        if not lir:
            continue
        # a dictionary word names a thing: no verb forms (-ed, -ing), no one-off jokes or slogans
        if re.search(r"(ed|ing)$", w) or w.count("-") > 1 or re.search(r"fuck|shit", w) or len(w.split()) > 2:
            rejected.append({"english": w, "proposed": lir, "parts": parts, "why": "not a dictionary noun (a verb form, a joke or a slogan)"})
            continue
        # plural English names the singular sense
        if w in ("pants", "news", "physics"):
            pass
        elif re.search(r"[^aeiou]ies$", w):
            w = w[:-3] + "y"
        elif re.search(r"(sh|ch|x|ss)es$", w):
            w = w[:-2]
        elif re.search(r"[^s]s$", w) and not re.search(r"(ss|us|is|ics|news)$", w):
            w = w[:-1]
        if w in EXCLUDE:
            rejected.append({"english": w, "proposed": lir, "parts": parts, "why": "an adjective, a verb phrase or a one-off description (the editor)"})
            continue
        ok = (len(parts) == 2 and all(p in heads or p in colours or p in timen for p in parts)
              and lir == "".join(parts) and lir not in forms and lir not in taken)
        if not ok:
            rejected.append({"english": w, "proposed": lir, "parts": parts, "why": "parts not headwords, misspelled, or already a word"})
            continue
        taken.add(lir)
        a, b = parts
        compounds.append({
            "module": "core", "headword": lir, "parts": [a, b],
            "domain": lines.get(b) or lines.get(a) or "Language & art", "tier": 2, "archetype": None,
            "image_compound": False, "title": False,
            "forms": {"n": {"form": lir, "meaning": f"{w} ({str(x.get('image', '')).strip()})" if x.get("image") else w}},
            "note": "For a gap the 2100 Dreams draft had to paraphrase (4.1, the author's request of 2026-10-27).",
        })
    # one alias per form and English
    seen, uniq = set(), []
    for al in aliases:
        k = (al["form"], al["add_english"])
        if k not in seen:
            seen.add(k)
            uniq.append(al)
    ref = common.load(common.LEXICON)
    base = dict(ref["dictionary"]["count"])
    patch = {
        "patch": "Liraasa 4.1: the vocabulary the 2100 Dreams draft still paraphrased",
        "base_version": "4.0", "target_version": "4.1",
        "status": "PROPOSED: made by the editor at the author's request (2026-10-27)",
        "base_file": "liraasa_4_0.json", "base_counts": base,
        "principles": ["No new roots: every word is a compound of existing headwords, colour bases or time nouns.",
                       "An existing word that covers the sense is preferred, and made findable as an English alias."],
        "modules": {"core": "The vocabulary the 2100 Dreams draft still had to paraphrase"},
        "function_words_add": [], "rulings_add": [], "roots_add": [], "compounds_add": compounds,
        "listed_derivations_add": [], "lexicalised_diminutives_add": [], "restored_forms_add": [],
        "rejected_proposals": rejected, "recipes_add": [], "english_aliases_add": uniq,
        "test_sentences": [], "validation": {"errors": []},
        "counts": {"new_roots": 0, "new_compounds": len(compounds), "headwords_after": base["headwords"] + len(compounds),
                   "meaningful_forms_after": base["meaningful_forms"] + len(compounds)},
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(patch, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {OUT}: {len(compounds)} compounds, {len(uniq)} aliases, {len(rejected)} rejected, from {len(words)} gaps")


if __name__ == "__main__":
    main()
