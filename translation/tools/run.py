"""The overnight driver: translate 2100 Dreams into Liraasa, best effort, never halting on quality.

    python translation/tools/run.py              # resume from the checkpoint and run to the end
    python translation/tools/run.py --limit 20   # stop after 20 new segments (a smoke test)
    python translation/tools/run.py --workers 3  # chapters in parallel (default 3)

Order of work: (1) every chapter in order, each batch translated, checked and repaired up the
ladder; (2) back-translation and scoring of every segment; (3) a repair pass on the weakest
segments with the strongest model, re-scored. Each result is written as soon as it exists, so a
restart skips finished work. Model calls go through `claude -p` on the author's logged-in
subscription (no API key), run outside the repository so no project hook or CLAUDE.md loads.
A usage limit or an outage pauses the run until it can go on; it never stops it, except the
weekly cap, which writes the report and exits so the next start resumes.

Workers: one batch of 15 paragraphs takes about six minutes, so one worker would need about
twenty hours for the book. The calibration runs alone; then whole chapters go to parallel
workers (3 by default). The registry stays single-writer: every read and write of it, and every
file write, holds one lock.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import common
import prompts
import report
from index import STOP, lemmas, words
from parse import Parser

MODEL_BULK = "sonnet"
MODEL_STRONG = "opus"
STRATEGIES = {
    "standard": {"batch": 15, "note": "translate faithfully, keeping the voice and rhythm"},
    "careful": {"batch": 8, "note": "simplify long sentences into linked clauses before translating"},
    "plain": {"batch": 6, "note": "split every sentence into short clauses first; prefer recipes and paraphrase to coinage"},
}
DOWN = {"standard": "careful", "careful": "plain", "plain": "plain"}


class WeeklyCap(Exception):
    pass


class Flagged(Exception):
    """The model's safeguards declined the request: retrying the same text will not help."""


LOCK = threading.RLock()
STOP_ALL = threading.Event()
_local = threading.local()


def parser():
    """One checker process per worker thread."""
    p = getattr(_local, "parser", None)
    if p is None:
        p = _local.parser = Parser()
        with LOCK:
            PARSERS.append(p)
    return p


PARSERS = []
WORKERS_FILE = os.path.join(common.ROOT, "workers.txt")
STOP_FILE = os.path.join(common.ROOT, "STOP")


class Limiter:
    """At most N model calls at once, N read from translation/workers.txt (changeable while running)."""

    def __init__(self):
        self.cv = threading.Condition()
        self.active = 0

    def limit(self):
        try:
            return max(1, int(open(WORKERS_FILE, encoding="utf-8").read().strip()))
        except Exception:
            return 3

    def __enter__(self):
        with self.cv:
            while self.active >= self.limit():
                self.cv.wait(timeout=30)
            self.active += 1

    def __exit__(self, *exc):
        with self.cv:
            self.active -= 1
            self.cv.notify_all()


CALLS = Limiter()


def now():
    return datetime.now().isoformat(timespec="seconds")


def log(msg):
    line = f"[{now()}] {msg}"
    with LOCK:
        print(line, flush=True)
        os.makedirs(common.LOGS, exist_ok=True)
        with open(os.path.join(common.LOGS, "run.log"), "a", encoding="utf-8") as f:
            f.write(line + "\n")


class State:
    def __init__(self):
        self.s = common.load(common.STATE, {}) or {}
        self.s.setdefault("events", [])
        self.s.setdefault("pauses", [])
        self.s.setdefault("strategy", None)
        self.s.setdefault("chapter_strategy", {})
        self.s.setdefault("prefer_paraphrase", False)
        self.s.setdefault("calls", 0)
        self.s.setdefault("parser_mode", "strict checker")

    def event(self, what):
        with LOCK:
            self.s["events"].append({"at": now(), "what": what})
            self.save()
        log(what)

    def save(self):
        with LOCK:
            common.save(common.STATE, self.s)


# ------------------------------------------------------------------ the model


def reset_time(text):
    m = re.search(r"\|(\d{10})", text)
    if m:
        return datetime.fromtimestamp(int(m.group(1)))
    m = re.search(r"resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)", text, re.I)
    if m:
        h = int(m.group(1)) % 12 + (12 if m.group(3).lower() == "pm" else 0)
        t = datetime.now().replace(hour=h, minute=int(m.group(2) or 0), second=0, microsecond=0)
        return t if t > datetime.now() else t + timedelta(days=1)
    return None


