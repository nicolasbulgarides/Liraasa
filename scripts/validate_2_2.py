"""validate_2_2.py: run the author's validator against Liraasa 2.2, honestly.

    PYTHONUTF8=1 python scripts/validate_2_2.py data/lexicon/liraasa_2_2.json \
        --previous data/lexicon/liraasa_2_1.json \
        --changes <every changeset since 1.1, in order> \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_2_2.json

As validate_2_1.py (ADR-0017), with what 2.2 changes (ADR-0018):

* A respelling undone. 2.2 restores silro, which 2.1 had respelled puzu. The
  2.1 row in legacy.respelled_roots stays as history, marked `reverted`, and
  reserves nothing. validate.py reads every respelled_roots row as a
  reservation (checks 13, 15, 23, 24), so it runs on a copy of the lexicon
  without the reverted rows. That is the only difference, and each check
  records it in `executed_against`.
* Check 3 keeps every compound a ruling of any edition makes canon
  (2.1:G59 kezupago).
* Check 12 finds a 0.8 headword respelled in 2.1 or 2.2 by its id.
* Check 18 holds the root respelled in 2.2 (silro, restored) to the
  new-root distance rule, as a WARN for the author.
* Check 25: 2.1 is carried verbatim except for what a 2.2 op records:
  rulings marked superseded, the two filled slots, and the restored spelling.
"""
import argparse
import collections
import copy
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "data", "source")
sys.path.insert(0, SOURCE)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import validate_1_1 as w11  # noqa: E402  (read-only reference, imported not edited)
import validate_2_0 as v20  # noqa: E402
import validate_2_1 as v21  # noqa: E402


def recorded(changesets):
    rec = v21.recorded(changesets)
    rec["superseded"] = []  # (ruling ref, clause or None, by)
    for cs in changesets:
        for op in cs["ops"]:
            if op["op"] == "supersede_ruling":
                rec["superseded"].append((op["entry"], op.get("field"), op["to"]))
    return rec


def ruling_key(ref):
    edition = ref.split(":")[0]
    return "rulings_" + edition.replace(".", "_") + ("_carried" if edition == "0.8" else "")


def canon_all(data):
    """Compounds a ruling of any edition declares canon over a derivation reading."""
    out = set()
    for k, v in data.items():
        if k.startswith("rulings_") and isinstance(v, list):
            for r in v:
                out |= set(re.findall(r"Compound reading of ([a-z]+) is canon", r["ruling"]))
    return out


def respelling_map(data, rec):
    """Old spelling -> new, for every row the recorded respellings made."""
    old_roots = {fr for fr, _ in rec["respelled"].values()}
    return {k: v["to"] for k, v in data["legacy"]["migration_forms"].items() if v.get("via") in old_roots}


def expected_from(prev, data, rec, mapping):
    """2.1 with the recorded non-respelling 2.2 changes applied, for check 25."""
    want = copy.deepcopy(prev)
    for ref, clause, by in rec["superseded"]:
        r = next(x for x in want[ruling_key(ref)] if x["id"] == ref.split(":")[1])
        if clause is None:
            r["superseded_by"] = by
        else:
            r["superseded_in_part"] = r.get("superseded_in_part", []) + [{"clause": clause, "by": by}]
    now = {h["id"]: h for h in data["headwords"]}
    slot_key = {"negativeAdjective": "negative_adjective", "ascendedAdjective": "ascended_adjective"}
    for (hid, slot) in rec["slots"]:
        h = next(x for x in want["headwords"] if x["id"] == hid)
        k = slot_key.get(slot, slot)
        h["glosses"][k] = now[hid]["glosses"][k]
        h["english_synonyms"] = now[hid]["english_synonyms"]
    # the respelling undone: its row is marked, and the rows that led to it are gone
    restored = {to for _, to in rec["respelled"].values()}
    for r in want["legacy"]["respelled_roots"]:
        if r["old"] in restored and any(r["new"] == fr for fr, _ in rec["respelled"].values()):
            r["reverted"] = True
    mig = want["legacy"]["migration_forms"]
    for k in list(mig):
        if mapping.get(mig[k]["to"]) == k:
            del mig[k]
    return want


def without_reverted(data):
    out = copy.deepcopy(data)
    out["legacy"]["respelled_roots"] = [r for r in out["legacy"]["respelled_roots"] if not r.get("reverted")]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 2.1 lexicon the 2.2 changeset applies to")
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
    tmp_lex = os.path.join(ROOT, "_validate_lex_2_2.json")
    tmp_out = os.path.join(ROOT, "_validate_raw_2_2.json")
    with open(tmp_lex, "w", encoding="utf-8") as f:
        json.dump(without_reverted(data), f, ensure_ascii=False, indent=1)
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
    canon = canon_all(data)
    det3, kept3 = v21.check_3(by_id[3], canon, rec_all["kept_ambiguity"])
    rerun[3] = (det3, "WARN" if kept3 and not det3 else None,
                "derivations that spell a headword: %d kept by the author (a 2.0 recorded ambiguity, or a compound a ruling makes canon: %s): %s"
                % (len(kept3), ", ".join(sorted(canon)), "; ".join(kept3)))
    rerun[7] = (v20.check_7(data, colour_bases), None, "compound well-formedness with 2.0:G38")
    if a.baseline:
        det12, accounted, moved, respelled = v21.check_12(data, v20.load(a.baseline), rec_all, mapping_all)
        rerun[12] = (det12, None, "0.8 headwords compared; %d with recorded gloss changes; %d in the image-compound pattern; %d found by id under a later spelling (2.1:G58)" % (len(accounted), len(moved), len(respelled)))
    det13, n13 = v20.check_13(by_id[13], ok_reused)
    rerun[13] = (det13, None, "%d forms reused under the sound ledger's own terms; reverted respellings reserve nothing (%s)" % (n13, "; ".join(reverted)))
    near18, exempt18 = v21.check_18(without_reverted(data), rec)
    rerun[18] = ([], "WARN" if near18 else None,
                 "%d roots respelled in %s checked against every active and reserved spelling: %s"
                 % (len(rec["respelled"]), version, "; ".join(near18) or "none within one edit"))
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
                         details_total=len(shown), note=note, executed_against="validate_2_2.py, with the 2.0–2.2 rulings applied")
        elif cid in extra and cid != 18:
            det, note = extra[cid]
            entry.update(status="FAIL" if det else "PASS", count=len(det), details=det[:60], details_total=len(det),
                         note=note, executed_against="entries with since == %r (validate_1_1 supplement)" % version)
        else:
            entry["executed_against"] = "validate.py, unmodified, on the lexicon less its reverted respelling rows (%s)" % "; ".join(reverted)
        checks.append(entry)

    det25 = v21.check_25(expected_from(prev, data, rec, mapping), data, rec, mapping)
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s; changesets: %s; %d spellings respelled; %d rulings superseded; %d slots filled." % (
            os.path.basename(a.previous), ", ".join(c["id"] for c in changesets if c["edition"] == version),
            len(mapping), len(rec["superseded"]), len(rec["slots"])),
        "executed_against": "validate_2_2.py",
    })

    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"], **{
        "respelled_in_%s" % version.replace(".", "_"): len(rec["respelled"]),
        "spellings_respelled": len(mapping),
        "image_compounds_attested": len(data.get("image_compounds", {}).get("attested", [])),
        "lexicalised_derivations": len(data["morphology"]["lexicalised_derivations"]),
    })
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_2_2.py: validate.py unmodified (less reverted respelling rows); checks 3/7/12/13/18/24 re-run with the 2.0–2.2 rulings; 25 edition-aware (ADR-0018)"
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
