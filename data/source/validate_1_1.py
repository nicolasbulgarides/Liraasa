"""validate_1_1.py — run the 1.0 validator against a 1.1 lexicon, honestly.

Why a wrapper is needed
-----------------------
`validate.py` finds "new material" by testing `status_1_0 in ("NEW",
"REPLACED")`. A 1.1 entry did not exist in 1.0, so it carries `status_1_1`
instead, and three checks would therefore inspect **nothing** and report PASS
without having tested the new roots:

  * check 5  phonotactics of new roots
  * check 18 proximity: new roots at least two edits from every active spelling
  * check 9  the clause requiring a new entry to carry synonyms

A vacuous pass is worse than a failure, so this wrapper re-runs those three
against the entries the 1.1 edition actually added (`since == "1.1"`) and
records, per check, how it was executed. It changes **no grammar and no rule** —
only which entries count as new.

usage:
  python3 validate_1_1.py liraasa_1_1.json --baseline-1-0 liraasa_1_0.json
                          [--baseline lexicon_0_8_rc2.json]
                          [--corpus DIR ...] [--out validation_1_1.json]
"""
import argparse
import collections
import json
import os
import subprocess
import sys

from liraasa_core import (
    FORM_KEYS,
    edit_distance,
    function_word_phonotactics,
    new_root_phonotactics,
    seven_forms,
)

HERE = os.path.dirname(os.path.abspath(__file__))

# The checks whose "new material" predicate is 1.0-specific.
VERSION_GATED = {5: "phonotactics of new roots", 18: "proximity of new roots", 9: "synonyms on new entries"}


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def new_entries(data, version):
    """The headwords this edition added, by `since`, not by `status_1_0`."""
    return [h for h in data["headwords"] if h.get("since") == version]


def active_spellings(data):
    out = set()
    for h in data["headwords"]:
        for key in FORM_KEYS:
            out.add(h["forms"][key])
    for f in data.get("function_words", []):
        for part in str(f["form"]).split(" / "):
            part = part.strip()
            if part and " " not in part:
                out.add(part)
    for p in data.get("pronouns", []):
        out.add(p["form"])
    for c in data.get("correlatives", []):
        out.add(c["form"])
    for t in data.get("time_and_dates", []):
        if " " not in t["form"]:
            out.add(t["form"])
    for d in data.get("discourse_particles", []):
        out.add(d["form"])
    return out


def reserved_spellings(data):
    out = set()
    legacy = data.get("legacy", {})
    for r in legacy.get("retired_roots", []) + legacy.get("respelled_roots", []):
        out.update(r["old_forms"].values())
    for r in legacy.get("retired_compounds", []):
        out.add(r["old"])
    for s in data.get("sound_ledger", []):
        out.add(s["spelling"])
    return out


def supplement(data, version):
    """Re-run the version-gated checks against this edition's new material."""
    added = new_entries(data, version)
    new_roots = [h for h in added if h["type"] == "Primal"]
    results = {}

    # ---- check 5: phonotactics of the new roots and any new function words
    det = []
    for h in new_roots:
        problem = new_root_phonotactics(h["root"])
        if problem:
            det.append("%s: %s" % (h["root"], problem))
    new_fw = [f["form"] for f in data.get("function_words", []) if f.get("since") == version]
    for w in new_fw:
        problem = function_word_phonotactics(w)
        if problem:
            det.append("%s: %s" % (w, problem))
    results[5] = (det, "%d new roots and %d new function words checked." % (len(new_roots), len(new_fw)))

    # ---- check 18: at least two edits from every active or reserved spelling
    active = active_spellings(data) | reserved_spellings(data)
    declared = {tuple(sorted(p)) for p in data["phonology"]["declared_distance_1_pairs"]}
    det = []
    for h in new_roots:
        w = h["root"]
        for s in active:
            if s == w or "-" in s or "-" in w:
                continue
            if edit_distance(w, s, cap=1) <= 1:
                if tuple(sorted((w, s))) in declared:
                    continue
                if len(w) <= 2 and len(s) > 3:
                    continue
                det.append("%s ~ %s" % (w, s))
    results[18] = (
        sorted(set(det)),
        "%d new roots checked against %d active and reserved spellings." % (len(new_roots), len(active)),
    )

    # ---- check 9 (new-entry clause): every added entry carries synonyms,
    #      a used root gloss, and the required metadata.
    det = []
    for h in added:
        if not (h.get("english_synonyms") or []):
            det.append("%s: new entry without synonyms" % h["root"])
        if str(h["glosses"].get("root", "")).strip().startswith("—"):
            det.append("%s: root gloss unused" % h["root"])
        for field in ("type", "forms", "glosses", "register", "domain", "notes"):
            if not h.get(field):
                det.append("%s: missing %s" % (h["root"], field))
        if h.get("protected") is not True:
            det.append("%s: not protected" % h["root"])
        expected = seven_forms(h["root"])
        for key in FORM_KEYS:
            if h["forms"][key] != expected[key]:
                det.append("%s.%s: %s != %s" % (h["root"], key, h["forms"][key], expected[key]))
    results[9] = (det, "%d added entries checked." % len(added))

    return results