def claude(state, prompt, model, kind, effort=None):
    """One headless call; returns the reply text. Waits out limits and outages; never gives up."""
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}
    os.makedirs(common.CLAUDE_CWD, exist_ok=True)
    exe = "claude.exe" if os.name == "nt" and not os.path.exists(os.path.expanduser("~/.local/bin/claude")) else os.path.expanduser("~/.local/bin/claude")
    if not os.path.exists(exe):
        exe = "claude"
    backoff = 30
    while True:
        t0 = time.time()
        try:
          with CALLS:
            p = subprocess.run(
                [exe, "-p", "--model", model, "--tools", "", "--strict-mcp-config",
                 "--setting-sources", "user", "--no-session-persistence",
                 "--system-prompt-file", prompts.SYSTEM, "--output-format", "json"]
                + (["--effort", effort] if effort else []),
                input=prompt, capture_output=True, text=True, encoding="utf-8",
                cwd=common.CLAUDE_CWD, env=env, timeout=1800,
            )
          out, err = p.stdout or "", p.stderr or ""
        except subprocess.TimeoutExpired:
            out, err = "", "timeout after 30 minutes"
        except Exception as e:  # the CLI could not start
            out, err = "", f"could not run claude: {e}"
        result, is_error = "", True
        try:
            j = json.loads(out)
            result, is_error = j.get("result", "") or "", bool(j.get("is_error"))
        except Exception:
            result = out
        with LOCK:
            state.s["calls"] += 1
            common.append_jsonl(os.path.join(common.LOGS, "calls.jsonl"), {
                "at": now(), "kind": kind, "model": model, "seconds": round(time.time() - t0),
                "ok": not is_error and p_ok(result), "chars_in": len(prompt), "chars_out": len(result),
                "thread": threading.current_thread().name,
            })
        if not is_error and result.strip():
            return result
        blob = f"{result}\n{out[-2000:]}\n{err[-2000:]}"
        if re.search(r"safeguards flagged|usage policy|anthropic\.com/legal/aup", blob, re.I):
            with LOCK:
                state.s["pauses"].append({"at": now(), "why": "declined by safeguards", "minutes": 0, "detail": kind})
            state.save()
            raise Flagged(blob.strip()[:200])
        # out of usage (the 5-hour window or the weekly cap): wait for the reset, then go on; never stop
        if re.search(r"usage limit|limit reached|hit your limit|out of (?:usage|credits)|rate.?limit|too many requests|overloaded|resets|weekly", blob, re.I):
            weekly = bool(re.search(r"weekly", blob, re.I))
            until = reset_time(blob) or (datetime.now() + timedelta(minutes=60 if weekly else 15))
            mins = max(1, round((until - datetime.now()).total_seconds() / 60)) + 2
            with LOCK:
                state.s["pauses"].append({"at": now(), "why": "weekly usage cap" if weekly else "usage limit", "minutes": mins, "detail": blob.strip()[:200]})
            state.save()
            log(f"usage limit: sleeping {mins} min (until {until:%H:%M})")
            time.sleep(mins * 60)
            continue
        with LOCK:
            state.s["pauses"].append({"at": now(), "why": "error / outage", "minutes": backoff / 60, "detail": blob.strip()[:300]})
        state.save()
        log(f"call failed ({blob.strip()[:160]!r}); retrying in {backoff}s")
        time.sleep(backoff)
        backoff = min(backoff * 2, 1800)


def p_ok(text):
    return bool(text and text.strip())


def json_array(text):
    """The first JSON array in a reply, forgiving code fences and trailing prose."""
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    i, j = t.find("["), t.rfind("]")
    if i < 0 or j < i:
        return []
    chunk = t[i : j + 1]
    try:
        v = json.loads(chunk)
        return v if isinstance(v, list) else []
    except json.JSONDecodeError:
        # objects one by one
        out = []
        for m in re.finditer(r"\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}", chunk, re.S):
            try:
                out.append(json.loads(m.group(0)))
            except json.JSONDecodeError:
                pass
        return out


# ------------------------------------------------------------------ data


