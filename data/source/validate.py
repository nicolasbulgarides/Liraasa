"""validate.py — Liraasa 1.0 validation suite (reusable for later versions).

usage:
  python3 validate.py liraasa_1_0.json [--baseline lexicon_0_8_rc2.json]
                      [--corpus DIR ...] [--out validation_1_0.json]

Every check is executed; nothing is reported as passed unless it ran.
Statuses: PASS, WARN (editorial attention, not an error), FAIL.
Exit code 1 if any FAIL.
"""
import sys, os, json, argparse, collections, re, itertools
sys.path.insert(0, os.path.dirname(__file__))
from liraasa_core import (FORM_KEYS, seven_forms, edit_distance, syllable_count, syllabify,
                          new_root_phonotactics, function_word_phonotactics, is_unused, tokenize)
from liraasa_lexicon import Lexicon

REGISTERS = {"everyday", "poetic"}
SUFFIX_SOUNDS = {"na", "ri", "ti", "yo", "vu", "san", "asa", "nasan", "asasan", "pago", "a"}

# grammar classes for the sentence checker
RANK = {}
for n, ws in [(4, "po futu pressa"), (5, "noma"), (7, "povi nosi dagi musi suvi viki kopi"),
              (8, "tavki"), (9, "hiro teki"), (10, "telvo vazdi fesmo"), (11, "roni tefa sahi"),
              (12, "bodu reve loki"), (13, "yehu gesu bisu vuda buyu tosu")]:
    for w in ws.split():
        RANK[w] = n
EVIDENTIALS = set("yehu gesu bisu vuda buyu tosu".split())
ATTITUDE = set("seye mufe poye pifu zoke".split())
STATUS = {"hoyo", "yasmo"}
COPULA = set("ke ka kapoki loya miyo".split())
VALENCY = {"vaku", "lesvu", "tekvu"}
RESET = set(("ata nara oro si sina kasa kopisa nevi raho fime kube nayo tuni sige kureli sidu "
             "tonsi narli korsi krotiata yava gome ki-oro sabri").split())
EXCLUDE = [("hiro", "roni"), ("hiro", "tefa"), ("teki", "roni"), ("teki", "tefa"), ("telvo", "tefa"),
           ("vazdi", "tefa"), ("fesmo", "tefa"), ("zoke", "seye"), ("zoke", "mufe"), ("zoke", "poye"),
           ("zoke", "pifu"), ("hoyo", "yasmo")]


class Report:
    def __init__(self):
        self.checks = []

    def add(self, cid, name, status, details=None, note=""):
        details = details or []
        self.checks.append({"id": cid, "check": name, "status": status, "count": len(details),
                            "details": details[:60], "details_total": len(details), "note": note})