def compare_baseline(prev, nxt):
    """Confirm the previous edition is carried verbatim. Not one of the 24."""
    det = []
    prev_by_root = {h["root"]: h for h in prev["headwords"]}
    nxt_by_root = {h["root"]: h for h in nxt["headwords"]}

    for i, before in enumerate(prev["headwords"]):
        after = nxt["headwords"][i] if i < len(nxt["headwords"]) else None
        if after is None:
            det.append("%s: missing from the new edition" % before["root"])
        elif before != after:
            det.append("%s: changed" % before["root"])

    for root in prev_by_root:
        if root not in nxt_by_root:
            det.append("%s: dropped" % root)

    frozen = [
        "phonology", "morphology", "motion_prefixes", "grammar", "function_words",
        "pronouns", "correlatives", "numbers", "time_and_dates", "colors",
        "discourse_particles", "rulings_1_0", "rulings_0_8_carried", "legacy",
        "sound_ledger", "dispositions", "settled_open_questions_0_8", "snapshot_0_8",
        "changelog_1_0", "rhyme_families",
    ]
    for key in frozen:
        if prev.get(key) != nxt.get(key):
            det.append("section %s changed" % key)

    n = len(prev.get("examples", []))
    if nxt.get("examples", [])[:n] != prev.get("examples", []):
        det.append("existing examples changed")

    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--baseline-1-0", required=True, help="the immutable previous edition")
    ap.add_argument("--baseline", help="0.8-rc2, passed through to validate.py for check 12")
    ap.add_argument("--corpus", nargs="*", default=[])
    ap.add_argument("--out")
    a = ap.parse_args()

    data = load(a.lexicon)
    version = data["version"]

    # ---- 1. the unmodified validator, as the project ships it -------------
    tmp_out = os.path.join(HERE, "_validate_raw.json")
    cmd = [sys.executable, os.path.join(HERE, "validate.py"), a.lexicon, "--out", tmp_out]
    if a.baseline:
        cmd += ["--baseline", a.baseline]
    if a.corpus:
        cmd += ["--corpus"] + a.corpus
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    proc = subprocess.run(cmd, cwd=HERE, env=env, capture_output=True, text=True)
    print(proc.stdout, end="")
    if proc.stderr.strip():
        print(proc.stderr, file=sys.stderr)
    raw = load(tmp_out)
    os.remove(tmp_out)

    # ---- 2. re-run the version-gated checks on this edition's new material -
    extra = supplement(data, version)

    checks = []
    for check in raw["checks"]:
        cid = check["id"]
        entry = dict(check)
        if cid in extra:
            det, note = extra[cid]
            entry["executed_against"] = "entries with since == %r (wrapper)" % version
            entry["gated_note"] = (
                "validate.py selects new material by status_1_0, which a %s entry does not "
                "carry; re-run here against %s." % (version, "since == %r" % version)
            )
            # The wrapper's findings are authoritative for these checks.
            entry["status"] = "FAIL" if det else "PASS"
            entry["count"] = len(det)
            entry["details"] = det[:60]
            entry["details_total"] = len(det)
            entry["note"] = note
        else:
            entry["executed_against"] = "validate.py, unmodified"
        checks.append(entry)

    # ---- 3. the carried-forward comparison --------------------------------
    prev = load(a.baseline_1_0)
    carried = compare_baseline(prev, data)
    checks.append(
        {
            "id": 25,
            "check": "Previous edition carried verbatim (headwords, grammar, closed classes, examples)",
            "status": "FAIL" if carried else "PASS",
            "count": len(carried),
            "details": carried[:60],
            "details_total": len(carried),
            "note": "Compared against %s." % os.path.basename(a.baseline_1_0),
            "executed_against": "validate_1_1.py wrapper",
        }
    )

    status_counts = dict(collections.Counter(c["status"] for c in checks))
    added = new_entries(data, version)
    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"])
    summary["counts"]["new_in_%s" % version.replace(".", "_")] = len(added)
    summary["counts"]["new_primal_roots"] = sum(1 for h in added if h["type"] == "Primal")
    summary["counts"]["new_compounds"] = sum(1 for h in added if h["type"] == "Compound")
    summary["status_counts"] = status_counts
    summary["wrapper"] = (
        "validate_1_1.py: checks %s re-run against since == %r because validate.py gates them "
        "on status_1_0; check 25 added. No grammar or rule was changed."
        % (sorted(VERSION_GATED), version)
    )

    result = {"summary": summary, "checks": checks}
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=1)

    print()
    print("--- 1.1 wrapper ---")
    for cid in sorted(VERSION_GATED):
        c = next(x for x in checks if x["id"] == cid)
        print("%2d %-4s %s (%d) [%s]" % (cid, c["status"], VERSION_GATED[cid], c["details_total"], c["note"]))
    c25 = checks[-1]
    print("%2d %-4s %s (%d)" % (c25["id"], c25["status"], c25["check"], c25["details_total"]))
    for d in c25["details"][:10]:
        print("        ", d)
    print()
    print(summary["counts"])
    print(status_counts)
    sys.exit(1 if status_counts.get("FAIL") else 0)


if __name__ == "__main__":
    main()