class Book:
    def __init__(self):
        self.lemma = common.load(os.path.join(common.INDEX, "lemma_index.json"))
        self.form = common.load(os.path.join(common.INDEX, "form_index.json"))
        self.names = common.load(os.path.join(common.INDEX, "names.json"))
        ref = common.load(common.LEXICON)
        self.heads = {l.split(":", 1)[0].split(" ")[0] for d in ref["dictionary"]["by_domain"].values() for l in d}
        self.colours = {c["base"] for c in ref["small_words"]["colours"]}
        self.timen = {r[0] for r in ref["small_words"]["time_words"]["rows"] if r[2] == "noun"}
        self.registry = common.load(common.REGISTRY, {"coinages": {}, "renderings": {}})
        self.segs = {}
        self.out = {}
        for ch in common.chapters():
            self.segs[ch] = common.read_jsonl(os.path.join(common.SEGMENTS, ch))
            recs = common.read_jsonl(os.path.join(common.OUT, ch))
            self.out[ch] = {r["id"]: r for r in recs}

    def save_chapter(self, ch):
        with LOCK:
            self._save_chapter(ch)

    def _save_chapter(self, ch):
        os.makedirs(common.OUT, exist_ok=True)
        path = os.path.join(common.OUT, ch)
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8", newline="\n") as f:
            for s in self.segs[ch]:
                r = self.out[ch].get(s["id"])
                if r is not None:
                    f.write(json.dumps(r, ensure_ascii=False) + "\n")
        os.replace(tmp, path)

    def save_registry(self):
        with LOCK:
            common.save(common.REGISTRY, self.registry)

    # retrieval
    def entries(self, texts, cap=450, per=6):
        seen, out = set(), []
        for t in texts:
            for w in words(t):
                lw = w.lower()
                if lw in STOP:
                    continue
                for l in sorted(lemmas(lw), key=len):
                    hits = self.lemma.get(l, [])
                    # a line whose first meaning is the word first
                    hits = sorted(hits, key=lambda x: (0 if re.search(r":\s*\(\w+\)\s*" + re.escape(l) + r"\b", x) else 1, len(x)))
                    for h in hits[:per]:
                        if h not in seen:
                            seen.add(h)
                            out.append(h)
                if len(out) >= cap:
                    return out
        return out

    def form_entries(self, texts, cap=400):
        seen, out = set(), []
        for t in texts:
            for w in re.findall(r"[A-Za-z][A-Za-z-]*", t):
                lw = w.lower()
                cands = [lw, re.sub(r"(tiri|ri|ti)$", "", lw)]
                for c in cands:
                    line = self.form.get(c)
                    if line and line not in seen:
                        seen.add(line)
                        out.append(line)
                        break
        return out[:cap]

    def names_in(self, texts):
        blob = " ".join(texts)
        return [f"{k} = {v['liraasa']} ({v.get('note', '')})" for k, v in self.names.items() if k in blob]

    def registry_for(self, texts, cap=120):
        with LOCK:
            return self._registry_for(texts, cap)

    def _registry_for(self, texts, cap):
        regs = dict(self.registry["coinages"])
        if len(regs) <= cap:
            pick = regs
        else:
            blob = " ".join(texts).lower()
            pick = {k: v for k, v in regs.items() if any(x in blob for x in lemmas(k.split()[0]))}
        lines = [f"{k} = {v['liraasa']} [{'+'.join(v['parts'])}] ({v['slot']})" for k, v in pick.items()]
        for k, v in self.registry.get("renderings", {}).items():
            if k.lower() in " ".join(texts).lower():
                lines.append(f"{k} (the author's rendering) = {v}")
        for k, v in self.registry.get("grammar", {}).items():
            lines.append(f"{k} (the author's ruling for this draft): {v}")
        return lines

    def coined_map(self):
        m = {}
        with LOCK:
            values = list(self.registry["coinages"].values())
        for v in values:
            for f, slot in v.get("forms", {v["liraasa"]: v["slot"]}).items():
                m[f] = slot
        return m


# ------------------------------------------------------------------ one batch


def valid_coinage(book, c):
    parts = c.get("parts") or []
    if len(parts) != 2:
        return "a coinage has exactly two parts"
    for p in parts:
        if p not in book.heads and p not in book.colours and p not in book.timen:
            return f"part {p} is not a headword"
    joined = "".join(parts)
    form = str(c.get("liraasa", "")).lower()
    if not form.startswith(joined):
        return f"{c.get('liraasa')} is not spelled {joined}+…"
    # only the compound's own forms by rule: the seven forms, -yo / -ti / -vu, and plural -ri
    f0 = joined[0] if joined else ""
    verb = joined + ("nia" if f0 == "n" else "sia" if f0 == "s" else "a" if f0 in "aeiou" else f0 + "a")
    ends = {"", "asa", "na", "san", "nasan", "asasan", "yo", "ti", "vu", verb[len(joined):]}
    rest = form[len(joined):]
    if rest not in ends and not (rest.endswith("ri") and rest[:-2] in ends):
        return f"{c.get('liraasa')} is not a form of {joined} by the word-building rules"
    if joined in book.heads:
        return None  # already a word: not a coinage, but harmless
    return None