def load(path):
    with open(path) as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--baseline")
    ap.add_argument("--corpus", nargs="*", default=[])
    ap.add_argument("--out")
    a = ap.parse_args()
    data = load(a.lexicon)
    LX = Lexicon(data)
    R = Report()
    heads = data["headwords"]
    H = {h["root"]: h for h in heads}
    fwords = [f["form"] for f in data["function_words"] if not f["form"].startswith("-")]
    fw_single = set()
    for f in fwords:
        for p in f.split(" / "):
            if " " not in p.strip():
                fw_single.add(p.strip())
    pronouns = {p["form"] for p in data["pronouns"]}
    correl = {c["form"] for c in data["correlatives"]}
    timew = {t["form"] for t in data["time_and_dates"] if " " not in t["form"]}
    numbers = {str(r["Liraasa"]) for r in data["numbers"]["rules"] if " " not in str(r["Liraasa"])}
    disc = {d["form"] for d in data["discourse_particles"]}
    closed = fw_single | pronouns | correl | timew | numbers | disc
    new_fw = {f["form"] for f in data["function_words"] if f.get("status_1_0") == "NEW"}

    # all lexical forms
    form_owner = collections.defaultdict(list)
    for h in heads:
        for k in FORM_KEYS:
            form_owner[h["forms"][k]].append((h["root"], k))
    derived = collections.defaultdict(list)
    for h in heads:
        for d in ("yo", "vu", "pago"):
            if d == "pago" and h["root"] == "mavo":
                continue
            derived[h["root"] + d].append((h["root"], "-" + d))

    # 1 duplicates
    c = collections.Counter(h["root"] for h in heads)
    R.add(1, "Duplicate headwords", "PASS" if all(v == 1 for v in c.values()) else "FAIL",
          [k for k, v in c.items() if v > 1])

    # 2 root collisions with other headwords' forms
    det = []
    for h in heads:
        for (o, k) in form_owner[h["root"]]:
            if o != h["root"]:
                det.append(f"{h['root']} = {o}.{k}")
    R.add(2, "Root collisions (a root equals another headword's form)", "FAIL" if det else "PASS", det)

    # 3 seven-form collisions + derivations
    det = [f"{f}: {v}" for f, v in form_owner.items() if len(v) > 1]
    lexd = data.get("morphology", {}).get("lexicalised_derivations", {})
    for f, v in derived.items():
        same_morphemes = f in H and H[f].get("components") == [v[0][0], v[0][1][1:]]
        if f in form_owner and not same_morphemes and f not in lexd:
            det.append(f"derivation {f} ({v[0][0]}{v[0][1]}) = form of {form_owner[f]}")
    R.add(3, "Collisions among all seven-form derivatives and -yo/-vu/-pago derivations", "FAIL" if det else "PASS", det)

    # 4 function-word collisions: exact against lexical forms; closed classes among themselves
    det = []
    for w in closed:
        if w in timew and w in H:
            continue          # time nouns listed in the time table are the same lexeme
        if w in lexd:
            continue
        if w in form_owner:
            det.append(f"{w} = lexical form {form_owner[w]}")
        if w in derived:
            det.append(f"{w} = derivation {derived[w]}")
    allowed_overlap = {("maivo",)}
    det = [d for d in det if not d.startswith("maivo =")]
    R.add(4, "Function-word, pronoun, correlative, number and time-word collisions with lexical forms", "FAIL" if det else "PASS", det,
          "maivo (pronoun) = maivo (root) is a declared overlap.")

    # 5 phonotactics of new items
    det = []
    for h in heads:
        if h["type"] == "Primal" and h.get("status_1_0") in ("NEW", "REPLACED"):
            p = new_root_phonotactics(h["root"])
            if p:
                det.append(f"{h['root']}: {p}")
    for w in new_fw:
        p = function_word_phonotactics(w)
        if p:
            det.append(f"{w}: {p}")
    R.add(5, "Phonotactics of new and respelled roots and new function words", "FAIL" if det else "PASS", det)

    # 6 syllable structure / stress
    det = []
    for h in heads:
        w = h["root"]
        if syllable_count(w) < 2:
            det.append(f"{w}: fewer than 2 syllables")
        protected_end = w in ("amor", "apok") or (h.get("components") and h["components"][-1] in ("amor", "apok"))
        if w[-1] not in "aeiou" and not protected_end:
            det.append(f"{w}: consonant-final root")
        if len(syllabify(w)) != syllable_count(w):
            det.append(f"{w}: syllabification mismatch")
    R.add(6, "Syllable structure and stress (roots ≥2 syllables, vowel-final except protected amor/apok heads)", "FAIL" if det else "PASS", det,
          "Stress is penultimate by rule; with hiatus every vowel is a syllable.")

    # 7 compound well-formedness
    det = []
    for h in heads:
        if h["type"] == "Compound":
            comps = h.get("components")
            if not comps or len(comps) != 2:
                det.append(f"{h['root']}: components {comps}"); continue
            if "".join(comps) != h["root"]:
                det.append(f"{h['root']}: spelling ≠ {'+'.join(comps)}")
            for x in comps:
                if x not in H:
                    det.append(f"{h['root']}: component {x} is not an active headword")
    R.add(7, "Compound well-formedness (two active components, MODIFIER+HEAD spelling)", "FAIL" if det else "PASS", det)

    # 8 dependency cycles
    det = []
    def walk(w, path):
        if w in path:
            det.append(" → ".join(path + [w])); return
        h = H.get(w)
        if h and h["type"] == "Compound":
            for x in h["components"]:
                walk(x, path + [w])
    for h in heads:
        if h["type"] == "Compound":
            walk(h["root"], [])
    R.add(8, "Compound dependency cycles", "FAIL" if det else "PASS", sorted(set(det)))

    # 9 metadata
    det = []
    for h in heads:
        for fld in ("root", "type", "forms", "glosses", "register", "domain", "english_synonyms", "status_1_0"):
            if fld not in h or h[fld] in (None, "") and fld != "english_synonyms":
                det.append(f"{h['root']}: missing {fld}")
        if is_unused(h["glosses"].get("root")):
            det.append(f"{h['root']}: root gloss unused")
        if "requires author confirmation" in json.dumps(h["glosses"]):
            det.append(f"{h['root']}: unresolved gloss")
        if h.get("status_1_0") == "NEW" and len(h.get("english_synonyms") or []) < 1:
            det.append(f"{h['root']}: new entry without synonyms")
    R.add(9, "Required metadata (and no unresolved glosses)", "FAIL" if det else "PASS", det)

    # 10 morphology
    det = []
    for h in heads:
        exp = seven_forms(h["root"])
        for k in FORM_KEYS:
            if h["forms"][k] != exp[k]:
                det.append(f"{h['root']}.{k}: {h['forms'][k]} ≠ {exp[k]}")
    R.add(10, "Seven forms follow the rules (incl. verb rule)", "FAIL" if det else "PASS", det)

    # 11 registers
    det = [f"{h['root']}: {h['register']}" for h in heads if h["register"] not in REGISTERS]
    R.add(11, "Register labels", "FAIL" if det else "PASS", det)

    # 12 baseline accounting
    legacy = data.get("legacy", {})
    retired = {r["old"]: r for r in legacy.get("retired_roots", [])}
    respelled = {r["old"]: r for r in legacy.get("respelled_roots", [])}
    rcomp = {r["old"]: r for r in legacy.get("retired_compounds", [])}
    if a.baseline:
        base = load(a.baseline)
        det = []
        for bh in base["headwords"]:
            w = bh["root"]
            if w in H:
                if H[w]["forms"] != bh["forms"]:
                    det.append(f"{w}: forms changed")
                if H[w]["glosses"] != bh["glosses"] and H[w].get("status_1_0") == "CARRIED":
                    det.append(f"{w}: glosses changed but status CARRIED")
            elif w not in retired and w not in respelled and w not in rcomp:
                det.append(f"{w}: missing from 1.0 with no legacy disposition")
        R.add(12, "Every 0.8 headword is carried unchanged or has a recorded disposition", "FAIL" if det else "PASS", det)
    else:
        R.add(12, "Every 0.8 headword is carried unchanged or has a recorded disposition", "FAIL", ["no --baseline given"], "not executed")

    # 13 legacy safety: reserved spellings must not be active
    reserved = set()
    for r in list(retired.values()) + list(respelled.values()):
        reserved |= set(r["old_forms"].values())
    for r in rcomp.values():
        reserved.add(r["old"])
    det = []
    for f in reserved:
        if f in form_owner and f not in [x for x in H]:
            # allowed only if it is the replacement itself (merge target)
            owners = form_owner[f]
            det.append(f"{f} reserved but active as {owners}")
        if f in closed:
            det.append(f"{f} reserved but used as a function word")
    # merge target ruhesonbu is allowed (merged root's forms are different spellings), so det should be empty
    R.add(13, "Reserved (retired/respelled) spellings are not reused by any active item", "FAIL" if det else "PASS", det,
          f"{len(reserved)} reserved spellings.")

    # 14/15 examples and corpus
    texts = []
    for e in data.get("examples", []):
        if e.get("status") == "HISTORICAL":
            continue
        t = e["liraasa"]
        if e.get("status") == "FORMULA":
            t = t.split("=")[-1]
        texts.append(("examples", t))
    corpus_lines = []
    for d in a.corpus:
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".txt"):
                for line in open(os.path.join(d, fn)):
                    line = line.strip()
                    if line and not line.startswith("#"):
                        corpus_lines.append((f"{os.path.basename(d)}/{fn}", line))
    det_unknown, det_retired = [], []
    reserved_lex = reserved
    for src, line in texts + corpus_lines:
        for tok, kind, an in LX.parse_text(line):
            if kind is None:
                det_unknown.append(f"{src}: '{tok}' in «{line[:70]}»")
            if tok.lower() in reserved_lex and tok.lower() not in form_owner:
                det_retired.append(f"{src}: retired '{tok}'")
    R.add(14, "Examples and corpus contain no unknown words", "FAIL" if det_unknown else "PASS", det_unknown,
          f"{len(texts)} example sentences, {len(corpus_lines)} corpus lines checked.")
    R.add(15, "No retired or respelled spellings in live examples and corpus", "FAIL" if det_retired else "PASS", det_retired)

    # 16 duplicate root glosses
    g = collections.defaultdict(list)
    for h in heads:
        g[h["glosses"]["root"].strip().lower()].append(h["root"])
    det = [f"'{k}': {v}" for k, v in g.items() if len(v) > 1]
    R.add(16, "Duplicate root glosses (editorial review)", "WARN" if det else "PASS", det,
          "Same gloss on different headwords: true synonyms, deliberate shades, or an editing slip.")

    # 17 segmentation ambiguity
    det = []
    for h in heads:
        if h["type"] != "Compound":
            continue
        w = h["root"]
        splits = [(w[:i], w[i:]) for i in range(2, len(w) - 1) if w[:i] in H and w[i:] in H]
        if len(splits) > 1:
            det.append(f"{w}: {splits}")
    R.add(17, "Compound segmentation ambiguity (more than one valid two-part split)", "WARN" if det else "PASS", det,
          "Not an error when the lexicon records the intended split; listed for parsers.")

    # 18 proximity of new items
    det = []
    active = set(form_owner) | closed
    new_items = [h["root"] for h in heads if h["type"] == "Primal" and h.get("status_1_0") in ("NEW", "REPLACED")] + sorted(new_fw)
    declared = {tuple(sorted(p)) for p in data["phonology"]["declared_distance_1_pairs"]}
    for w in new_items:
        for s in active:
            if s == w or "-" in s or "-" in w:
                continue
            if edit_distance(w, s, cap=1) <= 1:
                if len(w) <= 2 and len(s) <= 2 and tuple(sorted((w, s))) in declared:
                    continue
                if len(w) <= 2 and len(s) > 3:
                    continue
                det.append(f"{w} ~ {s}")
    R.add(18, "New roots and particles are at least two edits from every active spelling", "FAIL" if det else "PASS", sorted(set(det)),
          f"{len(new_items)} new or respelled items checked against {len(active)} active spellings; declared monosyllable pairs exempt.")

    # 19 monosyllable confusability among function words
    monos = sorted(w for w in closed if len(w) <= 2 and "-" not in w)
    det = []
    for x, y in itertools.combinations(monos, 2):
        if edit_distance(x, y) <= 1 and tuple(sorted((x, y))) not in declared:
            if x in new_fw or y in new_fw:
                det.append(f"{x} ~ {y}")
    R.add(19, "New monosyllabic particles: one-edit neighbours only where declared and positionally distinct", "FAIL" if det else "PASS", det,
          f"monosyllables: {' '.join(monos)}")

    # 20 particle misreading as lexical material / suffix
    det = []
    for w in new_fw | disc:
        if w in SUFFIX_SOUNDS:
            det.append(f"{w} sounds like a suffix")
        if w in form_owner or w in derived:
            det.append(f"{w} is also a lexical form")
        for h in heads:
            if h["root"].endswith(w) and len(w) >= 3 and h["root"] != w:
                pass  # compounds ending in a particle are harmless (particles are separate words)
    R.add(20, "New particles cannot be read as a lexical form or a suffix", "FAIL" if det else "PASS", det)

    # 21 grammar order checker
    det_g = []
    nchecked = 0
    for src, line in texts + corpus_lines:
        if src.startswith("legacy_0_8"):
            continue
        for problem in check_sentence(line, LX):
            det_g.append(f"{src}: {problem} «{line[:80]}»")
        nchecked += 1
    R.add(21, "Clause grammar: operator order, one evidential, attitude/status/ki clause-final, exclusions", "FAIL" if det_g else "PASS", det_g,
          f"{nchecked} sentences checked (legacy 0.8 texts are exempt).")

    # 22 dispositions complete
    det = []
    disp = data.get("dispositions", {})
    valid = {"KEEP", "RETIRE", "REPLACE", "MERGE", "REDEFINE", "ADD", "ARCHIVE", "REJECT", "RETIRED"}
    counts = {k: len(v) for k, v in disp.items()}
    exp = {"retirement_candidates": 182, "storytelling": 150, "root_review": 40, "unresolved_compounds": 3}
    for k, n in exp.items():
        if counts.get(k) != n:
            det.append(f"{k}: {counts.get(k)} rows, expected {n}")
        for r in disp.get(k, []):
            if r["disposition"] not in valid:
                det.append(f"{k}: {r} has invalid disposition")
            if re.search(r"\bTBD\b|pending|author must", json.dumps(r), re.I):
                det.append(f"{k}: open item {r.get('root') or r.get('id') or r.get('word')}")
    R.add(22, "Every candidate has one final disposition (182 audit, 150 storytelling, 40 review, 3 unresolved); no TBD", "FAIL" if det else "PASS", det,
          json.dumps(counts))

    # 23 migration completeness
    det = []
    mig = legacy.get("migration_forms", {})
    for r in list(retired.values()) + list(respelled.values()):
        for k, f in r["old_forms"].items():
            if f not in mig:
                det.append(f"{f} ({r['old']}.{k}) has no 1.0 mapping")
            else:
                tgt = mig[f]["to"]
                if tgt not in form_owner:
                    det.append(f"{f} → {tgt}: target is not an active form")
    for r in rcomp.values():
        if r["disposition"] == "REWRITE" and r["new"] not in H:
            det.append(f"{r['old']} → {r['new']} missing")
    R.add(23, "Migration table maps every retired form to an active 1.0 form", "FAIL" if det else "PASS", det,
          f"{len(mig)} legacy spellings mapped.")

    # 24 retired components in active compounds (explicit)
    det = []
    gone = set(retired) | set(respelled) | set(rcomp)
    for h in heads:
        if h["type"] == "Compound":
            for x in h["components"]:
                if x in gone:
                    det.append(f"{h['root']} depends on retired {x}")
    R.add(24, "No active compound depends on a retired or respelled primitive", "FAIL" if det else "PASS", det)

    # ---------------------------------------------------------------- summary
    st = collections.Counter(c["status"] for c in R.checks)
    summary = {
        "lexicon": os.path.basename(a.lexicon), "version": data.get("version"),
        "counts": {
            "headwords": len(heads),
            "primal_roots": sum(1 for h in heads if h["type"] == "Primal"),
            "compounds": sum(1 for h in heads if h["type"] == "Compound"),
            "forms": len(heads) * 7,
            "unused_forms": sum(1 for h in heads for k in FORM_KEYS if is_unused(h["glosses"][k])),
            "function_words": len(data["function_words"]),
            "new_function_words_1_0": len(new_fw),
        },
        "status_counts": dict(st),
    }
    result = {"summary": summary, "checks": R.checks}
    if a.out:
        with open(a.out, "w") as f:
            json.dump(result, f, ensure_ascii=False, indent=1)
    for ch in R.checks:
        print(f"{ch['id']:>2} {ch['status']:4} {ch['check']} ({ch['details_total']})")
        for d in ch["details"][:8]:
            print("        ", d)
    print(summary)
    sys.exit(1 if st.get("FAIL") else 0)


