"""validate_2_0.py: run the author's validator against Liraasa 2.0, honestly.

    PYTHONUTF8=1 python scripts/validate_2_0.py data/lexicon/liraasa_2_0.json \
        --previous data/lexicon/liraasa_1_2.json \
        --changes data/changes/2026-10-17-grammar-rulings.json data/changes/2026-10-17-lexicon-1-2.json \
                  data/changes/2026-10-18-lexicon-2-0.json \
        --baseline lexicon_0_8_rc2.json --out data/lexicon/validation_2_0.json

validate.py runs unmodified, as a subprocess. Then, as validate_1_2.py did
for 1.2 (ADR-0013), the checks a later edition's own rulings change are re-run
with those rulings applied, each exemption read from the data or the
changesets, never assumed (ADR-0016):

* 3  a derivation that spells an existing headword is the listed word, whose
     meaning overrides the default reading (2.0:G41). Allowed only where the
     author kept the ambiguity in the changeset (the op says so); WARN.
* 7  a compound's modifier may be a colour base, and a compound may be
     lexicalised with a suffix (2.0:G38).
* 12 a 0.8 headword's gloss may change where any recorded op (1.2 or 2.0)
     records exactly that slot; a headword moved into the image-compound
     pattern (2.0:G40) is disposed of, not missing.
* 13 and 24: a reserved spelling may be active again where the sound ledger
     says it was reusable from this edition and records its reuse.
* 18 a one-edit pair is allowed where phonology.declared_distance_1_pairs
     declares it (2.0:G37).
* 25 1.2 is carried verbatim except where a 2.0 op records the change,
     section by section.

Checks 5, 9 and 18 also run against `since == "2.0"` through
data/source/validate_1_1.py, imported, not edited. Each check records
`executed_against`.
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
SLOTS = ["root", "ascended", "negative", "verb", "negative_adjective", "adjective", "ascended_adjective"]


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def strip(rows, keys=("id",)):
    return [{k: v for k, v in r.items() if k not in keys} for r in rows]


def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def recorded(changesets):
    """What the changesets account for."""
    rec = {
        "slots": set(),  # (id, raw slot)
        "synonyms": set(),
        "examples": {},  # index -> {field: (from, to)}
        "particle_examples": {},  # (dp id, index) -> {field: (from, to)}
        "moved": set(),  # headword ids moved into the pattern
        "derivation_edits": {},  # spelling -> (from, to)
        "kept_ambiguity": set(),  # spellings whose op records the author kept an ambiguity
        "pairs": [],
        "sections": set(),
        "ledger": {},
    }
    for cs in changesets:
        for op in cs["ops"]:
            o = op["op"]
            if o in ("edit_gloss", "activate_slot"):
                rec["slots"].add((op["entry"], SLOT_KEY.get(op["slot"], op["slot"])))
            elif o == "edit_metadata" and op.get("field") == "english_synonyms":
                rec["synonyms"].add(op["entry"])
            elif o == "edit_metadata" and op.get("field") == "declared_distance_1_pairs":
                rec["pairs"].append(json.loads(op["to"]))
            elif o == "edit_example":
                i = int(op["entry"].split(":")[1])
                rec["examples"].setdefault(i, {})[op.get("field", "liraasa")] = (op["from"], op["to"])
            elif o == "edit_particle_example":
                _, dp, i = op["entry"].split(":")
                rec["particle_examples"].setdefault((dp, int(i)), {})[op.get("field", "liraasa")] = (op["from"], op["to"])
            elif o == "move_to_pattern":
                rec["moved"].add(op["entry"])
            elif o == "edit_derivation":
                rec["derivation_edits"][op["entry"]] = (op["from"], op["to"])
            elif o == "add_section":
                rec["sections"].add(op["entry"])
            elif o == "edit_ledger":
                rec["ledger"][op["entry"].replace("ledger:", "")] = (op["from"], op["to"])
            if "Author decision 2026-10-18: kept" in op.get("reason", "") and op.get("to"):
                rec["kept_ambiguity"].add(op["to"])
    return rec


def reused(data, version):
    """Spellings the sound ledger records as reused in (or before) this edition."""
    out = set()
    for row in data.get("sound_ledger", []):
        if row.get("state") == "REUSED" and row.get("reused_in") == version and row.get("reusable_from") <= version:
            out.add(row["spelling"])
    return out


# ------------------------------------------------------------------ re-runs

def check_3(raw_check, data, rec):
    """A derivation that spells a headword: allowed only where the author kept that ambiguity."""
    det, kept = [], []
    for d in raw_check["details"]:
        word = d.split(" ")[1] if d.startswith("derivation ") else ""
        base = d.split("(")[1].split("-")[0] if "(" in d else ""
        if base in rec["kept_ambiguity"]:
            kept.append(d)
        else:
            det.append(d)
    return det, kept


def check_7(data, colour_bases):
    det = []
    heads = {h["root"] for h in data["headwords"]}
    for h in data["headwords"]:
        if h["type"] != "Compound":
            continue
        parts = h.get("components") or []
        if len(parts) != 2:
            det.append("%s: %d components" % (h["root"], len(parts)))
            continue
        if "".join(parts) + h.get("suffix", "") != h["root"]:
            det.append("%s: spelling is not %s%s" % (h["root"], "+".join(parts), " + -" + h["suffix"] if h.get("suffix") else ""))
        for i, c in enumerate(parts):
            if c in heads:
                continue
            if i == 0 and c in colour_bases:
                continue  # 2.0:G38
            det.append("%s: component %s is not an active headword or (as modifier) a colour base" % (h["root"], c))
    return det


def check_12(data, base, rec):
    by_root = {h["root"]: h for h in data["headwords"]}
    attested = {h["root"]: h for h in data.get("image_compounds", {}).get("attested", [])}
    legacy = data.get("legacy", {})
    disposed = {r["old"] for k in ("retired_roots", "respelled_roots", "retired_compounds") for r in legacy.get(k, [])}
    det, accounted, moved = [], [], []
    for bh in base["headwords"]:
        w = bh["root"]
        h = by_root.get(w)
        if h is None:
            if w in attested and attested[w].get("id") in rec["moved"]:
                moved.append(w)
                h = attested[w]
            elif w in disposed:
                continue
            else:
                det.append("%s: missing with no legacy disposition" % w)
                continue
        if h["forms"] != bh["forms"]:
            det.append("%s: forms changed" % w)
        if h["glosses"] != bh["glosses"] and h.get("status_1_0") == "CARRIED":
            changed = [k for k in h["glosses"] if h["glosses"][k] != bh["glosses"].get(k)]
            unrecorded = [k for k in changed if (h.get("id"), k) not in rec["slots"]]
            if unrecorded:
                det.append("%s: glosses changed but status CARRIED (%s)" % (w, ", ".join(unrecorded)))
            else:
                accounted.append(w)
    return det, accounted, moved


def check_13(raw_check, ok):
    det = [d for d in raw_check["details"] if not any(d.startswith(s) for s in ok)]
    return det, len(raw_check["details"]) - len(det)


def check_18(data, version, rec):
    """New roots and function words two edits from every active spelling, except declared pairs."""
    declared = {frozenset(p) for p in data["phonology"].get("declared_distance_1_pairs", [])}
    active = set()
    for h in data["headwords"]:
        active.update(h["forms"].values())
    for key in ("function_words", "pronouns", "correlatives", "time_and_dates", "discourse_particles"):
        for r in data.get(key, []):
            if r.get("form"):
                active.add(r["form"])
    det, exempt = [], []
    for h in data["headwords"]:
        if h.get("since") != version or h["type"] != "Primal":
            continue
        w = h["root"]
        for other in sorted(active):
            if other == w or other in h["forms"].values() or abs(len(other) - len(w)) > 1:
                continue
            if edit_distance(w, other) <= 1:
                if frozenset((w, other)) in declared:
                    exempt.append("%s ~ %s (declared)" % (w, other))
                else:
                    det.append("%s ~ %s" % (w, other))
    return det, exempt


def check_24(raw_check, ok):
    det = [d for d in raw_check["details"] if not any(d.endswith("retired " + s) for s in ok)]
    return det, len(raw_check["details"]) - len(det)


def check_25(prev, data, rec):
    """1.2 carried verbatim except where a 2.0 op records the change."""
    det = []
    now = {h["root"]: h for h in data["headwords"]}
    attested = {h["root"]: h for h in data.get("image_compounds", {}).get("attested", [])}
    status = "status_" + data["version"].replace(".", "_")
    for before in prev["headwords"]:
        after = now.get(before["root"]) or attested.get(before["root"])
        if after is None:
            det.append("%s: dropped" % before["root"])
            continue
        if before["root"] in attested and after.get("id") not in rec["moved"]:
            det.append("%s: in the pattern with no op" % before["root"])
        hid = after.get("id")
        for k in SLOTS:
            if after["glosses"][k] != before["glosses"][k] and (hid, k) not in rec["slots"]:
                det.append("%s.%s: gloss changed with no op" % (before["root"], k))
        if after["english_synonyms"] != before["english_synonyms"]:
            if hid not in rec["synonyms"] and not any(s[0] == hid for s in rec["slots"]):
                det.append("%s: synonyms changed with no op" % before["root"])
        rest = lambda e: {k: v for k, v in e.items() if k not in ("glosses", "english_synonyms", status)}
        if rest(after) != rest(before):
            det.append("%s: changed outside glosses and synonyms" % before["root"])
    # headwords stay in 1.2's order, with 2.0's additions after them
    order = [h["root"] for h in data["headwords"] if h.get("since") != data["version"]]
    want = [h["root"] for h in prev["headwords"] if h["root"] in now]
    if order != want:
        det.append("1.2's headwords are out of order")

    def same(key, keys=("id",)):
        if strip(prev.get(key, []), keys) != strip(data.get(key, []), keys):
            det.append("section %s changed" % key)

    for key in ("function_words", "correlatives", "pronouns", "time_and_dates", "colors"):
        same(key)
    for key in ("numbers", "grammar", "rulings_1_0", "rulings_0_8_carried", "rulings_1_2", "dispositions",
                "settled_open_questions_0_8", "snapshot_0_8", "changelog_1_0", "changesets_1_2", "motion_prefixes"):
        if prev.get(key) != data.get(key):
            det.append("section %s changed" % key)
    # discourse particles: only recorded example edits
    for dp_before, dp_after in zip(prev["discourse_particles"], data["discourse_particles"]):
        b, a = dict(dp_before), dict(dp_after)
        be, ae = b.pop("examples"), a.pop("examples")
        if a != b or len(be) != len(ae):
            det.append("particle %s changed outside its examples" % b.get("form"))
            continue
        for i, (x, y) in enumerate(zip(be, ae)):
            edits = rec["particle_examples"].get((dp_after.get("id"), i), {})
            for field in set(x) | set(y):
                if x.get(field) != y.get(field):
                    fr, to = edits.get(field, (None, None))
                    if x.get(field) != fr or y.get(field) != to:
                        det.append("particle %s example %d.%s changed with no op" % (b.get("form"), i, field))
    # examples: only recorded edits
    pe, ne = prev["examples"], data["examples"]
    if len(pe) != len(ne):
        det.append("examples added or removed")
    for i, (x, y) in enumerate(zip(pe, ne)):
        edits = rec["examples"].get(i, {})
        for field in set(x) | set(y):
            if x.get(field) != y.get(field):
                fr, to = edits.get(field, (None, None))
                if x.get(field) != fr or y.get(field) != to:
                    det.append("example %d.%s changed with no op" % (i, field))
    # morphology: the derivation table grows; listed edits only; derivation_defaults added
    pm, nm = prev["morphology"], data["morphology"]
    if {k: v for k, v in pm.items() if k != "lexicalised_derivations"} != {k: v for k, v in nm.items() if k not in ("lexicalised_derivations", "derivation_defaults")}:
        det.append("section morphology changed outside lexicalised_derivations")
    if "derivation_defaults" in nm and "morphology.derivation_defaults" not in rec["sections"]:
        det.append("morphology.derivation_defaults with no op")
    # an edit names its derivation as derivation:<base id>:-<suffix>: spell it from the base
    roots = {h["id"]: h["root"] for h in prev["headwords"]}
    edits = {}
    for entry, change in rec["derivation_edits"].items():
        _, base, suffix = entry.split(":", 2) if not entry.startswith("derivation:lexicalised:") else ("", entry.split(":")[2], entry.split(":")[3])
        edits[roots.get(base, base) + suffix.lstrip("-")] = change
    for k, v in pm["lexicalised_derivations"].items():
        if nm["lexicalised_derivations"].get(k) != v and edits.get(k) != (v, nm["lexicalised_derivations"].get(k)):
            det.append("lexicalised derivation %s changed with no op" % k)
    # phonology: declared pairs appended only
    pp, npn = prev["phonology"], data["phonology"]
    if {k: v for k, v in pp.items() if k != "declared_distance_1_pairs"} != {k: v for k, v in npn.items() if k != "declared_distance_1_pairs"}:
        det.append("section phonology changed outside declared_distance_1_pairs")
    if npn["declared_distance_1_pairs"] != pp["declared_distance_1_pairs"] + rec["pairs"]:
        det.append("declared pairs differ from the recorded ones")
    # legacy: archived senses appended only
    pl, nl = prev["legacy"], data["legacy"]
    if {k: v for k, v in pl.items() if k != "archived_senses"} != {k: v for k, v in nl.items() if k != "archived_senses"}:
        det.append("section legacy changed outside archived_senses")
    if nl["archived_senses"][: len(pl["archived_senses"])] != pl["archived_senses"]:
        det.append("existing archived senses changed")
    # the sound ledger: recorded state changes only
    for x, y in zip(prev["sound_ledger"], data["sound_ledger"]):
        if x != y:
            fr, to = rec["ledger"].get(x["spelling"], (None, None))
            if x.get("state") != fr or y.get("state") != to or {**x, "state": None} != {k: v for k, v in {**y, "state": None}.items() if k != "reused_in"}:
                det.append("sound ledger row %s changed with no op" % x["spelling"])
    for key in ("image_compounds", "reserved_root_bank"):
        if key in data and key not in rec["sections"]:
            det.append("section %s with no op" % key)
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 1.2 lexicon the 2.0 changeset applies to")
    ap.add_argument("--changes", nargs="+", required=True, help="every changeset since 1.1, in order")
    ap.add_argument("--baseline", help="0.8-rc2, for check 12")
    ap.add_argument("--out")
    a = ap.parse_args()

    lexicon = os.path.abspath(a.lexicon)
    data, prev = load(lexicon), load(a.previous)
    changesets = [load(p) for p in a.changes]
    version = data["version"]
    rec = recorded(changesets)
    rec_now = recorded([c for c in changesets if c["edition"] == version])
    ok_reused = reused(data, version)
    colour_bases = {c["Base color"] for c in data["colors"]}

    tmp_out = os.path.join(ROOT, "_validate_raw_2_0.json")
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
    by_id = {c["id"]: c for c in raw["checks"]}

    extra = w11.supplement(data, version)  # 5, 9, 18 against since == version
    rerun = {}
    det3, kept3 = check_3(by_id[3], data, rec)
    rerun[3] = (det3, "WARN" if kept3 and not det3 else None,
                "derivations that spell a headword: %d kept by the author as a recorded ambiguity (the listed word's meaning overrides the default, 2.0:G41): %s" % (len(kept3), "; ".join(kept3)))
    rerun[7] = (check_7(data, colour_bases), None, "compound well-formedness with 2.0:G38: a colour base may be the modifier; a compound may carry a lexicalised suffix")
    if a.baseline:
        det12, accounted, moved = check_12(data, load(a.baseline), rec)
        rerun[12] = (det12, None, "0.8 headwords compared; %d with gloss changes all recorded by 1.2/2.0 ops; %d moved into the image-compound pattern by a recorded op (2.0:G40)" % (len(accounted), len(moved)))
    det13, n13 = check_13(by_id[13], ok_reused)
    rerun[13] = (det13, None, "%d forms of %s reused under the sound ledger's own terms (reusable from %s, reused in %s)" % (n13, ", ".join(sorted(ok_reused)) or "nothing", version, version))
    det18, exempt18 = check_18(data, version, rec_now)
    rerun[18] = (det18, None, "roots new in %s two edits from every active spelling; declared pairs exempt (2.0:G37): %s" % (version, "; ".join(exempt18)))
    det24, n24 = check_24(by_id[24], ok_reused)
    rerun[24] = (det24, None, "%d compounds built on a spelling the ledger records as reused in %s" % (n24, version))

    checks = []
    for check in raw["checks"]:
        entry = dict(check)
        cid = check["id"]
        if cid in rerun:
            det, forced, note = rerun[cid]
            entry.update(status=forced or ("FAIL" if det else "PASS"), count=len(det), details=det[:60],
                         details_total=len(det), note=note, executed_against="validate_2_0.py, with the 2.0 rulings applied")
        elif cid in extra and cid != 18:
            det, note = extra[cid]
            entry.update(status="FAIL" if det else "PASS", count=len(det), details=det[:60], details_total=len(det),
                         note=note, executed_against="entries with since == %r (validate_1_1 supplement)" % version)
        else:
            entry["executed_against"] = "validate.py, unmodified"
        checks.append(entry)

    det25 = check_25(prev, data, rec_now)
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s; changesets: %s." % (os.path.basename(a.previous), ", ".join(c["id"] for c in changesets if c["edition"] == version)),
        "executed_against": "validate_2_0.py",
    })

    added = w11.new_entries(data, version)
    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"], **{
        "new_in_%s" % version.replace(".", "_"): len(added),
        "new_primal_roots": sum(1 for h in added if h["type"] == "Primal"),
        "new_compounds": sum(1 for h in added if h["type"] == "Compound"),
        "image_compounds_attested": len(data.get("image_compounds", {}).get("attested", [])),
        "lexicalised_derivations": len(data["morphology"]["lexicalised_derivations"]),
    })
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_2_0.py: validate.py unmodified; checks 3/7/12/13/18/24 re-run with the 2.0 rulings; 5/9 via validate_1_1.supplement; 25 edition-aware (ADR-0016)"
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