def take_coinages(book, rec, seg_id):
    """Register new coinages (first wins); rewrite a second coinage for a registered sense."""
    with LOCK:
        return _take_coinages(book, rec, seg_id)


def _take_coinages(book, rec, seg_id):
    problems = []
    text = rec.get("liraasa", "")
    for c in rec.get("coinages") or []:
        if not isinstance(c, dict):
            continue
        why = valid_coinage(book, c)
        if why:
            problems.append(f"coinage {c.get('liraasa')}: {why}")
            continue
        key = str(c.get("english", "")).lower().strip()
        if not key:
            continue
        joined = "".join(c["parts"])
        form = str(c["liraasa"]).lower()
        reg = book.registry["coinages"].get(key)
        if reg is None:
            book.registry["coinages"][key] = {
                "liraasa": joined, "parts": c["parts"], "slot": c.get("slot", "n"),
                "forms": {form: c.get("slot", "n")}, "rule": c.get("rule", "2.0:G40"),
                "alternatives": c.get("alternatives", []), "confidence": c.get("confidence", "medium"),
                "uses": [seg_id], "first": seg_id, "context": "",
            }
        else:
            if reg["liraasa"] != joined:
                # the first coinage wins: respell this segment's word onto it
                new = reg["liraasa"] + form[len(joined):]
                text = re.sub(rf"\b{re.escape(c['liraasa'])}\b", new, text, flags=re.I)
                form = new
            reg["forms"][form] = c.get("slot", reg["slot"])
            if seg_id not in reg["uses"]:
                reg["uses"].append(seg_id)
    rec["liraasa"] = text
    return problems


def check(book, parser, rec):
    r = parser.check(rec.get("liraasa", ""), book.coined_map())
    return {"ok": r.get("ok", False), "errors": r.get("errors", []), "unruled": r.get("unruled", []),
            "warnings": r.get("warnings", []), "checker_gloss": r.get("gloss", "")}


def segments_block(segs):
    return "\n".join(json.dumps({"id": s["id"], "kind": s["kind"], "english": s["english"]}, ensure_ascii=False) for s in segs)


def translate_batch(state, book, ch, segs, strategy, context):
    texts = [s["english"] for s in segs]
    note = STRATEGIES[strategy]["note"] + ("; prefer paraphrase to coining for words used once" if state.s["prefer_paraphrase"] else "")
    prompt = prompts.TRANSLATE.format(
        strategy=f"{strategy}: {note}",
        context=context or "(the start of the book)",
        entries="\n".join(book.entries(texts)) or "(none)",
        names="\n".join(book.names_in(texts)) or "(none)",
        registry="\n".join(book.registry_for(texts)) or "(none yet)",
        segments=segments_block(segs),
    )
    reply = json_array(claude(state, prompt, MODEL_BULK, "translate"))
    got = {r.get("id"): r for r in reply if isinstance(r, dict)}
    recs = []
    for s in segs:
        r = got.get(s["id"]) or {"liraasa": "", "gloss": "", "coinages": [], "calls": []}
        rec = {"id": s["id"], "kind": s["kind"], "english": s["english"],
               "liraasa": str(r.get("liraasa", "")).strip(), "gloss": r.get("gloss", ""),
               "coinages": r.get("coinages") or [], "calls": r.get("calls") or [],
               "strategy": strategy, "model": MODEL_BULK, "attempts": 1, "rung": 0, "translated_at": now()}
        probs = take_coinages(book, rec, s["id"])
        rec["check"] = check(book, parser(), rec) if rec["liraasa"] else {"ok": False, "errors": ["no rendering returned"], "unruled": [], "warnings": []}
        rec["check"]["errors"] += probs
        rec["check"]["ok"] = rec["check"]["ok"] and not probs and bool(rec["liraasa"])
        rec["first_pass_ok"] = rec["check"]["ok"]
        recs.append(rec)
    # the ladder: retry with the findings, then simplify
    for rung in (1, 2):
        bad = [r for r in recs if not r["check"]["ok"]]
        if not bad:
            break
        repair(state, book, bad, rung, MODEL_BULK)
    for rec in recs:
        rec["status"] = "parsed" if rec["check"]["ok"] else "unparsed"
        with LOCK:
            book.out[ch][rec["id"]] = rec
    book.save_chapter(ch)
    book.save_registry()
    return recs


