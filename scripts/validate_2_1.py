"""validate_2_1.py: run the author's validator against Liraasa 2.1, honestly.

    PYTHONUTF8=1 python scripts/validate_2_1.py data/lexicon/liraasa_2_1.json \
        --previous data/lexicon/liraasa_2_0.json \
        --changes data/changes/2026-10-17-grammar-rulings.json data/changes/2026-10-17-lexicon-1-2.json                   data/changes/2026-10-18-lexicon-2-0.json data/changes/2026-10-18-lexicon-2-0-review.json                   data/changes/2026-10-18-lexicon-2-1.json \
        --baseline data/lexicon/lexicon_0_8_rc2.json --out data/lexicon/validation_2_1.json

validate.py runs unmodified, as a subprocess, then the checks a later
edition's own rulings change are re-run, as validate_2_0.py does (ADR-0016),
with what 2.1 changes (ADR-0017):

* 3  a derivation that spells a headword: allowed where a ruling says the
     compound reading is canon (2.1:G59, kezupago = kezu + pago, not
     kezu + -pago); WARN.
* 7, 13, 24 as for 2.0.
* 12 a 0.8 headword respelled in 2.1, or built on a respelled root, is
     found by its id under its new spelling (2.1:G58).
* 18 the roots a 2.1 op respells are checked like new roots: two edits from
     every active spelling and every reserved one. The spellings are the
     author's (2.1:G58 protects them), so a near neighbour is reported for
     the author as WARN, never silently passed.
* 25 2.0 is carried verbatim except where a 2.1 op records the change. A
     respelling changes text everywhere its words appear: each difference
     must be exactly the recorded respelling (legacy.migration_forms of the
     respelled roots) or a recorded edit.
"""
import argparse
import collections
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

SLOTS = v20.SLOTS
WORD = re.compile(r"[A-Za-z]+(?:-[A-Za-z]+)*")


def migrate(text, mapping):
    """respell.ts correctText: whole words, a -ri/-ti ending kept, a capital kept."""
    def one(m):
        word = m.group(0)
        lower = word.lower()
        hit, rest = mapping.get(lower), ""
        if hit is None:
            for suffix in ("tiri", "ri", "ti"):
                stem = lower[: -len(suffix)]
                if lower.endswith(suffix) and stem in mapping:
                    hit, rest = mapping[stem], suffix
                    break
        if hit is None:
            return word
        out = hit + rest
        return out[0].upper() + out[1:] if word[0].isupper() else out
    return WORD.sub(one, text)


def migrated(x, mapping):
    """Every string in a structure, migrated."""
    if isinstance(x, str):
        return migrate(x, mapping)
    if isinstance(x, list):
        return [migrated(v, mapping) for v in x]
    if isinstance(x, dict):
        return {k: migrated(v, mapping) for k, v in x.items()}
    return x


def recorded(changesets):
    rec = v20.recorded(changesets)
    rec["respelled"] = {}  # headword id -> (from, to)
    rec["fw_examples"] = {}  # fw id -> (from, to)
    rec["bank"] = set()
    for cs in changesets:
        for op in cs["ops"]:
            o = op["op"]
            if o in ("respell_root", "respell_as_compound"):
                rec["respelled"][op["entry"]] = (op["from"], op["to"])
            elif o == "edit_function_word":
                rec["fw_examples"][op["entry"]] = (op["from"], op["to"])
            elif o == "spend_bank_root":
                rec["bank"].add(op["entry"].replace("bank:", ""))
    return rec


def respelling_map(data, rec):
    """Old spelling -> new, for every form the edition's respellings moved."""
    old_roots = {fr for fr, _ in rec["respelled"].values()}
    return {k: v["to"] for k, v in data["legacy"]["migration_forms"].items() if v.get("via") in old_roots}


def canon_compounds(data, version):
    """Compounds a ruling of this edition declares canon over a derivation reading."""
    out = set()
    for r in data.get("rulings_" + version.replace(".", "_"), []):
        out |= set(re.findall(r"Compound reading of ([a-z]+) is canon", r["ruling"]))
    return out


def check_3(raw_check, canon, kept_before):
    """Canon compounds of this edition, and the ambiguities the author kept in 2.0."""
    det, kept = [], []
    for d in raw_check["details"]:
        base = d.split("(")[1].split("-")[0] if "(" in d else ""
        if base in kept_before or any(re.search(r"\b%s\b" % w, d) for w in canon):
            kept.append(d)
        else:
            det.append(d)
    return det, kept


