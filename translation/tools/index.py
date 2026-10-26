"""Build the retrieval index: English lemma -> Liraasa entries, and Liraasa form -> entry.

    python translation/tools/index.py

Sources: the dictionary lines, english_aliases, the lexicalised derivations and diminutives
(handoff/liraasa_3_6_llm.json), and the patch's names_sheet. Writes index/lemma_index.json,
index/form_index.json and index/names.json.
"""
import json
import os
import re

import common

STOP = set(
    "a an the of to in on at by for with from and or but not no is are was were be been being am "
    "i you he she it we they me him her us them my your his its our their this that these those "
    "as if so than then there here what who whom which when where why how all any each every some "
    "do does did done have has had having will would shall should can could may might must".split()
)


def lemmas(word):
    """A naive English lemmatiser: the word and its likely bases."""
    w = word.lower().strip("'’")
    out = {w}
    for suf, rep in (("ies", "y"), ("ied", "y"), ("ves", "f"), ("es", ""), ("s", ""), ("ed", ""),
                     ("ed", "e"), ("ing", ""), ("ing", "e"), ("ly", ""), ("er", ""), ("est", ""),
                     ("ness", ""), ("ment", "")):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            out.add(w[: -len(suf)] + rep)
    # doubled final consonant: running -> run
    for x in list(out):
        if len(x) > 3 and x[-1] == x[-2] and x[-1] not in "aeiouls":
            out.add(x[:-1])
    return out


def words(text):
    return re.findall(r"[A-Za-z][A-Za-z'’-]*", text)


def main():
    ref = common.load(common.LEXICON)
    lemma = {}
    form = {}

    def add(eng, line):
        for w in words(eng):
            w = w.lower()
            if w in STOP or len(w) < 2:
                continue
            for l in lemmas(w):
                lemma.setdefault(l, [])
                if line not in lemma[l]:
                    lemma[l].append(line)

    for dom in ref["dictionary"]["by_domain"].values():
        for line in dom:
            head = line.split(":", 1)[0].split(" ")[0]
            form[head] = line
            for seg in line.split(":", 1)[1].split("|"):
                m = re.match(r"\s*(\S+)\s*\((\w+)\)", seg)
                if m and not seg.strip().startswith("("):
                    form[m.group(1)] = line
            meanings = re.sub(r"\[[^\]]*\]|\{[^}]*\}", "", line.split(":", 1)[1])
            add(re.sub(r"\(\w+\)", "", meanings), line)
    for f, eng in ref["english_aliases"]["by_form"].items():
        line = f"{f} (English names): {eng}"
        add(eng, line)
        form.setdefault(f, line)
    wb = ref["word_building"]
    for key in ("lexicalised_derivations", "lexicalised_diminutives"):
        for f, gloss in wb[key].items():
            line = f"{f} (listed {key.split('_')[1][:-1]}): {gloss}"
            add(gloss.split(":")[0], line)
            form[f] = line
    patch = common.load(common.PATCH)
    names = {}
    for n in patch.get("names_sheet", []):
        names[n["english"]] = n
    os.makedirs(common.INDEX, exist_ok=True)
    common.save(os.path.join(common.INDEX, "lemma_index.json"), lemma)
    common.save(os.path.join(common.INDEX, "form_index.json"), form)
    common.save(os.path.join(common.INDEX, "names.json"), names)
    print(f"{len(lemma)} English lemmas, {len(form)} Liraasa forms, {len(names)} names")


if __name__ == "__main__":
    main()
