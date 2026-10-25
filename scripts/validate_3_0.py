"""validate_3_0.py: run the author's validator against Liraasa 3.0, honestly.

    PYTHONUTF8=1 python scripts/validate_3_0.py data/lexicon/liraasa_3_0.json \
        --previous data/lexicon/liraasa_2_5.json \
        --changes <every changeset since 1.1, in order> \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_3_0.json

3.0 is additions only (ADR-0021): it respells nothing, so checks 1-24 are
validate_2_3.py's, run on 3.0, as validate_2_5.py runs them. Check 25
re-applies every 3.0 op to frozen 2.5, independently of the TypeScript build:
validate_2_5.py's reading of the ruling, function-word, text and value ops,
plus the ops 3.0 adds to that list:

* add_root / add_compound: the payload's entry, with its seven forms built by
  liraasa_core.seven_forms (not copied), every unlisted slot unused;
* activate_slot: the slot's gloss, from "— (unused)" to the op's meaning, the
  entry marked REGLOSSED, and its synonyms keeping every 2.5 synonym;
* add_derivation: the derivation, built as its base + suffix;
* lexicalise_from_pattern: an attested image compound back among the
  headwords, whole and with its id; then edit_gloss gives it the patch's
  meaning, its old reading kept in legacy.archived_senses, and
  edit_metadata its domain;
* rhyme_families: rebuilt from every headword, as build_1_0.py builds it.

Anything else that differs from 2.5 is a FAIL.
"""
import argparse
import collections
import copy
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "data", "source"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import liraasa_core as core  # noqa: E402
import validate_2_0 as v20  # noqa: E402
import validate_2_2 as v22  # noqa: E402
import validate_2_3 as v23  # noqa: E402
import validate_2_5 as v25  # noqa: E402

UNUSED = "— (unused)"
SLOTS = ["root", "ascended", "negative", "verb", "negative_adjective", "adjective", "ascended_adjective"]
CAMEL = {"negativeAdjective": "negative_adjective", "ascendedAdjective": "ascended_adjective"}
HEADWORD_OPS = {"add_root", "add_compound", "activate_slot", "add_derivation",
                "lexicalise_from_pattern", "edit_gloss", "edit_metadata"}


def rhyme_families(roots):
    """build_1_0.py: every headword joins the family of its last four letters."""
    fam = collections.defaultdict(list)
    for w in roots:
        fam[w[-4:]].append(w)
    return [{"ending": k, "members": sorted(v), "count": len(v)} for k, v in sorted(fam.items())]