def repair(state, book, recs, rung, model):
    texts = [r["english"] for r in recs]
    block = "\n".join(json.dumps({"id": r["id"], "english": r["english"], "liraasa": r["liraasa"],
                                   "findings": r["check"]["errors"][:8]}, ensure_ascii=False) for r in recs)
    prompt = prompts.REPAIR.format(
        ladder=prompts.LADDER[rung],
        entries="\n".join(book.entries(texts + [r["liraasa"] for r in recs])) or "(none)",
        registry="\n".join(book.registry_for(texts)) or "(none yet)",
        segments=block,
    )
    reply = json_array(claude(state, prompt, model, f"repair-{rung}"))
    got = {r.get("id"): r for r in reply if isinstance(r, dict)}
    for rec in recs:
        r = got.get(rec["id"])
        if not r or not str(r.get("liraasa", "")).strip():
            continue
        cand = dict(rec)
        cand.update({"liraasa": str(r["liraasa"]).strip(), "gloss": r.get("gloss", rec.get("gloss", "")),
                     "coinages": r.get("coinages") or [], "calls": (rec.get("calls") or []) + (r.get("calls") or [])})
        probs = take_coinages(book, cand, rec["id"])
        cand["check"] = check(book, parser(), cand)
        cand["check"]["errors"] += probs
        cand["check"]["ok"] = cand["check"]["ok"] and not probs
        rec["attempts"] += 1
        # keep the better attempt: fewer errors
        if cand["check"]["ok"] or len(cand["check"]["errors"]) < len(rec["check"]["errors"]):
            keep = {k: cand[k] for k in ("liraasa", "gloss", "coinages", "calls", "check")}
            if rec.get("liraasa") and rec["liraasa"] != keep["liraasa"]:
                rec.setdefault("earlier", []).append({"liraasa": rec["liraasa"], "errors": rec["check"]["errors"][:4]})
            rec.update(keep)
            rec["rung"] = rung
            rec["model"] = model
            if rung >= 2:
                rec["calls"].append({"type": "paraphrase", "english": rec["english"][:80], "rendering": "simplified on repair rung %d" % rung, "confidence": "low"})


# ------------------------------------------------------------------ back-translation and scoring


def score_batch(state, book, ch, recs, model=MODEL_BULK):
    recs = [r for r in recs if r.get("liraasa")]
    if not recs:
        return
    reg = [f"{v['liraasa']} ({v['slot']}) = {'+'.join(v['parts'])}: {k}" for k, v in book.registry["coinages"].items()
           if any(v["liraasa"] in r["liraasa"].lower() for r in recs)]
    prompt = prompts.BACK.format(
        entries="\n".join(book.form_entries([r["liraasa"] for r in recs])) or "(none)",
        registry="\n".join(reg) or "(none)",
        segments="\n".join(json.dumps({"id": r["id"], "liraasa": r["liraasa"],
                                        "reading": r.get("check", {}).get("checker_gloss", "")},
                                       ensure_ascii=False) for r in recs),
    )
    back ={b.get("id"): b.get("english", "") for b in json_array(claude(state, prompt, model, "back", "low")) if isinstance(b, dict)}
    pairs = "\n".join(json.dumps({"id": r["id"], "source": r["english"], "back": back.get(r["id"], "")}, ensure_ascii=False) for r in recs)
    scores = {s.get("id"): s for s in json_array(claude(state, prompts.SCORE.format(pairs=pairs), model, "score", "low")) if isinstance(s, dict)}
    measured = "2026-10-26 v2: checker reading in back-translation; gender, articles, tense nuance and names not counted"
    for r in recs:
        r["back"] = back.get(r["id"], "")
        s = scores.get(r["id"], {})
        # a scorer that declines to score (its safety filter) has not measured anything:
        # keep the earlier score, or leave the segment unscored, never record a 0
        if re.search(r"safety|classifier|won.t repeat|cannot score|can.t score", str(s.get("lost", "")), re.I):
            r["score_refused"] = True
            if r.get("score") is None:
                r.pop("score", None)
            continue
        try:
            r["score"] = max(0.0, min(1.0, float(s.get("score", 0))))
        except (TypeError, ValueError):
            r["score"] = 0.0
        r["lost"] = s.get("lost", "")
        r["measure"] = measured
        r["confidence"] = confidence(r)
        with LOCK:
            book.out[ch][r["id"]] = r
    book.save_chapter(ch)


