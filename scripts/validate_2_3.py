"""validate_2_3.py: run the author's validator against Liraasa 2.3, honestly.

    PYTHONUTF8=1 python scripts/validate_2_3.py data/lexicon/liraasa_2_3.json \
        --previous data/lexicon/liraasa_2_2.json \
        --changes <every changeset since 1.1, in order> \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_2_3.json

As validate_2_2.py (ADR-0018), with what 2.3 changes (ADR-0019):

* Three new kinds of op: a compound rebuilt on other parts (wolf,
  recompose_compound), a compound replaced by a root (bear, cow,
  respell_compound_as_root), and a listed derivation retired for a new
  headword (mirunululirayo for kerku, retire_derivation). The first two are
  respellings: their old forms are in legacy.migration_forms and their rows
  in legacy.respelled_roots. The third maps the derivation to the new root.
* Check 18 holds the roots respelled in 2.3 and the new root kerku to the
  new-root distance rule, as a WARN for the author.
* Check 25: 2.2 is carried verbatim except for what a 2.3 op records. A
  superseded ruling, whole or in part, is kept as ruled (2.3:G71 supersedes
  the wolf clause of 2.1:G59), so it is compared unrespelled.
"""
import argparse
import collections
import copy
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "data", "source")
sys.path.insert(0, SOURCE)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import validate_1_1 as w11  # noqa: E402  (read-only reference, imported not edited)
import validate_2_0 as v20  # noqa: E402
import validate_2_1 as v21  # noqa: E402
import validate_2_2 as v22  # noqa: E402

MOVES = ("respell_root", "respell_as_compound", "recompose_compound", "respell_compound_as_root")


def recorded(changesets):
    rec = v22.recorded(changesets)
    rec["parts"] = {}  # headword id -> new components, or None for a compound made a root
    rec["retired_derivations"] = {}  # spelling -> id of the headword that replaces it
    rec["added_roots"] = {}  # id -> spelling
    rec["archived"] = []  # archive_text ops, in order
    for cs in changesets:
        payload = {h["id"]: h for h in cs.get("headwords", [])}
        for op in cs["ops"]:
            o = op["op"]
            if o in MOVES:
                rec["respelled"][op["entry"]] = (op["from"], op["to"])
                if o == "recompose_compound":
                    rec["parts"][op["entry"]] = op["to"].split("+")
                elif o == "respell_compound_as_root":
                    rec["parts"][op["entry"]] = None
            elif o == "retire_derivation":
                rec["retired_derivations"][op["from"].rsplit(": ", 1)[1].replace(" + -", "")] = op["to"]
            elif o == "archive_text":
                rec["archived"].append(op)
            elif o == "add_root" and op["entry"] in payload:
                rec["added_roots"][op["entry"]] = op["to"]
    return rec


def respelling_map(data, rec):
    """Old spelling -> new, for every row the recorded respellings and retirements made."""
    out = v22.respelling_map(data, rec)
    mig = data["legacy"]["migration_forms"]
    for word in rec["retired_derivations"]:
        if word in mig:
            out[word] = mig[word]["to"]
    return out


def expected_from(prev, data, rec, mapping):
    """2.2 with the recorded non-text 2.3 changes applied, for check 25."""
    want = v22.expected_from(prev, data, rec, mapping)
    for h in want["headwords"]:
        if h["id"] in rec["parts"]:
            parts = rec["parts"][h["id"]]
            h["type"] = "Compound" if parts else "Primal"
            h["components"] = parts
    now = {h["id"]: h for h in data["headwords"]}
    for hid in rec["added_roots"]:
        want["headwords"].append(copy.deepcopy(now[hid]))
    for word in rec["retired_derivations"]:
        want["morphology"]["lexicalised_derivations"].pop(word, None)
    # texts archived: the field reads its new text, and the archive keeps the old whole
    heads = {h["id"]: h for h in want["headwords"]}
    for op in rec["archived"]:
        if op["field"] == "notes":
            heads[op["entry"]]["notes"] = op["to"]
        want["legacy"].setdefault("archived_text", []).append({
            "entry": op["entry"], "field": op["field"], "text": op["from"], "now": op["to"],
            "archived_in": data["version"], "reason": op["reason"]})
    return want


