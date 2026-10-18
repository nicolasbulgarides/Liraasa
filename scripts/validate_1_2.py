"""validate_1_2.py: run the author's validator against Liraasa 1.2, honestly.

    PYTHONUTF8=1 python scripts/validate_1_2.py data/lexicon/liraasa_1_2.json \
        --previous data/lexicon/liraasa_1_1.json \
        --changes data/changes/2026-10-17-grammar-rulings.json data/changes/2026-10-17-lexicon-1-2.json \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_1_2.json

Builds on data/source/validate_1_1.py (ADR-0009 §5), which it imports
without modifying: validate.py runs unmodified as a subprocess, and checks 5,
9 and 18 are re-run against `since == "1.2"`.

Two checks are edition-gated in ways the 1.1 wrapper did not need (ADR-0013):

* Check 12 fails a 0.8 headword whose glosses changed while `status_1_0` is
  CARRIED. That was the right test for 1.0. 1.2 reglosses six carried
  entries on purpose, so here a changed slot is accounted for only if a 1.2
  changeset op (edit_gloss / activate_slot) records exactly that slot.
* Check 25, "previous edition carried verbatim", becomes "carried verbatim
  except where a changeset op records the change", verified section by
  section, so an unrecorded edit anywhere still fails.

Each check records `executed_against`, as validation_1_1.json does.
"""
import argparse
import collections
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "data", "source")
sys.path.insert(0, SOURCE)

import validate_1_1 as w11  # noqa: E402  (read-only reference, imported not edited)

SLOT_KEY = {"negativeAdjective": "negative_adjective", "ascendedAdjective": "ascended_adjective"}


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def strip_ids(rows):
    return [{k: v for k, v in r.items() if k != "id"} for r in rows]


def recorded(changesets, prev):
    """The changes the changesets account for, keyed for lookup."""
    id_to_root = {}
    for h in prev["headwords"]:
        pass
    slots = set()  # (root, raw slot)
    synonyms = set()  # roots whose synonyms an op edits
    examples = {}
    for cs in changesets:
        for op in cs["ops"]:
            if op["op"] in ("edit_gloss", "activate_slot"):
                slots.add((op["entry"], SLOT_KEY.get(op["slot"], op["slot"])))
            elif op["op"] == "edit_metadata" and op.get("field") == "english_synonyms":
                synonyms.add(op["entry"])
            elif op["op"] == "edit_example":
                examples[int(op["entry"].split(":")[1])] = (op["from"], op["to"])
    return slots, synonyms, examples


def check_12(data, base, slots):
    """validate.py check 12, with recorded 1.2 reglosses accounted for."""
    by_root = {h["root"]: h for h in data["headwords"]}
    legacy = data.get("legacy", {})
    disposed = {r["old"] for k in ("retired_roots", "respelled_roots", "retired_compounds") for r in legacy.get(k, [])}
    det, accounted = [], []
    for bh in base["headwords"]:
        w = bh["root"]
        h = by_root.get(w)
        if h is None:
            if w not in disposed:
                det.append("%s: missing with no legacy disposition" % w)
            continue
        if h["forms"] != bh["forms"]:
            det.append("%s: forms changed" % w)
        if h["glosses"] != bh["glosses"] and h.get("status_1_0") == "CARRIED":
            changed = [k for k in h["glosses"] if h["glosses"][k] != bh["glosses"].get(k)]
            unrecorded = [k for k in changed if (h.get("id"), k) not in slots]
            if unrecorded:
                det.append("%s: glosses changed but status CARRIED (%s)" % (w, ", ".join(unrecorded)))
            else:
                accounted.append("%s: %s (recorded 1.2 op)" % (w, ", ".join(changed)))
    return det, accounted