def confidence(r):
    ok = r.get("check", {}).get("ok")
    s = r.get("score")
    if not ok or s is None or s < 0.70:
        return "low"
    return "high" if s >= 0.85 else "medium"


# ------------------------------------------------------------------ the run


def context_for(book, ch, segs, first):
    i = next((k for k, s in enumerate(segs) if s["id"] == first["id"]), 0)
    if i == 0:
        return ""
    prev = segs[i - 1]
    r = book.out[ch].get(prev["id"], {})
    return json.dumps({"english": prev["english"], "liraasa": r.get("liraasa", "")}, ensure_ascii=False)


def pass_rate(recs):
    recs = [r for r in recs if "check" in r]
    return sum(1 for r in recs if r["check"]["ok"]) / len(recs) if recs else 1.0


def translate_chapter(state, book, ch, limit_left, calibrate_only=False):
    """Translate one chapter's remaining segments, adapting its strategy every 50 segments."""
    segs = book.segs[ch]
    with LOCK:
        todo = [s for s in segs if s["id"] not in book.out[ch]]
    strategy = state.s["chapter_strategy"].get(ch) or state.s["strategy"] or "standard"
    since_check = 0
    done = 0
    i = 0
    while i < len(todo) and not STOP_ALL.is_set():
        if os.path.exists(STOP_FILE):
            STOP_ALL.set()
            state.event("STOP file found: finishing the batches in flight, then stopping")
            break
        calibrating = state.s["strategy"] is None and ch != "ch00.jsonl"
        size = STRATEGIES[strategy]["batch"]
        batch = todo[i : i + size]
        recs = translate_batch(state, book, ch, batch, strategy, context_for(book, ch, segs, batch[0]))
        i += len(batch)
        since_check += len(batch)
        done += len(batch)
        log(f"{ch} {batch[0]['id']}..{batch[-1]['id']}: {sum(r['check']['ok'] for r in recs)}/{len(recs)} parse ({strategy})")
        if calibrating:
            with LOCK:
                cal = list(book.out[ch].values())
            if len(cal) >= 60:
                score_batch(state, book, ch, cal[:30])
                score_batch(state, book, ch, cal[30:60])
                pr = pass_rate(cal[:60])
                ag = sum(r.get("score", 0) for r in cal[:60]) / 60
                coin = sum(1 for r in cal[:60] if r.get("coinages")) / 60
                strategy = "standard" if pr >= 0.9 and ag >= 0.8 else "careful" if pr >= 0.7 else "plain"
                state.s["strategy"] = strategy
                state.s["calibration"] = {"pass_rate": round(pr, 3), "agreement": round(ag, 3), "coinage_rate": round(coin, 3), "strategy": strategy}
                if coin > 0.25:
                    state.s["prefer_paraphrase"] = True
                state.event(f"calibration on 60 segments: pass {pr:.0%}, agreement {ag:.2f}, coinages in {coin:.0%} → strategy {strategy}"
                            + ("; prefer paraphrase for single-use words" if coin > 0.25 else ""))
                if calibrate_only:
                    return done
        elif since_check >= 50:
            since_check = 0
            with LOCK:
                recent = list(book.out[ch].values())[-50:]
            pr = pass_rate(recent)
            if pr < 0.8 and DOWN[strategy] != strategy:
                strategy = DOWN[strategy]
                state.s["chapter_strategy"][ch] = strategy
                state.event(f"{ch}: pass rate {pr:.0%} on the last 50 → {strategy}")
        state.save()
        with LOCK:
            report.write(quiet=True)
        if limit_left is not None and done >= limit_left:
            return done
    return done