def superseded(ruling):
    return "superseded_by" in ruling or "superseded_in_part" in ruling


def check_rulings(want, data, mapping, archived):
    """Every earlier ruling respelled, except a superseded one, which is kept as ruled."""
    det = []
    for key in [k for k in want if k.startswith("rulings_")]:
        before, after = want[key], data.get(key)
        if not isinstance(before, list) or not isinstance(after, list) or len(before) != len(after):
            det.append("section %s added or removed rulings" % key)
            continue
        for x, y in zip(before, after):
            if not superseded(y):
                x = v21.migrated(x, mapping)
            # an archived ruling example reads the op's new text
            for op in archived:
                if op["entry"] == "%s:%s" % (key[len("rulings_"):].replace("_carried", "").replace("_", "."), y.get("id")):
                    i = int(op["field"].split(":")[1])
                    x = dict(x, examples=[[op["to"], e[1]] if n == i else e for n, e in enumerate(x["examples"])])
            if x != y:
                det.append("ruling %s:%s changed with no op" % (key, y.get("id")))
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 2.2 lexicon the 2.3 changeset applies to")
    ap.add_argument("--changes", nargs="+", required=True, help="every changeset since 1.1, in order")
    ap.add_argument("--baseline", help="0.8-rc2, for check 12")
    ap.add_argument("--out")
    a = ap.parse_args()

    lexicon = os.path.abspath(a.lexicon)
    data, prev = v20.load(lexicon), v20.load(a.previous)
    changesets = [v20.load(p) for p in a.changes]
    version = data["version"]
    rec_all = recorded(changesets)
    rec = recorded([c for c in changesets if c["edition"] == version])
    mapping = respelling_map(data, rec)
    mapping_all = respelling_map(data, rec_all)
    ok_reused = v21.reused(data, version)
    colour_bases = {c["Base color"] for c in data["colors"]}

    # validate.py, unmodified, on the lexicon less the reverted respelling rows
    tmp_lex = os.path.join(ROOT, "_validate_lex_2_3.json")
    tmp_out = os.path.join(ROOT, "_validate_raw_2_3.json")
    with open(tmp_lex, "w", encoding="utf-8") as f:
        json.dump(v22.without_reverted(data), f, ensure_ascii=False, indent=1)
    cmd = [sys.executable, os.path.join(SOURCE, "validate.py"), tmp_lex, "--out", tmp_out]
    if a.baseline:
        cmd += ["--baseline", os.path.abspath(a.baseline)]
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    proc = subprocess.run(cmd, cwd=SOURCE, env=env, capture_output=True, text=True)
    os.remove(tmp_lex)
    if proc.returncode not in (0, 1) or not os.path.exists(tmp_out):
        print(proc.stdout, proc.stderr, file=sys.stderr)
        sys.exit(2)
    raw = v20.load(tmp_out)
    os.remove(tmp_out)
    by_id = {c["id"]: c for c in raw["checks"]}
    reverted = [r["old"] + " → " + r["new"] for r in data["legacy"]["respelled_roots"] if r.get("reverted")]

    extra = w11.supplement(data, version)
    rerun = {}
    canon = v22.canon_all(data)
    det3, kept3 = v21.check_3(by_id[3], canon, rec_all["kept_ambiguity"])
    rerun[3] = (det3, "WARN" if kept3 and not det3 else None,
                "derivations that spell a headword: %d kept by the author (a 2.0 recorded ambiguity, or a compound a ruling makes canon: %s): %s"
                % (len(kept3), ", ".join(sorted(canon)), "; ".join(kept3)))
    rerun[7] = (v20.check_7(data, colour_bases), None, "compound well-formedness with 2.0:G38")
    if a.baseline:
        det12, accounted, moved, respelled = v21.check_12(data, v20.load(a.baseline), rec_all, mapping_all)
        rerun[12] = (det12, None, "0.8 headwords compared; %d with recorded gloss changes; %d in the image-compound pattern; %d found by id under a later spelling (2.1:G58, 2.3:G69)" % (len(accounted), len(moved), len(respelled)))
    det13, n13 = v20.check_13(by_id[13], ok_reused)
    rerun[13] = (det13, None, "%d forms reused under the sound ledger's own terms; reverted respellings reserve nothing (%s)" % (n13, "; ".join(reverted)))
    # the roots respelled in 2.3, the compounds made roots, and the new root, all as new roots
    rec18 = dict(rec, respelled=dict(rec["respelled"], **{i: (None, w) for i, w in rec["added_roots"].items()}))
    near18, exempt18 = v21.check_18(v22.without_reverted(data), rec18)
    rerun[18] = ([], "WARN" if near18 else None,
                 "%d roots respelled or added in %s checked against every active and reserved spelling: %s%s"
                 % (len(rec18["respelled"]), version, "; ".join(near18) or "none within one edit",
                    "; declared: " + "; ".join(exempt18) if exempt18 else ""))
    det24, n24 = v20.check_24(by_id[24], ok_reused)
    rerun[24] = (det24, None, "%d compounds built on a spelling the ledger records as reused" % n24)

    checks = []
    for check in raw["checks"]:
        entry = dict(check)
        cid = check["id"]
        if cid in rerun:
            det, forced, note = rerun[cid]
            shown = det if cid != 18 else near18
            entry.update(status=forced or ("FAIL" if det else "PASS"), count=len(shown), details=shown[:60],
                         details_total=len(shown), note=note, executed_against="validate_2_3.py, with the 2.0–2.3 rulings applied")
        elif cid in extra and cid != 18:
            det, note = extra[cid]
            entry.update(status="FAIL" if det else "PASS", count=len(det), details=det[:60], details_total=len(det),
                         note=note, executed_against="entries with since == %r (validate_1_1 supplement)" % version)
        else:
            entry["executed_against"] = "validate.py, unmodified, on the lexicon less its reverted respelling rows (%s)" % "; ".join(reverted)
        checks.append(entry)

    want = expected_from(prev, data, rec, mapping)
    det25 = [d for d in v21.check_25(want, data, rec, mapping) if not d.startswith("section rulings_")]
    det25 += check_rulings(want, data, mapping, rec["archived"])
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s; changesets: %s; %d spellings respelled or retired; %d entries moved (%d rebuilt or made roots); %d roots added; %d derivations retired; %d rulings superseded, kept as ruled; %d texts archived." % (
            os.path.basename(a.previous), ", ".join(c["id"] for c in changesets if c["edition"] == version),
            len(mapping), len(rec["respelled"]), len(rec["parts"]), len(rec["added_roots"]),
            len(rec["retired_derivations"]), len(rec["superseded"]), len(rec["archived"])),
        "executed_against": "validate_2_3.py",
    })

    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"], **{
        "respelled_in_%s" % version.replace(".", "_"): len(rec["respelled"]),
        "spellings_respelled": len(mapping),
        "image_compounds_attested": len(data.get("image_compounds", {}).get("attested", [])),
        "lexicalised_derivations": len(data["morphology"]["lexicalised_derivations"]),
    })
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_2_3.py: validate.py unmodified (less reverted respelling rows); checks 3/7/12/13/18/24 re-run with the 2.0–2.3 rulings; 25 edition-aware, superseded rulings kept as ruled (ADR-0019)"
    out = {"summary": summary, "checks": checks}
    for c in checks:
        print("%2d %s %s (%d)" % (c["id"], c["status"], c["check"], c["count"]))
        for d in c["details"][:8]:
            print("         " + d)
    print(summary["status_counts"])
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
    sys.exit(1 if any(c["status"] == "FAIL" for c in checks) else 0)


if __name__ == "__main__":
    main()