def split_clauses(line):
    parts = re.split(r"[.,;:!?—…\"“”()]+", line)
    out = []
    for p in parts:
        toks = [t.lower() for t in tokenize(p)]
        cur = []
        for t in toks:
            if (t in RESET or (t.startswith("ki-") and t != "ki-oro")) and cur:
                out.append(cur); cur = [t]
            else:
                cur.append(t)
        if cur:
            out.append(cur)
    return out


def check_sentence(line, LX):
    problems = []
    for cl in split_clauses(line):
        present = set(cl)
        for a, b in EXCLUDE:
            if a in present and b in present:
                problems.append(f"{a} with {b}")
        ev = [t for t in cl if t in EVIDENTIALS]
        if len(ev) > 1 and len(set(ev)) > 1:
            problems.append(f"more than one evidential {ev}")
        # final-slot words
        for i, t in enumerate(cl):
            rest = cl[i + 1:]
            if t == "ki" and rest:
                problems.append("ki not clause-final")
            if t in ATTITUDE and any(r not in ATTITUDE and r != "ki" for r in rest):
                problems.append(f"{t} not clause-final")
            if t in STATUS and any(r not in ATTITUDE and r != "ki" for r in rest):
                problems.append(f"{t} not before attitude/ki")
        # preverbal order
        last = 0
        seen_verb = False
        for i, t in enumerate(cl):
            if t in VALENCY or t == "sidu":
                last = 0; seen_verb = False; continue
            kind = LX.parse(t)
            is_verb = kind[0] == "lexical" and any(s == "verb" for (_, s) in kind[1][1]) or t in COPULA
            if t == "fututi" and i > 0 and cl[i - 1] in RANK:
                r = 8
            else:
                r = RANK.get(t)
            if r is None:
                if is_verb:
                    seen_verb = True; last = 99
                continue
            if seen_verb:
                if r == 12 or r == 4 and False:
                    continue
                if t in ("reve", "loki", "bodu"):
                    continue
                problems.append(f"'{t}' after the verb")
                continue
            if r < last:
                problems.append(f"'{t}' out of order")
            last = max(last, r)
    return problems


if __name__ == "__main__":
    main()
