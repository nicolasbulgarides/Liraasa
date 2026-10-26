"""Apply the author's edits to decisions.md, then re-translate only what they change.

    python translation/tools/apply_decisions.py          # read decisions.md, update, re-run
    python translation/tools/apply_decisions.py --dry    # show what would change

In decisions.md, an entry whose [x] is still on option A, with no "your own" text, is accepted.
Moving the [x] to another option, or writing your own after "your own:", changes it:

- a coinage: the registry takes the new word, and every segment that used it is re-translated;
- an idiom, a wordplay, a name or a reference: the chosen rendering is registered for reuse, and
  its segments are re-translated;
- a grammar default (G-1 … G-8): the choice is recorded as the author's ruling for this draft, and
  every segment tagged with it is re-translated;
- an unparsed or drifting segment: your own text becomes its Liraasa, checked by the parser.

Then the driver runs again (it only translates the segments removed from out/), and the
draft, decisions and report are regenerated.
"""
import argparse
import json
import os
import re
import subprocess
import sys

import common


def parse_md(path):
    entries = []
    cur = None
    for line in open(path, encoding="utf-8"):
        m = re.match(r"## (D-\d{4}) · ([\w-]+) · (.*?)(?: \((\d+) uses?: .*\))?$", line.rstrip())
        if m:
            cur = {"id": m.group(1), "type": m.group(2), "title": m.group(3), "options": [], "own": None}
            entries.append(cur)
            continue
        if cur is None:
            continue
        m = re.match(r"^(?:Chosen: |\s+)\[( |x|X)\] ([A-Z])  (.*)$", line.rstrip("\n"))
        if m:
            text = m.group(3)
            if text.startswith("your own:"):
                own = text[len("your own:"):].strip().strip("_").strip()
                if own:
                    cur["own"] = own
                if m.group(1).lower() == "x" and own:
                    cur["chosen"] = own
            else:
                cur["options"].append(text)
                if m.group(1).lower() == "x":
                    cur["chosen"] = text
    return entries


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    decs = {d["id"]: d for d in common.load(os.path.join(common.ROOT, "decisions.json"), [])}
    edited = parse_md(os.path.join(common.ROOT, "decisions.md"))
    registry = common.load(common.REGISTRY, {"coinages": {}, "renderings": {}})
    registry.setdefault("renderings", {})
    registry.setdefault("grammar", {})
    redo = set()
    direct = {}
    changes = []
    for e in edited:
        d = decs.get(e["id"])
        if d is None:
            continue
        chosen = e.get("own") or e.get("chosen") or (e["options"][0] if e["options"] else "")
        if not e["options"] or chosen == e["options"][0]:
            continue  # accepted
        changes.append(f"{e['id']} {d['type']} {d['title']}: {e['options'][0]!r} → {chosen!r}")
        segs = d.get("segments", [])
        if d["type"] == "coinage":
            word = chosen.split(" ")[0].strip()
            reg = registry["coinages"].get(d["title"])
            if reg is not None:
                parts = re.search(r"\(([a-z]+)\+([a-z]+)\)", chosen)
                reg["liraasa"] = word
                if parts:
                    reg["parts"] = [parts.group(1), parts.group(2)]
                reg["forms"] = {word: reg.get("slot", "n")}
                reg["author"] = True
            redo.update(segs)
        elif d["type"] == "grammar-default":
            registry["grammar"][d["title"].split(" ")[0]] = chosen
            redo.update(segs)
        elif d["type"] in ("idiom", "wordplay", "name", "reference", "register", "ambiguity"):
            registry["renderings"][d["title"]] = chosen
            redo.update(segs)
        elif d["type"] in ("unparsed", "drift", "paraphrase") and e.get("own"):
            for s in segs:
                direct[s] = e["own"]
    print("\n".join(changes) or "no changes: every entry accepted")
    if a.dry or not changes:
        return
    common.save(common.REGISTRY, registry)
    # remove re-translated segments from out/, set the author's own texts
    from parse import Parser
    p = Parser()
    for ch in common.chapters():
        path = os.path.join(common.OUT, ch)
        recs = common.read_jsonl(path)
        keep = []
        for r in recs:
            if r["id"] in redo:
                continue
            if r["id"] in direct:
                r["liraasa"] = direct[r["id"]]
                c = p.check(r["liraasa"])
                r["check"] = {"ok": c["ok"], "errors": c["errors"], "unruled": c.get("unruled", []), "warnings": c.get("warnings", [])}
                r["status"] = "parsed" if c["ok"] else "unparsed"
                r["author"] = True
                r.pop("score", None)
            keep.append(r)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            for r in keep:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    p.close()
    print(f"re-translating {len(redo)} segments; {len(direct)} set from your own text")
    subprocess.run([sys.executable, "-X", "utf8", os.path.join(common.HERE, "run.py")], check=False)


if __name__ == "__main__":
    main()
