"""migrate_text.py — convert pre-1.0 Liraasa text to the current edition.

Reconstructed for this repository (ADR-0010): the module is named in
`tools/README.md` and `rebuild_all.sh` but was not supplied.

Ruling 1.0:G19 (version gating): text dated before 1.0 is *read* with the 0.8
lexicon, and a 1.0 reader meeting a retired spelling looks it up in
`legacy.retired` and reads the 1.0 replacement. This script performs that
substitution in bulk, using `legacy.migration_forms`, which maps all 509
pre-1.0 spellings forward.

Five of those map to a multi-word **phrase** rather than a single form
(`archived-phrase`); those are substituted as the phrase, which changes the word
count of a line. For a song that matters to the metre, so each is reported.

usage:
  python3 migrate_text.py liraasa_1_1.json IN_DIR OUT_DIR [--report report.json]
"""
import argparse
import json
import os
import re
import sys

from liraasa_core import tokenize

WORD = re.compile(r"[A-Za-z][A-Za-z'\-]*")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_map(data):
    """old spelling -> (new spelling, kind, is_phrase)."""
    out = {}
    for old, entry in data.get("legacy", {}).get("migration_forms", {}).items():
        out[old] = (entry["to"], entry.get("kind", "retired"), " " in entry["to"])
    return out


def migrate_line(line, mapping):
    """Substitute every retired spelling, preserving case and punctuation."""
    changes = []

    def repl(m):
        word = m.group(0)
        hit = mapping.get(word.lower())
        if hit is None:
            return word
        new, kind, is_phrase = hit
        # Preserve an initial capital; the replacement may be multi-word.
        if word[:1].isupper():
            new = new[:1].upper() + new[1:]
        changes.append((word, new, kind, is_phrase))
        return new

    return WORD.sub(repl, line), changes


def migrate_file(src, dst, mapping):
    report = []
    out_lines = []
    with open(src, encoding="utf-8") as f:
        for n, raw in enumerate(f, 1):
            line = raw.rstrip("\n")
            # Comment lines carry English and provenance; leave them alone.
            if line.lstrip().startswith("#"):
                out_lines.append(line)
                continue
            new_line, changes = migrate_line(line, mapping)
            out_lines.append(new_line)
            for old, new, kind, is_phrase in changes:
                report.append(
                    {
                        "file": os.path.basename(src),
                        "line": n,
                        "from": old,
                        "to": new,
                        "kind": kind,
                        "phrase_substitution": is_phrase,
                    }
                )
    with open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write("# Migrated from 0.8 to 1.0+ by migrate_text.py (ruling 1.0:G19).\n")
        f.write("# Source: %s\n" % os.path.basename(src))
        f.write("\n".join(out_lines) + "\n")
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lexicon")
    ap.add_argument("in_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--report")
    a = ap.parse_args()

    mapping = build_map(load(a.lexicon))
    os.makedirs(a.out_dir, exist_ok=True)

    all_changes = []
    for name in sorted(os.listdir(a.in_dir)):
        if not name.endswith(".txt"):
            continue
        changes = migrate_file(
            os.path.join(a.in_dir, name), os.path.join(a.out_dir, name), mapping
        )
        all_changes.extend(changes)
        phrases = sum(1 for c in changes if c["phrase_substitution"])
        print(
            "%-28s %3d substitutions%s"
            % (name, len(changes), "  (%d phrase)" % phrases if phrases else "")
        )

    distinct = sorted({(c["from"], c["to"], c["kind"]) for c in all_changes})
    print()
    print("%d substitutions, %d distinct spellings" % (len(all_changes), len(distinct)))
    for old, new, kind in distinct:
        print("   %-16s -> %-32s %s" % (old, new, kind))

    phrase_hits = [c for c in all_changes if c["phrase_substitution"]]
    if phrase_hits:
        print()
        print("PHRASE substitutions change the word count of a line:")
        for c in phrase_hits:
            print("   %s:%d  %s -> %s" % (c["file"], c["line"], c["from"], c["to"]))

    if a.report:
        with open(a.report, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "lexicon": os.path.basename(a.lexicon),
                    "substitutions": len(all_changes),
                    "distinct": [
                        {"from": o, "to": n, "kind": k} for o, n, k in distinct
                    ],
                    "changes": all_changes,
                },
                f,
                ensure_ascii=False,
                indent=1,
            )
        print("\nWrote %s" % a.report)

    return 0


if __name__ == "__main__":
    sys.exit(main())