def strong_repair(state, book, group):
    if os.path.exists(STOP_FILE):
        STOP_ALL.set()
    if STOP_ALL.is_set():
        return
    ch_of = {r["id"]: f"ch{r['id'][1:3]}.jsonl" for r in group}
    before = {r["id"]: (r["check"]["ok"], r.get("score", 0), r["liraasa"]) for r in group}
    repair(state, book, group, 3 if any(not r["check"]["ok"] for r in group) else 2, MODEL_STRONG)
    for r in group:
        r["strong_repair"] = True
        r["status"] = "parsed" if r["check"]["ok"] else "unparsed"
    changed = [r for r in group if r["liraasa"] != before[r["id"]][2]]
    for ch in set(ch_of.values()):
        mine = [r for r in changed if ch_of[r["id"]] == ch]
        for r in mine:
            old = before[r["id"]]
            r["before_repair"] = {"ok": old[0], "score": old[1], "liraasa": old[2]}
        if mine:
            score_batch(state, book, ch, mine, MODEL_STRONG)
        # a repair that scored worse keeps the earlier rendering
        for r in mine:
            old = r["before_repair"]
            if (old["ok"] and not r["check"]["ok"]) or (old["ok"] == r["check"]["ok"] and r.get("score", 0) < old["score"]):
                r["liraasa"], r["score"] = old["liraasa"], old["score"]
                r["check"]["ok"] = old["ok"]
                r["repair_reverted"] = True
                r["confidence"] = confidence(r)
        with LOCK:
            for r in group:
                if ch_of[r["id"]] == ch:
                    book.out[ch][r["id"]] = r
        book.save_chapter(ch)
    book.save_registry()
    with LOCK:
        report.write(quiet=True)


def run(limit=None, workers=3):
    state = State()
    book = Book()
    prompts.build_system()
    state.event(("run started" if len(state.s["events"]) == 0 else "run resumed") + f" ({workers} workers)")
    try:
        chapters = list(book.segs)
        # 1a. the dedication, then the calibration on chapter 1, alone
        left = limit
        for ch in chapters[:2]:
            if state.s["strategy"] is not None and ch != "ch00.jsonl":
                break
            n = translate_chapter(state, book, ch, left, calibrate_only=True)
            left = None if left is None else left - n
            if left is not None and left <= 0:
                state.event(f"--limit {limit} reached")
                return
        # 1b. every chapter in parallel, in order of the queue
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="w") as pool:
            futs = [pool.submit(translate_chapter, state, book, ch, left) for ch in chapters]
            for f in futs:
                f.result()
        if STOP_ALL.is_set():
            raise WeeklyCap("weekly cap")
        if limit:
            state.event(f"--limit {limit}: stopping after translation")
            return
        state.event("translation complete")
        # 2. back-translate and score, chapters in parallel
        def score_chapter(ch):
            with LOCK:
                todo = [r for r in book.out[ch].values() if "score" not in r]
            for k in range(0, len(todo), 20):
                if os.path.exists(STOP_FILE):
                    STOP_ALL.set()
                if STOP_ALL.is_set():
                    return
                score_batch(state, book, ch, todo[k : k + 20])
            if todo:
                log(f"{ch}: scored {len(todo)}")
                with LOCK:
                    report.write(quiet=True)
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="s") as pool:
            for f in [pool.submit(score_chapter, ch) for ch in chapters]:
                f.result()
        if STOP_ALL.is_set():
            raise WeeklyCap("weekly cap")
        state.event("scoring complete")
        # 3. repair the weakest with the strongest model, as time and usage allow
        weak = sorted((r for ch in chapters for r in book.out[ch].values() if r.get("confidence") == "low" and not r.get("strong_repair")),
                      key=lambda r: (r.get("check", {}).get("ok", False), r.get("score", 0)))
        state.event(f"repair pass: {len(weak)} low-confidence segments")
        groups = [weak[k : k + 6] for k in range(0, len(weak), 6)]
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="r") as pool:
            for f in [pool.submit(strong_repair, state, book, g) for g in groups]:
                f.result()
        if STOP_ALL.is_set():
            raise WeeklyCap("weekly cap")
        state.event("repair pass complete; the run is finished")
        with open(os.path.join(common.ROOT, "FINISHED"), "w") as f:
            f.write(now() + "\n")
    except WeeklyCap as e:
        if os.path.exists(STOP_FILE):
            state.event("stopped on the STOP file, with everything saved")
        else:
            state.event(f"weekly usage cap reached: stopping with everything saved ({str(e)[:120]})")
            with open(os.path.join(common.ROOT, "STOPPED_WEEKLY_CAP"), "w") as f:
                f.write(now() + "\n")
    finally:
        book.save_registry()
        state.save()
        for p in PARSERS:
            p.close()
        report.write()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    run(a.limit, a.workers)
