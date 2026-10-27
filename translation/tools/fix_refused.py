"""Segments whose score is a refusal by the scorer's safety filter, not a measurement: unscored.

    python translation/tools/fix_refused.py

Run while no pass is running. Such a segment keeps its translation; its 0 is removed (it is
reported as unscored) and it is marked score_refused.
"""
import json
import os
import re

import common
import report

n = 0
for ch in common.chapters():
    p = os.path.join(common.OUT, ch)
    recs = common.read_jsonl(p)
    for r in recs:
        if re.search(r"safety classifier|won.t repeat that content|Not scored", str(r.get("lost", "")), re.I):
            r.pop("score", None)
            r["score_refused"] = True
            r["confidence"] = "unscored"
            n += 1
    with open(p, "w", encoding="utf-8", newline="
") as f:
        f.write("".join(json.dumps(r, ensure_ascii=False) + "
" for r in recs))
print(f"{n} segments unscored (their score was a refusal)")
report.write()
