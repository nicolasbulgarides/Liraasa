"""Paths and small helpers shared by the translation tools."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # translation/
REPO = os.path.dirname(ROOT)
SOURCE_TXT = os.path.join(ROOT, "source", "manuscript.txt")
SEGMENTS = os.path.join(ROOT, "segments")
OUT = os.path.join(ROOT, "out")
INDEX = os.path.join(ROOT, "index")
LOGS = os.path.join(ROOT, "logs")
REGISTRY = os.path.join(ROOT, "registry.json")
STATE = os.path.join(ROOT, "state.json")
# the lexicon this run reads: 3.6 with the author's decisions of 2026-10-25 (ADR-0027)
LEXICON = os.path.join(REPO, "handoff", "liraasa_3_6_llm.json")
PATCH = os.path.join(REPO, "data", "proposals", "liraasa_3_6_patch_decided.json")
MASTER = os.path.join(REPO, "archive", "patch_3_6", "docs", "2100_Dreams_Liraasa_Master_Word_List.xlsx")
# claude -p runs here, outside the repository, so no project hook or CLAUDE.md is loaded
CLAUDE_CWD = os.path.join(os.path.expanduser("~"), "liraasa_claude_run")


def load(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(path, value):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump(value, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def read_jsonl(path):
    if not os.path.exists(path):
        return []
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return out


def append_jsonl(path, value):
    with open(path, "a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(value, ensure_ascii=False) + "\n")


def chapters():
    return sorted(f for f in os.listdir(SEGMENTS) if f.endswith(".jsonl"))