def expected(prev, changesets, version):
    """2.5 with every 3.0 op applied, written from the op definitions alone."""
    mine = [c for c in changesets if c["edition"] == version]
    # validate_2_5.py's reading of the ops it knows, on a copy without the headword ops
    known = [dict(c, ops=[o for o in c["ops"] if o["op"] not in HEADWORD_OPS]) for c in mine]
    want, added, det = v25.expected(prev, known, version)
    tag = "status_" + version.replace(".", "_")
    heads = want["headwords"]
    by_id = {h["id"]: h for h in heads}
    by_root = {h["root"]: h for h in heads}
    for cs in mine:
        if any(o["op"] == "edit_metadata" and o.get("field") != "domain" for o in cs["ops"]):
            det.append("%s: an edit_metadata 3.0 does not use" % cs["id"])
        payload = {h["id"]: h for h in cs.get("headwords", [])}
        for op in cs["ops"]:
            o, entry = op["op"], op["entry"]
            if o in ("add_root", "add_compound"):
                p = payload.get(entry)
                if p is None or p["root"] != op["to"] or p["root"] in by_root:
                    det.append("%s: %s has no payload, or its spelling exists" % (entry, o))
                    continue
                if (o == "add_compound") != (p["type"] == "Compound"):
                    det.append("%s: %s with type %s" % (entry, o, p["type"]))
                if o == "add_compound" and "".join(p["components"]) != p["root"]:
                    det.append("%s: not its components joined" % entry)
                for c in p["components"] or []:
                    if c not in by_root:
                        det.append("%s: component %s is not a headword" % (entry, c))
                h = {
                    "root": p["root"], "type": p["type"], "components": p["components"],
                    "forms": core.seven_forms(p["root"]),
                    "glosses": {k: p["glosses"].get(k, UNUSED) for k in SLOTS},
                    "register": p["register"], "domain": p["domain"],
                    "english_synonyms": p["english_synonyms"],
                    "status_1_0": "NEW", tag: "NEW", "since": version, "history_0_8": None,
                    "notes": p["notes"], "protected": True, "id": p["id"],
                }
                heads.append(h)
                by_id[h["id"]] = h
                by_root[h["root"]] = h
            elif o == "lexicalise_from_pattern":
                att = want["image_compounds"]["attested"]
                h = next((x for x in att if x["id"] == entry), None)
                if h is None or h["root"] != op["from"] or h["root"] in by_root:
                    det.append("%s: not an attested image compound %s" % (entry, op["from"]))
                    continue
                att.remove(h)
                heads.append(h)
                by_id[h["id"]] = h
                by_root[h["root"]] = h
            elif o in ("activate_slot", "edit_gloss"):
                h = by_id.get(entry)
                key = CAMEL.get(op.get("slot"), op.get("slot"))
                now = None if h is None else h["glosses"].get(key)
                if now != op["from"] or (now == UNUSED) != (o == "activate_slot"):
                    det.append("%s %s: %s does not land on %r" % (entry, key, o, now))
                    continue
                h["glosses"][key] = op["to"]
                if op.get("archive"):
                    want["legacy"]["archived_senses"].append({
                        "word": h["forms"][key], "gloss_1_1": op["from"], "archived_in": version,
                        "replaced_by": op["to"], "note": op["reason"]})
                if tag not in h:
                    # apply.ts writes the mark just before `since`; key order does not matter here
                    h[tag] = "REGLOSSED"
            elif o == "edit_metadata" and op.get("field") == "domain":
                h = by_id.get(entry)
                if h is None or h["domain"] != op["from"]:
                    det.append("%s: domain is not %s" % (entry, op["from"]))
                    continue
                h["domain"] = op["to"]
            elif o == "add_derivation":
                base_id, suffix = entry[len("derivation:"):].rsplit(":", 1)
                base = by_id.get(base_id)
                if base is None or base["root"] + suffix.lstrip("-") != op["to"]:
                    det.append("%s: does not build %s" % (entry, op["to"]))
                    continue
                gloss = cs.get("lexicalised_derivations", {}).get(op["to"])
                table = want["morphology"]["lexicalised_derivations"]
                if gloss is None or op["to"] in table:
                    det.append("%s: no gloss, or already listed" % op["to"])
                    continue
                table[op["to"]] = gloss
    want["rhyme_families"] = rhyme_families([h["root"] for h in heads])
    return want, added, det


