"""validate_2_5.py: run the author's validator against Liraasa 2.5, honestly.

    PYTHONUTF8=1 python scripts/validate_2_5.py data/lexicon/liraasa_2_5.json \
        --previous data/lexicon/liraasa_2_3.json \
        --changes <every changeset since 1.1, in order> \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_2_5.json

2.5 is a grammar release (ADR-0020): it respells nothing, so checks 1-24 are
validate_2_3.py's, run on 2.5. Check 25 is rewritten for what 2.5's ops do.
It re-applies every 2.5 op to frozen 2.3, independently of the TypeScript
build, and compares every section:

* rulings: added, superseded (whole or in part), amended (`amended_by`),
  covered (`covered_by`); a ruling example archived reads its new text and
  the archive keeps the old one whole. No ruling text is ever changed.
* function words: meaning, use and example edits; antizi added.
* texts (`edit_text`, `archive_text` on a `text:` path) and values
  (`edit_value`) at the paths the ops name, and nowhere else.
* examples: the edits the ops record, and each example's `kind`.

Anything else that differs from 2.3 is a FAIL.
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

import validate_2_0 as v20  # noqa: E402
import validate_2_3 as v23  # noqa: E402

UNCHANGING = {"version", "built_utc", "source"}


def ruling_key(ref):
    edition = ref.split(":")[0]
    return "rulings_" + edition.replace(".", "_") + ("_carried" if edition == "0.8" else "")


def walk(lex, path):
    node = lex
    for k in path:
        node = node[int(k)] if isinstance(node, list) else node[k]
    return node


def expected(prev, changesets, version):
    """2.3 with every 2.5 op applied, written from the op definitions alone."""
    want = copy.deepcopy(prev)
    det = []
    added = collections.OrderedDict()
    for cs in [c for c in changesets if c["edition"] == version]:
        rulings = {r["id"]: r for r in cs.get("rulings", [])}
        fws = {f["id"]: f for f in cs.get("function_words", [])}
        for op in cs["ops"]:
            o, entry = op["op"], op["entry"]
            if o == "add_ruling":
                ed, rid = entry.split(":")
                added.setdefault("rulings_" + ed.replace(".", "_"), []).append(rulings[rid])
            elif o in ("supersede_ruling", "amend_ruling", "mark_ruling_covered"):
                r = next((x for x in want[ruling_key(entry)] if x["id"] == entry.split(":")[1]), None)
                if r is None or r["topic"] != op["from"]:
                    det.append("%s: %s lands on no ruling" % (entry, o))
                    continue
                if o == "supersede_ruling":
                    if op.get("field") is None:
                        r["superseded_by"] = op["to"]
                    else:
                        r["superseded_in_part"] = r.get("superseded_in_part", []) + [{"clause": op["field"], "by": op["to"]}]
                elif o == "amend_ruling":
                    r["amended_by"] = r.get("amended_by", []) + [{"by": op["to"], "scope": op.get("field", "in part")}]
                else:
                    r["covered_by"] = op["to"]
            elif o == "edit_function_word":
                f = next(x for x in want["function_words"] if x["id"] == entry)
                if f.get(op["field"]) != op["from"]:
                    det.append("%s %s: does not read the op's from" % (entry, op["field"]))
                f[op["field"]] = op["to"]
            elif o == "add_function_word":
                want["function_words"].append(fws[entry])
            elif o == "edit_example":
                i = int(entry.split(":")[1])
                field = "english" if op.get("field") == "english" else "liraasa"
                if want["examples"][i][field] != op["from"]:
                    det.append("%s: does not read the op's from" % entry)
                want["examples"][i][field] = op["to"]
            elif o == "edit_text":
                *path, key = entry[len("text:"):].split(".")
                node = walk(want, path)
                if node[key] != op["from"]:
                    det.append("%s: does not read the op's from" % entry)
                node[key] = op["to"]
            elif o == "edit_value":
                *path, key = entry[len("value:"):].split(".")
                node = walk(want, path)
                if op["from"] is None:
                    if key in node:
                        det.append("%s: adds a key that exists" % entry)
                elif json.dumps(node.get(key) if isinstance(node, dict) else node[int(key)], ensure_ascii=False, separators=(",", ":")) != json.dumps(json.loads(op["from"]), ensure_ascii=False, separators=(",", ":")):
                    det.append("%s: does not read the op's from" % entry)
                node[key] = json.loads(op["to"])
            elif o == "archive_text":
                if entry.startswith("text:"):
                    *path, key = entry[len("text:"):].split(".")
                    node = walk(want, path)
                    node[key] = op["to"]
                else:
                    r = next(x for x in want[ruling_key(entry)] if x["id"] == entry.split(":")[1])
                    # example:N is the Liraasa, example:N:english the English (3.4)
                    parts = op["field"].split(":")
                    i = int(parts[1])
                    if len(parts) > 2 and parts[2] == "english":
                        r["examples"][i] = [r["examples"][i][0], op["to"]]
                    else:
                        r["examples"][i] = [op["to"], r["examples"][i][1]]
                want["legacy"].setdefault("archived_text", []).append({
                    "entry": entry, "field": op["field"], "text": op["from"], "now": op["to"],
                    "archived_in": version, "reason": op["reason"]})
            elif o == "edit_metadata" and entry == "phonology.declared_distance_1_pairs":
                want["phonology"]["declared_distance_1_pairs"].append(json.loads(op["to"]))
            else:
                det.append("%s: op %s is not one 2.5 uses" % (entry, o))
    return want, added, det


def check_25(prev, data, changesets, version):
    want, added, det = expected(prev, changesets, version)
    for key in [k for k in data if k not in UNCHANGING]:
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
        if key not in data and key not in UNCHANGING:
            det.append("section %s dropped" % key)
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 2.3 lexicon the 2.5 changesets apply to")
    ap.add_argument("--changes", nargs="+", required=True, help="every changeset since 1.1, in order")
    ap.add_argument("--baseline", help="0.8-rc2, for check 12")
    ap.add_argument("--out")
    a = ap.parse_args()

    # checks 1-24: validate_2_3.py, run on 2.5 (it writes and reads only its own temp files)
    tmp = os.path.join(ROOT, "_validate_2_5_inner.json")
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
    os.remove(tmp)

    data, prev = v20.load(os.path.abspath(a.lexicon)), v20.load(a.previous)
    changesets = [v20.load(p) for p in a.changes]
    version = data["version"]
    checks = [c for c in inner["checks"] if c["id"] != 25]
    for c in checks:
        c["executed_against"] = c.get("executed_against", "") + " (validate_2_5.py: 2.5 respells nothing)"
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
        "note": "Compared against %s with every 2.5 op re-applied independently; changesets: %s; %d rulings added, %d superseded, %d amended, %d covered; %d texts and %d values edited; %d texts archived; %d examples edited; %d function-word fields edited; %d function words added." % (
            os.path.basename(a.previous), ", ".join(c["id"] for c in mine), count("add_ruling"), count("supersede_ruling"),
            count("amend_ruling"), count("mark_ruling_covered"), count("edit_text"), count("edit_value"),
            count("archive_text"), count("edit_example"), count("edit_function_word"), count("add_function_word")),
        "executed_against": "validate_2_5.py",
    })
    summary = dict(inner["summary"])
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_2_5.py: validate_2_3.py for checks 1-24 (2.5 respells nothing); 25 re-applies every 2.5 op independently (ADR-0020)"
    print("--- 2.5 ---")
    for c in checks:
        print("%2d %s %s (%d)" % (c["id"], c["status"], c["check"], c["count"]))
        if c["id"] == 25:
            for d in c["details"][:12]:
                print("         " + d)
    print(summary["status_counts"])
    if a.out:
        with open(a.out, "w", encoding="utf-8", newline="\n") as f:
            json.dump({"summary": summary, "checks": checks}, f, ensure_ascii=False, indent=1)
    sys.exit(1 if any(c["status"] == "FAIL" for c in checks) else 0)


if __name__ == "__main__":
    main()
