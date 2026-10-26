"""The run's status as small JSON files for the remote status page (a claude.ai dashboard).

    python translation/tools/status_json.py   # writes translation/status/*.json

summary.json: one row, the whole run. chapters.json: one row per chapter. events.json: the
latest run events (strategy changes, pauses, phases), newest first. No manuscript text.
"""
import json
import os
from datetime import datetime

import common


def main():
    state = common.load(common.STATE, {}) or {}
    rows, total, done, ok, scored, score_sum = [], 0, 0, 0, 0, 0.0
    conf = {"high": 0, "medium": 0, "low": 0}
    for ch in common.chapters():
        segs = common.read_jsonl(os.path.join(common.SEGMENTS, ch))
        recs = {r["id"]: r for r in common.read_jsonl(os.path.join(common.OUT, ch))}
        n = len(segs)
        d = sum(1 for s in segs if s["id"] in recs)
        o = sum(1 for r in recs.values() if r.get("check", {}).get("ok"))
        sc = [r["score"] for r in recs.values() if r.get("score") is not None]
        for r in recs.values():
            if r.get("confidence") in conf:
                conf[r["confidence"]] += 1
        label = "Dedication" if ch == "ch00.jsonl" else f"Chapter {int(ch[2:4])}"
        rows.append({
            "chapter": label,
            "segments": n,
            "translated": d,
            "passing": o,
            "pass_rate": round(o / d, 3) if d else None,
            "scored": len(sc),
            "agreement": round(sum(sc) / len(sc), 3) if sc else None,
            "strategy": state.get("chapter_strategy", {}).get(ch) or state.get("strategy") or "standard",
        })
        total, done, ok = total + n, done + d, ok + o
        scored, score_sum = scored + len(sc), score_sum + sum(sc)
    events = list(reversed(state.get("events", [])))[:25]
    last_pause = (state.get("pauses") or [{}])[-1]
    finished = os.path.exists(os.path.join(common.ROOT, "FINISHED"))
    if finished:
        phase = "Finished"
    elif done < total:
        phase = "Translating"
    elif scored < total:
        phase = "Back-translating and scoring"
    else:
        phase = "Repairing the weakest segments"
    paused_until = None
    if last_pause.get("why", "").startswith(("usage", "weekly")) and last_pause.get("minutes"):
        t = datetime.fromisoformat(last_pause["at"]).timestamp() + last_pause["minutes"] * 60
        # a pause is over once a call has succeeded after it
        last_ok = max((c["at"] for c in common.read_jsonl(os.path.join(common.LOGS, "calls.jsonl")) if c.get("ok")), default="")
        if t > datetime.now().timestamp() and last_ok < last_pause["at"]:
            paused_until = datetime.fromtimestamp(t).isoformat(timespec="minutes")
    summary = [{
        "updated": datetime.now().isoformat(timespec="minutes"),
        "phase": "Paused for the usage limit" if paused_until else phase,
        "paused_until": paused_until,
        "segments": total,
        "translated": done,
        "translated_share": round(done / total, 3) if total else 0,
        "passing": ok,
        "pass_rate": round(ok / done, 3) if done else None,
        "scored": scored,
        "agreement": round(score_sum / scored, 3) if scored else None,
        "high": conf["high"],
        "medium": conf["medium"],
        "low": conf["low"],
        "calls": state.get("calls", 0),
        "workers": open(os.path.join(common.ROOT, "workers.txt")).read().strip() if os.path.exists(os.path.join(common.ROOT, "workers.txt")) else "3",
    }]
    out = os.path.join(common.ROOT, "status")
    os.makedirs(out, exist_ok=True)
    for name, data in (("summary", summary), ("chapters", rows),
                       ("events", [{"at": e["at"], "event": e["what"]} for e in events])):
        with open(os.path.join(out, f"{name}.json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
    print(json.dumps(summary[0]))


if __name__ == "__main__":
    main()