def reused(data, version):
    """Spellings the sound ledger records as reused in this edition or an earlier one."""
    return {row["spelling"] for row in data.get("sound_ledger", [])
            if row.get("state") == "REUSED" and row.get("reused_in", "~") <= version
            and row.get("reusable_from") <= version}


def check_12(data, base, rec, mapping):
    """As 2.0, but a headword respelled in this edition is found by its id."""
    by_root = {h["root"]: h for h in data["headwords"]}
    attested = {h["root"]: h for h in data.get("image_compounds", {}).get("attested", [])}
    legacy = data.get("legacy", {})
    disposed = {r["old"] for k in ("retired_roots", "respelled_roots", "retired_compounds") for r in legacy.get(k, [])}
    det, accounted, moved, respelled = [], [], [], []
    for bh in base["headwords"]:
        w = bh["root"]
        h = by_root.get(w) or attested.get(w)
        if h is None and w in mapping:
            h = by_root.get(mapping[w]) or attested.get(mapping[w])
            if h is not None:
                respelled.append(w)
                forms = {k: mapping.get(f, f) for k, f in bh["forms"].items()}
                if h["forms"] != forms:
                    det.append("%s: forms are not the recorded respelling" % w)
                continue
        if h is None:
            if w not in disposed:
                det.append("%s: missing with no legacy disposition" % w)
            continue
        if w in attested:
            moved.append(w)
        if h["forms"] != bh["forms"]:
            det.append("%s: forms changed" % w)
        if h["glosses"] != bh["glosses"] and h.get("status_1_0") == "CARRIED":
            changed = [k for k in h["glosses"] if h["glosses"][k] != bh["glosses"].get(k)]
            unrecorded = [k for k in changed if (h.get("id"), k) not in rec["slots"]]
            if unrecorded:
                det.append("%s: glosses changed but status CARRIED (%s)" % (w, ", ".join(unrecorded)))
            else:
                accounted.append(w)
    return det, accounted, moved, respelled


def check_18(data, rec):
    """The respelled roots against every active and reserved spelling."""
    declared = {frozenset(p) for p in data["phonology"].get("declared_distance_1_pairs", [])}
    active = {}
    for h in data["headwords"]:
        if h["type"] == "Primal":
            active.setdefault(h["root"], "%s (root)" % h["root"])
    for key in ("function_words", "pronouns", "correlatives", "time_and_dates", "discourse_particles"):
        for r in data.get(key, []):
            if r.get("form"):
                active.setdefault(r["form"], key.replace("_", " ").rstrip("s"))
    for c in data["colors"]:
        for k in ("Base color",):
            if c.get(k):
                active.setdefault(c[k], "colour")
    reserved = {}
    for r in data["legacy"]["respelled_roots"] + data["legacy"]["retired_roots"]:
        reserved.setdefault(r["old"], "reserved: was %s" % r["old"])
    by_id = {h["id"]: h for h in data["headwords"]}
    near, exempt = [], []
    for hid, (_, to) in rec["respelled"].items():
        h = by_id.get(hid)
        if h is None or h["type"] != "Primal":
            continue  # a root replaced by a compound: check 17 and the sound audit cover it
        w = h["root"]
        for pool in (active, reserved):
            for other, what in sorted(pool.items()):
                if other == w or "-" in other or abs(len(other) - len(w)) > 1:
                    continue
                if v20.edit_distance(w, other) <= 1:
                    line = "%s ~ %s (%s)" % (w, other, what)
                    (exempt if frozenset((w, other)) in declared else near).append(line)
    return sorted(set(near)), exempt