def check_25(prev, data, slots, synonyms, examples):
    """The previous edition is carried verbatim except where an op records the change."""
    det = []
    nxt = {h["root"]: h for h in data["headwords"]}
    for i, before in enumerate(prev["headwords"]):
        after = data["headwords"][i] if i < len(data["headwords"]) else None
        if after is None or after["root"] != before["root"]:
            det.append("%s: moved or missing" % before["root"])
            continue
        hid = after.get("id")
        a = {k: v for k, v in after.items() if k not in ("id", "status_1_2")}
        b = dict(before)
        for k in a["glosses"]:
            if a["glosses"][k] != b["glosses"].get(k) and (hid, k) not in slots:
                det.append("%s.%s: gloss changed with no op" % (before["root"], k))
        if a.get("status_1_2") is None and after.get("status_1_2") not in (None, "REGLOSSED"):
            det.append("%s: unexpected status_1_2" % before["root"])
        if a["english_synonyms"] != b["english_synonyms"]:
            if hid not in synonyms and not any(s[0] == hid for s in slots):
                det.append("%s: synonyms changed with no op" % before["root"])
        rest = lambda e: {k: v for k, v in e.items() if k not in ("glosses", "english_synonyms")}
        if rest(a) != rest(b):
            det.append("%s: changed outside glosses and synonyms" % before["root"])
    for root in (h["root"] for h in prev["headwords"]):
        if root not in nxt:
            det.append("%s: dropped" % root)

    def appended(key):
        p, n = prev.get(key, []), strip_ids(data.get(key, []))
        if n[: len(p)] != strip_ids(p):
            det.append("section %s: existing rows changed" % key)

    for key in ("function_words", "correlatives"):
        appended(key)
    for key in ("pronouns", "time_and_dates", "colors", "discourse_particles"):
        if strip_ids(prev.get(key, [])) != strip_ids(data.get(key, [])):
            det.append("section %s changed" % key)
    for key in ("numbers", "grammar", "rulings_1_0", "rulings_0_8_carried", "sound_ledger", "dispositions",
                "settled_open_questions_0_8", "snapshot_0_8", "changelog_1_0"):
        if prev.get(key) != data.get(key):
            det.append("section %s changed" % key)
    pm, nm = prev["morphology"], data["morphology"]
    if {k: v for k, v in pm.items() if k != "lexicalised_derivations"} != {k: v for k, v in nm.items() if k != "lexicalised_derivations"}:
        det.append("section morphology changed outside lexicalised_derivations")
    if any(nm["lexicalised_derivations"].get(k) != v for k, v in pm["lexicalised_derivations"].items()):
        det.append("an existing lexicalised derivation changed")
    if prev["motion_prefixes"]["retired"] != data["motion_prefixes"]["retired"] or prev["motion_prefixes"]["rule"] != data["motion_prefixes"]["rule"]:
        det.append("motion_prefixes changed outside the curated metaphors")
    pp, npn = prev["phonology"], data["phonology"]
    if {k: v for k, v in pp.items() if k != "protected_exceptions"} != {k: v for k, v in npn.items() if k != "protected_exceptions"}:
        det.append("section phonology changed outside protected_exceptions")
    pl, nl = prev["legacy"], data["legacy"]
    if {k: v for k, v in pl.items() if k != "archived_senses"} != {k: v for k, v in nl.items() if k != "archived_senses"}:
        det.append("section legacy changed outside archived_senses")
    if nl["archived_senses"][: len(pl["archived_senses"])] != pl["archived_senses"]:
        det.append("existing archived senses changed")
    pe, ne = prev["examples"], data["examples"]
    if len(pe) != len(ne):
        det.append("examples added or removed")
    for i, (a, b) in enumerate(zip(pe, ne)):
        if a != b:
            frm_to = examples.get(i)
            if frm_to is None or a["liraasa"] != frm_to[0] or b["liraasa"] != frm_to[1] or {**a, "liraasa": None} != {**b, "liraasa": None}:
                det.append("example %d changed with no op" % i)
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 1.1 lexicon the changesets apply to")
    ap.add_argument("--changes", nargs="+", required=True)
    ap.add_argument("--baseline", help="0.8-rc2, for check 12")
    ap.add_argument("--out")
    a = ap.parse_args()

    lexicon = os.path.abspath(a.lexicon)
    data, prev = load(lexicon), load(a.previous)
    changesets = [load(p) for p in a.changes]
    version = data["version"]
    slots, synonyms, examples = recorded(changesets, prev)

    tmp_out = os.path.join(ROOT, "_validate_raw_1_2.json")
    cmd = [sys.executable, os.path.join(SOURCE, "validate.py"), lexicon, "--out", tmp_out]
    if a.baseline:
        cmd += ["--baseline", os.path.abspath(a.baseline)]
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    proc = subprocess.run(cmd, cwd=SOURCE, env=env, capture_output=True, text=True)
    if proc.returncode not in (0, 1) or not os.path.exists(tmp_out):
        print(proc.stdout, proc.stderr, file=sys.stderr)
        sys.exit(2)
    raw = load(tmp_out)
    os.remove(tmp_out)

    extra = w11.supplement(data, version)
    if a.baseline:
        det12, accounted = check_12(data, load(a.baseline), slots)
        extra[12] = (det12, "0.8 headwords compared; %d gloss changes accounted for by recorded 1.2 ops: %s" % (len(accounted), "; ".join(accounted)))

    checks = []
    for check in raw["checks"]:
        entry = dict(check)
        cid = check["id"]
        if cid in extra:
            det, note = extra[cid]
            entry.update(
                status="FAIL" if det else "PASS",
                count=len(det),
                details=det[:60],
                details_total=len(det),
                note=note,
                executed_against=("entries with since == %r (validate_1_1 supplement)" % version) if cid != 12
                else "validate_1_2.py: 0.8 baseline, with recorded 1.2 reglosses accounted for",
            )
        else:
            entry["executed_against"] = "validate.py, unmodified"
        checks.append(entry)

    det25 = check_25(prev, data, slots, synonyms, examples)
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s; changesets: %s." % (os.path.basename(a.previous), ", ".join(c["id"] for c in changesets)),
        "executed_against": "validate_1_2.py",
    })

    added = w11.new_entries(data, version)
    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"], **{
        "new_in_%s" % version.replace(".", "_"): len(added),
        "new_primal_roots": sum(1 for h in added if h["type"] == "Primal"),
        "new_compounds": sum(1 for h in added if h["type"] == "Compound"),
    })
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_1_2.py: validate.py unmodified, checks 5/9/18 via validate_1_1.supplement, check 12 and 25 edition-aware (ADR-0013)"
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