def check_25(prev, data, changesets, version):
    want, added, det = expected(prev, changesets, version)
    # synonyms of a reglossed 2.5 entry are rebuilt from its glosses: they must keep every 2.5 one
    archived = collections.defaultdict(list)
    for cs in [c for c in changesets if c["edition"] == version]:
        for op in cs["ops"]:
            if op["op"] == "edit_gloss" and op.get("archive"):
                archived[op["entry"]].append(op["from"])
    old = {h["id"]: h for h in prev["headwords"] + prev.get("image_compounds", {}).get("attested", [])}
    got = {h["id"]: h for h in data["headwords"]}
    for h in want["headwords"]:
        was, now = old.get(h["id"]), got.get(h["id"])
        if was is None or now is None or h["glosses"] == was["glosses"]:
            continue
        # only a sense of a reading the changeset archived may go
        gone = " ".join(archived.get(h["id"], [])).lower()
        lost = [s for s in was["english_synonyms"] if s not in now["english_synonyms"] and s.lower() not in gone]
        if lost:
            det.append("%s: synonyms %s lost" % (h["root"], lost))
        h["english_synonyms"] = now["english_synonyms"]
    for key in [k for k in data if k not in v25.UNCHANGING]:
        if key in added:
            if data[key] != list(added[key]):
                det.append("section %s is not the changesets' rulings" % key)
        elif key.startswith("changesets_") and key not in prev:
            continue
        elif key not in want:
            det.append("section %s added with no op" % key)
        elif want[key] != data[key]:
            if isinstance(want[key], list) and isinstance(data[key], list) and len(want[key]) == len(data[key]):
                rows = [i for i, (x, y) in enumerate(zip(want[key], data[key])) if x != y]
                det.append("section %s differs with no op at rows %s" % (key, rows[:10]))
            else:
                det.append("section %s differs with no op" % key)
    for key in want:
        if key not in data and key not in v25.UNCHANGING:
            det.append("section %s dropped" % key)
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 2.5 lexicon the 3.0 changeset applies to")
    ap.add_argument("--changes", nargs="+", required=True, help="every changeset since 1.1, in order")
    ap.add_argument("--baseline", help="0.8-rc2, for check 12")
    ap.add_argument("--out")
    a = ap.parse_args()

    # checks 1-24: validate_2_3.py, run on 3.0 (it writes and reads only its own temp files)
    tmp = os.path.join(ROOT, "_validate_3_0_inner.json")
    # its own check 25 (replaced below) reads every slot op as one on a previous headword;
    # an entry lexicalised from the pattern was not one, so that reading skips it
    original = v22.expected_from

    def tolerant(prev, data, rec, mapping):
        ids = {h["id"] for h in prev["headwords"]}
        return original(prev, data, dict(rec, slots=[x for x in rec["slots"] if x[0] in ids]), mapping)

    v22.expected_from = tolerant
    sys_argv = sys.argv
    sys.argv = ["validate_2_3.py", a.lexicon, "--previous", a.previous, "--changes", *a.changes, "--out", tmp]
    if a.baseline:
        sys.argv += ["--baseline", a.baseline]
    try:
        v23.main()
    except SystemExit:
        pass
    finally:
        sys.argv = sys_argv
    inner = v20.load(tmp)
    v22.expected_from = original
    os.remove(tmp)

    data, prev = v20.load(os.path.abspath(a.lexicon)), v20.load(a.previous)
    changesets = [v20.load(p) for p in a.changes]
    version = data["version"]
    checks = [c for c in inner["checks"] if c["id"] != 25]
    for c in checks:
        c["executed_against"] = c.get("executed_against", "") + " (validate_3_0.py: 3.0 respells nothing)"
    det25 = check_25(prev, data, changesets, version)
    mine = [c for c in changesets if c["edition"] == version]
    count = lambda op: sum(1 for c in mine for o in c["ops"] if o["op"] == op)
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s with every 3.0 op re-applied independently; changesets: %s; %d rulings, %d roots, %d compounds, %d slots activated, %d derivations, %d function words added; %d texts and %d values edited; %d function-word fields edited." % (
            os.path.basename(a.previous), ", ".join(c["id"] for c in mine), count("add_ruling"), count("add_root"),
            count("add_compound"), count("activate_slot"), count("add_derivation"), count("add_function_word"),
            count("edit_text"), count("edit_value"), count("edit_function_word")),
        "executed_against": "validate_3_0.py",
    })
    summary = dict(inner["summary"])
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_3_0.py: validate_2_3.py for checks 1-24 (3.0 respells nothing); 25 re-applies every 3.0 op independently (ADR-0021)"
    print("--- 3.0 ---")
    for c in checks:
        print("%2d %s %s (%d)" % (c["id"], c["status"], c["check"], c["count"]))
        if c["id"] == 25 or c["status"] == "WARN":
            for d in c["details"][:12]:
                print("         " + (d if isinstance(d, str) else json.dumps(d, ensure_ascii=False)))
    print(summary["status_counts"])
    if a.out:
        with open(a.out, "w", encoding="utf-8", newline="\n") as f:
            json.dump({"summary": summary, "checks": checks}, f, ensure_ascii=False, indent=1)
    sys.exit(1 if any(c["status"] == "FAIL" for c in checks) else 0)


if __name__ == "__main__":
    main()