def check_25(prev, data, rec, mapping):
    """2.0 carried verbatim except where a 2.1 op records the change."""
    det = []
    status = "status_" + data["version"].replace(".", "_")
    m = lambda x: migrated(x, mapping)

    def entries(lex):
        rows = lex["headwords"] + lex.get("image_compounds", {}).get("attested", [])
        return {h["id"]: h for h in rows}

    now, before_all = entries(data), entries(prev)
    for hid, before in before_all.items():
        after = now.get(hid)
        if after is None:
            det.append("%s: dropped" % before["root"])
            continue
        want = dict(before)
        if before["root"] != after["root"]:
            if mapping.get(before["root"]) != after["root"]:
                det.append("%s → %s: not the recorded respelling" % (before["root"], after["root"]))
            want["root"] = after["root"]
            want["forms"] = {k: mapping.get(f, f) for k, f in before["forms"].items()}
            if hid in rec["respelled"] and before["type"] == "Primal" and after["type"] == "Compound":
                want["type"] = "Compound"
                want["components"] = rec["respelled"][hid][1].split("+")
            elif before.get("components"):
                want["components"] = [mapping.get(c, c) for c in before["components"]]
        if "notes" in want:
            want["notes"] = m(want["notes"])
        if want != after:
            keys = sorted(k for k in set(want) | set(after) if want.get(k) != after.get(k) and k != status)
            if keys:
                det.append("%s: changed outside the respelling (%s)" % (before["root"], ", ".join(keys)))
    order = lambda lex: [h["id"] for h in lex["headwords"]]
    if order(prev) != order(data):
        det.append("2.0's headwords are out of order")

    for key in ("pronouns", "correlatives", "time_and_dates", "colors", "numbers", "grammar", "dispositions",
                "settled_open_questions_0_8", "snapshot_0_8", "changelog_1_0", "changesets_1_2", "changesets_2_0",
                "phonology", "sound_ledger"):
        if prev.get(key) != data.get(key):
            det.append("section %s changed" % key)
    for key in [k for k in prev if k.startswith("rulings_")] + ["motion_prefixes", "discourse_particles"]:
        if m(prev.get(key)) != data.get(key):
            det.append("section %s is not 2.0 respelled" % key)
    # function words: respelled examples, and recorded example edits
    for x, y in zip(prev["function_words"], data["function_words"]):
        x = m(x)
        if x.get("example") != y.get("example"):
            fr, to = rec["fw_examples"].get(y.get("id"), (None, None))
            if x.get("example") != fr or y.get("example") != to:
                det.append("function word %s example changed with no op" % y["form"])
            x = dict(x, example=y.get("example"))
        if x != y:
            det.append("function word %s changed" % y["form"])
    if len(prev["function_words"]) != len(data["function_words"]):
        det.append("function words added or removed")
    # examples: respelled, then recorded edits
    pe, ne = prev["examples"], data["examples"]
    if len(pe) != len(ne):
        det.append("examples added or removed")
    for i, (x, y) in enumerate(zip(pe, ne)):
        x = dict(x, liraasa=m(x["liraasa"]), feature=m(x["feature"]) if x["feature"].startswith("vocab:") else x["feature"])
        edits = rec["examples"].get(i, {})
        for field in set(x) | set(y):
            if x.get(field) != y.get(field):
                fr, to = edits.get(field, (None, None))
                if x.get(field) != fr or y.get(field) != to:
                    det.append("example %d.%s changed with no op" % (i, field))
    # morphology: derivations respelled with their base
    pm, nm = prev["morphology"], data["morphology"]
    if {k: v for k, v in pm.items() if k != "lexicalised_derivations"} != {k: v for k, v in nm.items() if k != "lexicalised_derivations"}:
        det.append("section morphology changed outside lexicalised_derivations")
    want = {mapping.get(k, k): (m(v) if k in mapping else v) for k, v in pm["lexicalised_derivations"].items()}
    if list(want.items()) != list(nm["lexicalised_derivations"].items()):
        det.append("lexicalised derivations are not 2.0 respelled")
    # image compounds: only the attested rows move (checked above), and the notes
    pi, ni = dict(prev["image_compounds"]), dict(data["image_compounds"])
    pi.pop("attested"), ni.pop("attested")
    if m(pi) != ni:
        det.append("section image_compounds changed outside attested")
    # legacy: respelled roots appended; migration rows added or re-pointed by the respelling
    pl, nl = prev["legacy"], data["legacy"]
    if {k: v for k, v in pl.items() if k not in ("respelled_roots", "migration_forms")} != \
            {k: v for k, v in nl.items() if k not in ("respelled_roots", "migration_forms")}:
        det.append("section legacy changed outside respelled_roots and migration_forms")
    if nl["respelled_roots"][: len(pl["respelled_roots"])] != pl["respelled_roots"]:
        det.append("existing respelled roots changed")
    added = nl["respelled_roots"][len(pl["respelled_roots"]):]
    if sorted(r["old"] for r in added) != sorted(fr for fr, _ in rec["respelled"].values()):
        det.append("respelled roots appended do not match the recorded ops")
    for k, row in pl["migration_forms"].items():
        after = nl["migration_forms"].get(k)
        if after is None or dict(row, to=mapping.get(row["to"], row["to"])) != after:
            det.append("migration row %s changed" % k)
    for k in set(nl["migration_forms"]) - set(pl["migration_forms"]):
        if k not in mapping:
            det.append("migration row %s added with no respelling" % k)
    # the bank: recorded spent roots only
    pb, nb = prev.get("reserved_root_bank", {}), data.get("reserved_root_bank", {})
    for key, group in pb.items():
        if isinstance(group, dict) and "roots" in group:
            left = [r for r in group["roots"] if r not in rec["bank"]]
            if nb.get(key, {}).get("roots") != left:
                det.append("reserved_root_bank.%s changed with no op" % key)
    return det


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("--previous", required=True, help="the 2.0 lexicon the 2.1 changeset applies to")
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
    ok_reused = reused(data, version)
    colour_bases = {c["Base color"] for c in data["colors"]}
    canon = canon_compounds(data, version)

    tmp_out = os.path.join(ROOT, "_validate_raw_2_1.json")
    cmd = [sys.executable, os.path.join(SOURCE, "validate.py"), lexicon, "--out", tmp_out]
    if a.baseline:
        cmd += ["--baseline", os.path.abspath(a.baseline)]
    env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8")
    proc = subprocess.run(cmd, cwd=SOURCE, env=env, capture_output=True, text=True)
    if proc.returncode not in (0, 1) or not os.path.exists(tmp_out):
        print(proc.stdout, proc.stderr, file=sys.stderr)
        sys.exit(2)
    raw = v20.load(tmp_out)
    os.remove(tmp_out)
    by_id = {c["id"]: c for c in raw["checks"]}

    extra = w11.supplement(data, version)  # 5, 9 against since == version
    rerun = {}
    det3, kept3 = check_3(by_id[3], canon, rec_all["kept_ambiguity"])
    rerun[3] = (det3, "WARN" if kept3 and not det3 else None,
                "derivations that spell a headword: %d kept by the author, as an ambiguity recorded in 2.0 or where a 2.1 ruling makes the compound reading canon (%s): %s"
                % (len(kept3), ", ".join(sorted(canon)) or "none", "; ".join(kept3)))
    rerun[7] = (v20.check_7(data, colour_bases), None, "compound well-formedness with 2.0:G38: a colour base may be the modifier; a compound may carry a lexicalised suffix")
    if a.baseline:
        det12, accounted, moved, respelled = check_12(data, v20.load(a.baseline), rec_all, mapping)
        rerun[12] = (det12, None, "0.8 headwords compared; %d with recorded gloss changes; %d in the image-compound pattern; %d found by id under their 2.1 spelling (2.1:G58)" % (len(accounted), len(moved), len(respelled)))
    det13, n13 = v20.check_13(by_id[13], ok_reused)
    rerun[13] = (det13, None, "%d forms reused under the sound ledger's own terms" % n13)
    near18, exempt18 = check_18(data, rec)
    rerun[18] = ([], "WARN" if near18 else None,
                 "%d roots respelled in %s checked against every active and reserved spelling. The spellings are the author's (2.1:G58); "
                 "%d one-edit neighbours are listed for the author (2.1:G57 asks for two letters' distance except in deliberate families): %s%s"
                 % (len(rec["respelled"]), version, len(near18), "; ".join(near18),
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
                         details_total=len(shown), note=note, executed_against="validate_2_1.py, with the 2.0 and 2.1 rulings applied")
        elif cid in extra and cid != 18:
            det, note = extra[cid]
            entry.update(status="FAIL" if det else "PASS", count=len(det), details=det[:60], details_total=len(det),
                         note=note, executed_against="entries with since == %r (validate_1_1 supplement)" % version)
        else:
            entry["executed_against"] = "validate.py, unmodified"
        checks.append(entry)

    det25 = check_25(prev, data, rec, mapping)
    checks.append({
        "id": 25,
        "check": "Previous edition carried verbatim, except where a changeset op records the change",
        "status": "FAIL" if det25 else "PASS",
        "count": len(det25),
        "details": det25[:60],
        "details_total": len(det25),
        "note": "Compared against %s; changesets: %s; %d spellings respelled." % (
            os.path.basename(a.previous), ", ".join(c["id"] for c in changesets if c["edition"] == version), len(mapping)),
        "executed_against": "validate_2_1.py",
    })

    summary = dict(raw["summary"])
    summary["counts"] = dict(summary["counts"], **{
        "respelled_in_%s" % version.replace(".", "_"): len(rec["respelled"]),
        "spellings_respelled": len(mapping),
        "image_compounds_attested": len(data.get("image_compounds", {}).get("attested", [])),
        "lexicalised_derivations": len(data["morphology"]["lexicalised_derivations"]),
    })
    summary["status_counts"] = dict(collections.Counter(c["status"] for c in checks))
    summary["wrapper"] = "validate_2_1.py: validate.py unmodified; checks 3/7/12/13/18/24 re-run with the 2.0 and 2.1 rulings; 5/9 via validate_1_1.supplement; 25 respelling-aware (ADR-0017)"
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
